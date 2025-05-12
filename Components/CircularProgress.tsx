import { Box, CircularProgress, circularProgressClasses, CircularProgressProps } from "@mui/material";
import React from "react";

export function CustomCircularProgress(props: CircularProgressProps & {wheelHexadecimalColor: string}) {
    return (
      <Box sx={{ position: "relative" }}>
        <CircularProgress
          variant="determinate"
          sx={(theme) => ({
            color: theme.palette.grey[200],
          })}
          size={40}
          thickness={4}
          {...props}
          value={100}
        />
        <CircularProgress
          variant="indeterminate"
          disableShrink
          sx={() => ({
            color: props.wheelHexadecimalColor,
            animationDuration: "550ms",
            position: "absolute",
            left: 0,
            [`& .${circularProgressClasses.circle}`]: {
              strokeLinecap: "round",
            },
          })}
          size={40}
          thickness={4}
          {...props}
        />
      </Box>
    );
  }