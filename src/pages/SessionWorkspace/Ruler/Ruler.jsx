import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

import { colors } from "../../../utils/Pallete";

import Draggable from "react-draggable";

import { Box } from "@mui/material";

function Ruler(props) {
  const rulerRef = useRef(null);

  const [isMoving, setIsMoving] = useState(false);
  const [gridPos, setGridPos] = useState(null);
  const [resizingHandle, setResizingHandle] = useState(false);
  const [handlePosition, setHandlePosition] = useState(props.zoomPosition);

  const grid = 1;

  const zoomSize = props.zoomPosition[1] - props.zoomPosition[0] + 1;

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
    if (!e.target.className.includes("handle")) {
      setIsMoving(
        ((e.pageX - rulerRef.current.getBoundingClientRect().left) /
          rulerRef.current.offsetWidth) *
          props.sessionSize -
          props.zoomPosition[0]
      );
    }
  };

  const handleHover = (mouseX) => {
    let hoveredPos =
      (mouseX - rulerRef.current.getBoundingClientRect().left) /
      rulerRef.current.offsetWidth;

    //console.log(hoveredPos);

    if (resizingHandle) {
      setHandlePosition((prev) => {
        let newHandlePos = [...prev];
        let handleSide = resizingHandle === "left";
        if (
          (resizingHandle === "left" && hoveredPos < 0) ||
          (resizingHandle === "right" && hoveredPos + 1 > props.sessionSize)
        )
          return prev;
        newHandlePos[handleSide ? 0 : 1] =
          hoveredPos * props.sessionSize - (handleSide ? 0 : 1);

        props.setZoomPosition((prev) => {
          let newSessionZoom = [...prev];
          newSessionZoom[handleSide ? 0 : 1] = parseInt(
            hoveredPos * props.sessionSize + (handleSide ? 0.5 : -0.5)
          );
          if (
            newSessionZoom[0] > newSessionZoom[1] ||
            JSON.stringify(newSessionZoom) === JSON.stringify(prev)
          ) {
            //console.log("isBigger");
            return prev;
          }
          return newSessionZoom;
        });

        return newHandlePos;
      });
    }
    if (isMoving !== false) {
      setHandlePosition((prev) => {
        let newHandlePos = [...prev];
        newHandlePos = newHandlePos.map(
          (pos, posIndex) =>
            hoveredPos * props.sessionSize +
            posIndex * (zoomSize - 1) -
            isMoving
        );
        if (newHandlePos[0] < 0 || newHandlePos[1] + 1 > props.sessionSize)
          return prev;

        props.setZoomPosition((prev) => {
          let newSessionZoom = [...prev];
          newSessionZoom = newHandlePos.map((e, i) => parseInt(e + 0.5));
          if (JSON.stringify(newSessionZoom) === JSON.stringify(prev))
            return prev;

          return newSessionZoom;
        });

        return newHandlePos;
      });
    }

    let gridPos = Math.floor(Math.abs(hoveredPos * props.sessionSize));

    setGridPos((prev) =>
      JSON.stringify(prev) === JSON.stringify(gridPos) ? prev : gridPos
    );
  };

  const handleMouseUp = (e) => {
    //console.log(e);
    setResizingHandle(null);
    setIsMoving(false);
    if (resizingHandle || isMoving) {
    }
    setHandlePosition([props.zoomPosition[0], props.zoomPosition[1]]);
  };

  useEffect(() => {
    //console.log(props.isMouseDown);
    if (!props.isMouseDown) handleMouseUp();
  }, [props.isMouseDown]);

  useEffect(() => {
    handleHover(props.mousePosition[0]);
  }, [props.mousePosition]);

  useEffect(() => {
    //console.log(props.zoomPosition);
    setHandlePosition([props.zoomPosition[0], props.zoomPosition[1]]);
  }, [props.zoomPosition]);

  return (
    <Box
      className="ws-ruler"
      disabled
      //onMouseMove={handleHover}
      onClick={handleMouseUp}
      onMouseUp={handleMouseUp}
      ref={rulerRef}
      sx={(theme) => ({
        [theme.breakpoints.down("md")]: {
          height: "16px",
        },
      })}
    >
      {rulerRef.current && (
        <div
          className="ws-ruler-zoom-cont"
          onMouseDown={handleZoomContMouseDown}
          style={{
            width:
              (handlePosition[1] - handlePosition[0] + 1) *
              (rulerRef.current.offsetWidth / props.sessionSize),

            transform: `translateX(${
              handlePosition[0] *
              (rulerRef.current.offsetWidth / props.sessionSize)
            }px`,

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

      {Array(props.sessionSize)
        .fill(0)
        .map((e, i) => (
          <div
            style={{
              position: "absolute",
              height: "100%",
              left: (1 / props.sessionSize) * i * 100 + "%",
              width: 2,
              backgroundColor: "black",
              opacity: 0.4,
            }}
          />
        ))}

      {props.tracks &&
        props.tracks.map((track, trackIndex) => (
          <Box
            className="ws-ruler-track"
            sx={(theme) => ({
              bgcolor:
                colors[track.color][theme.palette.mode === "dark" ? 200 : 400],
            })}
          />
        ))}
    </Box>
  );
}

export default Ruler;
