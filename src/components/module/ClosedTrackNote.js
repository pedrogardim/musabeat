import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import { colors } from "../../utils/materialPalette";

function ClosedTrackNote(props) {
  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const trackType = props.module.type;

  /* 

  useEffect(() => {
    console.log("isResizing", isResizing);
  }, [isResizing]);

  useEffect(() => {
    console.log("isMoving", isMoving);
  }, [isMoving]);


 */

  return (
    <div
      className={`module-score-note ${
        props.module.type === 1 && "module-score-note-melody"
      }`}
      style={{
        height: props.rowRef.current.scrollHeight / props.moduleRows.length - 1,
        width:
          (Tone.Time(props.note.duration).toSeconds() /
            Tone.Time("1m").toSeconds()) *
            (props.rowRef.current.offsetWidth / props.sessionSize) -
          2,
        transform: `translate(${
          Tone.Time(props.note.time).toSeconds() *
          (props.rowRef.current.offsetWidth /
            (props.sessionSize * Tone.Time("1m").toSeconds()))
        }px,${
          props.moduleRows.findIndex((e) => e.note === props.note.note) *
          (props.rowRef.current.scrollHeight / props.moduleRows.length)
        }px)`,
        backgroundColor: trackType === 1 ? "white" : "transparent",
        //borderRadius: 4,
        //margin: "-2px -2px 0 0",
      }}
    >
      {trackType === 0 && (
        <div
          style={{
            position: "absolute",
            height: 8,
            top: "calc(50% - 4px)",
            width: 8,
            left: -4,
            backgroundColor: "white" /*  border:
      props.cursorMode === "edit" && "solid 1px rgba(0,0,0,0.5)", */,
            transform: "rotate(45deg)",
          }}
        />
      )}
    </div>
  );
}

export default ClosedTrackNote;
