import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";
import "./ModuleRow.css";

import Draggable from "react-draggable";

import { colors } from "../../utils/materialPalette";

import {
  IconButton,
  Icon,
  Tooltip,
  TextField,
  Typography,
} from "@material-ui/core";

import { scheduleSampler, clearEvents } from "../../utils/TransportSchedule";

function ModuleRow(props) {
  const rowRef = useRef(null);

  const [moduleRows, setModuleRows] = useState([]);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [compact, setCompact] = useState(true);
  const [draggingSelect, setDraggingSelect] = useState(false);
  const [TLinputSessionSize, setTLinputSessionSize] = useState(
    props.sessionSize
  );
  const [gridPos, setGridPos] = useState([]);

  const loadModuleRows = () => {
    let rows = [];
    if (!props.instrument) return;
    if (props.module.type === 0) {
      rows = Array(props.instrument._buffers._buffers.size)
        .fill(0)
        .map((e, i) => {
          return {
            lbl: props.module.lbls[i],
            player: props.instrument.player(JSON.stringify(i)),
            wavepath: drawWave(
              props.instrument.player(JSON.stringify(i)).buffer.toArray()
            ),
          };
        });
    }
    setModuleRows(rows);
  };

  const handleHover = (event) => {
    let hoveredPos = [
      event.pageY - rowRef.current.getBoundingClientRect().top,
      event.pageX - rowRef.current.getBoundingClientRect().left,
    ];

    let gridPos = [
      Math.floor(
        Math.abs(
          (hoveredPos[0] / rowRef.current.offsetHeight) * moduleRows.length
        )
      ),
      Math.floor(
        Math.abs(
          (hoveredPos[1] / rowRef.current.offsetWidth) *
            props.sessionSize *
            props.gridSize
        )
      ),
    ];

    setGridPos(gridPos);
  };

  const handleClick = () => {
    if (!props.cursorMode) return;

    let newNote = {
      note: gridPos[0],
      duration: moduleRows[gridPos[0]].player.buffer.duration,
      time: Tone.Time(
        (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize
      ).toBarsBeatsSixteenths(),
    };

    console.log(newNote);

    props.setModules((prev) => {
      let newModules = [...prev];
      newModules[props.index].score = [
        ...newModules[props.index].score,
        { ...newNote },
      ];
      return newModules;
    });
  };

  const scheduleNotes = () => {
    !props.module.muted
      ? scheduleSampler(
          props.module.score,
          props.instrument,
          Tone.Transport,
          props.module.id
        )
      : clearEvents(props.module.id);
  };

  useEffect(() => {
    scheduleNotes();
  }, [props.instrument, props.module, props.module.score, props.isLoaded]);

  useEffect(() => {
    loadModuleRows();
  }, [props.instrument, props.module, props.isLoaded]);

  useEffect(() => {
    console.log(moduleRows);
  }, [moduleRows]);

  return (
    <div
      className="module-grid-row"
      ref={rowRef}
      onMouseOver={handleHover}
      onMouseDown={handleClick}
      disabled
    >
      {moduleRows.map((row, rowIndex) => (
        <div className="module-inner-row">
          <span className="module-inner-row-label">{row.lbl}</span>
          <div className="module-inner-row-line" />
        </div>
      ))}
      {rowRef.current &&
        props.module.score.map((note, noteIndex) => (
          <div
            className="module-score-ghost"
            style={{
              height: rowRef.current.offsetHeight / moduleRows.length,
              width:
                Tone.Time(note.duration).toSeconds() *
                (rowRef.current.offsetWidth /
                  (props.sessionSize * Tone.Time("1m").toSeconds())),
              transform: `translate(${
                Tone.Time(note.time).toSeconds() *
                (rowRef.current.offsetWidth /
                  (props.sessionSize * Tone.Time("1m").toSeconds()))
              }px,${
                note.note * (rowRef.current.offsetHeight / moduleRows.length)
              }px)`,
              backgroundColor:
                props.cursorMode === "edit"
                  ? colors[props.module.color][300]
                  : "transparent",
            }}
          >
            <svg
              viewBox="0 0 64 32"
              preserveAspectRatio="none"
              width="64px"
              height="32px"
              style={{ width: "100%", height: "100%", viewBox: "auto" }}
            >
              {moduleRows[note.note] && (
                <path
                  d={moduleRows[note.note].wavepath}
                  stroke={
                    props.cursorMode === "edit"
                      ? "#ffffff"
                      : colors[props.module.color][300]
                  }
                  strokeWidth={1}
                  fill="none"
                />
              )}
            </svg>
          </div>
        ))}
      {rowRef.current && props.cursorMode === "edit" && (
        <div
          className="module-score-ghost"
          style={{
            height: rowRef.current.offsetHeight / moduleRows.length,
            width:
              (moduleRows[gridPos[0]].player.buffer.duration *
                rowRef.current.offsetWidth) /
              (props.sessionSize * Tone.Time("1m").toSeconds()),
            transform: `translate(${
              gridPos[1] *
              (rowRef.current.offsetWidth /
                (props.sessionSize * props.gridSize))
            }px,${
              gridPos[0] * (rowRef.current.offsetHeight / moduleRows.length)
            }px)`,
            opacity: 0.5,
            backgroundColor: colors[props.module.color][300],
          }}
        />
      )}
    </div>
  );
}

const drawWave = (wavearray, setWavePath) => {
  if (!wavearray.length) {
    return;
  }

  let pathstring = "M 0 16 ";

  let wave = wavearray;
  let scale = wave.length / 64;

  let yZoom = 2;

  for (let x = 0; x < 64; x++) {
    pathstring +=
      "L " +
      x +
      " " +
      (wave[Math.floor(x * scale)] * 16 + 16 / yZoom) * yZoom +
      " ";
  }

  return pathstring;
};

export default ModuleRow;
