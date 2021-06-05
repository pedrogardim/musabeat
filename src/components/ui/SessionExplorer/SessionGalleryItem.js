import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Paper,
  Typography,
  CircularProgres,
  Icon,
  IconButton,
} from "@material-ui/core";

import "./SessionGalleryItem.css";

import firebase from "firebase";

import { colors } from "../../../utils/materialPalette";

function SessionGalleryItem(props) {
  const handleClick = () => {};

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <Paper className="session-gallery-item">
        <Typography variant="h5" className="session-gallery-item-title">
          {props.session.name}
        </Typography>
        <IconButton style={{ position: "absolute", top:0,right:0}}>
          <Icon>edit</Icon>
        </IconButton>
      <div className="session-gallery-item-modules-cont">
        {props.session.modules.map((e) => (
          <Paper
            className="session-gallery-item-module"
            style={{ backgroundColor: colors[e.color][500] }}
          >
            {e.name}
          </Paper>
        ))}
      </div>
      <div className="session-gallery-item-module-footer">
        <IconButton>
          <Icon>edit</Icon>
        </IconButton>
        <IconButton>
          <Icon>share</Icon>
        </IconButton>
        <IconButton>
          <Icon>content_copy</Icon>
        </IconButton>
        <IconButton>
          <Icon>delete</Icon>
        </IconButton>
      </div>
    </Paper>
  );
}

export default SessionGalleryItem;
