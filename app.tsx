import { S3Client } from "@aws-sdk/client-s3";
import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import {
  Box,
  Button,
  CircularProgress,
  circularProgressClasses,
  CircularProgressProps,
  createTheme,
  IconButton,
  Slider,
  ThemeProvider,
  Tooltip,
  useTheme
} from "@mui/material";
import * as arrow from "apache-arrow";
import * as d3 from "d3";
import DeckGL, { Layer, MapView, MapViewState, PickingInfo } from "deck.gl";
import React, { useEffect, useReducer, useRef } from "react";
import { createRoot } from "react-dom/client";
import { StaticMap } from "react-map-gl";
import "./App.css";
import { ColorRamp, RGB, rgba2hex } from "./common";
import MercatorLogo from "./img/MOi_rectangle-transparentbackground-color.png";
import { Legend } from "./Legend";
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

const COLOR_LOW_RGB: RGB = {r: 0, g: 0, b: 0, opacity: 0}

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
  const theme = useTheme()
  
  const colorHigh = d3.color(
    `rgba(${polygonColor.r},${polygonColor.g},${polygonColor.b},${polygonColor.opacity})`,
  );

  const colorRamp: ColorRamp = {
    minValue: 0.01,
    minColor: COLOR_LOW_RGB,
    maxValue: 1,
    maxColor: polygonColor,
  }
  const colorGradient = d3.scaleLog([colorRamp.minValue, colorRamp.maxValue], [COLOR_LOW, colorHigh]);

  const legendStops = [
    {
      value: 0.05,
      color: d3.color(colorGradient(0.05)!).toString()
    },
    {
      value: 0.2,
      color: d3.color(colorGradient(0.2)!).toString()
    },
    {
      value: 0.5,
      color: d3.color(colorGradient(0.5)!).toString()
    },
    {
      value:(1),
      color: d3.color(colorGradient(1)!).toString()
    }
  ]

  const onClick = (info: PickingInfo) => {
    if (info.object) {
      console.log(JSON.stringify(info.object.toJSON()));
    }
  };

  const initialState: State = {
    table: undefined,
    isPlaying: false,
    filesS3Keys: [],
    currentIndex: 0,
  };

  const [{ table, isPlaying, currentIndex, filesS3Keys, error }, dispatch] =
    useReducer(reducer, initialState);

  const fetchingData = useRef<boolean>(false);

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

  const handleChangeDate = async (newIndex: number, commited: boolean) => {
    dispatch({ type: "dateChanged", result: newIndex });
    commited && await fetchData(newIndex);
  };


  const handlePlayPause = async (newValue: boolean) => {
    dispatch({ type: "PlayButtonClicked", result: newValue });
  };

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

  const layers: Layer[] = [];

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

  function getDateFromS3ObjectFileIndex(index: number): string {
    if (filesS3Keys.length > 0) {
      const s3ObjectKey = filesS3Keys[index];
      const match = s3ObjectKey.match(dateRegExpInFile);
      return match ? match[0] : "";
    } else {
      return "";
    }
  }


  function CustomCircularProgress(props: CircularProgressProps) {
    return (
      <Box sx={{ position: "relative" }}>
        <CircularProgress
          variant="determinate"
          sx={(theme) => ({
            color: theme.palette.grey[200],
          })}
          size={40}
          thickness={4}
          {...props}
          value={100}
        />
        <CircularProgress
          variant="indeterminate"
          disableShrink
          sx={() => ({
            color: rgba2hex(polygonColor),
            animationDuration: "550ms",
            position: "absolute",
            left: 0,
            [`& .${circularProgressClasses.circle}`]: {
              strokeLinecap: "round",
            },
          })}
          size={40}
          thickness={4}
          {...props}
        />
      </Box>
    );
  }

  return (
    <div className="my-app">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller
        layers={layers}
        onClick={onClick}
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
          <CustomCircularProgress />
        </Box>
      )}
      <Box className="header">
        <img src={MercatorLogo} alt="Mercator" />
        <Box className="application-title" color={theme.palette.primary.main}>{applicationTitle}</Box>
      </Box>
      <Box className="download-file-button">
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
        <div style={{display: "flex", flexDirection: "row", width: '90%', alignItems: "center"}}>
          <Legend title={"Chl-a surface coverage (normalized concentration)"} legendStops={legendStops}></Legend>
          <Slider
            valueLabelDisplay="on"
            valueLabelFormat={getDateFromS3ObjectFileIndex(currentIndex)}
            style={{ opacity: "80%", marginLeft: "20px" }}
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
      main: '#1B2F58',
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
      polygonColor={{r: 0, g: 109, b: 44, opacity: 1}}
      sourceDataFileDownloadUrl={sourceDataFileDownloadUrl}
    />,
  </ThemeProvider>
);
