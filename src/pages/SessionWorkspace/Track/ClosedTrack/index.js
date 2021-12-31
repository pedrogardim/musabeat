import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";
import "./Track.css";

import { colors } from "../../utils/materialPalette";

import { IconButton, Icon, Paper, CircularProgress } from "@mui/material";

import {
  scheduleSampler,
  scheduleMelody,
  scheduleAudioTrack,
  clearEvents,
} from "../../utils/TransportSchedule";

import ClosedTrackNote from "./ClosedTrackNote";

function ClosedTrack(props) {
  const rowRef = useRef(null);

  const [trackRows, setTrackRows] = useState([]);
  const [gridPos, setGridPos] = useState([]);
  const [drawingNote, setDrawingNote] = useState(null);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [deletableNote, setDeletableNote] = useState(false);

  const trackType = props.track.type;
  const isSelected = props.selectedTrack === props.index;

  const loadTrackRows = () => {
    let rows = [];
    if (!props.instrument) return;

    let array = [...new Set(props.track.score.map((item) => item.note))].sort(
      (a, b) => a - b
    );

    rows = array.map((e, i) => {
      return {
        note: e,
        index: e,
        //player: props.instrument.player(e),
      };
    });

    setTrackRows(rows);
  };

  const scheduleNotes = () => {
    !props.track.muted
      ? trackType === 0
        ? scheduleSampler(
            props.track.score,
            props.instrument,
            Tone.Transport,
            props.track.id
          )
        : trackType === 1
        ? scheduleMelody(
            props.track.score,
            props.instrument,
            Tone.Transport,
            props.track.id
          )
        : scheduleAudioTrack(
            props.track.score,
            props.instrument,
            Tone.Transport,
            props.track.id
          )
      : clearEvents(props.track.id);
  };

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================USEEFFECTS======================================== */
  /* ================================================================================== */
  /* ================================================================================== */

  useEffect(() => {
    loadTrackRows();
  }, [props.instrument, props.track, props.selectedTrack]);

  useEffect(() => {
    scheduleNotes();
  }, [props.instrument, props.track, props.track.score, props.isLoaded]);

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================JSX=============================================== */
  /* ================================================================================== */
  /* ================================================================================== */

  return (
    <Paper
      className="closed-track"
      ref={rowRef}
      onClick={() => props.loaded && props.setSelectedTrack(props.index)}
      disabled
      sx={(theme) => ({
        bgcolor:
          colors[props.track.color][theme.palette.mode === "dark" ? 200 : 400],
        [theme.breakpoints.down("md")]: {
          margin: "2px 0 2px 48px",
        },
      })}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 0,
          position: "absolute",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!props.loaded && (
          <CircularProgress
            sx={(theme) => ({
              position: "absolute",
              left: "calc(50% - 20px)",
              top: "calc(50% - 20px)",
              color:
                colors[props.track.color][
                  theme.palette.mode === "dark" ? 900 : 900
                ],
            })}
          />
        )}
        {rowRef.current &&
          props.track.score.length > 0 &&
          props.track.score.map((note, noteIndex) => (
            <ClosedTrackNote
              rowRef={rowRef}
              trackRows={trackRows}
              note={note}
              track={props.track}
              sessionSize={props.sessionSize}
              index={noteIndex}
              zoomPosition={props.zoomPosition}
              selected={
                props.selectedNotes && props.selectedNotes.includes(noteIndex)
              }
              key={noteIndex}
              gridSize={props.gridSize}
              movingSelDelta={props.movingSelDelta}
            />
          ))}
      </div>
      <IconButton
        sx={(theme) => ({
          color:
            colors[props.track.color][
              theme.palette.mode === "dark" ? 200 : 600
            ],
        })}
        className={"closed-track-button"}
      >
        <Icon>
          {props.track.type === 0
            ? "grid_on"
            : props.track.type === 1
            ? "piano"
            : "graphic_eq"}
        </Icon>
      </IconButton>
    </Paper>
  );
}

export default ClosedTrack;
