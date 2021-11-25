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
  const TLWrapper = useRef(null);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [compact, setCompact] = useState(true);
  const [draggingSelect, setDraggingSelect] = useState(false);
  const [TLinputSessionSize, setTLinputSessionSize] = useState(
    props.sessionSize
  );

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (element.x / TLWrapper.current.offsetWidth) *
      Tone.Time(Tone.Transport.loopEnd).toSeconds();

    setCursorPosition(element.x);
  };

  const handleCursorDragStart = (event, element) => {
    Tone.Transport.pause();
  };

  const handleCursorDragStop = (event, element) => {};

  const handleMouseDown = (event) => {
    return;
    if (
      (compact && event.target.className === "ws-grid-module-tile") ||
      !props.timelineMode
    ) {
      let newTime =
        ((event.pageX - TLWrapper.current.offsetLeft) /
          TLWrapper.current.offsetWidth) *
        Tone.Transport.loopEnd;

      Tone.Transport.seconds =
        newTime < 0
          ? 0
          : newTime > Tone.Transport.loopEnd
          ? Tone.Transport.loopEnd
          : newTime;
    } else if (
      props.timelineMode &&
      event.target.className === "ws-grid-module-tile"
    ) {
      setDraggingSelect(true);
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

  return (
    <div
      className="ws-grid"
      disabled
      ref={TLWrapper}
      onMouseDown={handleMouseDown}
      onMouseUp={() => setDraggingSelect(false)}
      onMouseLeave={() => setDraggingSelect(false)}
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
        position={{
          x:
            TLWrapper.current && cursorPosition * TLWrapper.current.offsetWidth,
          y: 0,
        }}
        bounds=".ws-grid"
      >
        <div
          className={`ws-grid-cursor ${compact && "ws-grid-cursor-compact"}`}
          style={{ backgroundColor: props.isRecording && "#f50057" }}
        />
      </Draggable>

      <div style={{ position: "absolute", right: -64 }}>
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
      </div>
    </div>
  );
}

export default WorkspaceGrid;
