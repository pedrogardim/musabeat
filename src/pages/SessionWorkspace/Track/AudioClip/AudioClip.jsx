import React, { useState, useRef, useEffect, useContext } from "react";

import * as Tone from "tone";

import { colors } from "../../../../utils/Pallete";

import { IconButton, Icon } from "@mui/material";

import wsCtx from "../../../../context/SessionWorkspaceContext";

import "./style.css";

function AudioClip(props) {
  const noteRef = useRef(null);

  const { tracks, setTracks, params, paramSetter, instrumentsInfo } =
    useContext(wsCtx);

  const { gridSize, selNotes, movingSelDelta, zoomPosition, selectedTrack } =
    params;

  const {
    note,
    rowRef,
    player,
    index,
    floatPos,
    deletableNote,
    isRecClip,
    isMouseDown,
    setDrawingNote,
  } = props;

  const fileInfo = instrumentsInfo[selectedTrack].filesInfo[index];
  const track = tracks[selectedTrack];

  const loaded = player.loaded;

  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const [noteTime, setNoteTime] = useState(note.time);
  const [noteDuration, setNoteDuration] = useState(
    isRecClip ? 0 : note.duration
  );
  const [noteOffset, setNoteOffset] = useState(note.offset);

  const isSelected =
    selNotes &&
    selNotes[selectedTrack] &&
    selNotes[selectedTrack].includes(index);

  let zoomSize = zoomPosition[1] - zoomPosition[0] + 1;

  const commitChanges = () => {
    if (
      noteTime === note.time &&
      noteDuration === note.duration &&
      noteOffset === note.offset
    )
      return;
    setTracks((prev) => {
      let newTracks = [...prev];
      newTracks[selectedTrack].score = [...newTracks[selectedTrack].score];
      newTracks[selectedTrack].score[index].duration = parseFloat(
        noteDuration.toFixed(3)
      );
      newTracks[selectedTrack].score[index].time = noteTime;

      newTracks[selectedTrack].score[index].offset = parseFloat(
        noteOffset.toFixed(3)
      );

      newTracks[selectedTrack].score = handleOverlappingClips(
        newTracks[selectedTrack].score,
        index
      );
      return newTracks;
    });
  };

  const handleOverlappingClips = (score, noteIndex) => {
    let newScore = score.map((e) => ({
      ...e,
      time: parseFloat(Tone.Time(e.time).toSeconds().toFixed(3)),
    }));
    //console.log("newScore", newScore);
    let commitedNote = newScore[noteIndex];
    for (let i = 0; i < score.length; i++) {
      if (i === noteIndex || newScore[i] === null) continue;
      //case 1: total overlapping
      if (
        commitedNote.time < newScore[i].time &&
        commitedNote.time + commitedNote.duration >
          newScore[i].time + newScore[i].duration
      ) {
        newScore[i] = null;
        //console.log("case 1: total overlapping");
        continue;
      }
      //case 2: overlapping only in the middle (splited)
      if (
        commitedNote.time > newScore[i].time &&
        commitedNote.time + commitedNote.duration <
          newScore[i].time + newScore[i].duration
      ) {
        //clip on the right
        let newClip = {
          clip: newScore[i].clip,
          duration:
            newScore[i].time +
            newScore[i].duration -
            (commitedNote.time + commitedNote.duration),
          time: commitedNote.time + commitedNote.duration,
          offset: commitedNote.time + commitedNote.duration - newScore[i].time,
        };
        //clip on the left
        newScore[i].duration = commitedNote.time - newScore[i].time;
        newScore = [...newScore, newClip];

        //console.log("case 2: middle overlapping");
        continue;
      }
      //case 3: overlapping on the left
      if (
        commitedNote.time + commitedNote.duration > newScore[i].time &&
        commitedNote.time + commitedNote.duration <
          newScore[i].time + newScore[i].duration
      ) {
        let difference =
          commitedNote.time + commitedNote.duration - newScore[i].time;
        newScore[i].time = newScore[i].time + difference;
        newScore[i].offset = difference;
        newScore[i].duration = newScore[i].duration - difference;
        //console.log("case 3: overlapping on the left");
        continue;
      }
      //case 4: overlapping on the right
      if (
        newScore[i].time + newScore[i].duration > commitedNote.time &&
        commitedNote.time + commitedNote.duration >
          newScore[i].time + newScore[i].duration
      ) {
        let difference =
          newScore[i].time + newScore[i].duration - commitedNote.time;
        newScore[i].duration = newScore[i].duration - difference;
        //console.log("case 4: overlapping on the right");
        continue;
      }
    }
    return newScore
      .filter((e, i) => e !== null || i === noteIndex)
      .map((e) => ({
        ...e,
        time: Tone.Time(e.time).toBarsBeatsSixteenths(),
      }));
  };

  const handleMouseDown = (e) => {
    if (isRecClip || deletableNote) return;

    if (!e.target.className.includes("track-score-note-handle")) {
      if (typeof floatPos[1] !== "number") return;
      let clickedPoint =
        floatPos[1] -
        (gridSize * Tone.Time(noteTime).toSeconds()) /
          Tone.Time("1m").toSeconds();
      setIsMoving(clickedPoint);
      paramSetter("selNotes", () => {
        let newNotes = [];
        newNotes[selectedTrack] = [index];
        //console.log(newNotes);
        return newNotes;
      });
    }

    /*  setDrawingNote((note) => {
      let newNote = { ...note };
      newNote.time = Tone.Time(note.time).toSeconds();
      console.log(newNote);
      return newNote;
    }); */
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
    if (isRecClip) return;
    let note = {};
    setDrawingNote(null);
    if (isResizing === "right") {
      note.dur =
        (floatPos[1] * Tone.Time("1m").toSeconds()) / gridSize -
        Tone.Time(noteTime).toSeconds();
      setNoteDuration(
        note.dur < 0.1
          ? 0.1
          : note.dur > player.buffer.duration - note.offset
          ? player.buffer.duration - note.offset
          : note.dur
      );
    }
    if (isResizing === "left") {
      note.time = (floatPos[1] * Tone.Time("1m").toSeconds()) / gridSize;

      if (note.time <= 0) return;

      note.offset = note.time - Tone.Time(note.time).toSeconds();

      note.dur =
        Tone.Time(note.time).toSeconds() +
        note.duration -
        (floatPos[1] * Tone.Time("1m").toSeconds()) / gridSize;

      if (note.dur > player.buffer.duration || note.dur < 0.1) return;

      setNoteTime(note.time < 0 ? 0 : note.time);
      setNoteOffset(note.offset < 0 ? 0 : note.offset);
      setNoteDuration(note.dur);
    }
  };

  const handleMove = () => {
    if (isRecClip) return;

    if (typeof floatPos[1] !== "number") return;

    let newTime =
      ((floatPos[1] - isMoving) * Tone.Time("1m").toSeconds()) / gridSize;

    let maxTime = (zoomPosition[1] + 1) * Tone.Time("1m").toSeconds();

    //if (newTime < 0) newTime = 0;
    //if (newTime + noteDuration > maxTime) newTime = maxTime - noteDuration;

    setNoteTime(Tone.Time(newTime).toBarsBeatsSixteenths());
  };

  useEffect(() => {
    if (isResizing) handleResize();
    if (isMoving !== false) handleMove();
  }, [floatPos]);

  useEffect(() => {
    //console.log(isMouseDown);
    if (isMouseDown === false) {
      commitChanges();
      setIsResizing(false);
      setIsMoving(false);
    }
  }, [isMouseDown]);

  useEffect(() => {
    setNoteTime((prev) => (note.time !== prev ? note.time : prev));
    setNoteDuration((prev) => (note.duration !== prev ? note.duration : prev));
  }, [note]);

  /*  useEffect(() => {
    console.log("isMoving", isMoving);
  }, [isMoving]); */

  /* useEffect(() => {
    //watch to window resize to update clips position

    window.addEventListener("resize", updateClipPosition);
    return () => {
      window.removeEventListener("resize", updateClipPosition);
    };
  }, []); */

  useEffect(() => {
    //console.log(recording);
    let recordingNoteRefresh =
      isRecClip &&
      setInterval(
        () =>
          setNoteDuration(
            Tone.Transport.seconds - Tone.Time(note.time).toSeconds()
          ),
        16
      );
    return () => {
      clearInterval(recordingNoteRefresh);
    };
  }, []);

  /*  useEffect(() => {
    //updateClipPosition();
  }, [
    trackSize,
    score,
    player,
    player.loaded,
    trackZoom,
    fullScreen,
  ]); */

  useEffect(() => {
    //watch to window resize to update clips position
    //console.log(clipWidth, clipHeight);
    loaded &&
      drawClipWave(
        player.buffer,
        //clipHeight,
        //clipWidth,
        noteDuration,
        noteOffset,
        colors[track.color],
        rowRef.current.offsetWidth,
        noteRef.current.offsetWidth,
        index
      );
  }, [
    rowRef.current,
    player,
    player.buffer.loaded,
    zoomPosition,
    note,
    noteDuration,
    noteOffset,
  ]);

  return (
    <div
      className={`track-score-note ${
        deletableNote && "track-score-note-deletable"
      } ${track.type === 1 && "track-score-note-melody"}`}
      ref={noteRef}
      onMouseDown={handleMouseDown}
      style={{
        height: rowRef.current.scrollHeight / 2,
        width:
          (noteDuration / Tone.Time("1m").toSeconds()) *
            (rowRef.current.offsetWidth / zoomSize) -
          2,
        transform: `translate(${
          Tone.Time(noteTime).toSeconds() *
            (rowRef.current.offsetWidth /
              (zoomSize * Tone.Time("1m").toSeconds())) +
          ((isSelected && movingSelDelta ? movingSelDelta / gridSize : 0) -
            zoomPosition[0]) *
            (rowRef.current.offsetWidth / zoomSize)
        }px,${rowRef.current.scrollHeight / 4}px)`,
        backgroundColor: isRecClip
          ? "#f50057"
          : colors[track.color][isSelected ? 800 : 300],
        outline: `solid 1px ${colors[track.color][800]}`,
        borderRadius: 4,
        zIndex: isSelected && 2,
        //margin: "-2px -2px 0 0",
      }}
    >
      {!isRecClip && (
        <>
          <div
            className="track-score-note-handle"
            onMouseDown={() => setIsResizing("left")}
            style={{ left: 0, cursor: "ew-resize" }}
          />
          <div
            className="track-score-note-handle"
            onMouseDown={() => setIsResizing("right")}
            style={{ right: 0, cursor: "ew-resize" }}
          />
        </>
      )}

      <span className="audioclip-text up">{fileInfo && fileInfo.name}</span>

      {!isRecClip && (
        <canvas
          className="sampler-audio-clip-wave"
          id={`canvas-${index}`}
          height={rowRef.current.scrollHeight / 2}
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

const drawClipWave = (
  buffer,
  duration,
  offset,
  color,
  parentWidth,
  noteWidth,
  index
) => {
  //if (clipHeight === 0 || clipWidth === 0) return;

  const canvas = document.getElementById(`canvas-${index}`);
  canvas.width = noteWidth;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //console.log(canvas.width);

  let waveArray = buffer.slice(offset);

  waveArray = waveArray.slice(0, duration).toArray(0);

  let xScale = waveArray.length / canvas.width;
  let yScale = 2;

  ctx.fillStyle = color[900];

  for (let x = 0; x < canvas.width; x++) {
    let rectHeight =
      Math.abs(Math.floor(waveArray[Math.floor(x * xScale)] * canvas.height)) *
      yScale;

    //console.log("rect");
    ctx.fillRect(x, canvas.height / 2 - rectHeight / 2, 1, rectHeight);
  }
};

/* 
const drawClipWave = (buffer, clipHeight, clipWidth, color) => {
  //console.log(buffer);
  let waveArray = buffer;

  let scale = waveArray.length / clipWidth;

  let pathString = "M 0 " + clipHeight / 2 + " ";

  for (let x = 0; x < clipWidth; x++) {
    pathString +=
      "L " +
      x +
      " " +
      Math.floor(
        waveArray[Math.floor(x * scale)] * clipHeight + clipHeight / 2
      ) +
      " ";
  }
  return <path d={pathString} stroke={color[100]} fill="none" />;
};
 */

export default AudioClip;
