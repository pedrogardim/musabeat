import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import { colors } from "../../utils/materialPalette";

import { IconButton, Icon } from "@material-ui/core";

import "./AudioClip.css";

function AudioClip(props) {
  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const [noteTime, setNoteTime] = useState(props.note.time);
  const [noteDuration, setNoteDuration] = useState(
    props.recording ? 0 : props.note.duration
  );

  const isSelected =
    props.selectedNotes && props.selectedNotes.includes(props.index);

  let zoomSize = props.zoomPosition[1] - props.zoomPosition[0] + 1;

  const commitChanges = () => {
    if (noteTime === props.note.time && noteDuration === props.note.duration)
      return;
    props.setModules((prev) => {
      let newModules = [...prev];
      newModules[props.selectedModule].score = [
        ...newModules[props.selectedModule].score,
      ];
      newModules[props.selectedModule].score[props.index].duration =
        noteDuration;
      newModules[props.selectedModule].score[props.index].time = noteTime;
      return newModules;
    });
  };

  const handleMouseDown = (e) => {
    if (props.ghost || props.deletingNote) return;

    if (!e.target.className.includes("module-score-note-handle")) {
      if (typeof props.floatPos[1] !== "number") return;
      let clickedPoint =
        props.floatPos[1] -
        (props.gridSize * Tone.Time(noteTime).toSeconds()) /
          Tone.Time("1m").toSeconds();
      setIsMoving(clickedPoint);
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
      let newDurtime =
        ((props.floatPos[1] + 1) * Tone.Time("1m").toSeconds()) /
          props.gridSize -
        Tone.Time(noteTime).toSeconds();
      return newDurtime < 0 ? 0 : Tone.Time(newDurtime).toBarsBeatsSixteenths();
    });
  };

  const handleMove = () => {
    if (props.ghost) return;

    if (typeof props.floatPos[1] !== "number") return;

    let newTime =
      ((props.floatPos[1] - isMoving) * Tone.Time("1m").toSeconds()) /
      props.gridSize;

    let maxTime = (props.zoomPosition[1] + 1) * Tone.Time("1m").toSeconds();

    if (newTime < 0) newTime = 0;
    if (newTime + noteDuration > maxTime) newTime = maxTime - noteDuration;

    setNoteTime(Tone.Time(newTime).toBarsBeatsSixteenths());
  };

  useEffect(() => {
    if (isResizing) handleResize();
    if (isMoving !== false) handleMove();
  }, [props.floatPos]);

  useEffect(() => {
    //console.log(props.isMouseDown);
    if (props.isMouseDown === false) {
      commitChanges();
      setIsResizing(false);
      setIsMoving(false);
    }
  }, [props.isMouseDown]);

  useEffect(() => {
    setNoteTime((prev) => (props.note.time !== prev ? props.note.time : prev));
    setNoteDuration((prev) =>
      props.note.duration !== prev ? props.note.duration : prev
    );
  }, [props.note]);

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
    //console.log(props.recording);
    let recordingNoteRefresh =
      props.recording &&
      setInterval(
        () =>
          setNoteDuration(
            Tone.Transport.seconds - Tone.Time(props.note.time).toSeconds()
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
    props.moduleSize,
    props.score,
    props.player,
    props.player.loaded,
    props.moduleZoom,
    props.fullScreen,
  ]); */

  useEffect(() => {
    //watch to window resize to update clips position
    //console.log(clipWidth, clipHeight);
    props.loaded &&
      drawClipWave(
        props.player.buffer,
        //clipHeight,
        //clipWidth,
        props.note.duration,
        props.note.offset,
        colors[props.module.color],
        props.rowRef.current.offsetWidth,
        props.index
      );
  }, [
    props.rowRef.current,
    props.player,
    props.player.buffer.loaded,
    props.zoomPosition,
  ]);

  return (
    <div
      className={`module-score-note ${
        props.ghost && "module-score-note-ghost"
      } ${props.deletableNote && "module-score-note-deletable"} ${
        props.module.type === 1 && "module-score-note-melody"
      }`}
      onMouseDown={handleMouseDown}
      style={{
        height: props.rowRef.current.scrollHeight / 2,
        width:
          (noteDuration / Tone.Time("1m").toSeconds()) *
            (props.rowRef.current.offsetWidth / zoomSize) -
          2,
        transform: `translate(${
          Tone.Time(noteTime).toSeconds() *
            (props.rowRef.current.offsetWidth /
              (zoomSize * Tone.Time("1m").toSeconds())) -
          props.zoomPosition[0] * (props.rowRef.current.offsetWidth / zoomSize)
        }px,${props.rowRef.current.scrollHeight / 4}px)`,
        opacity: props.ghost && 0.5,
        backgroundColor: props.recording
          ? "#f50057"
          : colors[props.module.color][isSelected ? 800 : 300],
        outline: `solid 1px ${colors[props.module.color][800]}`,
        borderRadius: 4,
        //margin: "-2px -2px 0 0",
      }}
    >
      {!props.ghost && (
        <div
          className="module-score-note-handle"
          onMouseDown={() => setIsResizing(true)}
        />
      )}

      <span className="audioclip-text up">
        {props.fileInfo && props.fileInfo.name}
      </span>

      {!props.recording && (
        <canvas
          className="sampler-audio-clip-wave"
          id={`canvas-${props.index}`}
          height={props.rowRef.current.scrollHeight / 2}
          width={
            (props.note.duration / Tone.Time("1m").toSeconds()) *
              (props.rowRef.current.offsetWidth / zoomSize) -
            2
          }
          style={{ height: "100%", width: "100%", pointerEvents: "none" }}
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

const drawClipWave = (buffer, duration, offset, color, parentWidth, index) => {
  //if (clipHeight === 0 || clipWidth === 0) return;

  const canvas = document.getElementById(`canvas-${index}`);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //console.log(canvas.width);

  let rightOffset =
    ((duration - buffer.duration) * parentWidth) /
    Tone.Time(Tone.Transport.loopEnd).toSeconds();

  let waveArray = buffer.toArray(0);
  let xScale = waveArray.length / (canvas.width - rightOffset);
  let yScale = 2;

  ctx.fillStyle = color[900];

  for (let x = 0; x < canvas.width - rightOffset; x++) {
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
