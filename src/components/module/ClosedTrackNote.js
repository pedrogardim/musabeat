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
      className={`module-score-note`}
      style={{
        height: props.rowRef.current.scrollHeight / props.moduleRows.length - 1,
        width: props.note.duration
          ? (Tone.Time(props.note.duration).toSeconds() /
              Tone.Time("1m").toSeconds()) *
              (props.rowRef.current.offsetWidth / zoomSize) -
            2
          : 0,
        transform: `translate(${
          Tone.Time(props.note.time).toSeconds() *
            (props.rowRef.current.offsetWidth /
              (zoomSize * Tone.Time("1m").toSeconds())) -
          props.zoomPosition[0] * (props.rowRef.current.offsetWidth / zoomSize)
        }px,${
          props.moduleRows
            .sort((a, b) =>
              trackType === 0 ? a.note - b.note : b.note - a.note
            )
            .findIndex((e) => e.note === props.note.note) *
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
            left: -3,
            backgroundColor: props.selected
              ? "white"
              : colors[props.module.color][900],
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
            backgroundColor: props.selected
              ? "white"
              : colors[props.module.color][900],
          }}
        />
      )}
    </div>
  );
}

export default ClosedTrackNote;
