import React, { useState, useEffect, useRef, useContext } from "react";

import * as Tone from "tone";

import { SessionWorkspaceContext } from "../../../../context/SessionWorkspaceContext";

import { Box, IconButton, Icon } from "@mui/material";

function Selection(props) {
  const [initialSelectionPos, setInitialSelectionPos] = useState(null);
  const [resizingHandle, setResizingHandle] = useState(false);
  const [isMovingSelected, setIsMovingSelected] = useState(false);

  const { gridPos, clickedTarget, gridRef } = props;

  const { tracks, setTracks, params, paramSetter } = useContext(
    SessionWorkspaceContext
  );

  const {
    zoomPosition,
    gridSize,
    cursorMode,
    selectedTrack,
    selection,
    selNotes,
    movingSelDelta,
    sessionSize,
  } = params;

  const zoomSize = zoomPosition[1] - zoomPosition[0] + 1;

  const onMouseDown = (className) => {
    if (className.includes("handle")) return;

    let isClickOnNote = className.includes("note");
    let isClickOnButton =
      className.includes("MuiIcon") || className.includes("MuiButton");

    if (isClickOnNote || isClickOnButton) return;

    paramSetter("selection", []);

    if (!cursorMode && !isClickOnNote) {
      Tone.Transport.seconds =
        (gridPos * Tone.Time("1m").toSeconds()) / gridSize;

      setInitialSelectionPos(gridPos);
      paramSetter("selection", [gridPos, null]);
    }
  };

  const onMouseUp = () => {
    setResizingHandle(null);
    setInitialSelectionPos(null);
    setIsMovingSelected(false);
    if (movingSelDelta !== null) commitNotesDrag();
    //setSelection([]);
  };

  const onGridPosChange = () => {
    //drag note input
    if (clickedTarget !== null && !resizingHandle) {
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
      "movingSelDelta",
      null
    );
  };

  const updateSelectedNotes = () => {
    paramSetter(
      "selNotes",
      tracks.map((mod, modIndex) => {
        if (
          (selectedTrack !== null && selectedTrack !== modIndex) ||
          selection[1] === null
        )
          return [];
        let notes = [];
        for (let x = 0; x < mod.score.length; x++) {
          let note = mod.score[x];
          if (
            Tone.Time(note.time).toSeconds() +
              (note.duration ? Tone.Time(note.duration).toSeconds() : 0) >=
              (selection[0] / gridSize) * Tone.Time("1m").toSeconds() +
                (note.duration ? 0.0001 : 0) &&
            Tone.Time(note.time).toSeconds() <
              (selection[1] / gridSize) * Tone.Time("1m").toSeconds()
          )
            notes.push(x);
        }
        return notes;
      })
    );
  };

  const handleSelectedNotesDrag = () => {
    paramSetter("movingSelDelta", gridPos - isMovingSelected);
  };

  useEffect(() => {
    if (tracks && movingSelDelta === null) updateSelectedNotes();
  }, [selection]);

  useEffect(() => {
    onGridPosChange();
  }, [gridPos]);

  useEffect(() => {
    clickedTarget ? onMouseDown(clickedTarget) : onMouseUp();
  }, [clickedTarget]);

  return selection.length > 0 && !selection.includes(null) ? (
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
        <Icon sx={{ transform: "rotate(45deg)", color: "background.default" }}>
          open_in_full
        </Icon>
      </IconButton>
    </Box>
  ) : (
    <></>
  );
}

export default Selection;
