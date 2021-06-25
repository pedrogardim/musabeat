import React, { useState, useEffect, useRef } from "react";

import PianoRollNote from "./PianoRollNote";
import * as Tone from "tone";

import {
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
  Typography,
} from "@material-ui/core";

import {
  schedulePianoRoll,
  clearEvents,
} from "../../../utils/TransportSchedule";

import Draggable from "react-draggable";

import "./PianoRoll.css";
import { colors } from "../../../utils/materialPalette";

function PianoRoll(props) {
  const PRWrapper = useRef(null);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [notes, setNotes] = useState([]);

  //PRWrapper.current && PRWrapper.current.scrollTo(0, 0);

  const scheduleEvents = () => {
    !props.module.muted && !!props.instrument
      ? schedulePianoRoll(
          notes,
          props.instrument,
          Tone.Transport,
          props.module.id
        )
      : clearEvents(props.module.id);
  };

  const handleDblClick = (event) => {
    let clickedPos = [
      event.target.getBoundingClientRect().top,
      event.target.getBoundingClientRect().left,
    ];
    let modulePos = [
      PRWrapper.current.getBoundingClientRect().top,
      PRWrapper.current.getBoundingClientRect().left,
    ];

    let delta = [
      83 - Math.floor((clickedPos[0] - modulePos[0]) / 31),
      (clickedPos[1] - modulePos[1]) /
        (PRWrapper.current.offsetWidth / (props.module.size * 8)),
    ];

    let newNote = {
      note: Tone.Frequency(delta[0] + 24, "midi").toNote(),
      time: (Tone.Time("1m").toSeconds() * delta[1]) / (props.module.size * 8),
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

  const toggleCursor = (state) => {
    clearInterval(cursorAnimator);
    state &&
      setCursorAnimator(
        setInterval(() => {
          let cursorPosition =
            props.module.size === props.sessionSize
              ? Tone.Transport.seconds /
                props.module.size /
                Tone.Time("1m").toSeconds()
              : (Tone.Transport.seconds / Tone.Time("1m").toSeconds()) %
                props.module.size;
          //temp fix
          PRWrapper.current !== null &&
            Tone.Transport.state === "started" &&
            setCursorPosition(cursorPosition * PRWrapper.current.offsetWidth);
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
    setNotes((prev) => {
      let newNotes = [...prev];
      newNotes[index] = Object.assign({}, prev[index], note);
      //console.log(newNotes[index]);
      return newNotes;
    });
  };

  useEffect(() => {
    toggleCursor(Tone.Transport.state);
    //scheduleEvents();
  }, [Tone.Transport.state]);

  useEffect(() => {
    scheduleEvents();
    props.setModules((previousModules) => {
      let newModules = [...previousModules];
      newModules[props.index].score = notes;
      return newModules;
    });
  }, [notes]);

  return (
    <div
      className="module-innerwrapper"
      style={
        (props.style,
        {
          backgroundColor: colors[props.module.color][900],
          overflow: "scroll",
        })
      }
    >
      <div
        className="piano-roll"
        ref={PRWrapper}
        style={{
          width: props.moduleZoom * 100 + "%",
        }}
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
              }}
            >
              <span
                className="piano-roll-row-label"
                style={{ color: colors[props.module.color][100] }}
              >
                {Tone.Frequency(i + 24, "midi").toNote()}
              </span>
              {Array(props.module.size * 8)
                .fill(0)
                .map((ee, ii) => (
                  <div
                    key={"prrt" + ii}
                    style={{
                      borderLeft:
                        "solid 1px " +
                        (ii % 8 == 0
                          ? colors[props.module.color][500]
                          : ii % 2 == 0
                          ? colors[props.module.color][700]
                          : colors[props.module.color][800]),
                    }}
                    className="piano-roll-row-tile"
                    onDoubleClick={handleDblClick}
                  />
                ))}
            </div>
          ))}
        {(props.fullScreen || props.moduleZoom) &&
          notes.map((e, i) => (
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
            />
          ))}
        <Draggable
          axis="x"
          onDrag={handleCursorDrag}
          onStart={handleCursorDragStart}
          onStop={handleCursorDragStop}
          position={{ x: cursorPosition, y: 0 }}
        >
          <div
            className="sampler-cursor"
            style={{ backgroundColor: "white" }}
          />
        </Draggable>
      </div>
    </div>
  );
}

export default PianoRoll;
