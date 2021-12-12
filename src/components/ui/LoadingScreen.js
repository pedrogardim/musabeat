import React, { useState, useRef } from "react";

import { Fade } from "@mui/material";

import AppLogo from "./AppLogo";

import { useTranslation } from "react-i18next";

import "./LoadingScreen.css";

function LoadingScreen(props) {
  const { t } = useTranslation();

  return (
    <Fade in={props.open} timeout={{ enter: 0, exit: 200 }}>
      <div className="loading-screen-background">
        <AppLogo className="loading-screen-logo" animated />
      </div>
    </Fade>
  );
}

export default LoadingScreen;
