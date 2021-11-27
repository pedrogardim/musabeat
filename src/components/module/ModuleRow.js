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

import {
  scheduleSampler,
  scheduleMelody,
  clearEvents,
} from "../../utils/TransportSchedule";

import SamplerNote from "./SamplerNote";
import MelodyNote from "./MelodyNote";

function ModuleRow(props) {
  const rowRef = useRef(null);

  const [moduleRows, setModuleRows] = useState([]);
  const [gridPos, setGridPos] = useState([]);
  const [drawingNote, setDrawingNote] = useState(null);

  const [isMouseDown, setIsMouseDown] = useState(false);

  const trackType = props.module.type;

  const loadModuleRows = () => {
    let rows = [];
    if (!props.instrument) return;
    if (trackType === 0) {
      let array =
        props.selectedModule === props.index
          ? Object.keys(
              Array(props.instrument._buffers._buffers.size).fill(0)
            ).map((e) => parseInt(e))
          : [...new Set(props.module.score.map((item) => item.note))].sort(
              (a, b) => a - b
            );

      rows = array.map((e, i) => {
        return {
          note: e,
          lbl: props.module.lbls[e],
          player: props.instrument.player(e),
          wavepath: drawWave(props.instrument.player(e).buffer.toArray()),
        };
      });
    }
    if (trackType === 1) {
      let array = Array(88)
        .fill(0)
        .map((e, i) => 108 - i);

      rows = array.map((e, i) => {
        return {
          index: e,
          note: e,
          lbl: Tone.Frequency(e, "midi").toNote(),
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
        (trackType === 0
          ? rowRef.current.offsetWidth /
            (props.sessionSize * props.gridSize * 2)
          : 0),
    ];

    let gridPos = [
      Math.floor(
        Math.abs(
          (hoveredPos[0] / rowRef.current.scrollHeight) * moduleRows.length
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
      if (trackType === 0) {
        let newNote = {
          note: gridPos[0],
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
      } else {
        let newNote = {
          note: 108 - gridPos[0],
          time: (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize,
        };
        setDrawingNote(newNote);
      }
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    if (trackType === 1 && drawingNote) {
      let newNote = { ...drawingNote };

      let duration =
        (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize -
          newNote.time ===
        0
          ? Tone.Time("1m").toSeconds() / props.gridSize
          : ((gridPos[1] + 1) * Tone.Time("1m").toSeconds()) / props.gridSize -
            newNote.time;

      newNote.duration = Tone.Time(duration).toBarsBeatsSixteenths();

      newNote.time = Tone.Time(newNote.time).toBarsBeatsSixteenths();

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
      setDrawingNote(null);
    }
  };

  const onGridPosChange = () => {
    //drag note input
    if (isMouseDown) {
      if (props.cursorMode === "edit" && trackType === 0) {
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
      ? trackType === 0
        ? scheduleSampler(
            props.module.score,
            props.instrument,
            Tone.Transport,
            props.module.id
          )
        : scheduleMelody(
            props.module.score,
            props.instrument,
            Tone.Transport,
            props.module.id
          )
      : clearEvents(props.module.id);
  };

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================USEEFFECTS======================================== */
  /* ================================================================================== */
  /* ================================================================================== */

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
    //console.log(moduleRows[0], moduleRows.length);
  }, [moduleRows]);
  /* 
  useEffect(() => {
    console.log(drawingNote && drawingNote.time);
  }, [drawingNote]); */

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================JSX=============================================== */
  /* ================================================================================== */
  /* ================================================================================== */

  return (
    <div
      className="module-grid-row-wrapper"
      style={{ overflowY: trackType === 1 && "overlay" }}
    >
      <div
        className="module-grid-row"
        ref={rowRef}
        onMouseMove={handleHover}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseUp}
        onClick={handleMouseUp}
        onMouseUp={handleMouseUp}
        disabled
        style={{
          //overflowY: trackType === 1 && "overlay",
          border: trackType === 1 && "1px solid rgba(0, 0, 0,0.2)",
        }}
      >
        {moduleRows.map((row, rowIndex) => (
          <div
            className="module-inner-row"
            style={{
              //borderTop: trackType === 1 && "1px solid rgba(0, 0, 0,0.2)",
              borderBottom: trackType === 1 && "1px solid rgba(0, 0, 0,0.2)",
              minHeight: trackType === 1 && "6.66666%",
              background:
                trackType === 1 &&
                (rowIndex % 12 === 2 ||
                  rowIndex % 12 === 4 ||
                  rowIndex % 12 === 6 ||
                  rowIndex % 12 === 9 ||
                  rowIndex % 12 === 11) &&
                "#0000001a",
              //colors[props.module.color][900] + "3a",
            }}
          >
            <Typography
              variant="overline"
              className="module-inner-row-label"
              style={{ color: colors[props.module.color][500] }}
            >
              {row.lbl}
            </Typography>
            {trackType === 0 && <div className="module-inner-row-line" />}
          </div>
        ))}
        {rowRef.current &&
          props.module.score.length > 0 &&
          props.module.score
            .filter((e) => e.time.split(":")[0] < props.sessionSize)
            .map((note, noteIndex) =>
              trackType === 0 ? (
                <SamplerNote
                  rowRef={rowRef}
                  moduleRows={moduleRows}
                  note={note}
                  module={props.module}
                  sessionSize={props.sessionSize}
                  gridSize={props.gridSize}
                />
              ) : (
                <MelodyNote
                  rowRef={rowRef}
                  moduleRows={moduleRows}
                  note={note}
                  drawingNote={drawingNote}
                  module={props.module}
                  sessionSize={props.sessionSize}
                  gridSize={props.gridSize}
                />
              )
            )}
        {rowRef.current &&
          props.cursorMode === "edit" &&
          (trackType === 0 ? (
            <SamplerNote
              ghost
              rowRef={rowRef}
              moduleRows={moduleRows}
              gridPos={gridPos}
              module={props.module}
              sessionSize={props.sessionSize}
              gridSize={props.gridSize}
            />
          ) : (
            <MelodyNote
              ghost
              rowRef={rowRef}
              moduleRows={moduleRows}
              gridPos={gridPos}
              drawingNote={drawingNote}
              module={props.module}
              sessionSize={props.sessionSize}
              gridSize={props.gridSize}
            />
          ))}
      </div>
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
