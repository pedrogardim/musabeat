import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import { colors } from "../../utils/materialPalette";

function MelodyNote(props) {
  const handleMouseDown = () => {
    if (props.ghost || props.deletingNote) return;

    props.setDrawingNote((note) => {
      let newNote = { ...note };
      newNote.time = Tone.Time(props.note.time).toSeconds();
      return;
    });
  };
  return (
    <div
      className={`module-score-note ${
        props.ghost && "module-score-note-ghost"
      }`}
      onMouseDown={handleMouseDown}
      style={{
        height: props.rowRef.current.scrollHeight / props.moduleRows.length - 1,
        width:
          (props.ghost
            ? props.drawingNote
              ? (props.gridPos[1] + 1) *
                  (props.rowRef.current.offsetWidth /
                    (props.sessionSize * props.gridSize)) -
                Tone.Time(props.drawingNote.time).toSeconds() *
                  (props.rowRef.current.offsetWidth /
                    (props.sessionSize * Tone.Time("1m").toSeconds()))
              : props.rowRef.current.offsetWidth /
                (props.sessionSize * props.gridSize)
            : (Tone.Time(props.note.duration).toSeconds() /
                Tone.Time("1m").toSeconds()) *
              (props.rowRef.current.offsetWidth / props.sessionSize)) - 2,
        transform: props.ghost
          ? `translate(${
              props.drawingNote
                ? Tone.Time(props.drawingNote.time).toSeconds() *
                  (props.rowRef.current.offsetWidth /
                    (props.sessionSize * Tone.Time("1m").toSeconds()))
                : props.gridPos[1] *
                  (props.rowRef.current.offsetWidth /
                    (props.sessionSize * props.gridSize))
            }px,${
              props.gridPos[0] *
              (props.rowRef.current.scrollHeight / props.moduleRows.length)
            }px)`
          : `translate(${
              Tone.Time(props.note.time).toSeconds() *
              (props.rowRef.current.offsetWidth /
                (props.sessionSize * Tone.Time("1m").toSeconds()))
            }px,${
              props.moduleRows.findIndex((e) => e.note === props.note.note) *
              (props.rowRef.current.scrollHeight / props.moduleRows.length)
            }px)`,
        opacity: props.ghost && 0.5,
        backgroundColor: colors[props.module.color][600],
        outline: "solid 1px " + colors[props.module.color][800],
        //margin: "-2px -2px 0 0",
      }}
    ></div>
  );
}

export default MelodyNote;
