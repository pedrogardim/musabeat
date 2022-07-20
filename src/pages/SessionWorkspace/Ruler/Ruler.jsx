import React, { useState, useEffect, useRef, useContext } from "react";
import * as Tone from "tone";

import { colors } from "../../../utils/Pallete";

import { SessionWorkspaceContext } from "../../../context/SessionWorkspaceContext";

import { Box } from "@mui/material";

function Ruler(props) {
  const rulerRef = useRef(null);

  const { params, paramSetter, tracks } = useContext(SessionWorkspaceContext);

  const { zoomPosition, sessionSize } = params;

  const [isMoving, setIsMoving] = useState(false);
  const [resizingHandle, setResizingHandle] = useState(false);
  const [handlePosition, setHandlePosition] = useState(zoomPosition);

  const zoomSize = zoomPosition[1] - zoomPosition[0] + 1;

  const handleZoomContMouseDown = (e) => {
    if (!e.target.className.includes("handle")) {
      setIsMoving(
        (((e.touches ? e.touches[0].pageX : e.pageX) -
          rulerRef.current.getBoundingClientRect().left) /
          rulerRef.current.offsetWidth) *
          sessionSize -
          zoomPosition[0]
      );
    }
  };

  const handleHover = (mouseX) => {
    let hoveredPos =
      (mouseX - rulerRef.current.getBoundingClientRect().left) /
      rulerRef.current.offsetWidth;

    if (resizingHandle) {
      setHandlePosition((prev) => {
        let newHandlePos = [...prev];
        let handleSide = resizingHandle === "left";
        if (
          (resizingHandle === "left" && hoveredPos < 0) ||
          (resizingHandle === "right" && hoveredPos + 1 > sessionSize)
        )
          return prev;
        newHandlePos[handleSide ? 0 : 1] =
          hoveredPos * sessionSize - (handleSide ? 0 : 1);

        paramSetter("zoomPosition", (prev) => {
          let newSessionZoom = [...prev];
          newSessionZoom[handleSide ? 0 : 1] = parseInt(
            hoveredPos * sessionSize + (handleSide ? 0.5 : -0.5)
          );
          if (
            newSessionZoom[0] > newSessionZoom[1] ||
            JSON.stringify(newSessionZoom) === JSON.stringify(prev)
          ) {
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
            hoveredPos * sessionSize + posIndex * (zoomSize - 1) - isMoving
        );
        if (newHandlePos[0] < 0 || newHandlePos[1] + 1 > sessionSize)
          return prev;

        paramSetter("zoomPosition", (prev) => {
          let newSessionZoom = [...prev];
          newSessionZoom = newHandlePos.map((e, i) => parseInt(e + 0.5));
          if (JSON.stringify(newSessionZoom) === JSON.stringify(prev))
            return prev;

          return newSessionZoom;
        });

        return newHandlePos;
      });
    }

    /* let gridPos = Math.floor(Math.abs(hoveredPos * sessionSize));

    setGridPos((prev) =>
      JSON.stringify(prev) === JSON.stringify(gridPos) ? prev : gridPos
    ); */
  };

  const handleMouseUp = (e) => {
    setResizingHandle(null);
    setIsMoving(false);
    if (resizingHandle || isMoving) {
    }
    setHandlePosition([zoomPosition[0], zoomPosition[1]]);
  };

  useEffect(() => {
    setHandlePosition([zoomPosition[0], zoomPosition[1]]);
    let begin = params.zoomPosition[0] * Tone.Time("1m").toSeconds();
    Tone.Transport.setLoopPoints(
      begin,
      (params.zoomPosition[1] + 1) * Tone.Time("1m").toSeconds()
    );

    if (Tone.Transport.seconds < begin) Tone.Transport.seconds = begin;
  }, [zoomPosition]);

  return (
    <Box
      className="ws-ruler"
      disabled
      onClick={handleMouseUp}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
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
          onTouchStart={handleZoomContMouseDown}
          onTouchMove={(e) => handleHover(e.touches[0].pageX)}
          style={{
            width:
              (handlePosition[1] - handlePosition[0] + 1) *
              (rulerRef.current.offsetWidth / sessionSize),

            transform: `translateX(${
              handlePosition[0] * (rulerRef.current.offsetWidth / sessionSize)
            }px`,
          }}
        >
          <div
            className="ws-ruler-zoom-cont-handle"
            onMouseDown={() => setResizingHandle("left")}
            onTouchStart={() => setResizingHandle("left")}
            onTouchMove={(e) => handleHover(e.touches[0].pageX)}
            style={{ left: 0 }}
          />
          <div
            className="ws-ruler-zoom-cont-handle"
            onMouseDown={() => setResizingHandle("right")}
            onTouchStart={() => setResizingHandle("right")}
            onTouchMove={(e) => handleHover(e.touches[0].pageX)}
            style={{ right: 0 }}
          />
        </div>
      )}

      {Array(sessionSize)
        .fill(0)
        .map((e, i) => (
          <div
            style={{
              position: "absolute",
              height: "100%",
              left: (1 / sessionSize) * i * 100 + "%",
              width: 2,
              backgroundColor: "black",
              opacity: 0.4,
            }}
          />
        ))}

      {tracks &&
        tracks.map((track, trackIndex) => (
          <Box
            className="ws-ruler-track"
            sx={(theme) => ({
              bgcolor:
                colors[track.color][theme.palette.mode === "dark" ? 200 : 400],
            })}
          />
        ))}

      {(resizingHandle || isMoving) && (
        <div
          className="knob-backdrop"
          onMouseMove={(e) => handleHover(e.pageX)}
          onTouchMove={(e) => handleHover(e.touches[0].pageX)}
          onMouseUp={handleMouseUp}
          onMouseOut={handleMouseUp}
          onTouchEnd={handleMouseUp}
        />
      )}
    </Box>
  );
}

export default Ruler;
