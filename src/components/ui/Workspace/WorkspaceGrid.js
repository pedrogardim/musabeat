import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import "./WorkspaceGrid.css";

import Draggable from "react-draggable";

import { colors } from "../../../utils/materialPalette";

import WorkspaceGridLines from "./WorkspaceGridLines";

import {
  IconButton,
  Icon,
  Tooltip,
  TextField,
  Slider,
} from "@material-ui/core";

function WorkspaceGrid(props) {
  const gridRef = useRef(null);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [compact, setCompact] = useState(true);
  const [draggingSelect, setDraggingSelect] = useState(false);
  const [TLinputSessionSize, setTLinputSessionSize] = useState(
    props.sessionSize
  );

  const [gridPos, setGridPos] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (element.x / gridRef.current.offsetWidth) *
      Tone.Time(Tone.Transport.loopEnd).toSeconds();

    setCursorPosition(element.x);
  };

  const handleCursorDragStart = (event, element) => {
    Tone.Transport.pause();
  };

  const handleCursorDragStop = (event, element) => {};

  const handleMouseDown = (event) => {
    setIsMouseDown(true);
    props.setSelection([]);

    if (!props.cursorMode) {
      Tone.Transport.seconds =
        (gridPos * Tone.Time("1m").toSeconds()) / props.gridSize;

      props.setSelection([
        (gridPos * Tone.Time("1m").toSeconds()) / props.gridSize,
        null,
      ]);
    }
  };

  const handleHover = (event) => {
    let hoveredPos =
      event.pageX -
      gridRef.current.getBoundingClientRect().left +
      gridRef.current.offsetWidth / (props.sessionSize * props.gridSize * 2);

    let gridPos = Math.floor(
      Math.abs(
        (hoveredPos / gridRef.current.offsetWidth) *
          props.sessionSize *
          props.gridSize
      )
    );

    setGridPos((prev) =>
      JSON.stringify(prev) === JSON.stringify(gridPos) ? prev : gridPos
    );
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    //props.setSelection([]);
  };

  const onGridPosChange = () => {
    //drag note input
    if (isMouseDown) {
      if (props.cursorMode === "edit") {
        //handleMouseDown();
      } else {
        props.setSelection((prev) => [
          prev[0],
          (gridPos * Tone.Time("1m").toSeconds()) / props.gridSize,
        ]);
      }
    }
  };

  const handleSessionSizeChange = (e) => {
    let newValue = e.target.value;
    let newSize;
    if (props.sessionSize === e.target.value) return;
    if (newValue <= 1) {
      newSize = 1;
    } else if (newValue >= 128) {
      newSize = 128;
    } else if (newValue > 1 && newValue < 128) {
      newSize = newValue;
    }
    props.setSessionSize(parseInt(newSize));
  };

  useEffect(() => {
    setTLinputSessionSize(props.sessionSize);
  }, [props.sessionSize]);

  useEffect(() => {
    //toggleCursor(Tone.Transport.state);
    setCursorAnimator(
      setInterval(() => {
        //temp fix

        Tone.Transport.seconds <= Tone.Transport.loopEnd &&
          Tone.Transport.seconds >= 0 &&
          setCursorPosition(Tone.Transport.seconds / Tone.Transport.loopEnd);
      }, 16)
    );

    return () => {
      //console.log("cleared");
      clearInterval(cursorAnimator);
    };
  }, [props.timelineMode]);

  useEffect(() => {
    onGridPosChange();
  }, [gridPos]);

  return (
    <div
      className="ws-grid"
      disabled
      ref={gridRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleHover}
      onMouseLeave={handleMouseUp}
      onClick={handleMouseUp}
      onMouseUp={handleMouseUp}
    >
      <WorkspaceGridLines
        gridSize={props.gridSize}
        sessionSize={props.sessionSize}
      />

      {props.children}

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
        bounds=".ws-grid"
      >
        <div
          className={`ws-grid-cursor ${compact && "ws-grid-cursor-compact"}`}
          style={{ backgroundColor: props.isRecording && "#f50057" }}
        />
      </Draggable>

      {props.selection.length > 0 && !props.selection.includes(null) && (
        <div
          style={{
            position: "absolute",
            height: "100%",
            transform: `translateX(${
              (props.selection[0] / Tone.Transport.loopEnd) *
              gridRef.current.offsetWidth
            }px)`,
            width:
              (props.selection[1] / Tone.Transport.loopEnd) *
                gridRef.current.offsetWidth -
              (props.selection[0] / Tone.Transport.loopEnd) *
                gridRef.current.offsetWidth,
            backgroundColor: "lightgray",
            opacity: 0.4,
            /* border:
                props.cursorMode === "edit" && "solid 1px rgba(0,0,0,0.5)", */
          }}
        />
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
