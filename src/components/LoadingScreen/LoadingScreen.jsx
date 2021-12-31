import React, { useState, useRef } from "react";

import { Box, Fade } from "@mui/material";

import AppLogo from "../AppLogo";

import { useTranslation } from "react-i18next";

import "./style.css";

function LoadingScreen(props) {
  const { t } = useTranslation();

  return (
    <Fade in={props.open} timeout={{ enter: 0, exit: 200 }}>
      <Box
        className="loading-screen-background"
        sx={{ bgcolor: "background.default" }}
      >
        <AppLogo className="loading-screen-logo" animated />
      </Box>
    </Fade>
  );
}

export default LoadingScreen;
