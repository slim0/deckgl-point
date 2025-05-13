import OctopusVulgarisInNorthernSpainImage from "../img/OctopusVulgarisInNorthernSpain.png";
import { PointOfInterest } from "./common";

export const octopusVulgarisInNorthernSpain: PointOfInterest = {
  type: "Feature",
  properties: {
    title: "Octopus vulgaris in Northern Spain",
    description:
      "The Galician coast is characterized by seasonal upwelling, which brings nutrient-rich waters to the surface, leading to increased phytoplankton growth. This boosts the abundance of octopus larvae, leading to larger octopus populations that are ready to be harvested later. Timely forecasts of upwelling and chlorophyll changes in this region could help us better predict octopus catches and make more informed decisions for sustainable fisheries management.",
    citations: [
      "Otero, J., et al. (2009). Bottom-up control of common octopus Octopus vulgaris in the Galician upwelling system, northeast Atlantic Ocean. Marine Ecology Progress Series, 386, 123–132. https://doi.org/10.3354/meps07437 ",
    ],
    preview: OctopusVulgarisInNorthernSpainImage,
  },
  geometry: {
    coordinates: [-5.0624386885919215, 43.92546532330641],
    type: "Point",
  },
};
