import React, { useEffect, useState, Fragment } from "react";

import { Skeleton } from "@material-ui/lab";

import { IconButton, Icon, Typography } from "@material-ui/core";

import "./Module.css";

function PlaceholderModule(props) {
  let moduleContent = <span>Nothing Here</span>;

  return (
    <div
      style={{
        backgroundColor: "gray",
        overflow: "hidden",
      }}
      className={"module"}
    >
      <div className="module-header">
        <Skeleton width="30%" />

        <IconButton className="module-options-button">
          <Icon>more_vert</Icon>
        </IconButton>
      </div>
      <div className="module-innerwrapper">
        {<Skeleton variant="rect" height="100%" fitContent />}
      </div>
    </div>
  );
}

export default PlaceholderModule;
