import React, { useState, useEffect, useRef, useContext } from "react";

import * as Tone from "tone";

import "./style.css";

import Draggable from "react-draggable";

import { SessionWorkspaceContext } from "../../../context/SessionWorkspaceContext";

import { Box, Typography, IconButton, Icon } from "@mui/material";

function Grid(props) {
  const gridRef = useRef(null);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [gridPos, setGridPos] = useState(null);
  const [initialSelectionPos, setInitialSelectionPos] = useState(null);
  const [resizingHandle, setResizingHandle] = useState(false);
  const [isMovingSelected, setIsMovingSelected] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const { setTracks, params, paramSetter } = useContext(
    SessionWorkspaceContext
  );

  const {
    zoomPosition,
    openSubPage,
    gridSize,
    cursorMode,
    selectedTrack,
    playing,
    selection,
    selNotes,
    movingSelDelta,
    sessionSize,
  } = params;

  const zoomSize = zoomPosition[1] - zoomPosition[0] + 1;

  const hiddenNumbers = openSubPage === "IE" || openSubPage === "mixer";

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds = (gridPos * Tone.Time("1m").toSeconds()) / gridSize;

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

    paramSetter("selection", []);

    if (!cursorMode && !isClickOnNote) {
      Tone.Transport.seconds =
        (gridPos * Tone.Time("1m").toSeconds()) / gridSize;

      setInitialSelectionPos(gridPos);
      paramSetter("selection", [gridPos, null]);
    }
  };

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

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setResizingHandle(null);
    setInitialSelectionPos(null);
    setIsMovingSelected(false);
    if (movingSelDelta !== null) commitNotesDrag();
    //setSelection([]);
  };

  const onGridPosChange = () => {
    //drag note input
    if (isMouseDown && !resizingHandle) {
      if (cursorMode !== "edit") {
        if (isMovingSelected === false)
          paramSetter(
            "selection",
            [initialSelectionPos, gridPos].sort((a, b) => a - b)
          );
        else handleSelectedNotesDrag();
      }
    }
    if (resizingHandle) {
      paramSetter("selection", (prev) => {
        let newSelection = [...prev];
        let handleSide = resizingHandle === "left";
        if (
          (resizingHandle === "left" && newSelection < 0) ||
          (resizingHandle === "right" && newSelection + 1 > sessionSize)
        )
          return prev;
        newSelection[handleSide ? 0 : 1] = gridPos;

        return newSelection;
      });
    }
  };

  const commitNotesDrag = () => {
    setTracks((prev) =>
      prev.map((track, trackIndex) => ({
        ...track,
        score: track.score.map((note, noteIndex) => ({
          ...note,
          time: Tone.Time(
            Tone.Time(note.time).toSeconds() +
              (selNotes[trackIndex].includes(noteIndex) &&
                (movingSelDelta / gridSize) * Tone.Time("1m").toSeconds())
          ).toBarsBeatsSixteenths(),
        })),
      }))
    );

    paramSetter(
      "selection",
      (prev) => prev.map((e) => e + movingSelDelta),
      "movingDelta",
      null
    );
  };

  const handleSelectedNotesDrag = () => {
    paramSetter("movingSelDelta", gridPos - isMovingSelected);
  };
  /* 
  useEffect(() => {
    setTLinputSessionSize(sessionSize);
  }, [sessionSize]); */

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
              zoomPosition[0] * Tone.Time("1m").toSeconds()) /
              (zoomSize * Tone.Time("1m").toSeconds())
          );
      }, 16)
    );
  }, [zoomPosition]);

  useEffect(() => {
    onGridPosChange();
  }, [gridPos]);

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
                    color="textPrimary"
                  >
                    {i / gridSize + 1 + zoomPosition[0]}
                  </Typography>
                )}
              </Box>
            )
          )}

        <div className="ws-grid-line" />
      </div>

      {(selection.length === 0 ||
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
          disabled={isMouseDown}
          bounds=".ws-grid-line-cont"
        >
          <Box
            className={"ws-grid-cursor"}
            sx={{ bgcolor: playing === "rec" ? "secondary" : "text.primary" }}
            style={{
              pointerEvents: isMouseDown && "none",
            }}
          />
        </Draggable>
      )}

      {props.children}

      {selection.length > 0 && !selection.includes(null) && (
        <Box
          sx={{
            position: "absolute",
            height: "100%",
            transform: `translateX(${
              ((selection.sort((a, b) => a - b)[0] +
                (movingSelDelta && movingSelDelta) -
                zoomPosition[0] * gridSize) /
                (zoomSize * gridSize)) *
                gridRef.current.offsetWidth +
              48
            }px)`,
            width: Math.abs(
              (selection.sort((a, b) => a - b)[1] / (zoomSize * gridSize)) *
                gridRef.current.offsetWidth -
                (selection.sort((a, b) => a - b)[0] / (zoomSize * gridSize)) *
                  gridRef.current.offsetWidth
            ),
            bgcolor: "text.secondary",
            opacity: 0.7,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            /* border:
                cursorMode === "edit" && "solid 1px rgba(0,0,0,0.5)", */
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
          defaultValue={sessionSize}
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
