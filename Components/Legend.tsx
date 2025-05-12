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
                width: "50px",
                height: "20px",
                background: legendStop.color,
                color: "white",
                textAlign: "center",
                padding: "5px 10px 5px 10px",
                marginBottom: "10px",
              }}
            >{legendStop.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
