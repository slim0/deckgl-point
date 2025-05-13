import ShiftsInAmericanLobsterPopulationsImage from "../img/ShiftsInAmericanLobsterPopulations.jpg";
import { PointOfInterest } from "./common";

export const shiftsInAmericanLobsterPopulations: PointOfInterest = {
  type: "Feature",
  properties: {
    title: "Shifts in American Lobster Populations",
    description:
      "As the cold, nutrient-rich Labrador Current weakens and warmer, nutrient-poor Gulf Stream waters move in, the base of the food web—phytoplankton—declines, reducing food availability for larval lobsters and contributing to population shifts and lower harvests. Chlorophyll forecasts can help us detect early signs of declining productivity and ecosystem disruption, allowing for timely, adaptive management decisions",
    citations: [],
    preview: ShiftsInAmericanLobsterPopulationsImage,
  },
  geometry: {
    coordinates: [-63.1466676, 46.3355508],
    type: "Point",
  },
};
