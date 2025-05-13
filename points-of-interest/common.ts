import { Feature, Point } from "geojson";

export type PointOfInterestProperties = {
  description: string;
  citations: string[];
  title: string;
  preview: string;
};

export type PointOfInterest = Feature<Point, PointOfInterestProperties>;
