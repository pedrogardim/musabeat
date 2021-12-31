import React, { useState, useEffect, useRef } from "react";

import * as Tone from "tone";

import "./style.css";

import Draggable from "react-draggable";

import { colors } from "../../../utils/Pallete";

import { Box, Typography, IconButton, Icon } from "@mui/material";

function Grid(props) {
  const gridRef = useRef(null);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [gridPos, setGridPos] = useState(null);
  const [initialSelectionPos, setInitialSelectionPos] = useState(null);
  const [resizingHandle, setResizingHandle] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isMovingSelected, setIsMovingSelected] = useState(false);

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
    setIsMouseDown(true);

    if (e.target.className.includes("handle")) {
      return;
    }

    let isClickOnNote = e.target.className.includes("note");
    let isClickOnButton =
      e.target.className.includes("MuiIcon") ||
      e.target.className.includes("MuiButton");

    if (isClickOnNote || isClickOnButton) return;

    props.setSelection([]);

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
    setIsMovingSelected(false);
    if (props.movingSelDelta !== null) commitNotesDrag();
    //props.setSelection([]);
  };

  const onGridPosChange = () => {
    //drag note input
    if (isMouseDown && !resizingHandle) {
      if (props.cursorMode !== "edit") {
        if (isMovingSelected === false)
          props.setSelection((prev) =>
            [initialSelectionPos, gridPos].sort((a, b) => a - b)
          );
        else handleSelectedNotesDrag();
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

  const commitNotesDrag = () => {
    props.setTracks((prev) =>
      prev.map((track, trackIndex) => ({
        ...track,
        score: track.score.map((note, noteIndex) => ({
          ...note,
          time: Tone.Time(
            Tone.Time(note.time).toSeconds() +
              (props.selectedNotes[trackIndex].includes(noteIndex) &&
                (props.movingSelDelta / props.gridSize) *
                  Tone.Time("1m").toSeconds())
          ).toBarsBeatsSixteenths(),
        })),
      }))
    );

    props.setSelection((prev) => prev.map((e) => e + props.movingSelDelta));

    props.setMovingSelDelta(null);
  };

  const handleSelectedNotesDrag = () => {
    props.setMovingSelDelta(gridPos - isMovingSelected);
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
              <Box
                key={i + "gd"}
                className="ws-grid-line"
                sx={{ bgcolor: "text.primary" }}
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
                  <Typography
                    className="ws-grid-line-mesure-num"
                    color="textPrimary"
                  >
                    {i / props.gridSize + 1 + props.zoomPosition[0]}
                  </Typography>
                )}
              </Box>
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
          <Box
            className={"ws-grid-cursor"}
            sx={{ bgcolor: props.isRecording ? "secondary" : "text.primary" }}
            style={{
              pointerEvents: props.isMouseDown && "none",
            }}
          />
        </Draggable>
      )}

      {props.children}

      {props.selection.length > 0 && !props.selection.includes(null) && (
        <Box
          sx={{
            position: "absolute",
            height: "100%",
            transform: `translateX(${
              ((props.selection.sort((a, b) => a - b)[0] +
                (props.movingSelDelta && props.movingSelDelta) -
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
            bgcolor: "text.secondary",
            opacity: 0.7,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
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
          <IconButton onMouseDown={() => setIsMovingSelected(gridPos)}>
            <Icon
              sx={{ transform: "rotate(45deg)", color: "background.default" }}
            >
              open_in_full
            </Icon>
          </IconButton>
        </Box>
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

export default Grid;
