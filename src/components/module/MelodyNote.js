import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import { colors } from "../../utils/materialPalette";

function MelodyNote(props) {
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e) => {
    if (props.ghost || props.deletingNote) return;

    /*  props.setDrawingNote((note) => {
      let newNote = { ...note };
      newNote.time = Tone.Time(props.note.time).toSeconds();
      console.log(newNote);
      return newNote;
    }); */
  };

  const handleResize = () => {
    if (props.ghost) return;

    props.setModules((prev) => {
      let newModules = [...prev];
      let newDuration = Tone.Time(
        ((props.gridPos[1] + 1) * Tone.Time("1m").toSeconds()) /
          props.gridSize -
          Tone.Time(
            newModules[props.selectedModule].score[props.index].time
          ).toSeconds()
      ).toBarsBeatsSixteenths();

      if (
        Tone.Time(newDuration).toSeconds() >=
        Tone.Time("1m").toSeconds() / props.gridSize
      ) {
        newModules[props.selectedModule].score[props.index].duration =
          newDuration;
        return newModules;
      }
      return prev;
    });
  };

  useEffect(() => {
    if (isResizing) handleResize();
  }, [props.gridPos]);

  useEffect(() => {
    //console.log(props.isMouseDown);
    if (props.isMouseDown === false) setIsResizing(false);
  }, [props.isMouseDown]);

  useEffect(() => {
    console.log("isResizing", isResizing);
  }, [isResizing]);

  return (
    <div
      className={`module-score-note ${
        props.ghost && "module-score-note-ghost"
      } ${props.deletableNote && "module-score-note-deletable"}`}
      onMouseDown={handleMouseDown}
      style={{
        height: props.rowRef.current.scrollHeight / props.moduleRows.length - 1,
        width:
          (props.ghost
            ? props.drawingNote
              ? (props.gridPos[1] + 1) *
                  (props.rowRef.current.offsetWidth /
                    (props.sessionSize * props.gridSize)) -
                Tone.Time(props.drawingNote.time).toSeconds() *
                  (props.rowRef.current.offsetWidth /
                    (props.sessionSize * Tone.Time("1m").toSeconds()))
              : props.rowRef.current.offsetWidth /
                (props.sessionSize * props.gridSize)
            : (Tone.Time(props.note.duration).toSeconds() /
                Tone.Time("1m").toSeconds()) *
              (props.rowRef.current.offsetWidth / props.sessionSize)) - 2,
        transform: props.ghost
          ? `translate(${
              props.drawingNote
                ? Tone.Time(props.drawingNote.time).toSeconds() *
                  (props.rowRef.current.offsetWidth /
                    (props.sessionSize * Tone.Time("1m").toSeconds()))
                : props.gridPos[1] *
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
        backgroundColor: colors[props.module.color][600],
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
    </div>
  );
}

export default MelodyNote;
