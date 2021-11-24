import React, { useRef } from "react";

import { Typography } from "@material-ui/core";

import "./BackgroundGrid.css";

function BackgroundGrid(props) {
  const gridTileRef = useRef(null);
  //TODO: Time signature subdivision, now fixed to 4

  let grid = [];

  //for (let x = 0; x < props.sessionSize * 8; x++) {
  for (let x = 0; x < props.moduleSize * 8; x++) {
    grid.push(
      <div
        ref={x === 0 ? gridTileRef : undefined}
        style={{
          borderLeft:
            "solid 1px " +
            (x % 8 === 0
              ? props.color[500]
              : x % 2 === 0
              ? props.color[700]
              : props.color[800]),
        }}
        className="background-grid-item"
      >
        {x % 8 === 0 && (
          <span
            style={{
              color: props.color[200],
              visibility:
                gridTileRef.current &&
                gridTileRef.current.offsetWidth < 3.5 &&
                x % 2 === 0
                  ? "hidden"
                  : "visible",
            }}
            className="background-grid-item-num"
          >
            {Math.floor(x / 8) + 1}
          </span>
        )}
      </div>
    );
  }

  return <div className="background-grid">{grid}</div>;
}

export default BackgroundGrid;
