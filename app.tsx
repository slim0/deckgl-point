import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { Box, Button, Slider, Tooltip } from "@mui/material";
import * as arrow from "apache-arrow";
import * as d3 from "d3";
import DeckGL, { Layer, MapView, MapViewState, PickingInfo } from "deck.gl";
import React, { useEffect, useReducer, useRef } from "react";
import { createRoot } from "react-dom/client";
import { StaticMap } from "react-map-gl";
import "./App.css";
import { reducer } from "./reducer";
import {
  getAnonymousS3Client,
  getObjectByteArray,
  listObjectsWithPrefix,
} from "./s3";

const S3_ENDPOINT = "https://minio.dive.edito.eu";
const S3_REGION = "waw3-1";
const S3_BUCKET_NAME = "project-chlorophyll";
const S3_PREFIX = "TESTS_SIMON";

const ANIMATION_TIMEOUT = 2000;

const INITIAL_VIEW_STATE: MapViewState = {
  latitude: 20,
  longitude: 0,
  zoom: 2,
  bearing: 0,
  pitch: 0,
  minZoom: 2,
};

const colorLow = d3.color("#2C353B");
const colorHigh = d3.color("#5FD490");
const COLOR_GRADIENT = d3.scaleLinear([0, 1], [colorLow, colorHigh]);

const s3Client = getAnonymousS3Client(S3_ENDPOINT, S3_REGION);

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";

// 04APR_CHL5D_6MFORECAST_norm-2025-04-01.feather
const dateRegExp = "\\d{4}-\\d{2}-\\d{2}";
const fileRegExp = new RegExp(
  `^${S3_PREFIX}/04APR_CHL5D_6MFORECAST_norm-${dateRegExp}.feather$`,
);

export type State = {
  table: arrow.Table | undefined;
  isPlaying: boolean;
  filesS3Keys: string[];
  currentIndex: number;
  error?: string;
};



function App() {
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

  const [
    { table, isPlaying, currentIndex, filesS3Keys, error },
    dispatch,
  ] = useReducer(reducer, initialState);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = async (index: number) => {
    const key = filesS3Keys[index];
    try {
      const data = await getObjectByteArray(s3Client, S3_BUCKET_NAME, key);
      const table = arrow.tableFromIPC(data);
      dispatch({ type: "tableFetched", result: table });
    } catch (err) {
      dispatch({
        type: "failure",
        error: `Failure while trying to fetch table for file: ${key}`,
      });
    }
  };

  useEffect(() => {
    listObjectsWithPrefix(s3Client, S3_BUCKET_NAME, S3_PREFIX).then(
      async (objects) => {
        const filteredObjects = objects.filter((object) =>
          object.match(fileRegExp),
        );
        dispatch({ type: "filesParsed", result: filteredObjects.sort() });
      },
    );
  }, []);

  const handleChangeDate = async (newIndex: number) => {
    dispatch({ type: "dateChanged", result: newIndex });
    await fetchData(newIndex);
  };

  const handlePlayPause = async (newValue: boolean) => {
    dispatch({ type: "PlayButtonClicked", result: newValue });
  };

  useEffect(() => {
    let cancelled = false;
  
    const runAnimation = async () => {
      while (!cancelled && isPlaying && currentIndex < filesS3Keys.length - 1) {
        await fetchData(currentIndex);
        if (!cancelled) {
          dispatch({ type: "dateChanged", result: currentIndex + 1 });
        }
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_TIMEOUT));
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
  }, [isPlaying, currentIndex, filesS3Keys]);

    
  useEffect(() => {
    fetchData(currentIndex);
  }, [filesS3Keys]);

  const layers: Layer[] = [];

  table &&
    layers.push(
      new GeoArrowPolygonLayer({
        id: "geoarrow-polygons",
        stroked: true,
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
          const color = d3.color(COLOR_GRADIENT(row["CHL"])!).rgb();
          return [color.r, color.g, color.b];
        },
        _normalize: false,
      }),
    );

  function getDateFromS3ObjectFileIndex(index: number): string {
    if (filesS3Keys.length > 0) {
      const s3ObjectKey = filesS3Keys[index];
      const match = s3ObjectKey.match(dateRegExp)
      return match ? match[0] : "";
    } else {
      return "";
    }
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
      <Box className="controller">
        <Button
          style={{ color: "white", opacity: "70%" }}
          className="play-button"
          variant="text"
          startIcon={isPlaying ? <PauseCircleIcon /> : <PlayCircleIcon />}
          onClick={() => handlePlayPause(!isPlaying)}
        />
        <Tooltip enterTouchDelay={0} placement="auto" title={getDateFromS3ObjectFileIndex(currentIndex)}>
          <Slider
            valueLabelDisplay="on"
            valueLabelFormat={getDateFromS3ObjectFileIndex(currentIndex)}
            style={{ color: "white", opacity: "70%" }}
            className="slider"
            value={currentIndex}
            onChange={(_event, index) => handleChangeDate(index)}
            step={1}
            min={0}
            max={filesS3Keys.length - 1}
          />
        </Tooltip>
      </Box>
    </div>
  );
}

/* global document */
const container = document.body.appendChild(document.createElement("div"));
createRoot(container).render(<App />);
