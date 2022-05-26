import React, { useState, useRef, useContext } from "react";

import "./style.css";

import wsCtx from "../../../context/SessionWorkspaceContext";

import Selection from "./Selection";
import Cursor from "./Cursor";

import { Box, Typography } from "@mui/material";

function Grid(props) {
  const gridRef = useRef(null);

  const [gridPos, setGridPos] = useState(null);
  const [clickedTarget, setClickedTarget] = useState(null);

  const { params } = useContext(wsCtx);

  const { zoomPosition, openSubPage, gridSize, selectedTrack } = params;

  const zoomSize = zoomPosition[1] - zoomPosition[0] + 1;

  const hiddenNumbers = openSubPage === "IE" || openSubPage === "mixer";

  const handleMouseDown = (e) => setClickedTarget(e.target.className);
  const handleMouseUp = (e) => setClickedTarget(null);

  const handleHover = (event) => {
    let hoveredPos =
      event.pageX -
      gridRef.current.getBoundingClientRect().left +
      gridRef.current.offsetWidth / (zoomSize * gridSize * 2);

    let gridPos = Math.floor(
      Math.abs(
        (hoveredPos / gridRef.current.offsetWidth) * zoomSize * gridSize
      ) +
        zoomPosition[0] * gridSize
    );

    setGridPos((prev) =>
      JSON.stringify(prev) === JSON.stringify(gridPos) ? prev : gridPos
    );
  };

  return (
    <div
      className="ws-grid"
      disabled
      onMouseDown={handleMouseDown}
      onMouseMove={handleHover}
      onMouseLeave={handleMouseUp}
      onClick={handleMouseUp}
      onMouseUp={handleMouseUp}
      tabIndex={-1}
    >
      <div ref={gridRef} className="ws-grid-line-cont">
        {Array(zoomSize * gridSize)
          .fill(0)
          .map((e, i) =>
            i % gridSize !== 0 && selectedTrack === null ? (
              ""
            ) : (
              <Box
                key={i + "gd"}
                className="ws-grid-line"
                sx={{ bgcolor: "text.primary" }}
                style={{
                  opacity:
                    i % gridSize === 0
                      ? 0.4
                      : i % gridSize === gridSize / 2
                      ? 0.3
                      : 0.2,
                }}
              >
                {i % gridSize === 0 && !hiddenNumbers && (
                  <Typography
                    className="ws-grid-line-mesure-num"
                    sx={{ color: "text.primary" }}
                  >
                    {i / gridSize + 1 + zoomPosition[0]}
                  </Typography>
                )}
              </Box>
            )
          )}

        <div className="ws-grid-line" />
      </div>

      <Cursor
        gridPos={gridPos}
        clickedTarget={clickedTarget}
        gridRef={gridRef}
      />

      {props.children}

      <Selection
        gridPos={gridPos}
        clickedTarget={clickedTarget}
        gridRef={gridRef}
      />
    </div>
  );
}

export default Grid;
