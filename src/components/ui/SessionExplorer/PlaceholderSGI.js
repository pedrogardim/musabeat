import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Paper,
  Typography,
  CircularProgress,
  TextField,
  Icon,
  IconButton,
  Avatar,
  Tooltip,
} from "@material-ui/core";

import "./SessionGalleryItem.css";

import { Skeleton } from "@material-ui/lab";

function PlaceholderSGI(props) {
  const [creatorInfo, setCreatorInfo] = useState({});
  const [hovered, setHovered] = useState(false);
  const [sessionLikes, setSessionLikes] = useState(false);

  return (
    <Paper
      className={`session-gallery-item ${
        hovered && "session-gallery-item-hovered"
      }`}
    >
      <div className="session-gallery-item-title-cont">
        <Skeleton width="128px" height="32px" />
      </div>

      {!props.isUser && (
        <div className="session-gallery-item-subtitle">
          <Skeleton height="24px" width="24px" variant="circle" />
          <div style={{ width: "8px" }} />
          <Skeleton width="70px" />
        </div>
      )}

      <div className="session-gallery-item-modules-cont">
        <Skeleton height="100%" width="100%" variant="rect" />
      </div>
      <div className="session-gallery-item-footer">
        {[1, 1, 1].map((i) => (
          <Skeleton
            key={`sgiphi${i}`}
            height="24px"
            width="24px"
            style={{ margin: 12 }}
            variant="circle"
          />
        ))}
      </div>
    </Paper>
  );
}

export default PlaceholderSGI;
