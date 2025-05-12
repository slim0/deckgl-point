import { Feature, Point } from "geojson";

export type PointOfInterestProperties = {
  title: string;
  description: string;
  citations: string[];
  preview: string;
};

export type PointOfInterest = Feature<Point, PointOfInterestProperties>;

export const algalBloomFormation: PointOfInterest = {
  type: "Feature",
  properties: {
    title: "Algal bloom formation",
    description:
      "Sargassum is a type of macroalgae, its growth is often influenced by the same nutrient-rich conditions that boost phytoplankton, which lead to elevated chlorophyll levels. Monitoring chlorophyll concentrations over time can help us identify ocean regions experiencing eutrophication or nutrient upwelling-conditions that are conducive to Sargassum proliferation.",
    citations: [
      "Wang, M., et al. (2019). The great Atlantic Sargassum belt. Science, 365(6448), 83-87. https://doi.org/10.1126/science.aaw7912",
      "Johns, E. M., et al (2020). The establishment of a pelagic Sargassum population in the tropical Atlantic: Implications for the Great Atlantic Sargassum Belt. Progress in Oceanography, 182, 102269. https://doi.org/10.1016/j.pocean.2020.102269",
    ],
    preview:
      "https://upload.wikimedia.org/wikipedia/commons/6/61/Sargassum_sp._%28Sargasse%29.jpg?uselang=fr",
  },
  geometry: {
    coordinates: [-37.533889, 10.9835],
    type: "Point",
  },
};
