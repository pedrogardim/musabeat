import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import { colors } from "../../utils/materialPalette";

function ClosedTrackNote(props) {
  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const trackType = props.module.type;

  let zoomSize = props.zoomPosition[1] - props.zoomPosition[0] + 1;

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
            (props.rowRef.current.offsetWidth / zoomSize) -
          2,
        transform: `translate(${
          Tone.Time(props.note.time).toSeconds() *
          (props.rowRef.current.offsetWidth /
            (zoomSize * Tone.Time("1m").toSeconds()))
        }px,${
          props.moduleRows.findIndex((e) => e.note === props.note.note) *
          (props.rowRef.current.scrollHeight / props.moduleRows.length)
        }px)`,
        backgroundColor: "transparent",
        //borderRadius: 4,
        //margin: "-2px -2px 0 0",
      }}
    >
      {trackType === 0 ? (
        <div
          style={{
            position: "absolute",
            height: 8,
            top: "calc(50% - 4px)",
            width: 8,
            left: 1,
            backgroundColor: colors[props.module.color][900],
            transform: "rotate(45deg)",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            maxHeight: 8,
            height: "50%",
            top: "calc(50% - 4px)",
            width: "100%",
            left: 1,
            backgroundColor: colors[props.module.color][900],
          }}
        />
      )}
    </div>
  );
}

export default ClosedTrackNote;
