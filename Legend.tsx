import React from "react";

type LegendStop = {
  value: number;
  color: string;
};

type Props = {
  legendStops: LegendStop[];
  title: string;
  subtitle: string;
};

export function Legend(props: Props) {
  const { legendStops, title, subtitle } = props;
  return (
    <div
      className="legend"
      style={{ display: "flex", flexDirection: "column", width: "500px" }}
    >
      <div style={{ fontWeight: "bold" }}>{title}</div>
      <div style={{ marginBottom: "10px", fontStyle: "italic" }}>
        {subtitle}
      </div>
      <div style={{ display: "flex" }}>
        {legendStops.map((legendStop) => (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                width: "30px",
                height: "20px",
                background: legendStop.color,
                marginRight: "20px",
                marginBottom: "10px",
                border: "1px solid black",
              }}
            />
            <span>{legendStop.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
