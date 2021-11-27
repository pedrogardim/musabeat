import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import { colors } from "../../utils/materialPalette";

function MelodyNote(props) {
  return (
    <div
      className="module-score-ghost"
      style={{
        height: props.rowRef.current.scrollHeight / props.moduleRows.length,
        width: props.ghost
          ? props.drawingNote
            ? props.gridPos[1] *
                (props.rowRef.current.offsetWidth /
                  (props.sessionSize * props.gridSize)) -
              Tone.Time(props.drawingNote.time).toSeconds() *
                (props.rowRef.current.offsetWidth /
                  (props.sessionSize * Tone.Time("1m").toSeconds()))
            : props.rowRef.current.offsetWidth /
              (props.sessionSize * props.gridSize)
          : (Tone.Time(props.note.duration).toSeconds() /
              Tone.Time("1m").toSeconds()) *
            (props.rowRef.current.offsetWidth / props.sessionSize),
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
        backgroundColor: colors[props.module.color][300],
      }}
    ></div>
  );
}

export default MelodyNote;
