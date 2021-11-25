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
    if (props.module.type === 0) {
      rows = Array(props.instrument && props.instrument._buffers._buffers.size)
        .fill(0)
        .map((e, i) => props.module.lbls[i]);
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
    console.log(props.instrument);
    let newNote = {
      note: gridPos[0],
      duration: /* props.instrument._buffers._buffers.get(gridPos[0]).duration ||  */ 0.2,
      time: Tone.Time(
        (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize
      ).toBarsBeatsSixteenths(),
    };

    console.log(newNote.time);

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
    loadModuleRows();
    scheduleNotes();
  }, [props.instrument, props.module, props.module.score]);

  useEffect(() => {
    console.log(moduleRows);
  }, [moduleRows]);

  return (
    <div
      className="module-grid-row"
      ref={rowRef}
      onMouseOver={handleHover}
      onMouseDown={handleClick}
    >
      {moduleRows.map((row, rowIndex) => (
        <div className="module-inner-row">
          <span className="module-inner-row-label">{row}</span>
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
              top:
                note.note * (rowRef.current.offsetHeight / moduleRows.length),
              left:
                Tone.Time(note.time).toSeconds() *
                (rowRef.current.offsetWidth /
                  (props.sessionSize * Tone.Time("1m").toSeconds())),
              backgroundColor: colors[props.module.color][300],
            }}
          />
        ))}
      {rowRef.current && props.cursorMode === "edit" && (
        <div
          className="module-score-ghost"
          style={{
            height: rowRef.current.offsetHeight / moduleRows.length,
            width:
              rowRef.current.offsetWidth / (props.sessionSize * props.gridSize),
            top: gridPos[0] * (rowRef.current.offsetHeight / moduleRows.length),
            left:
              gridPos[1] *
              (rowRef.current.offsetWidth /
                (props.sessionSize * props.gridSize)),
            backgroundColor: colors[props.module.color][300],
          }}
        />
      )}
    </div>
  );
}

export default ModuleRow;
