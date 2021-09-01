import React, { useState, useRef } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
} from "@material-ui/core";

import { useTranslation } from "react-i18next";

import "./LoadingScreen.css";

function LoadingScreen(props) {
  const { t } = useTranslation();

  return (
    <div className="loading-screen-background">
      <svg
        className="loading-screen-logo"
        x="0px"
        y="0px"
        viewBox="0 0 210.6 249.6"
      >
        <path
          className="lsl-seg lsl-seg1"
          d="M196.5,0L196.5,0c7.8,0,14.1,6.3,14.1,14.1v221.4c0,7.8-6.3,14.1-14.1,14.1h0c-7.8,0-14.1-6.3-14.1-14.1V14.1
	C182.4,6.3,188.7,0,196.5,0z"
        />
        <path
          className="lsl-seg lsl-seg2"
          d="M152.4,37.4L152.4,37.4c7.7,0,13.9,6.2,13.9,13.9v91.6c0,7.7-6.2,13.9-13.9,13.9h0c-7.7,0-13.9-6.2-13.9-13.9
	V51.3C138.5,43.6,144.7,37.4,152.4,37.4z"
        />
        <path
          className="lsl-seg lsl-seg3"
          d="M108.6,72.4L108.6,72.4c7.7,0,13.9,6.2,13.9,13.9v91.6c0,7.7-6.2,13.9-13.9,13.9h0c-7.7,0-13.9-6.2-13.9-13.9
	V86.3C94.6,78.6,100.9,72.4,108.6,72.4z"
        />

        <path
          className="lsl-seg lsl-seg4"
          d="M63.1,156.8L63.1,156.8c-8.6,0-15.6-7-15.6-15.6V52.9c0-8.6,7-15.6,15.6-15.6h0c8.6,0,15.6,7,15.6,15.6v88.3
	C78.6,149.8,71.7,156.8,63.1,156.8z"
        />
        <path
          className="lsl-seg lsl-seg5"
          d="M15.8,249.6L15.8,249.6c-8.7,0-15.8-7.1-15.8-15.8V15.8C0,7.1,7.1,0,15.8,0h0c8.7,0,15.8,7.1,15.8,15.8v218.1
	C31.5,242.6,24.5,249.6,15.8,249.6z"
        />
      </svg>
    </div>
  );
}

export default LoadingScreen;
