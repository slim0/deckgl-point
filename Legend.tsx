import React from "react";

type LegendStop = {
  value: number;
  color: string;
};

type Props = {
  legendStops: LegendStop[];
  title: string
};

export function Legend(props: Props) {
  const { legendStops, title } = props;
  return (
    <div className="legend" style={{display: "flex", flexDirection: "column", width: "500px"}}>
      <div style={{marginBottom: "10px"}}>{title}</div>
      <div style={{display: "flex"}} >
        {legendStops.map((legendStop) => (
          <div style={{display: "flex", flexDirection: "column"}}>
            <div
              style={{
                width: "30px",
                height: "20px",
                background: legendStop.color,
                marginRight: "20px",
                marginBottom: "10px",
                border: "1px solid black"
              }}
            />
            <span>{legendStop.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
