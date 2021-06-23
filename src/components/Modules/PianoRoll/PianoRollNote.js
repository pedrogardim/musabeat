import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import { labels } from "../../../assets/drumkits";

//import Draggable from "react-draggable";
import { Rnd } from "react-rnd";

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
  const [notePosition, setNotePosition] = useState({ x: 0, y: 0 });
  let noteHeight = 31;
  let noteWidth = 60;

  const style = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "solid 1px #ddd",
    background: "#f0f0f0",
  };

  const handleNoteDrag = (event, data) => {
    setNotePosition({ x: data.x, y: data.y });
    //console.log(data);
  };

  const handleNoteDragStop = (event, data) => {
    let newTime =
      (data.x * Tone.Time("1m").toSeconds()) /
      props.parentRef.current.offsetWidth;
    let newNote = Tone.Frequency(-data.y / 31 + 107, "midi").toNote();
    console.log(newNote, newTime);
    let noteObj = { note: newNote, time: newTime };
    props.changeNote(noteObj, props.index);
  };

  const handleNoteDragStart = (event, element) => {};

  const updateNotePosition = () => {
    console.log("updateNotePosition triggered");
    let noteX =
      (props.note.time / Tone.Time("1m").toSeconds()) *
      props.parentRef.current.offsetWidth;
    noteHeight = 30;
    noteWidth =
      (Tone.Time(props.note.duration).toSeconds() /
        Tone.Time("1m").toSeconds()) *
      props.parentRef.current.offsetWidth;

    let noteY = 31 * (83 - (Tone.Frequency(props.note.note).toMidi() - 24));

    setNotePosition({ x: noteX, y: noteY });
    //console.log(noteY, noteX, noteHeight, noteWidth);
  };

  useEffect(() => {
    if (props.parentRef.current) {
      updateNotePosition();
    }
  }, [props.parentRef.current, props.fullScreen, props.moduleZoom]);

  /*  useEffect(() => {
    console.log(notePosition);
  }, [notePosition]); */

  return (
    <Rnd
      style={style}
      enableResizing={{
        top: false,
        right: true,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      onDrag={handleNoteDrag}
      onDragStop={handleNoteDragStop}
      position={notePosition}
      bounds={".piano-roll"}
      dragGrid={[1, 31]}
      default={{
        x: notePosition.x,
        y: notePosition.y,
        width: 320,
        height: 30,
      }}
    >
      {props.note.note}
    </Rnd>
  );
}

export default PianoRollNote;
