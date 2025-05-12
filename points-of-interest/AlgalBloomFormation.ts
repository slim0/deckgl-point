import { Feature, Point } from "geojson";

export type PointOfInterestProperties = {
    title: string,
    description: string
    citation: string | undefined
    preview: string
}

export type PointOfInterest = Feature<Point, PointOfInterestProperties>

export const algalBloomFormation: PointOfInterest = {
    type: "Feature",
    properties: {
      title: "Algal bloom formation",
      description: "Sargassum is a type of macroalgae, its growth is often influenced by the same nutrient-rich conditions that boost phytoplankton, which lead to elevated chlorophyll levels. Monitoring chlorophyll concentrations over time can help us identify ocean regions experiencing eutrophication or nutrient upwelling-conditions that are conducive to Sargassum proliferation.",
      citation: undefined,
      preview: "https://upload.wikimedia.org/wikipedia/commons/6/61/Sargassum_sp._%28Sargasse%29.jpg?uselang=fr",
    },
    geometry: {
      coordinates: [-37.533889, 10.9835],
      type: "Point",
    },
}