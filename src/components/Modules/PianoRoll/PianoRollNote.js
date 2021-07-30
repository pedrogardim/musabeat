import React, { useState, useEffect } from "react";

import * as Tone from "tone";

//import Draggable from "react-draggable";
import { Rnd } from "react-rnd";

import "./PianoRoll.css";

function PianoRollNote(props) {
  const [notePosition, setNotePosition] = useState({ x: 0, y: 0 });
  const [noteWidth, setNoteWidth] = useState(0);

  //const [noteSize, setNoteSize] = useState({ width: 0, height: 30 });

  let noteHeight = props.parentRef.current
    ? props.parentRef.current.offsetHeight / 84
    : 16;

  const style = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `solid 1px ${props.color[100]}`,
    background: props.selected ? props.color[500] : props.color[300],
    color: props.selected ? props.color[100] : props.color[800],
    borderRadius: 3,
  };

  const handleMouseDown = (e) => {
    props.setSelection((prev) =>
      e.shiftKey
        ? prev.includes(props.index)
          ? prev.filter((e) => e !== props.index)
          : [...prev, props.index]
        : [props.index]
    );
  };

  const handleDrag = (event, data) => {
    setNotePosition({ x: data.x, y: data.y });
    //console.log(data);
  };

  const handleDragStop = (event, data) => {
    let newTime =
      (data.x * Tone.Time("1m").toSeconds() * props.size) /
      props.parentRef.current.offsetWidth;
    let newNote = Tone.Frequency(-data.y / noteHeight + 107, "midi").toNote();
    //console.log(newNote, newTime);
    let noteObj = { note: newNote, time: newTime };
    props.changeNote(noteObj, props.index);
  };

  const handleResize = (a, b, c, d, e, f) => {
    setNoteWidth(c.offsetWidth);
  };

  const handleResizeStop = (a, b, c, d, e, f) => {
    let noteObj = {
      duration:
        (c.offsetWidth * Tone.Time("1m").toSeconds() * props.size) /
        props.parentRef.current.offsetWidth,
    };
    props.changeNote(noteObj, props.index);
  };

  const updateNotePosition = () => {
    noteHeight = props.parentRef.current.offsetHeight / 84;
    let noteX =
      (props.note.time / (Tone.Time("1m").toSeconds() * props.size)) *
      props.parentRef.current.offsetWidth;
    setNoteWidth(
      (Tone.Time(props.note.duration).toSeconds() /
        (Tone.Time("1m").toSeconds() * props.size)) *
        props.parentRef.current.offsetWidth
    );

    let noteY =
      noteHeight * (83 - (Tone.Frequency(props.note.note).toMidi() - 24));

    setNotePosition({ x: noteX, y: noteY });
    //console.log(noteY, noteX, noteHeight, noteWidth);
  };

  useEffect(() => {}, []);

  useEffect(() => {
    if (props.parentRef.current) {
      updateNotePosition();
    }
  }, [
    props.note,
    props.index,
    props.parentWidth,
    props.parentRef.current,
    props.fullScreen,
    props.moduleZoom,
    props.size,
    //props.parentRef.current.offsetHeight,
    //props.parentRef.current.offsetWidth,
  ]);

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
      onDrag={handleDrag}
      onDragStop={handleDragStop}
      onResize={handleResize}
      onResizeStop={handleResizeStop}
      onMouseDown={handleMouseDown}
      position={notePosition}
      size={{ height: noteHeight, width: noteWidth }}
      bounds={".piano-roll"}
      dragGrid={[3, noteHeight]}
      default={{
        x: notePosition.x,
        y: notePosition.y,
        width: 60,
        height: noteHeight,
      }}
    >
      {props.note.note}
    </Rnd>
  );
}

export default PianoRollNote;
