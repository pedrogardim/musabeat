import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import { colors } from "../../utils/materialPalette";

function SamplerNote(props) {
  return (
    <div
      className="module-score-note"
      style={{
        height: props.rowRef.current.scrollHeight / props.moduleRows.length,
        width:
          props.rowRef.current.offsetWidth /
          (props.sessionSize * props.gridSize),
        transform: props.ghost
          ? `translate(${
              props.gridPos[1] *
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
          backgroundColor: colors[props.module.color][300] /*  border:
          props.cursorMode === "edit" && "solid 1px rgba(0,0,0,0.5)", */,
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
        {props.moduleRows[note.note] && (
          <path
            d={props.moduleRows[note.note].wavepath}
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
