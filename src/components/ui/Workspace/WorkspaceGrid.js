import React, { useState, useEffect, useRef, Fragment } from "react";

import * as Tone from "tone";

import "./WorkspaceGrid.css";

import Draggable from "react-draggable";

import { colors } from "../../../utils/materialPalette";

import { IconButton, Icon, Tooltip, TextField, Slider } from "@mui/material";

function WorkspaceGrid(props) {
  const gridRef = useRef(null);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [gridPos, setGridPos] = useState(null);
  const [initialSelectionPos, setInitialSelectionPos] = useState(null);
  const [resizingHandle, setResizingHandle] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const zoomSize = props.zoomPosition[1] - props.zoomPosition[0] + 1;

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (gridPos * Tone.Time("1m").toSeconds()) / props.gridSize;

    setCursorPosition(element.x);
  };

  const handleCursorDragStart = (event, element) => {
    Tone.Transport.pause();
  };

  const handleCursorDragStop = (event, element) => {};

  const handleMouseDown = (e) => {
    if (e.target.className.includes("handle")) {
      return;
    }

    let isClickOnNote = e.target.className.includes("note");

    if (isClickOnNote) return;

    props.setSelection([]);

    setIsMouseDown(true);

    if (!props.cursorMode && !isClickOnNote) {
      Tone.Transport.seconds =
        (gridPos * Tone.Time("1m").toSeconds()) / props.gridSize;

      setInitialSelectionPos(gridPos);
      props.setSelection([gridPos, null]);
    }
  };

  const handleHover = (event) => {
    let hoveredPos =
      event.pageX -
      gridRef.current.getBoundingClientRect().left +
      gridRef.current.offsetWidth / (zoomSize * props.gridSize * 2);

    let gridPos = Math.floor(
      Math.abs(
        (hoveredPos / gridRef.current.offsetWidth) * zoomSize * props.gridSize
      ) +
        props.zoomPosition[0] * props.gridSize
    );

    setGridPos((prev) =>
      JSON.stringify(prev) === JSON.stringify(gridPos) ? prev : gridPos
    );
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setResizingHandle(null);
    setInitialSelectionPos(null);
    //props.setSelection([]);
  };

  const onGridPosChange = () => {
    //drag note input
    if (isMouseDown && !resizingHandle) {
      if (props.cursorMode === "edit") {
        //handleMouseDown();
      } else {
        props.setSelection((prev) =>
          [initialSelectionPos, gridPos].sort((a, b) => a - b)
        );
      }
    }
    if (resizingHandle) {
      props.setSelection((prev) => {
        let newSelection = [...prev];
        let handleSide = resizingHandle === "left";
        if (
          (resizingHandle === "left" && newSelection < 0) ||
          (resizingHandle === "right" && newSelection + 1 > props.sessionSize)
        )
          return prev;
        newSelection[handleSide ? 0 : 1] = gridPos;

        return newSelection;
      });
    }
  };
  /* 
  useEffect(() => {
    setTLinputSessionSize(props.sessionSize);
  }, [props.sessionSize]); */

  useEffect(() => {
    //toggleCursor(Tone.Transport.state);
    clearInterval(cursorAnimator);
    setCursorAnimator(
      setInterval(() => {
        //temp fix

        Tone.Transport.seconds <= Tone.Transport.loopEnd &&
          Tone.Transport.seconds >= 0 &&
          setCursorPosition(
            (Tone.Transport.seconds -
              props.zoomPosition[0] * Tone.Time("1m").toSeconds()) /
              (zoomSize * Tone.Time("1m").toSeconds())
          );
      }, 16)
    );
  }, [props.zoomPosition]);

  useEffect(() => {
    onGridPosChange();
    //console.log(gridPos);
  }, [gridPos]);

  /* useEffect(() => {
    console.log(props.isMouseDown);
  }, [props.isMouseDown]); */

  return (
    <div
      className="ws-grid"
      disabled
      onMouseDown={handleMouseDown}
      onMouseMove={handleHover}
      onMouseLeave={handleMouseUp}
      onClick={handleMouseUp}
      onMouseUp={handleMouseUp}
    >
      <div ref={gridRef} className="ws-grid-line-cont">
        {Array(zoomSize * props.gridSize)
          .fill(0)
          .map((e, i) =>
            i % props.gridSize !== 0 && props.selectedTrack === null ? (
              ""
            ) : (
              <div
                key={i + "gd"}
                className="ws-grid-line"
                style={{
                  opacity:
                    i % props.gridSize === 0
                      ? 0.4
                      : i % props.gridSize === props.gridSize / 2
                      ? 0.3
                      : 0.2,
                }}
              >
                {i % props.gridSize === 0 && !props.hiddenNumbers && (
                  <span className="ws-grid-line-mesure-num">
                    {i / props.gridSize + 1 + props.zoomPosition[0]}
                  </span>
                )}
              </div>
            )
          )}

        <div className="ws-grid-line" />
      </div>

      {(props.selection.length === 0 ||
        props.selection.includes(null) ||
        props.selection[0] === props.selection[1]) && (
        <Draggable
          axis="x"
          onDrag={handleCursorDrag}
          onStart={handleCursorDragStart}
          onStop={handleCursorDragStop}
          onMouseDown={handleMouseDown}
          position={{
            x: gridRef.current && cursorPosition * gridRef.current.offsetWidth,
            y: 0,
          }}
          disabled={props.isMouseDown}
          bounds=".ws-grid-line-cont"
          style={{ pointerEvents: props.isMouseDown && "none" }}
        >
          <div
            className={"ws-grid-cursor"}
            style={{
              backgroundColor: props.isRecording && "#f50057",
              pointerEvents: props.isMouseDown && "none",
            }}
          />
        </Draggable>
      )}

      {props.children}

      {props.selection.length > 0 && !props.selection.includes(null) && (
        <div
          style={{
            position: "absolute",
            height: "100%",
            transform: `translateX(${
              ((props.selection.sort((a, b) => a - b)[0] -
                props.zoomPosition[0] * props.gridSize) /
                (zoomSize * props.gridSize)) *
                gridRef.current.offsetWidth +
              48
            }px)`,
            width: Math.abs(
              (props.selection.sort((a, b) => a - b)[1] /
                (zoomSize * props.gridSize)) *
                gridRef.current.offsetWidth -
                (props.selection.sort((a, b) => a - b)[0] /
                  (zoomSize * props.gridSize)) *
                  gridRef.current.offsetWidth
            ),
            backgroundColor: "rgb(0, 0, 0,0.5)",
            opacity: 0.7,
            /* border:
                props.cursorMode === "edit" && "solid 1px rgba(0,0,0,0.5)", */
          }}
        >
          <div
            className="ws-ruler-zoom-cont-handle"
            onMouseDown={() => setResizingHandle("left")}
            style={{ left: 0, opacity: 0 }}
          />
          <div
            className="ws-ruler-zoom-cont-handle"
            onMouseDown={() => setResizingHandle("right")}
            style={{ right: 0, opacity: 0 }}
          />
        </div>
      )}

      {/* <div style={{ position: "absolute", right: -64 }}>
        <TextField
          label="Session Size"
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{ min: 1, max: 128 }}
          defaultValue={props.sessionSize}
          onKeyDown={(e) => e.keyCode === 13 && handleSessionSizeChange(e)}
          onBlur={(e) => handleSessionSizeChange(e)}
          onMouseUp={(e) => handleSessionSizeChange(e)}
          value={TLinputSessionSize}
          onChange={(e) => setTLinputSessionSize(e.target.value)}
        />
      </div> */}
    </div>
  );
}

export default WorkspaceGrid;
