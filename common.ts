export type RGB = { r: number; g: number; b: number; opacity: number };

export function rgba2hex(RgbColor: RGB) {
  const redHex = RgbColor.r.toString(16).padStart(2, "0");
  const greenHex = RgbColor.g.toString(16).padStart(2, "0");
  const blueHex = RgbColor.b.toString(16).padStart(2, "0");
  const alphaHex = Math.round(RgbColor.opacity * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${redHex}${greenHex}${blueHex}${alphaHex}`;
}

export type ColorRamp = {
  minValue: number;
  minColor: RGB;
  maxValue: number;
  maxColor: RGB;
};
