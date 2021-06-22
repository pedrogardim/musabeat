import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import { labels } from "../../../assets/drumkits";

import Draggable from "react-draggable";

import {
  scheduleDrumSequence,
  clearEvents,
} from "../../../utils/TransportSchedule";
import { loadDrumPatch } from "../../../assets/musicutils";

import {
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
  Typography,
} from "@material-ui/core";

import "./PianoRoll.css";
import { colors } from "../../../utils/materialPalette";

function PianoRollNote(props) {
  const [notePosition, setNotePosition] = useState([0, 0]);
  let noteHeight = 31;
  let noteWidth = 60;

  const handleNoteDrag = (event, element) => {
    setNotePosition([element.x, element.y]);
  };

  const handleNoteDragStart = (event, element) => {};

  const handleNoteDragStop = (event, element) => {};

  const updateNotePosition = () => {
    let noteX =
      (props.note.time / Tone.Time("1m").toSeconds()) *
      props.parentRef.current.offsetWidth;
    noteHeight = 30;
    noteWidth =
      (Tone.Time(props.note.duration).toSeconds() /
        Tone.Time("1m").toSeconds()) *
      props.parentRef.current.offsetWidth;

    let noteY = 31 * (83 - (Tone.Frequency(props.note.note).toMidi() - 24));

    setNotePosition([noteX, noteX]);
    console.log(noteY, noteX, noteHeight, noteWidth);
  };

  useEffect(() => {
    if (props.parentRef.current) {
      updateNotePosition();
    }
  }, [props.parentRef.current, props.fullScreen, props.moduleZoom]);

  return (
    <Draggable
      grid={[1, 31]}
      onDrag={handleNoteDrag}
      onStart={handleNoteDragStart}
      onStop={handleNoteDragStop}
      position={{ x: notePosition[0], y: notePosition[1] }}
    >
      <div
        className="piano-roll-note"
        style={{
          height: noteHeight,
          width: noteWidth,
          backgroundColor: props.color[300],
          outline: `solid 1px ${props.color[700]}`,
        }}
      ></div>
    </Draggable>
  );
}

export default PianoRollNote;
