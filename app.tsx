import { GeoArrowScatterplotLayer } from "@geoarrow/deck.gl-layers";
import * as arrow from "apache-arrow";
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
const S3_PREFIX = "TESTS_SIMON";

const ANIMATION_TIMEOUT = 1000;

const INITIAL_VIEW_STATE: MapViewState = {
  latitude: 20,
  longitude: 0,
  zoom: 2,
  bearing: 0,
  pitch: 0,
};

const s3Client = getAnonymousS3Client(S3_ENDPOINT, S3_REGION);

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";
const NAV_CONTROL_STYLE = {
  position: "absolute",
  top: 10,
  left: 10,
};

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
      new GeoArrowScatterplotLayer({
        id: "geoarrow-points",
        data: table,
        opacity: 1,
        getFillColor: table.getChild("colors")!,
        radiusUnits: "pixels",
        getRadius: ({ index, data }) => {
          const recordBatch = data.data;
          const row = recordBatch.get(index)!;
          return row["CHL"] > 0.2 ? row["CHL"] : 0;
        },
        pickable: true,
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
