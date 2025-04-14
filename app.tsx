import { GeoArrowPolygonLayer } from "@geoarrow/deck.gl-layers";
import * as arrow from "apache-arrow";
import * as d3 from "d3";
import DeckGL, { Layer, MapViewState, PickingInfo } from "deck.gl";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { StaticMap } from "react-map-gl";
import {
  getAnonymousS3Client,
  getObjectByteArray,
  listObjectsWithPrefix,
} from "./s3";

const S3_ENDPOINT = "https://minio.dive.edito.eu";
const S3_REGION = "waw3-1";
const S3_BUCKET_NAME = "project-chlorophyll";
const S3_PREFIX = "TEST";

const ANIMATION_TIMEOUT = 1000;

const INITIAL_VIEW_STATE: MapViewState = {
  latitude: 20,
  longitude: 0,
  zoom: 2,
  bearing: 0,
  pitch: 0,
};

const colorLow = d3.color("#2C353B")
const colorHigh = d3.color("#5FD490")
const COLOR_GRADIENT = d3.scaleLog([0.03, 10], [colorLow, colorHigh])

const s3Client = getAnonymousS3Client(S3_ENDPOINT, S3_REGION);

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";


const fileRegExp = new RegExp(
  `^${S3_PREFIX}/03MAR_CHL5D_6MFORECAST-\\d{4}-\\d{2}-\\d{2}.feather$`,
);

function Root() {
  const onClick = (info: PickingInfo) => {
    if (info.object) {
      console.log(JSON.stringify(info.object.toJSON()));
    }
  };

  const [table, setTable] = useState<arrow.Table | undefined>(undefined);

  useEffect(() => {
    listObjectsWithPrefix(s3Client, S3_BUCKET_NAME, S3_PREFIX).then(
      async (objects) => {
        const filteredObjects = objects.filter((object) =>
          object.match(fileRegExp),
        );
        for (let index = 0; index < filteredObjects.length; index++) {
          const featherFileS3ObjectKey = filteredObjects[index];
          const data = await getObjectByteArray(
            s3Client,
            S3_BUCKET_NAME,
            featherFileS3ObjectKey,
          );
          const table = arrow.tableFromIPC(data);
          setTable(table);
          await new Promise((resolve) =>
            setTimeout(resolve, ANIMATION_TIMEOUT),
          );
        }
      },
    );
  }, []);

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
          const color = d3.color(COLOR_GRADIENT(row["CHL"])!).rgb()
          return [color.r, color.g, color.b]
        },
        _normalize: false,
      }),
    );

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller
      layers={layers}
      onClick={onClick}
    >
      <StaticMap mapStyle={MAP_STYLE} />
    </DeckGL>
  );
}

/* global document */
const container = document.body.appendChild(document.createElement("div"));
createRoot(container).render(<Root />);
