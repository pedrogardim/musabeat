import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import { IconButton, Icon } from "@material-ui/core";

import { colors } from "../../utils/materialPalette";

function MelodyNote(props) {
  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [noteTime, setNoteTime] = useState(props.note.time);
  const [noteNote, setNoteNote] = useState(props.note.note);
  const [noteDuration, setNoteDuration] = useState(props.note.duration);

  const isSelected =
    props.selectedNotes && props.selectedNotes.includes(props.index);

  let zoomSize = props.zoomPosition[1] - props.zoomPosition[0] + 1;

  const commitChanges = () => {
    if (
      noteTime === props.note.time &&
      noteDuration === props.note.duration &&
      noteNote === props.note.note
    )
      return;

    props.setModules((prev) => {
      let newModules = [...prev];
      newModules[props.selectedModule].score = [
        ...newModules[props.selectedModule].score,
      ];

      newModules[props.selectedModule].score[props.index].duration =
        noteDuration;
      newModules[props.selectedModule].score[props.index].time = noteTime;
      newModules[props.selectedModule].score[props.index].note = noteNote;

      return newModules;
    });
  };

  const handleMouseDown = (e) => {
    if (props.ghost || props.deletingNote) return;

    if (!e.target.className.includes("module-score-note-handle")) {
      setIsMoving(
        props.gridPos[1] -
          (props.gridSize * Tone.Time(noteTime).toSeconds()) /
            Tone.Time("1m").toSeconds()
      );
      props.setSelectedNotes(() => {
        let newNotes = [];
        newNotes[props.selectedModule] = [props.index];
        //console.log(newNotes);
        return newNotes;
      });
    }

    /*  props.setDrawingNote((note) => {
      let newNote = { ...note };
      newNote.time = Tone.Time(props.note.time).toSeconds();
      console.log(newNote);
      return newNote;
    }); */
  };

  const deleteNote = () => {
    props.setModules((prev) => {
      console.log(props.index);
      let newModules = [...prev];
      newModules[props.selectedModule].score = newModules[
        props.selectedModule
      ].score.filter((e, i) => i !== props.index);
      return newModules;
    });
  };

  const handleResize = () => {
    if (props.ghost) return;

    props.setDrawingNote(null);
    setNoteDuration((prev) => {
      let newDuration =
        ((props.gridPos[1] + 1) * Tone.Time("1m").toSeconds()) /
          props.gridSize -
        Tone.Time(noteTime).toSeconds();

      if (newDuration >= Tone.Time("1m").toSeconds() / props.gridSize) {
        return Tone.Time(newDuration).toBarsBeatsSixteenths();
      }
      return prev;
    });
  };

  const handleMove = () => {
    if (props.ghost) return;

    let newTime = Tone.Time(
      ((props.gridPos[1] - isMoving) * Tone.Time("1m").toSeconds()) /
        props.gridSize
    ).quantize(props.gridSize + "n");

    let newNote = 108 - props.gridPos[0];

    if (true) {
      setNoteTime(Tone.Time(newTime).toBarsBeatsSixteenths());
      setNoteNote(newNote);
    }
  };

  useEffect(() => {
    if (isResizing) handleResize();
    if (isMoving !== false) handleMove();
  }, [props.gridPos]);

  useEffect(() => {
    setNoteTime((prev) => (props.note.time !== prev ? props.note.time : prev));
    setNoteDuration((prev) =>
      props.note.duration !== prev ? props.note.duration : prev
    );
    setNoteNote((prev) => (props.note.note !== prev ? props.note.note : prev));
  }, [props.note]);

  useEffect(() => {
    //console.log(props.isMouseDown);
    if (props.isMouseDown === false) {
      commitChanges();
      setIsResizing(false);
      setIsMoving(false);
    }
  }, [props.isMouseDown]);

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
        props.ghost && "module-score-note-ghost"
      } ${props.deletableNote && "module-score-note-deletable"} ${
        props.module.type === 1 && "module-score-note-melody"
      }`}
      onMouseDown={handleMouseDown}
      style={{
        height: props.rowRef.current.scrollHeight / props.moduleRows.length - 1,
        width:
          (props.ghost
            ? props.drawingNote
              ? (props.gridPos[1] + 1) *
                  (props.rowRef.current.offsetWidth /
                    (zoomSize * props.gridSize)) -
                Tone.Time(props.drawingNote.time).toSeconds() *
                  (props.rowRef.current.offsetWidth /
                    (zoomSize * Tone.Time("1m").toSeconds()))
              : props.rowRef.current.offsetWidth / (zoomSize * props.gridSize)
            : (Tone.Time(noteDuration).toSeconds() /
                Tone.Time("1m").toSeconds()) *
              (props.rowRef.current.offsetWidth / zoomSize)) - 2,
        transform: props.ghost
          ? `translate(${
              (props.drawingNote
                ? Tone.Time(props.drawingNote.time).toSeconds() *
                  (props.rowRef.current.offsetWidth /
                    (zoomSize * Tone.Time("1m").toSeconds()))
                : props.gridPos[1] *
                  (props.rowRef.current.offsetWidth /
                    (zoomSize * props.gridSize))) -
              props.zoomPosition[0] *
                (props.rowRef.current.offsetWidth / zoomSize)
            }px,${
              props.gridPos[0] *
              (props.rowRef.current.scrollHeight / props.moduleRows.length)
            }px)`
          : `translate(${
              Tone.Time(noteTime).toSeconds() *
                (props.rowRef.current.offsetWidth /
                  (zoomSize * Tone.Time("1m").toSeconds())) -
              props.zoomPosition[0] *
                (props.rowRef.current.offsetWidth / zoomSize)
            }px,${
              props.moduleRows.findIndex((e) => e.note === noteNote) *
              (props.rowRef.current.scrollHeight / props.moduleRows.length)
            }px)`,
        opacity: props.ghost && 0.5,
        backgroundColor: colors[props.module.color][isSelected ? 800 : 300],
        outline: `solid 1px ${colors[props.module.color][800]}`,
        //borderRadius: 4,
        //margin: "-2px -2px 0 0",
      }}
    >
      {!props.ghost && (
        <div
          className="module-score-note-handle"
          onMouseDown={() => setIsResizing(true)}
        />
      )}

      {isSelected && props.selectedNotes.length === 1 && (
        <>
          <IconButton
            onMouseDown={deleteNote}
            style={{
              position: "absolute",
              top: -48,
              left: "50%",
              marginLeft: -24,
            }}
          >
            <Icon>delete</Icon>
          </IconButton>
          <Icon
            color="inherit"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginLeft: -12,
              marginTop: -12,
              pointerEvents: "none",
              opacity: 0.4,
            }}
          >
            open_with
          </Icon>
        </>
      )}
    </div>
  );
}

export default MelodyNote;
