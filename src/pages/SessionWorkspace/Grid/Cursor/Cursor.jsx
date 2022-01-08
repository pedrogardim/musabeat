import React, { useState, useEffect, useRef, useContext } from "react";

import * as Tone from "tone";

import Draggable from "react-draggable";

import { SessionWorkspaceContext } from "../../../../context/SessionWorkspaceContext";

import { Box } from "@mui/material";

function Grid(props) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);

  const { params } = useContext(SessionWorkspaceContext);

  const { gridPos, clickedTarget, gridRef } = props;

  const { zoomPosition, gridSize, selection, isRecording, cursorMode } = params;

  const zoomSize = zoomPosition[1] - zoomPosition[0] + 1;

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds = (gridPos * Tone.Time("1m").toSeconds()) / gridSize;
    setCursorPosition(element.x);
  };

  const handleCursorDragStart = (event, element) => {
    Tone.Transport.pause();
  };

  const handleCursorDragStop = (event, element) => {};

  const onMouseDown = (className) => {
    if (className.includes("handle")) return;

    let isClickOnNote = className.includes("note");
    let isClickOnButton =
      className.includes("MuiIcon") || className.includes("MuiButton");

    if (isClickOnNote || isClickOnButton) return;

    if (!cursorMode && !isClickOnNote) {
      Tone.Transport.seconds =
        (gridPos * Tone.Time("1m").toSeconds()) / gridSize;
    }
  };

  useEffect(() => {
    if (clickedTarget) onMouseDown(clickedTarget);
  }, [clickedTarget]);

  useEffect(() => {
    clearInterval(cursorAnimator);
    setCursorAnimator(
      setInterval(() => {
        Tone.Transport.seconds <= Tone.Transport.loopEnd &&
          Tone.Transport.seconds >= 0 &&
          setCursorPosition(
            (Tone.Transport.seconds -
              zoomPosition[0] * Tone.Time("1m").toSeconds()) /
              (zoomSize * Tone.Time("1m").toSeconds())
          );
      }, 16)
    );
  }, [zoomPosition]);

  return (
    (selection.length === 0 ||
      selection.includes(null) ||
      selection[0] === selection[1]) && (
      <Draggable
        axis="x"
        onDrag={handleCursorDrag}
        onStart={handleCursorDragStart}
        onStop={handleCursorDragStop}
        position={{
          x: gridRef.current && cursorPosition * gridRef.current.offsetWidth,
          y: 0,
        }}
        disabled={clickedTarget !== null}
        bounds=".ws-grid-line-cont"
      >
        <Box
          className={"ws-grid-cursor"}
          sx={(theme) => ({
            bgcolor: isRecording
              ? theme.palette.secondary.main
              : "text.primary",
          })}
          style={{
            pointerEvents: clickedTarget !== null && "none",
          }}
        />
      </Draggable>
    )
  );
}

export default Grid;
