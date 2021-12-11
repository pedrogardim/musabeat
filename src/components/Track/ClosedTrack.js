import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";
import "./Track.css";

import { colors } from "../../utils/materialPalette";

import { IconButton, Icon, Paper, CircularProgress } from "@material-ui/core";

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
  }, [props.instrument, props.track, props.isLoaded, props.selectedTrack]);

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
      style={{
        /* width: `${
          (props.sessionSize * 100) /
          (props.zoomPosition[1] - props.zoomPosition[0] + 1)
        }%`, */
        border: trackType === 1 && isSelected && "1px solid rgba(0, 0, 0,0.2)",
        backgroundColor: colors[props.track.color][400],
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 0,
          position: "absolute",
          overflow: "hidden",
          display: !props.loaded && "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {props.loaded ? (
          rowRef.current &&
          props.track.score.length > 0 &&
          props.track.score.map((note, noteIndex) => (
            <ClosedTrackNote
              rowRef={rowRef}
              trackRows={trackRows}
              note={note}
              drawingNote={drawingNote}
              track={props.track}
              sessionSize={props.sessionSize}
              gridSize={props.gridSize}
              gridPos={gridPos}
              deletableNote={deletableNote}
              setDrawingNote={setDrawingNote}
              index={noteIndex}
              setTracks={props.setTracks}
              isMouseDown={isMouseDown}
              selectedTrack={props.selectedTrack}
              zoomPosition={props.zoomPosition}
              selected={
                props.selectedNotes && props.selectedNotes.includes(noteIndex)
              }
            />
          ))
        ) : (
          <CircularProgress style={{ color: colors[props.track.color][900] }} />
        )}
      </div>
      <IconButton className={"closed-track-button"}>
        <Icon style={{ color: colors[props.track.color][900] }}>
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
