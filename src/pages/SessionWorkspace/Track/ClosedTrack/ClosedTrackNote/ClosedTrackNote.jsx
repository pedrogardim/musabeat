import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

import { colors } from "../../../../../utils/Pallete";

import { Box, Paper } from "@mui/material";

function ClosedTrackNote(props) {
  const {
    rowRef,
    trackRows,
    note,
    track,
    zoomPosition,
    selected,
    gridSize,
    movingSelDelta,
    player,
  } = props;

  const canvasRef = useRef(null);

  const trackType = track.type;

  let zoomSize = zoomPosition[1] - zoomPosition[0] + 1;

  useEffect(() => {
    if (player)
      drawClipWave(
        player.buffer.toArray(0),
        canvasRef,
        colors[track.color][900]
      );
  }, [player]);

  return (
    <Box
      className="track-score-note"
      style={{
        height: rowRef.current.scrollHeight / trackRows.length - 1,
        width: note.duration
          ? (Tone.Time(note.duration).toSeconds() /
              Tone.Time("1m").toSeconds()) *
              (rowRef.current.offsetWidth / zoomSize) -
            2
          : 0,
        transform: `translate(${
          Tone.Time(note.time).toSeconds() *
            (rowRef.current.offsetWidth /
              (zoomSize * Tone.Time("1m").toSeconds())) +
          ((selected ? movingSelDelta / gridSize : 0) - zoomPosition[0]) *
            (rowRef.current.offsetWidth / zoomSize)
        }px,${
          trackType === 2
            ? 0
            : trackRows
                .sort((a, b) =>
                  trackType === 0 ? a.note - b.note : b.note - a.note
                )
                .findIndex((e) => e.note === note.note) *
              (rowRef.current.scrollHeight / trackRows.length)
        }px)`,
        backgroundColor: "transparent",
        overflow: trackType === 2 && "hidden",
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
            backgroundColor: selected
              ? "white"
              : colors[props.track.color][900],
          })}
        />
      ) : trackType === 1 ? (
        <Paper
          sx={(theme) => ({
            boxShadow: 0,
            position: "absolute",
            maxHeight: 8,
            height: "50%",
            top: "calc(50% - 4px)",
            width: "100%",
            left: 1,
            backgroundColor: selected
              ? "white"
              : colors[props.track.color][900],
          })}
        />
      ) : (
        player && (
          <canvas
            className="sampler-audio-clip-wave"
            ref={canvasRef}
            style={{
              position: "absolute",
              height: "100%",
              width:
                (player.buffer.duration / Tone.Time("1m").toSeconds()) *
                (rowRef.current.offsetWidth / zoomSize),
              left:
                -(note.offset / Tone.Time("1m").toSeconds()) *
                (rowRef.current.offsetWidth / zoomSize),
            }}
          />
        )
      )}
    </Box>
  );
}

const drawClipWave = (waveArray, canvasRef, color) => {
  //if (clipHeight === 0 || clipWidth === 0) return;
  const canvas = canvasRef.current;
  canvas.height = canvas.offsetHeight;
  canvas.width = canvas.offsetWidth;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //console.log(canvas.width);

  let xScale = waveArray.length / canvas.width;
  let yScale = 1;

  ctx.fillStyle = color;

  for (let x = 0; x < canvas.width; x++) {
    let rectHeight =
      Math.abs(Math.floor(waveArray[Math.floor(x * xScale)] * canvas.height)) *
      yScale;

    //console.log("rect");
    ctx.fillRect(x, canvas.height / 2 - rectHeight / 2, 1, rectHeight);
  }
};

export default ClosedTrackNote;
