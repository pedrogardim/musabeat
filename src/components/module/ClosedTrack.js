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

import ClosedTrackNote from "./ClosedTrackNote";
import MelodyNote from "./MelodyNote";

function ClosedTrack(props) {
  const rowRef = useRef(null);

  const [moduleRows, setModuleRows] = useState([]);
  const [gridPos, setGridPos] = useState([]);
  const [drawingNote, setDrawingNote] = useState(null);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [deletableNote, setDeletableNote] = useState(false);

  const trackType = props.module.type;
  const isSelected = props.selectedModule === props.index;

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
    console.log(note, props.playingOctave);

    if (props.module.type === 0) {
      if (!props.instrument.has(note)) return;
      props.instrument.player(note).start();
    } else {
      props.instrument.triggerAttackRelease(
        Tone.Frequency(note + props.playingOctave * 12, "midi"),
        "8n"
      );
    }

    //console.log(e.code);

    if (!props.isRecording) return;

    if (props.module.type === 0) {
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
        if (find !== -1) return newModules;
        newModules[props.selectedModule].score = [
          ...newModules[0].score,
          newNote,
        ];
        return newModules;
      });
    } else {
      let drawingNote = {
        note: note + props.playingOctave * 12,
        time: Tone.Time(Tone.Transport.seconds).quantize(`${props.gridSize}n`),
      };

      //setDrawingNote(drawingNote);
    }
  };

  const releaseNote = () => {};

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

  /* ================================================================================== */
  /* ================================================================================== */
  /* ================================JSX=============================================== */
  /* ================================================================================== */
  /* ================================================================================== */

  return (
    <div
      className="closed-track"
      ref={rowRef}
      onClick={() => props.setSelectedModule(props.index)}
      disabled
      style={{
        /* width: `${
          (props.sessionSize * 100) /
          (props.zoomPosition[1] - props.zoomPosition[0] + 1)
        }%`, */
        border: trackType === 1 && isSelected && "1px solid rgba(0, 0, 0,0.2)",
        backgroundColor: colors[props.module.color][400],
      }}
    >
      {rowRef.current &&
        props.module.score.length > 0 &&
        props.module.score
          .filter((e) => e.time.split(":")[0] < props.sessionSize)
          .map((note, noteIndex) => (
            <ClosedTrackNote
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
            />
          ))}
      <IconButton className={"closed-track-button"}>
        <Icon style={{ color: colors[props.module.color][900] }}>
          {props.module.type === 0
            ? "grid_on"
            : props.module.type === 1
            ? "piano"
            : "graphic_eq"}
        </Icon>
      </IconButton>
    </div>
  );
}

export default ClosedTrack;
