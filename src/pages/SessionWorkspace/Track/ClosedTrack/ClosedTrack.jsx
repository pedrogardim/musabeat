import React, { useState, useEffect, useRef, useContext } from "react";
import * as Tone from "tone";
import { colors } from "../../../../utils/Pallete";

import { SessionWorkspaceContext } from "../../../../context/SessionWorkspaceContext";

import { IconButton, Icon, Paper, CircularProgress } from "@mui/material";

import {
  scheduleSampler,
  scheduleMelody,
  scheduleAudioTrack,
  clearEvents,
} from "../../services/Schedule";

import Note from "./Note";

function ClosedTrack(props) {
  const rowRef = useRef(null);

  const [trackRows, setTrackRows] = useState([]);

  const { trackIndex, track, selectedNotes, movingSelDelta } = props;

  const { instruments, params, paramSetter, instrumentsLoaded } = useContext(
    SessionWorkspaceContext
  );

  const { zoomPosition, gridSize, isLoaded, sessionSize } = params;

  const trackType = track.type;

  const instrument = instruments[trackIndex];
  const loaded = instrumentsLoaded[trackIndex];
  const selectedTrackNotes = selectedNotes[trackIndex];

  const loadTrackRows = () => {
    let rows = [];
    if (!instrument) return;

    let array = [...new Set(track.score.map((item) => item.note))].sort(
      (a, b) => a - b
    );

    rows = array.map((e, i) => {
      return {
        note: e,
        index: e,
        //player: instrument.player(e),
      };
    });

    setTrackRows(rows);
  };

  const scheduleNotes = () => {
    !track.muted
      ? trackType === 0
        ? scheduleSampler(track.score, instrument, Tone.Transport, track.id)
        : trackType === 1
        ? scheduleMelody(track.score, instrument, Tone.Transport, track.id)
        : scheduleAudioTrack(track.score, instrument, Tone.Transport, track.id)
      : clearEvents(track.id);
  };

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================USEEFFECTS======================================== */
  /* ================================================================================== */
  /* ================================================================================== */

  useEffect(() => {
    loadTrackRows();
  }, [instrument, track]);

  useEffect(() => {
    scheduleNotes();
  }, [instrument, track, track.score, isLoaded]);

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================JSX=============================================== */
  /* ================================================================================== */
  /* ================================================================================== */

  return (
    <Paper
      className="closed-track"
      ref={rowRef}
      onClick={() => loaded && paramSetter("selectedTrack", trackIndex)}
      disabled
      sx={(theme) => ({
        bgcolor: colors[track.color][theme.palette.mode === "dark" ? 200 : 400],
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
        {!loaded && (
          <CircularProgress
            sx={(theme) => ({
              position: "absolute",
              left: "calc(50% - 20px)",
              top: "calc(50% - 20px)",
              color:
                colors[track.color][theme.palette.mode === "dark" ? 900 : 900],
            })}
          />
        )}
        {rowRef.current &&
          track.score.length > 0 &&
          track.score.map((note, noteIndex) => (
            <Note
              rowRef={rowRef}
              trackRows={trackRows}
              note={note}
              track={track}
              sessionSize={sessionSize}
              index={noteIndex}
              zoomPosition={zoomPosition}
              selected={
                selectedTrackNotes && selectedTrackNotes.includes(noteIndex)
              }
              key={noteIndex}
              gridSize={gridSize}
              movingSelDelta={movingSelDelta}
            />
          ))}
      </div>
      <IconButton
        sx={(theme) => ({
          color: colors[track.color][theme.palette.mode === "dark" ? 200 : 600],
        })}
        className={"closed-track-button"}
      >
        <Icon>
          {track.type === 0
            ? "grid_on"
            : track.type === 1
            ? "piano"
            : "graphic_eq"}
        </Icon>
      </IconButton>
    </Paper>
  );
}

export default ClosedTrack;
