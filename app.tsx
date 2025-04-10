import { GeoArrowScatterplotLayer } from "@geoarrow/deck.gl-layers";
import * as arrow from "apache-arrow";
import DeckGL, { Layer, PickingInfo } from "deck.gl";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MapContext, NavigationControl, StaticMap } from "react-map-gl";
import { listObjectsWithPrefix } from "./s3";


const DATA_BASE_URI = "https://minio.dive.edito.eu"
const S3_BUCKET_NAME = "project-chlorophyll"
const S3_PREFIX = "TESTS_SIMON"

const GEOARROW_POINT_DATA =
  "http://localhost:8080/03MAR_CHL5D_6MFORECAST.feather";

const INITIAL_VIEW_STATE = {
  latitude: 20,
  longitude: 0,
  zoom: 2,
  bearing: 0,
  pitch: 0,
};

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";
const NAV_CONTROL_STYLE = {
  position: "absolute",
  top: 10,
  left: 10,
};

function Root() {
  const onClick = (info: PickingInfo) => {
    if (info.object) {
      console.log(JSON.stringify(info.object.toJSON()));
    }
  };

  const [table, setTable] = useState<arrow.Table | undefined>(undefined);
  const [featherFilesS3Key, setFeatherFilesS3Key] = useState<string[]>([]);

  useEffect(() => {
    listObjectsWithPrefix(S3_BUCKET_NAME, S3_PREFIX).then(async (objects) => {
      const filteredObjects = objects.filter((object) => object.endsWith(".feather"))
      setFeatherFilesS3Key(filteredObjects)
      for (let index = 0; index < filteredObjects.length; index++) {
        const featherFileS3ObjectKey = filteredObjects[index];
        const url = `${DATA_BASE_URI}/${S3_BUCKET_NAME}/${featherFileS3ObjectKey}`
        const data = await fetch(url);
        const table = await arrow.tableFromIPC(data);
        setTable(table);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    })
  }, [setFeatherFilesS3Key])

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
      controller={true}
      layers={layers}
      ContextProvider={MapContext.Provider}
      onClick={onClick}
    >
      <StaticMap mapStyle={MAP_STYLE} />
      <NavigationControl style={NAV_CONTROL_STYLE} />
    </DeckGL>
  );
}

/* global document */
const container = document.body.appendChild(document.createElement("div"));
createRoot(container).render(<Root />);
