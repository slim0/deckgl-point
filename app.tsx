import { S3Client } from "@aws-sdk/client-s3";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import InfoIcon from "@mui/icons-material/Info";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import {
  Box,
  Button,
  createTheme,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Slider,
  ThemeProvider,
  Tooltip,
  useTheme,
} from "@mui/material";
import * as arrow from "apache-arrow";
import * as d3 from "d3";
import DeckGL, { GeoJsonLayer, Layer, MapView, MapViewState } from "deck.gl";
import { FeatureCollection, Point } from "geojson";
import React, { useEffect, useReducer, useRef } from "react";
import { createRoot } from "react-dom/client";
import { StaticMap } from "react-map-gl";
import "./App.css";
import { ColorRamp, RGB, rgba2hex } from "./common";
import { CustomCircularProgress } from "./Components/CircularProgress";
import { Legend } from "./Components/Legend";
import ApplicationInformation from "./img/applicationInformation.png";
import MercatorLogo from "./img/MOi_rectangle-transparentbackground-color.png";
import {
  algalBloomFormation,
  PointOfInterest,
  PointOfInterestProperties,
} from "./points-of-interest/AlgalBloomFormation";
import { reducer } from "./reducer";
import {
  getAnonymousS3Client,
  getObjectByteArray,
  listObjectsWithPrefix,
} from "./s3";

const INITIAL_VIEW_STATE: MapViewState = {
  latitude: 20,
  longitude: 0,
  zoom: 2,
  bearing: 0,
  pitch: 0,
  minZoom: 2,
};

const COLOR_LOW_RGB: RGB = { r: 0, g: 0, b: 0, opacity: 0 };

const COLOR_LOW = d3.color(
  `rgba(${COLOR_LOW_RGB.r},${COLOR_LOW_RGB.g},${COLOR_LOW_RGB.b},${COLOR_LOW_RGB.opacity})`,
);

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export type State = {
  table: arrow.Table | undefined;
  isPlaying: boolean;
  filesS3Keys: string[];
  currentIndex: number;
  error?: string;
};

type Props = {
  applicationTitle: string;
  animationTimer?: number;
  s3Info: {
    s3Client: S3Client;
    s3Bucket: string;
    s3Prefix?: string;
  };
  featherFileRegExp: RegExp;
  dateRegExpInFile: RegExp;
  polygonColor: RGB;
  sourceDataFileDownloadUrl: string;
};

function App(props: Props) {
  const {
    s3Info,
    animationTimer,
    featherFileRegExp,
    dateRegExpInFile,
    polygonColor,
    sourceDataFileDownloadUrl,
    applicationTitle,
  } = props;
  const { s3Client, s3Bucket, s3Prefix } = s3Info;
  const theme = useTheme();

  const colorHigh = d3.color(
    `rgba(${polygonColor.r},${polygonColor.g},${polygonColor.b},${polygonColor.opacity})`,
  );

  const colorRamp: ColorRamp = {
    minValue: 0.01,
    minColor: COLOR_LOW_RGB,
    maxValue: 1,
    maxColor: polygonColor,
  };
  const colorGradient = d3.scaleLog(
    [colorRamp.minValue, colorRamp.maxValue],
    [COLOR_LOW, colorHigh],
  );

  const legendStops = [
    {
      value: 0.05,
      color: d3.color(colorGradient(0.05)!).toString(),
    },
    {
      value: 0.2,
      color: d3.color(colorGradient(0.2)!).toString(),
    },
    {
      value: 0.5,
      color: d3.color(colorGradient(0.5)!).toString(),
    },
    {
      value: 1,
      color: d3.color(colorGradient(1)!).toString(),
    },
  ];

  const initialState: State = {
    table: undefined,
    isPlaying: false,
    filesS3Keys: [],
    currentIndex: 0,
  };

  // State
  const [{ table, isPlaying, currentIndex, filesS3Keys, error }, dispatch] =
    useReducer(reducer, initialState);

  const ApplicationInformationDialogContent: PointOfInterestProperties = {
    title: "Why seasonal forecasting?",
    description:
      "Chlorophyll offers a window into the health of our marine ecosystems. Because it is tied to algae and plant growth, tracking it can reveal early signs of problems like nutrient pollution, harmful algal blooms, or disruptions in fish habitats— all of which have direct economic and social consequences. Seasonal forecasts can provide advanced warnings of large-scale ecological changes driven by shifts in ocean conditions, such as warming waters or changes in nutrient cycles. This means the ability to make smarter, forward-looking decisions-whether it's safeguarding fisheries that support local jobs, protecting public health from toxic blooms, or planning coastal resilience strategies in a changing climate.",
    preview: ApplicationInformation,
    citations: undefined,
  };

  const [dialogContent, setDialogContent] = React.useState<
    PointOfInterestProperties | undefined
  >(ApplicationInformationDialogContent);

  const fetchingData = useRef<boolean>(false);
  //////////

  // useEffect
  useEffect(() => {
    listObjectsWithPrefix(s3Client, s3Bucket, s3Prefix).then(
      async (objects) => {
        const filteredObjects = objects.filter((object) =>
          object.match(featherFileRegExp),
        );
        dispatch({ type: "filesParsed", result: filteredObjects.sort() });
      },
    );
  }, []);

  useEffect(() => {
    if (animationTimer !== undefined) {
      let cancelled = false;

      const runAnimation = async () => {
        while (
          !cancelled &&
          isPlaying &&
          currentIndex < filesS3Keys.length - 1
        ) {
          await fetchData(currentIndex);
          if (!cancelled) {
            dispatch({ type: "dateChanged", result: currentIndex + 1 });
          }
          await new Promise((resolve) => setTimeout(resolve, animationTimer));
        }

        if (currentIndex >= filesS3Keys.length - 1) {
          dispatch({ type: "PlayButtonClicked", result: false });
        }
      };

      if (isPlaying) {
        runAnimation();
      }
      return () => {
        cancelled = true;
      };
    }
  }, [isPlaying, currentIndex, filesS3Keys]);

  useEffect(() => {
    filesS3Keys.length > 0 && fetchData(currentIndex);
  }, [filesS3Keys]);
  //////////

  const fetchData = async (index: number) => {
    fetchingData.current = true;
    const key = filesS3Keys[index];
    try {
      const data = await getObjectByteArray(s3Client, s3Bucket, key);
      const table = arrow.tableFromIPC(data);
      dispatch({ type: "tableFetched", result: table });
      fetchingData.current = false;
    } catch (err) {
      dispatch({
        type: "failure",
        error: `Failure while trying to fetch table for file: ${key}`,
      });
    }
  };

  // Handles
  const handleChangeDate = async (newIndex: number, commited: boolean) => {
    dispatch({ type: "dateChanged", result: newIndex });
    commited && (await fetchData(newIndex));
  };

  const handlePlayPause = async (newValue: boolean) => {
    dispatch({ type: "PlayButtonClicked", result: newValue });
  };

  const handleClickOpenDialog = (
    dialogProperties: PointOfInterestProperties,
  ) => {
    setDialogContent(dialogProperties);
  };

  const handleCloseDialog = () => {
    setDialogContent(undefined);
  };
  //////////

  function getDateFromS3ObjectFileIndex(index: number): string {
    if (filesS3Keys.length > 0) {
      const s3ObjectKey = filesS3Keys[index];
      const match = s3ObjectKey.match(dateRegExpInFile);
      return match ? match[0] : "";
    } else {
      return "";
    }
  }

  const geojsonData: FeatureCollection<Point, PointOfInterestProperties> = {
    type: "FeatureCollection",
    features: [algalBloomFormation],
  };

  const pointsOfInterestLayers = new GeoJsonLayer<PointOfInterest>({
    id: "GeoJsonLayer",
    data: geojsonData,
    pickable: true,
    stroked: false,
    filled: true,
    pointType: "icon",
    iconAtlas:
      "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
    iconMapping:
      "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.json",
    getIcon: () => "marker",
    getIconSize: 30,
    iconAlphaCutoff: 0,
    onClick: (layer) => {
      if (layer.object !== undefined) {
        handleClickOpenDialog(layer.object.properties);
      }
    },
    pointRadiusMinPixels: 5,
    getFillColor: [255, 0, 0, 255],
  });

  const layers: Layer[] = [pointsOfInterestLayers];

  table &&
    layers.push(
      new GeoArrowPolygonLayer({
        id: "geoarrow-polygons",
        stroked: false,
        filled: true,
        data: table,
        extruded: false,
        wireframe: true,
        positionFormat: "XY",
        autoHighlight: false,
        opacity: 1,
        getFillColor: ({ index, data, target }) => {
          const recordBatch = data.data;
          const row = recordBatch.get(index)!;
          const rowChlValue = row["CHL"];
          const color = d3.color(colorGradient(rowChlValue)!).rgb();
          return [color.r, color.g, color.b, color.opacity * 255];
        },
        _normalize: false,
      }),
    );

  return (
    <div className="my-app">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={{
          dragPan: true,
          dragRotate: false,
        }}
        layers={layers}
        getTooltip={(layer) =>
          layer.object && `${layer.object.properties.title}`
        }
        views={
          new MapView({
            repeat: true,
          })
        }
      >
        <StaticMap mapStyle={MAP_STYLE} />
      </DeckGL>
      {fetchingData.current && (
        <Box sx={{ display: "flex" }}>
          <CustomCircularProgress
            wheelHexadecimalColor={rgba2hex(polygonColor)}
          />
        </Box>
      )}
      <Box className="header">
        <img src={MercatorLogo} alt="Mercator" />
        <Box className="application-title" color={theme.palette.primary.main}>
          {applicationTitle}
        </Box>
      </Box>
      <Box
        className="download-file-button"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <Tooltip title="Why seasonal forecasting?" placement="left">
          <IconButton
            color="primary"
            onClick={() =>
              handleClickOpenDialog(ApplicationInformationDialogContent)
            }
          >
            <InfoIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download source data file" placement="left">
          <IconButton color="primary" href={sourceDataFileDownloadUrl} download>
            <CloudDownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Box className="controller">
        {animationTimer && (
          <Button
            color="primary"
            style={{ opacity: "70%", marginRight: "25px" }}
            className="play-button"
            variant="text"
            startIcon={isPlaying ? <PauseCircleIcon /> : <PlayCircleIcon />}
            onClick={() => handlePlayPause(!isPlaying)}
          />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            alignItems: "center",
          }}
        >
          <Legend
            title={"Chl-a surface coverage"}
            subtitle={"i.e. normalized concentration"}
            legendStops={legendStops}
          ></Legend>
          <Slider
            valueLabelDisplay="on"
            valueLabelFormat={getDateFromS3ObjectFileIndex(currentIndex)}
            style={{ opacity: "80%" }}
            color="primary"
            className="slider"
            value={currentIndex}
            marks
            onChange={(_event, index) => handleChangeDate(index, false)}
            onChangeCommitted={(_event, index) => handleChangeDate(index, true)}
            step={1}
            min={0}
            max={filesS3Keys.length - 1}
          />
        </div>
      </Box>
      <Dialog
        open={dialogContent !== undefined}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth={"xl"}
      >
        <DialogTitle>{dialogContent && dialogContent.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "800px",
                  maxHeight: "400px",
                }}
                src={dialogContent && dialogContent.preview}
              ></img>
              <div style={{ marginLeft: "20px" }}>
                {dialogContent && dialogContent.description}
              </div>
            </div>
            {dialogContent && dialogContent.citations && (
              <div style={{marginTop: "20px", fontSize: "12px"}}>
                {dialogContent.citations.map((citation, index) => (
                  <div id={`citation-${index}`} style={{marginTop: "5px"}}>{citation}</div>
                ))}
              </div>
            )}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const S3_ENDPOINT = "https://minio.dive.edito.eu";
const S3_REGION = "waw3-1";
const S3_BUCKET = "project-chlorophyll";
const S3_PREFIX = "PER_DAY_FEATHER_FILES";

const dateRegExpInFile = new RegExp("\\d{4}-\\d{2}-\\d{2}");
const featherFileRegExp = new RegExp(
  `^${S3_PREFIX}/04APR_CHL5D_6MFORECAST_norm-${dateRegExpInFile.source}.feather$`,
);

const sourceDataFileDownloadUrl =
  "https://minio.dive.edito.eu/project-chlorophyll/04APR_CHL5D_6MFORECAST_norm.parquet";

const s3Client = getAnonymousS3Client(S3_ENDPOINT, S3_REGION);

const theme = createTheme({
  palette: {
    primary: {
      main: "#1B2F58",
    },
    secondary: {
      main: "#80C5DE",
    },
  },
});

/* global document */
const container = document.body.appendChild(document.createElement("div"));
createRoot(container).render(
  <ThemeProvider theme={theme}>
    <App
      applicationTitle="Surface Chlorophyll-a Seasonal Forecast (Machine Learning Based)"
      s3Info={{
        s3Client,
        s3Bucket: S3_BUCKET,
        s3Prefix: S3_PREFIX,
      }}
      featherFileRegExp={featherFileRegExp}
      dateRegExpInFile={dateRegExpInFile}
      polygonColor={{ r: 0, g: 109, b: 44, opacity: 1 }}
      sourceDataFileDownloadUrl={sourceDataFileDownloadUrl}
    />
    ,
  </ThemeProvider>,
);
