import React from "react";

import "./style.css";

import { Box } from "@mui/material";

function LoadingBar(props) {
  const { value } = props;

  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        width: value * 100 + "%",
        height: value === 1 ? 0 : 8,
      }}
      className="loading-bar"
    />
  );
}

export default LoadingBar;
