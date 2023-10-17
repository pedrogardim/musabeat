import React, { useState, useEffect, useContext } from "react";
import * as Tone from "tone";

import { IconButton, Icon } from "@mui/material";

import { colors } from "../../../../utils/Pallete";

import wsCtx from "../../../../context/SessionWorkspaceContext";

function MelodyNote(props) {
  const {
    rowRef,
    note,
    drawingNote,
    setDrawingNote,
    index,
    ghost,
    gridPos,
    deletableNote,
    isMouseDown,
  } = props;

  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [noteTime, setNoteTime] = useState(note && note.time);
  const [noteNote, setNoteNote] = useState(note && note.note);
  const [noteDuration, setNoteDuration] = useState(note && note.duration);

  const { tracks, setTracks, params, paramSetter } = useContext(wsCtx);

  const {
    trackRows,
    gridSize,
    selNotes,
    movingSelDelta,
    zoomPosition,
    selectedTrack,
  } = params;

  const track = tracks[selectedTrack];

  const isSelected =
    selNotes &&
    selNotes[selectedTrack] &&
    selNotes[selectedTrack].includes(index);

  let zoomSize = zoomPosition[1] - zoomPosition[0] + 1;

  const attr = {
    parentHeight: rowRef.current.scrollHeight,
    //parentHeight2: trackRows.length * 17 * zoomY,
    // parentWidth: rowRef.current.offsetWidth,
    parentWidth: rowRef.current.offsetWidth * 1.01,
  };

  //console.log(attr.parentHeight / (trackRows.length * zoomY));

  const commitChanges = () => {
    if (ghost) return;

    if (
      noteTime === note.time &&
      noteDuration === note.duration &&
      noteNote === note.note
    )
      return;

    setTracks((prev) => {
      let newTracks = [...prev];
      newTracks[selectedTrack].score = [...newTracks[selectedTrack].score];

      newTracks[selectedTrack].score[index].duration = noteDuration;
      newTracks[selectedTrack].score[index].time = noteTime;
      newTracks[selectedTrack].score[index].note = noteNote;

      return newTracks;
    });
  };

  const handleMouseDown = (e) => {
    if (ghost) return;

    if (!e.target.className.includes("track-score-note-handle")) {
      setIsMoving(
        gridPos[1] -
          (gridSize * Tone.Time(noteTime).toSeconds()) /
            Tone.Time("1m").toSeconds()
      );

      paramSetter("selNotes", (prev) => {
        let newNotes = [...prev];
        newNotes[selectedTrack] = [index];
        return newNotes;
      });
    }
  };

  const deleteNote = () => {
    setTracks((prev) => {
      console.log(index);
      let newTracks = [...prev];
      newTracks[selectedTrack].score = newTracks[selectedTrack].score.filter(
        (e, i) => i !== index
      );
      return newTracks;
    });
  };

  const handleResize = () => {
    if (ghost) return;

    setDrawingNote(null);
    setNoteDuration((prev) => {
      let newDuration =
        ((gridPos[1] + 1) * Tone.Time("1m").toSeconds()) / gridSize -
        Tone.Time(noteTime).toSeconds();

      if (newDuration >= Tone.Time("1m").toSeconds() / gridSize) {
        return Tone.Time(newDuration).toBarsBeatsSixteenths();
      }
      return prev;
    });
  };

  const handleMove = () => {
    if (ghost) return;

    let newTime = Tone.Time(
      ((gridPos[1] - isMoving) * Tone.Time("1m").toSeconds()) / gridSize
    ).quantize(gridSize + "n");

    let newNote = 108 - gridPos[0];

    if (true) {
      setNoteTime(Tone.Time(newTime).toBarsBeatsSixteenths());
      setNoteNote(newNote);
    }
  };

  useEffect(() => {
    if (isResizing) handleResize();
    if (isMoving !== false) handleMove();
  }, [gridPos]);

  useEffect(() => {
    if (ghost) return;
    setNoteTime((prev) => (note.time !== prev ? note.time : prev));
    setNoteDuration((prev) => (note.duration !== prev ? note.duration : prev));
    setNoteNote((prev) => (note.note !== prev ? note.note : prev));
  }, [note]);

  useEffect(() => {
    //console.log(isMouseDown);
    if (isMouseDown === false) {
      commitChanges();
      setIsResizing(false);
      setIsMoving(false);
    }
  }, [isMouseDown]);

  return (
    <div
      className={`track-score-note ${ghost && "track-score-note-ghost"} ${
        deletableNote && "track-score-note-deletable"
      } ${track.type === 1 && "track-score-note-melody"}`}
      onMouseDown={handleMouseDown}
      style={{
        height: attr.parentHeight / trackRows.length - 1,
        width:
          (ghost
            ? drawingNote
              ? (gridPos[1] + 1) * (attr.parentWidth / (zoomSize * gridSize)) -
                Tone.Time(drawingNote.time).toSeconds() *
                  (attr.parentWidth / (zoomSize * Tone.Time("1m").toSeconds()))
              : attr.parentWidth / (zoomSize * gridSize)
            : (Tone.Time(noteDuration).toSeconds() /
                Tone.Time("1m").toSeconds()) *
              (attr.parentWidth / zoomSize)) - 2,
        transform: ghost
          ? `translate(${
              (drawingNote
                ? Tone.Time(drawingNote.time).toSeconds() *
                  (attr.parentWidth / (zoomSize * Tone.Time("1m").toSeconds()))
                : gridPos[1] * (attr.parentWidth / (zoomSize * gridSize))) -
              zoomPosition[0] * (attr.parentWidth / zoomSize)
            }px,${gridPos[0] * (attr.parentHeight / trackRows.length)}px)`
          : `translate(${
              Tone.Time(noteTime).toSeconds() *
                (attr.parentWidth / (zoomSize * Tone.Time("1m").toSeconds())) +
              ((isSelected && movingSelDelta ? movingSelDelta / gridSize : 0) -
                zoomPosition[0]) *
                (attr.parentWidth / zoomSize)
            }px,${
              trackRows.findIndex((e) => e.note === noteNote) *
              (attr.parentHeight / trackRows.length)
            }px)`,
        opacity: ghost && 0.5,
        backgroundColor: colors[track.color][isSelected ? 800 : 300],
        outline: `solid 1px ${colors[track.color][800]}`,
        top: 0,
        left: 0,
        //borderRadius: 4,
        //margin: "-2px -2px 0 0",
      }}
    >
      {!ghost && (
        <div
          className="track-score-note-handle"
          onMouseDown={() => setIsResizing(true)}
        />
      )}

      {isSelected && selNotes[selectedTrack].length === 1 && (
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
