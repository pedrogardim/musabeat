import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import "./WorkspaceGridLines.css";

function WorkspaceGridLines(props) {
  return (
    <div className="ws-grid-line-cont">
      {Array(props.sessionSize * props.gridSize)
        .fill(0)
        .map((e, i) => (
          <div
            className="ws-grid-line"
            style={{
              opacity:
                i % props.gridSize === 0
                  ? 0.4
                  : i % props.gridSize === props.gridSize / 2
                  ? 0.3
                  : 0.2,
            }}
          />
        ))}

      <div className="ws-grid-line" />
    </div>
  );
}

export default WorkspaceGridLines;
