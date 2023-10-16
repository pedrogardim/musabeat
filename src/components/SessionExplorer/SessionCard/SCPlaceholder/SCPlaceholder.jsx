import React from "react";
import { Grid, Paper, Avatar, Icon, IconButton } from "@mui/material";

import { Skeleton } from "@mui/material";

function SCPlaceholder(props) {
  return (
    <Grid item xs={12} sm={6} md={6} lg={4}>
      <Paper className={"session-gallery-item"}>
        <div className="session-gallery-item-title-cont">
          <Avatar className="session-gallery-item-subtitle-avatar" />
          <Skeleton width="128px" height="32px" />
          <IconButton className="session-gallery-item-actions-button">
            <Icon>more_vert</Icon>
          </IconButton>
        </div>

        <div className="session-gallery-item-track-cont">
          <Skeleton height="100%" width="100%" variant="rect" />
        </div>
        <div className="session-gallery-item-footer">
          {[1, 1].map((e, i) => (
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

export default SCPlaceholder;
