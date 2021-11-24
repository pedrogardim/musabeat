import React, { useState, useEffect, useRef } from "react";

import PianoRollNote from "./PianoRollNote";
//import SelectBox from "../../ui/SelectBox";

import * as Tone from "tone";

import { Typography } from "@material-ui/core";
import {
  schedulePianoRoll,
  clearEvents,
} from "../../../utils/TransportSchedule";

import { parseMidiFile } from "../../../assets/musicutils";

import Draggable from "react-draggable";

import { FileDrop } from "react-file-drop";

import "./PianoRoll.css";
import { colors } from "../../../utils/materialPalette";

function PianoRoll(props) {
  const PRWrapper = useRef(null);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [notes, setNotes] = useState(
    props.module.score ? props.module.score : []
  );
  //TEMP: used only for detect window resizing on note component
  const [parentWidth, setParentWidth] = useState(0);
  const [dragSelection, setDragSelection] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);

  const [draggingNoteDelta, setDraggingNoteDelta] = useState(null);
  const [draggingNote, setDraggingNote] = useState(null);

  //PRWrapper.current && PRWrapper.current.scrollTo(0, 0);

  const scheduleEvents = () => {
    !props.module.muted && !!props.instrument
      ? schedulePianoRoll(
          notes,
          props.instrument,
          Tone.Transport,
          props.module.id,
          props.module.size,
          props.sessionSize,
          props.timeline,
          props.timelineMode
        )
      : clearEvents(props.module.id);
  };

  const handleFileDrop = (files, event) => {
    if (files[0].type !== "audio/midi") return;

    event.preventDefault();
    Tone.Transport.pause();
    let file = files[0];
    setDraggingOver(false);
    //console.log(file);
    //parseMidiFile(file, setNotes);
    file.arrayBuffer().then((r) => parseMidiFile(r, setNotes));
  };

  const handleDblClick = (event) => {
    let clickedPos = [
      event.pageY - PRWrapper.current.getBoundingClientRect().top,
      event.pageX - PRWrapper.current.getBoundingClientRect().left,
    ];

    let delta = [
      84 - Math.ceil(clickedPos[0] / (PRWrapper.current.offsetHeight / 84)),
      clickedPos[1] / PRWrapper.current.offsetWidth,
    ];

    let newNote = {
      note: Tone.Frequency(delta[0] + 24, "midi").toNote(),
      time: Tone.Time(
        Tone.Time("1m").toSeconds() * delta[1] * props.module.size
      ).toBarsBeatsSixteenths(),
      duration: "8n",
      velocity: 0.7,
    };
    //console.log(newNote);

    setNotes((prev) => {
      let newNotes = [...prev];
      newNotes.push(newNote);
      return newNotes;
    });
  };

  const toggleCursor = () => {
    setCursorAnimator(
      setInterval(() => {
        PRWrapper.current !== null &&
          setCursorPosition(
            ((Tone.Transport.seconds %
              (Tone.Time("1m").toSeconds() * props.module.size)) /
              (Tone.Time("1m").toSeconds() * props.module.size)) *
              PRWrapper.current.offsetWidth
          );
      }, 32)
    );
  };

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (element.x / PRWrapper.current.offsetWidth) *
      Tone.Time("1m").toSeconds() *
      props.module.size;

    setCursorPosition(element.x);
  };

  const handleCursorDragStart = (event, element) => {
    props.instrument.releaseAll(0);
  };

  const handleCursorDragStop = (event, element) => {
    //scheduleEvents();
  };

  const changeNote = (note, index) => {
    //console.log("change note", note);
    setNotes((prev) => {
      let newNotes = [...prev];
      newNotes[index] = Object.assign({}, prev[index], note);
      //console.log(newNotes[index]);
      return newNotes;
    });
  };

  const handleKeyPress = (e) => {
    //console.log(e.keyName);
  };

  const handleMouseDown = (e) => {
    let initialPoint = [
      e.pageX - PRWrapper.current.getBoundingClientRect().left,
      e.pageY - PRWrapper.current.getBoundingClientRect().top,
    ];

    if (e.target.className === "piano-roll") {
      //console.log("notes cleared!");
      props.setSelection([]);
      setDragSelection([...initialPoint, ...initialPoint]);
    }
  };

  const handleMouseMove = (event) => {
    if (dragSelection) {
      let newPoint = [
        event.pageX - PRWrapper.current.getBoundingClientRect().left,
        event.pageY - PRWrapper.current.getBoundingClientRect().top,
      ];
      setDragSelection((prev) => [prev[0], prev[1], ...newPoint]);

      //console.log(dragSelection[1], newPoint[1]);

      let timeRangeInSeconds = [dragSelection[0], newPoint[0]]
        .map(
          (e) =>
            (e / PRWrapper.current.offsetWidth) *
            Tone.Time("1m").toSeconds() *
            props.module.size
        )
        .sort((a, b) => a - b);

      let noteRangeInMidi = [dragSelection[1], newPoint[1]]
        .map(
          (n) => 84 - Math.ceil((n / PRWrapper.current.offsetHeight) * 84) + 24
        )
        .sort((a, b) => a - b);

      const checkCondition = (note) => {
        let midiNote = Tone.Frequency(note.note).toMidi();
        let secTime = Tone.Time(note.time).toSeconds();
        let secDur = Tone.Time(note.duration).toSeconds();

        let noteCondition =
          midiNote >= noteRangeInMidi[0] && midiNote <= noteRangeInMidi[1];
        let timeCondition =
          secTime + secDur >= timeRangeInSeconds[0] &&
          secTime <= timeRangeInSeconds[1];
        //console.log(timeCondition);
        return noteCondition && timeCondition;
      };

      let noteSelection = notes
        .map((e, i) => (checkCondition(e) ? i : false))
        .filter((e) => e !== false);

      props.setSelection(noteSelection);
    }
  };

  const handleMouseOut = (event) => {
    setHovered(false);
    setDragSelection(false);
  };

  const handleMouseEnter = (event) => {
    setHovered(true);
  };

  const handleMouseUp = (event) => {
    setDragSelection(false);
  };

  const drawDragSelectionBox = () => {
    const canvas = document.getElementById("drag-select-box");
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let width = dragSelection[2] - dragSelection[0];
    let height = dragSelection[3] - dragSelection[1];
    ctx.fillStyle = colors[props.module.color][200] + "50";
    ctx.strokeStyle = colors[props.module.color][700];

    ctx.fillRect(dragSelection[0], dragSelection[1], width, height);
  };

  useEffect(() => {
    toggleCursor();
    window.addEventListener(
      "resize",
      () => PRWrapper.current && setParentWidth(PRWrapper.current.offsetWidth)
    );

    return () => {
      clearInterval(cursorAnimator);
      window.removeEventListener(
        "resize",
        () => PRWrapper.current && setParentWidth(PRWrapper.current.offsetWidth)
      );
    };
  }, []);

  useEffect(() => {
    //console.log("notes", notes);
    scheduleEvents();
    props.isSessionLoaded &&
      props.setModules((previousModules) => {
        let checker =
          JSON.stringify(previousModules[props.index].score) !==
          JSON.stringify(notes);

        let newModules = [...previousModules];
        newModules[props.index].score = JSON.parse(JSON.stringify(notes));
        return checker ? newModules : previousModules;
      });
  }, [notes]);

  useEffect(() => {
    setNotes(props.module.score);
    //console.log(props.module.score);
  }, [props.module.score]);

  useEffect(() => {
    scheduleEvents();
  }, [props.loaded, props.instrument, props.timeline, props.module.muted]);

  useEffect(() => {
    drawDragSelectionBox();
    //console.log(dragSelection);
  }, [dragSelection]);

  useEffect(() => {
    setDragSelection(false);
  }, [hovered]);

  /* useEffect(() => {
    console.log(draggingNote);
  }, [draggingNote]);

  useEffect(() => {
    console.log(draggingNoteDelta);
  }, [draggingNoteDelta]); */

  return (
    <div
      className="module-innerwrapper"
      style={
        (props.style,
        {
          backgroundColor: colors[props.module.color][900],
          overflow: "overlay",
        })
      }
    >
      <div
        className="piano-roll"
        ref={PRWrapper}
        style={{
          width: props.moduleZoom * 100 + "%",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseOut={handleMouseOut}
        onKeyDown={handleKeyPress}
        onMouseDown={handleMouseDown}
        /* onTouchStart={handleMouseDown} */
        onMouseUp={handleMouseUp}
        /*  onTouchEnd={handleMouseUp} */
        onMouseMove={handleMouseMove}
        /* onTouchMove={handleMouseMove} */
        onDragEnter={() => setDraggingOver(true)}
        onDoubleClick={handleDblClick}
      >
        {Array(12 * 7)
          .fill(0)
          .map((e, i) => (
            <div
              key={"prr" + i}
              className="piano-roll-row"
              style={{
                borderBottom: `solid 1px ${colors[props.module.color][800]}`,
                backgroundColor:
                  Tone.Frequency(i + 24, "midi")
                    .toNote()
                    .includes("#") && "rgba(0,0,0,0.1)",
                //minHeight: props.fullScreen ? 32 : 16,
                minHeight: 16,
              }}
            >
              {hovered && (
                <div className="piano-roll-row-label">
                  <Typography
                    variant="overline"
                    style={{
                      color: colors[props.module.color][200],
                      opacity: 0.5,
                      pointerEvents: "none",
                      /* textAlign: hovered === "left" ? "right" : "left", */
                    }}
                  >
                    {Tone.Frequency(i + 24, "midi").toNote()}
                  </Typography>
                </div>
              )}
            </div>
          ))}
        {Array(props.module.size * 8)
          .fill(0)
          .map((ee, i) => (
            <div
              key={"prrt" + i}
              style={{
                borderLeft:
                  "solid 1px " +
                  (i % 8 === 0
                    ? colors[props.module.color][500]
                    : i % 2 === 0
                    ? colors[props.module.color][700]
                    : colors[props.module.color][800]),
                width: 100 / (props.module.size * 8) + "%",
                left: (100 / (props.module.size * 8)) * i + "%",
              }}
              className="piano-roll-vert-tile"
            >
              {i % 8 === 0 && (
                <span
                  style={{
                    color: colors[props.module.color][200],
                  }}
                  className="background-grid-item-num"
                >
                  {Math.floor(i / 8) + 1}
                </span>
              )}
            </div>
          ))}
        {notes.map((e, i) => (
          <PianoRollNote
            index={i}
            key={"prn" + i}
            parentRef={PRWrapper}
            color={colors[props.module.color]}
            note={notes[i]}
            moduleZoom={props.moduleZoom}
            fullScreen={props.fullScreen}
            changeNote={changeNote}
            sessionSize={props.sessionSize}
            size={props.module.size}
            parentWidth={parentWidth}
            selection={props.selection}
            selected={
              typeof props.selection === "object" && props.selection.includes(i)
            }
            setSelection={props.setSelection}
            instrument={props.instrument}
            dragSelection={dragSelection}
            draggingNote={draggingNote}
            setDraggingNote={setDraggingNote}
            draggingNoteDelta={draggingNoteDelta}
            setDraggingNoteDelta={setDraggingNoteDelta}
          />
        ))}
        <canvas
          id="drag-select-box"
          style={{ pointerEvents: "none", zIndex: 4, position: "absolute" }}
          height={PRWrapper.current && PRWrapper.current.offsetHeight}
          width={PRWrapper.current && PRWrapper.current.offsetWidth}
        />
        <Draggable
          axis="x"
          onDrag={handleCursorDrag}
          onStart={handleCursorDragStart}
          onStop={handleCursorDragStop}
          position={{ x: cursorPosition, y: 0 }}
          style={{ pointerEvents: dragSelection && "none" }}
        >
          <div
            className="sampler-cursor"
            style={{
              backgroundColor: "white",
              pointerEvents: dragSelection && "none",
            }}
          />
        </Draggable>
      </div>
      {draggingOver && (
        <FileDrop
          onDragLeave={(e) => {
            setDraggingOver(false);
          }}
          onDrop={(files, event) => handleFileDrop(files, event)}
          className={"file-drop"}
          index={props.index}
          style={{
            backgroundColor: colors[props.module.color][300],
          }}
        >
          Drop your files here!
        </FileDrop>
      )}
    </div>
  );
}

export default PianoRoll;
