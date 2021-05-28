import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import "./BackgroundGrid.css";

function BackgroundGrid(props) {
  //TODO: Time signature subdivision, now fixed to 4


  let grid = [];

  for (let x = 0; x < props.sessionSize * 8; x++) {
    grid.push(
      <div
        style={{ borderLeft: "solid 1px " + (x % 8 == 0 ? props.color[500] : x % 2 == 0 ? props.color[700] : props.color[800]) }}
        className="background-grid-item"
      />
    );
  }

  return <div className="background-grid">{grid}</div>;
}

export default BackgroundGrid;
