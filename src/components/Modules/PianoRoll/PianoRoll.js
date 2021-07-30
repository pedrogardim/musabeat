import React, { useState, useEffect, useRef } from "react";

import PianoRollNote from "./PianoRollNote";
//import SelectBox from "../../ui/SelectBox";

import * as Tone from "tone";

import { Typography } from "@material-ui/core";
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
  const [hovered, setHovered] = useState(false);
  const [notes, setNotes] = useState(
    props.module.score ? props.module.score : []
  );
  //TEMP: used only for detect window resizing on note component
  const [parentWidth, setParentWidth] = useState(0);
  const [selecting, setSelecting] = useState(false);

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
      82 -
        Math.floor(
          (clickedPos[0] - modulePos[0]) / (PRWrapper.current.offsetHeight / 82)
        ),
      (clickedPos[1] - modulePos[1]) /
        (PRWrapper.current.offsetWidth / (props.module.size * 8)),
    ];

    let newNote = {
      note: Tone.Frequency(delta[0] + 24, "midi").toNote(),
      time: (Tone.Time("1m").toSeconds() * delta[1]) / (props.module.size * 8),
      duration: "8n",
      velocity: 0.7,
    };

    console.log(newNote);

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
          PRWrapper.current !== null &&
            Tone.Transport.state === "started" &&
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
    setNotes((prev) => {
      let newNotes = [...prev];
      newNotes[index] = Object.assign({}, prev[index], note);
      //console.log(newNotes[index]);
      return newNotes;
    });
  };

  const handleKeyPress = (e) => {
    console.log(e.keyName);
  };

  const handleMouseDown = (e) => {
    if (e.target.className === "piano-roll-row-tile") {
      //console.log("notes cleared!");
      props.setSelection([]);
    }
    setSelecting([e.pageX, e.pageY]);
  };

  const handleMouseOver = (event) => {
    let hoverX =
      (event.nativeEvent.pageX -
        PRWrapper.current.getBoundingClientRect().left) /
      PRWrapper.current.offsetWidth;
    setHovered(hoverX < 0.5 ? "left" : "right");
  };

  const handleMouseOut = (event) => {
    setHovered(false);
    setSelecting(false);
  };

  const handleMouseUp = (event) => {
    setSelecting(false);
  };

  useEffect(() => {
    window.addEventListener("resize", () =>
      setParentWidth(PRWrapper.current.offsetWidth)
    );

    return () => {
      window.removeEventListener("resize", () =>
        setParentWidth(PRWrapper.current.offsetWidth)
      );
    };
  }, []);

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

  useEffect(() => {
    setNotes(props.module.score);
    //console.log(props.module.score);
  }, [props.module.score]);

  useEffect(() => {
    scheduleEvents();
  }, [props.loaded, props.instrument, props.timeline, props.module.muted]);

  /*  useEffect(() => {
    console.log(props.selection);
  }, [props.selection]); */

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
        onKeyDown={handleKeyPress}
        onMouseDown={handleMouseDown}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onMouseUp={handleMouseUp}
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
                minHeight: props.fullScreen ? 32 : 16,
              }}
            >
              {hovered && (
                <Typography
                  variant="overline"
                  className="piano-roll-row-label"
                  style={{
                    color: colors[props.module.color][100],
                    textAlign: hovered === "left" ? "right" : "left",
                  }}
                >
                  {Tone.Frequency(i + 24, "midi").toNote()}
                </Typography>
              )}
              {Array(props.module.size * 8)
                .fill(0)
                .map((ee, ii) => (
                  <div
                    key={"prrt" + ii}
                    style={{
                      borderLeft:
                        "solid 1px " +
                        (ii % 8 === 0
                          ? colors[props.module.color][500]
                          : ii % 2 === 0
                          ? colors[props.module.color][700]
                          : colors[props.module.color][800]),
                    }}
                    className="piano-roll-row-tile"
                    onDoubleClick={handleDblClick}
                  />
                ))}
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
            selected={props.selection.includes(i)}
            setSelection={props.setSelection}
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
