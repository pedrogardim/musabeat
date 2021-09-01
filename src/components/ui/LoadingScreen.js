import React, { useState, useRef } from "react";

import { Dialog } from "@material-ui/core";

import AppLogo from "./AppLogo";

import { useTranslation } from "react-i18next";

import "./LoadingScreen.css";

function LoadingScreen(props) {
  const { t } = useTranslation();

  return (
    <div className="loading-screen-background">
      <AppLogo className="loading-screen-logo" animated />
    </div>
  );
}

export default LoadingScreen;
