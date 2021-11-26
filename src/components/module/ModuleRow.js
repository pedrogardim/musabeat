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

import SamplerNote from "./SamplerNote";

function ModuleRow(props) {
  const rowRef = useRef(null);

  const [moduleRows, setModuleRows] = useState([]);
  const [gridPos, setGridPos] = useState([]);

  const [isMouseDown, setIsMouseDown] = useState(false);

  const loadModuleRows = () => {
    let rows = [];
    if (!props.instrument) return;
    if (props.module.type === 0) {
      let array =
        props.selectedModule === props.index
          ? Object.keys(
              Array(props.instrument._buffers._buffers.size).fill(0)
            ).map((e) => parseInt(e))
          : [...new Set(props.module.score.map((item) => item.note))].sort(
              (a, b) => a - b
            );

      console.log(array);

      rows = array.map((e, i) => {
        return {
          note: e,
          lbl: props.module.lbls[e],
          player: props.instrument.player(e),
          wavepath: drawWave(props.instrument.player(e).buffer.toArray()),
        };
      });
    }
    setModuleRows(rows);
  };

  const handleHover = (event) => {
    let hoveredPos = [
      event.pageY - rowRef.current.getBoundingClientRect().top,
      event.pageX -
        rowRef.current.getBoundingClientRect().left +
        rowRef.current.offsetWidth / (props.sessionSize * props.gridSize * 2),
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

    setGridPos((prev) =>
      JSON.stringify(prev) === JSON.stringify(gridPos) ? prev : gridPos
    );
  };

  const handleMouseDown = (e) => {
    setIsMouseDown(true);

    if (!props.cursorMode) {
      Tone.Transport.seconds =
        (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize;

      props.setSelection([
        (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize,
        null,
      ]);
    } else {
      let newNote = {
        note: gridPos[0],
        duration: moduleRows[gridPos[0]].player.buffer.duration,
        time: Tone.Time(
          (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize
        ).toBarsBeatsSixteenths(),
      };

      props.setModules((prev) => {
        let newModules = [...prev];
        let find = newModules[props.index].score.findIndex(
          (e) => e.note === newNote.note && e.time === newNote.time
        );
        newModules[props.index].score =
          find === -1
            ? [...newModules[props.index].score, { ...newNote }]
            : newModules[props.index].score.filter(
                (e) => e.note !== newNote.note || e.time !== newNote.time
              );

        return newModules;
      });
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const onGridPosChange = () => {
    //drag note input
    if (isMouseDown) {
      if (props.cursorMode === "edit") {
        handleMouseDown();
      } else {
        //props.setSelection((prev) => [
        //  prev[0],
        //  (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize,
        //]);
      }
    }
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
  }, [props.instrument, props.module, props.isLoaded, props.selectedModule]);

  useEffect(() => {
    onGridPosChange();
  }, [gridPos]);

  useEffect(() => {
    console.log(moduleRows);
  }, [moduleRows]);

  return (
    <div
      className="module-grid-row"
      ref={rowRef}
      onMouseMove={handleHover}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseUp}
      onClick={handleMouseUp}
      onMouseUp={handleMouseUp}
      disabled
    >
      {moduleRows.map((row, rowIndex) => (
        <div className="module-inner-row">
          <Typography variant="overline" className="module-inner-row-label">
            {row.lbl}
          </Typography>
          <div className="module-inner-row-line" />
        </div>
      ))}
      {rowRef.current &&
        props.module.score
          .filter((e) => e.time.split(":")[0] < props.sessionSize)
          .map((note, noteIndex) => (
            <SamplerNote
              rowRef={rowRef}
              moduleRows={moduleRows}
              note={note}
              module={props.module}
              sessionSize={props.sessionSize}
              gridSize={props.gridSize}
            />
          ))}
      {rowRef.current && props.cursorMode === "edit" && (
        <SamplerNote
          ghost
          rowRef={rowRef}
          moduleRows={moduleRows}
          gridPos={gridPos}
          module={props.module}
          sessionSize={props.sessionSize}
          gridSize={props.gridSize}
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
    if (Math.abs(wave[Math.floor(x * scale)]) > 0.02) {
      pathstring +=
        "L " +
        x +
        " " +
        (wave[Math.floor(x * scale)] * 16 + 16 / yZoom) * yZoom +
        " ";
    }
  }

  return pathstring;
};

export default ModuleRow;
