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
import { ContactPhoneSharp } from "@material-ui/icons";

function ModuleRow(props) {
  const rowRef = useRef(null);
  const rowWrapperRef = useRef(null);

  const [moduleRows, setModuleRows] = useState([]);
  const [gridPos, setGridPos] = useState([]);
  const [drawingNote, setDrawingNote] = useState(null);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [deletableNote, setDeletableNote] = useState(false);

  const [selection, setSelection] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);

  const trackType = props.module.type;
  const isSelected = props.selectedModule === props.index;

  const zoomSize = props.zoomPosition[1] - props.zoomPosition[0] + 1;

  const loadModuleRows = () => {
    let rows = [];
    if (!props.instrument) return;
    if (trackType === 0) {
      let array = isSelected
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
      let array = isSelected
        ? Array(88)
            .fill(0)
            .map((e, i) => 108 - i)
        : [...new Set(props.module.score.map((item) => item.note))].sort(
            (a, b) => a - b
          );

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

  const playNote = (note) => {
    console.log(Tone.Frequency(note, "midi").toNote());
    if (props.module.type === 0) {
      if (!props.instrument.has(note)) return;
      props.instrument.player(note).start();
    } else {
      props.instrument.triggerAttack(Tone.Frequency(note, "midi"));
    }

    if (!props.isRecording) return;

    if (trackType === 0) {
      let newNote = {
        note: note,
        time: Tone.Time(
          Tone.Time(Tone.Transport.seconds).quantize(`${props.gridSize}n`)
        ).toBarsBeatsSixteenths(),
      };

      props.setModules((prev) => {
        let newModules = [...prev];
        let find = newModules[props.selectedModule].score.findIndex(
          (e) => e.note === newNote.note && e.time === newNote.time
        );
        //console.log(find);
        if (find !== -1) return prev;
        newModules[props.selectedModule].score = [
          ...newModules[0].score,
          newNote,
        ];
        return newModules;
      });
    } else {
      let drawingNote = {
        note: note,
        time: Tone.Time(Tone.Transport.seconds).quantize(`${props.gridSize}n`),
      };

      //setDrawingNote(drawingNote);
    }
  };

  const releaseNote = (note) => {
    if (trackType === 1) {
      props.instrument.triggerRelease(Tone.Frequency(note, "midi"));
    }
  };

  /* ================================================================================== */
  /* ================================================================================== */
  /* =============================MOUSE EVENTS========================================= */
  /* ================================================================================== */
  /* ================================================================================== */

  const handleHover = (event) => {
    let hoveredPos = [
      event.pageY - rowRef.current.getBoundingClientRect().top,
      event.pageX -
        rowRef.current.getBoundingClientRect().left +
        (trackType === 0
          ? rowRef.current.offsetWidth / (zoomSize * props.gridSize * 2)
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
            zoomSize *
            props.gridSize
        )
      ) +
        props.zoomPosition[0] * props.gridSize,
    ];

    setGridPos((prev) =>
      JSON.stringify(prev) === JSON.stringify(gridPos) ? prev : gridPos
    );

    if (props.cursorMode === "edit" && trackType === 0) {
      let find =
        props.module.score.findIndex(
          (e) =>
            (e.note === gridPos[0] || e.note === 108 - gridPos[0]) &&
            e.time ===
              Tone.Time(
                (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize
              ).toBarsBeatsSixteenths()
        ) !== -1;

      setDeletableNote((prev) => (prev === find ? prev : find));
    }
  };

  const handleMouseDown = (e) => {
    //console.log(e && e.target.className);

    setIsMouseDown(true);

    let isClickOnNote = e && e.target.className.includes("module-score-note");

    if (!isClickOnNote) {
      setSelectedNotes([]);
    }

    if (
      (e && e.target.className.includes("module-score-note-handle")) ||
      props.cursorMode !== "edit"
    )
      return;

    //console.log("mousedown triggered");

    if (trackType === 0) {
      let newNote = {
        note: gridPos[0],
        time: Tone.Time(
          (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize
        ).toBarsBeatsSixteenths(),
      };

      props.setModules((prev) => {
        let newModules = [...prev];

        newModules[props.index].score = deletableNote
          ? newModules[props.index].score.filter(
              (e) => e.note !== newNote.note || e.time !== newNote.time
            )
          : [...newModules[props.index].score, { ...newNote }];

        return newModules;
      });
    } else {
      let newNote = {
        note: 108 - gridPos[0],
        time: (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize,
      };
      /* if (isClickOnNote && deletableNote) {
           console.log(
            "isClickOnNote",
            isClickOnNote,
            "deletableNote",
            deletableNote
          ); 

          props.setModules((prev) => {
            let newModules = [...prev];

            newModules[props.index].score = newModules[
              props.index
            ].score.filter(
              (e) =>
                e.note !== newNote.note ||
                e.time !== Tone.Time(newNote.time).toBarsBeatsSixteenths()
            );

            return newModules;
          });
        } else  */
      if (!isClickOnNote) {
        //console.log("drawingNote");
        setDrawingNote(newNote);
      }
    }
  };

  const handleMouseUp = (e) => {
    setIsMouseDown(false);
    if (trackType === 1 && drawingNote && props.cursorMode === "edit") {
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
      if (props.cursorMode === "edit") {
        trackType === 0 && handleMouseDown();
      } else {
        //props.setSelection((prev) => [
        //  prev[0],
        //  (gridPos[1] * Tone.Time("1m").toSeconds()) / props.gridSize,
        //]);
      }
    }
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

  useEffect(() => {
    props.setPlayNoteFunction &&
      props.setPlayNoteFunction([playNote, releaseNote]);
  }, []);

  useEffect(() => {
    //console.log(drawingNote);
  }, [drawingNote]);

  useEffect(() => {
    setDeletableNote(false);
  }, [props.cursorMode]);

  useEffect(() => {
    rowWrapperRef.current.scrollTop =
      rowWrapperRef.current.scrollHeight / 2 -
      rowWrapperRef.current.offsetHeight / 2;
  }, [props.selectedModule, rowWrapperRef.current]);

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================JSX=============================================== */
  /* ================================================================================== */
  /* ================================================================================== */

  return (
    <div
      className="module-grid-row-wrapper"
      ref={rowWrapperRef}
      style={{
        overflowY: trackType === 1 && isSelected && "overlay",
        maxHeight: !isSelected && "10%",
        cursor: props.cursorMode === "edit" && deletableNote && "not-allowed",
      }}
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
          /* 
          width: `${
            (props.sessionSize * 100) /
            (props.zoomPosition[1] - props.zoomPosition[0] + 1)
          }%`,
           */
          border:
            trackType === 1 && isSelected && "1px solid rgba(0, 0, 0,0.2)",
        }}
      >
        {moduleRows.map((row, rowIndex) => (
          <div
            className="module-inner-row"
            style={{
              //borderTop: trackType === 1 && "1px solid rgba(0, 0, 0,0.2)",
              borderBottom:
                trackType === 1 && isSelected && "1px solid rgba(0, 0, 0,0.2)",
              margin: props.selectedModule === null && "8px 0",
              minHeight: trackType === 1 && "6.66666%",
              background:
                trackType === 1 &&
                isSelected &&
                (rowIndex % 12 === 2 ||
                  rowIndex % 12 === 4 ||
                  rowIndex % 12 === 6 ||
                  rowIndex % 12 === 9 ||
                  rowIndex % 12 === 11) &&
                //"#0000001a",
                colors[props.module.color][800] + "3a",
            }}
            key={rowIndex + "ri"}
          >
            <span
              className="module-inner-row-label"
              style={{ color: colors[props.module.color][900] }}
            >
              {trackType === 0
                ? row.lbl
                    .match(/[^aeiou., ]/gi)
                    .slice(0, 3)
                    .join()
                    .replaceAll(",", "")
                : row.lbl}
            </span>
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
                  key={noteIndex}
                  rowRef={rowRef}
                  moduleRows={moduleRows}
                  note={note}
                  module={props.module}
                  sessionSize={props.sessionSize}
                  gridSize={props.gridSize}
                  deletableNote={deletableNote}
                  index={noteIndex}
                  selectedModule={props.selectedModule}
                  zoomPosition={props.zoomPosition}
                  a={rowRef.current}
                />
              ) : (
                <MelodyNote
                  key={noteIndex}
                  rowRef={rowRef}
                  moduleRows={moduleRows}
                  note={note}
                  drawingNote={drawingNote}
                  module={props.module}
                  sessionSize={props.sessionSize}
                  gridSize={props.gridSize}
                  gridPos={gridPos}
                  deletableNote={deletableNote}
                  setDrawingNote={setDrawingNote}
                  index={noteIndex}
                  setModules={props.setModules}
                  isMouseDown={isMouseDown}
                  selectedModule={props.selectedModule}
                  selectedNotes={selectedNotes}
                  setSelectedNotes={setSelectedNotes}
                  zoomPosition={props.zoomPosition}
                  a={rowRef.current}
                />
              )
            )}
        {rowRef.current &&
          props.selectedModule !== null &&
          props.cursorMode === "edit" &&
          !deletableNote &&
          (trackType === 0 ? (
            <SamplerNote
              ghost
              rowRef={rowRef}
              moduleRows={moduleRows}
              gridPos={gridPos}
              module={props.module}
              sessionSize={props.sessionSize}
              gridSize={props.gridSize}
              selectedModule={props.selectedModule}
              zoomPosition={props.zoomPosition}
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
              gridPos={gridPos}
              gridSize={props.gridSize}
              setModules={props.setModules}
              selectedNotes={[]}
              selectedModule={props.selectedModule}
              setDrawingNote={setDrawingNote}
              zoomPosition={props.zoomPosition}
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
