import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import { colors } from "../../utils/materialPalette";

function SamplerNote(props) {
  const isSelected =
    props.selectedNotes && props.selectedNotes.includes(props.index);

  let zoomSize = props.zoomPosition[1] - props.zoomPosition[0] + 1;
  return (
    <div
      className="module-score-note"
      style={{
        height: props.rowRef.current.scrollHeight / props.trackRows.length,
        width: 0,
        transform: props.ghost
          ? `translate(${
              props.gridPos[1] *
                (props.rowRef.current.offsetWidth /
                  (zoomSize * props.gridSize)) -
              props.zoomPosition[0] *
                (props.rowRef.current.offsetWidth / zoomSize)
            }px,${
              props.gridPos[0] *
              (props.rowRef.current.scrollHeight / props.trackRows.length)
            }px)`
          : `translate(${
              Tone.Time(props.note.time).toSeconds() *
                (props.rowRef.current.offsetWidth /
                  (zoomSize * Tone.Time("1m").toSeconds())) -
              props.zoomPosition[0] *
                (props.rowRef.current.offsetWidth / zoomSize)
            }px,${
              props.trackRows.findIndex((e) => e.note === props.note.note) *
              (props.rowRef.current.scrollHeight / props.trackRows.length)
            }px)`,
        opacity: props.ghost && 0.5,
        /* backgroundColor:
        props.cursorMod === "edit"
          ? colors[props.module.color][300]
          : "transparent", */
      }}
    >
      <div
        style={{
          position: "absolute",
          height: 16,
          top: "calc(50% - 8px)",
          width: 16,
          left: -8,
          backgroundColor: colors[props.module.color][isSelected ? 800 : 300],
          filter: !props.exists && "saturate(0.2)",
          transform: "rotate(45deg)",
        }}
      />
      {/* props.cursorMode !== "edit" && (
      <svg
        viewBox="0 0 64 32"
        preserveAspectRatio="none"
        width="64px"
        height="32px"
        style={{
          width:
            Tone.Time(note.duration).toSeconds() *
            (props.rowRef.current.offsetWidth /
              (props.sessionSize * Tone.Time("1m").toSeconds())),
          height: "100%",
          viewBox: "auto",
        }}
      >
        {props.trackRows[note.note] && (
          <path
            d={props.trackRows[note.note].wavepath}
            stroke={
              props.cursorMode === "edit"
                ? "rgba(0,0,0,0.5)"
                : colors[props.module.color][300]
            }
            strokeWidth={1}
            fill="none"
          />
        )}
      </svg>
    ) */}
    </div>
  );
}

export default SamplerNote;
