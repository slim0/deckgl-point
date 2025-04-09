import { GeoArrowScatterplotLayer } from "@geoarrow/deck.gl-layers";
import * as arrow from "apache-arrow";
import DeckGL, { Layer, PickingInfo } from "deck.gl";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MapContext, NavigationControl, StaticMap } from "react-map-gl";

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
  "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";
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

  const [table, setTable] = useState<arrow.Table | null>(null);

  useEffect(() => {
    // declare the data fetching function
    const fetchData = async () => {
      const data = await fetch(GEOARROW_POINT_DATA);
      const table = await arrow.tableFromIPC(data);
      setTable(table);
    };

    if (!table) {
      fetchData().catch(console.error);
    }
  });

  const layers: Layer[] = [];

  table &&
    layers.push(
      new GeoArrowScatterplotLayer({
        id: "geoarrow-points",
        data: table,
        // Pre-computed colors in the original table
        opacity: 1,
        getFillColor: table.getChild("colors")!,
        radiusUnits: "pixels",
        getRadius: ({ index, data }) => {
          const recordBatch = data.data;
          const row = recordBatch.get(index)!;
          if (row["CHL"] > 10) {
            console.log(row["CHL"])
          }
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
