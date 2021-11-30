import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import "./WorkspaceGrid.css";

import Draggable from "react-draggable";

import { colors } from "../../../utils/materialPalette";

import {
  IconButton,
  Icon,
  Tooltip,
  TextField,
  Slider,
} from "@material-ui/core";

function WorkspaceRuler(props) {
  const rulerRef = useRef(null);

  const [isMoving, setIsMoving] = useState(false);
  const [gridPos, setGridPos] = useState(null);
  const [resizingHandle, setResizingHandle] = useState(null);

  const [isMouseDown, setIsMouseDown] = useState(false);

  const grid = 1;

  //const [sessionPreview, setPessionPreview] = useState([]);

  /*  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (element.x / rulerRef.current.offsetWidth) *
      Tone.Time(Tone.Transport.loopEnd).toSeconds();

    setCursorPosition(element.x);
  };

  const handleCursorDragStart = (event, element) => {
    Tone.Transport.pause();
  };

  const handleCursorDragStop = (event, element) => {}; */

  const handleZoomContMouseDown = (e) => {
    setIsMouseDown(true);
    if (!e.target.className.includes("handle")) {
      setIsMoving(gridPos);
    }
  };

  const handleMouseDown = (e) => {
    setIsMouseDown(true);

    if (!e.target.className.includes("zoom")) {
      props.setZoomPosition((prev) => {
        let difference = prev[0] - gridPos;
        return prev.map((e) => e - difference);
      });
    }
  };

  const onGridPosChange = () => {
    if (resizingHandle) {
      props.setZoomPosition((prev) => {
        let newSessionZoom = [...prev];
        if (
          (resizingHandle === "left" && gridPos < 0) ||
          (resizingHandle === "right" && gridPos + 1 > props.sessionSize)
        )
          return prev;
        newSessionZoom[resizingHandle === "left" ? 0 : 1] = gridPos;
        if (newSessionZoom[0] - newSessionZoom[1] < 0)
          newSessionZoom = newSessionZoom.sort((a, b) => a - b);
        return newSessionZoom;
      });
    }
    if (isMoving !== false) {
      props.setZoomPosition((prev) => {
        let newSessionZoom = [...prev];
        if (
          newSessionZoom[0] + gridPos - isMoving < 0 ||
          newSessionZoom[1] + gridPos - isMoving > props.sessionSize
        )
          return prev;
        newSessionZoom[0] = newSessionZoom[0] + gridPos - isMoving;
        newSessionZoom[1] = newSessionZoom[1] + gridPos - isMoving;
        return newSessionZoom;
      });
    }
    console.log(gridPos);
  };

  const handleHover = (event) => {
    let hoveredPos =
      (event.pageX - rulerRef.current.getBoundingClientRect().left) /
      rulerRef.current.offsetWidth;

    let gridPos = Math.floor(Math.abs(hoveredPos * props.sessionSize));

    setGridPos((prev) =>
      JSON.stringify(prev) === JSON.stringify(gridPos) ? prev : gridPos
    );
  };

  const handleMouseUp = () => {
    setResizingHandle(null);
    setIsMoving(false);
  };

  useEffect(() => {
    onGridPosChange();
  }, [gridPos]);

  useEffect(() => {
    console.log(isMoving);
  }, [isMoving]);

  useEffect(() => {
    console.log(props.zoomPosition);
  }, [props.zoomPosition]);

  return (
    <div
      className="ws-ruler"
      disabled
      onMouseDown={handleMouseDown}
      onMouseMove={handleHover}
      onMouseLeave={handleMouseUp}
      onClick={handleMouseUp}
      onMouseUp={handleMouseUp}
      ref={rulerRef}
    >
      {rulerRef.current && (
        <div
          className="ws-ruler-zoom-cont"
          handleMouseDown={handleZoomContMouseDown}
          style={{
            height: "100%",
            width:
              (props.zoomPosition[1] - props.zoomPosition[0] + 1) *
              (rulerRef.current.offsetWidth / props.sessionSize),

            transform: `translateX(${
              props.zoomPosition[0] *
              (rulerRef.current.offsetWidth / props.sessionSize)
            }px`,
            backgroundColor: "rgba(0,0,0,0.3)",
            outline: `solid 1px black`,
            //borderRadius: 4,
            //margin: "-2px -2px 0 0",
          }}
        >
          <div
            className="ws-ruler-zoom-cont-handle"
            onMouseDown={() => setResizingHandle("left")}
            style={{ left: 0 }}
          />
          <div
            className="ws-ruler-zoom-cont-handle"
            onMouseDown={() => setResizingHandle("right")}
            style={{ right: 0 }}
          />
        </div>
      )}
      {/* <Draggable
        axis="x"
        onDrag={handleCursorDrag}
        onStart={handleCursorDragStart}
        onStop={handleCursorDragStop}
        onMouseDown={handleMouseDown}
        position={{
          x: rulerRef.current && cursorPosition * rulerRef.current.offsetWidth,
          y: 0,
        }}
        bounds=".ws-grid-line-cont"
      >
        <div
          className={"ws-grid-cursor"}
          style={{ backgroundColor: props.isRecording && "#f50057" }}
        />
      </Draggable> */}

      {props.modules &&
        props.modules.map((module, moduleIndex) => (
          <div
            className="ws-ruler-track"
            style={{ backgroundColor: colors[module.color][300] }}
          />
        ))}
    </div>
  );
}

export default WorkspaceRuler;
