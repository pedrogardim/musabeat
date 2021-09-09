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
    pointerEvents: props.dragSelection && "none",
  };

  const handleClick = (e) => {
    props.setSelection((prev) =>
      e.shiftKey
        ? prev.includes(props.index)
          ? prev.filter((e) => e !== props.index)
          : [...prev, props.index]
        : [props.index]
    );

    props.instrument.triggerAttackRelease(
      props.note.note,
      props.note.duration,
      Tone.immediate()
    );
  };

  const handleDrag = (event, data) => {
    setNotePosition({ x: data.x, y: data.y });
    props.setDraggingNoteDelta({ x: data.deltaX, y: data.deltaY });
    props.setDraggingNote([props.index, props.note]);
  };

  const handleDragStop = (event, data) => {
    let newTime = Tone.Time(
      (data.x * Tone.Time("1m").toSeconds() * props.size) /
        props.parentRef.current.offsetWidth
    ).toBarsBeatsSixteenths();
    let newNote = Tone.Frequency(-data.y / noteHeight + 107, "midi").toNote();
    if (newTime.includes("-")) newTime = "0:0:0";
    let noteObj = { note: newNote, time: newTime };
    props.changeNote(noteObj, props.index);

    props.setDraggingNoteDelta(null);
    props.setDraggingNote(null);
  };

  const handleResize = (a, b, c, d, e, f) => {
    setNoteWidth(c.offsetWidth);
  };

  const handleResizeStop = (a, b, c, d, e, f) => {
    let noteObj = {
      duration: Tone.Time(
        (c.offsetWidth * Tone.Time("1m").toSeconds() * props.size) /
          props.parentRef.current.offsetWidth
      ).toBarsBeatsSixteenths(),
    };
    props.changeNote(noteObj, props.index);
  };

  const updateNotePosition = () => {
    noteHeight = props.parentRef.current.offsetHeight / 84;
    let noteX =
      (Tone.Time(props.note.time).toSeconds() /
        (Tone.Time("1m").toSeconds() * props.size)) *
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

  //useEffect(() => {}, []);

  useEffect(() => {
    if (props.parentRef.current) {
      updateNotePosition();
    }
  }, [
    props.note,
    props.note.note,
    props.index,
    props.parentWidth,
    props.parentRef.current,
    props.fullScreen,
    props.moduleZoom,
    props.size,
    //props.parentRef.current.offsetHeight,
    //props.parentRef.current.offsetWidth,
  ]);

  //WIP: Multidrag

  /* useEffect(() => {
    if (
      props.draggingNote &&
      props.draggingNote[0] !== props.index &&
      props.selected
    ) {
      if (props.draggingNoteDelta) {
        setNotePosition((prev) => {
          return {
            x: prev.x + props.draggingNoteDelta.x,
            y: prev.y + props.draggingNoteDelta.y,
          };
        });
      } else {
        handleDragStop("", { x: notePosition.x, y: notePosition.y });
      }
    }
  }, [props.draggingNoteDelta]); */

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
      onClick={handleClick}
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
