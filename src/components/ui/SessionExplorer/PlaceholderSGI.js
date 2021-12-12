import React from "react";
import { Grid, Paper } from "@mui/material";

import "./SessionGalleryItem.css";

import { Skeleton } from "@mui/material";

function PlaceholderSGI(props) {
  return (
    <Grid item xs={12} sm={6} md={3} xl={!props.compact ? 2 : 3}>
      <Paper className={"session-gallery-item"}>
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

        <div className="session-gallery-item-track-cont">
          <Skeleton height="100%" width="100%" variant="rect" />
        </div>
        <div className="session-gallery-item-footer">
          {[1, 1, 1].map((e, i) => (
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
    </Grid>
  );
}

export default PlaceholderSGI;
