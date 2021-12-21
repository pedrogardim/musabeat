import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import { colors } from "../../utils/materialPalette";

import { Box, Paper } from "@mui/material";

function ClosedTrackNote(props) {
  const trackType = props.track.type;

  let zoomSize = props.zoomPosition[1] - props.zoomPosition[0] + 1;

  return (
    <Box
      className="track-score-note"
      style={{
        height: props.rowRef.current.scrollHeight / props.trackRows.length - 1,
        width: props.note.duration
          ? (Tone.Time(props.note.duration).toSeconds() /
              Tone.Time("1m").toSeconds()) *
              (props.rowRef.current.offsetWidth / zoomSize) -
            2
          : 0,
        transform: `translate(${
          Tone.Time(props.note.time).toSeconds() *
            (props.rowRef.current.offsetWidth /
              (zoomSize * Tone.Time("1m").toSeconds())) +
          ((props.selected ? props.movingSelDelta / props.gridSize : 0) -
            props.zoomPosition[0]) *
            (props.rowRef.current.offsetWidth / zoomSize)
        }px,${
          props.trackRows
            .sort((a, b) =>
              trackType === 0 ? a.note - b.note : b.note - a.note
            )
            .findIndex((e) => e.note === props.note.note) *
          (props.rowRef.current.scrollHeight / props.trackRows.length)
        }px)`,
        backgroundColor: "transparent",
        //borderRadius: 4,
        //margin: "-2px -2px 0 0",
      }}
    >
      {trackType === 0 ? (
        <Paper
          sx={(theme) => ({
            boxShadow: 0,
            position: "absolute",
            height: 4,
            top: "calc(50% - 2px)",
            width: 4,
            left: -2,
            backgroundColor: props.selected
              ? "white"
              : theme.palette.mode === "dark"
              ? colors[props.track.color][900]
              : colors[props.track.color][900],
          })}
        />
      ) : (
        <Paper
          sx={(theme) => ({
            boxShadow: 0,
            position: "absolute",
            maxHeight: 8,
            height: "50%",
            top: "calc(50% - 4px)",
            width: "100%",
            left: 1,
            backgroundColor: props.selected
              ? "white"
              : theme.palette.mode === "dark"
              ? colors[props.track.color][900]
              : colors[props.track.color][900],
          })}
        />
      )}
    </Box>
  );
}

export default ClosedTrackNote;
