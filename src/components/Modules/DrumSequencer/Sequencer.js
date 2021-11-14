import React, { useState, useEffect, useRef } from "react";

import SequencerTile from "./SequencerTile";
import * as Tone from "tone";

import { labels } from "../../../assets/drumkits";

import {
  scheduleDrumSequence,
  clearEvents,
} from "../../../utils/TransportSchedule";

import {
  BottomNavigation,
  BottomNavigationAction,
  Typography,
} from "@material-ui/core";

import "./Sequencer.css";
import { colors } from "../../../utils/materialPalette";
import { ContactsOutlined } from "@material-ui/icons";

function Sequencer(props) {
  const parentRef = useRef(null);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [sequencerArray, setSequence] = useState(props.module.score);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [soundsMap, setSoundsMap] = useState([]);
  const [draggingSelect, setDraggingSelect] = useState(false);

  const inputNote = (x, y) => {
    /*  setSequence((previousSequence) =>
      previousSequence.map((measure, measureIndex) =>
        Object.assign(
          {},
          Object.values(measure).map((beat, beatIndex) =>
            measureIndex === currentMeasure && beatIndex === x
              ? beat === 0
                ? [y]
                : beat.includes(y) && beat.length > 1
                ? beat.filter((z) => z !== y)
                : beat.includes(y) && beat.length === 1
                ? 0
                : [...beat, isNaN(y) ? y : parseInt(y)]
              : beat
          )
        )
      )
    ); */

    setSequence((previousSequence) => {
      let newSequence = [...previousSequence];
      let beat = newSequence[currentMeasure][x];
      newSequence[currentMeasure][x] =
        beat === 0
          ? [y]
          : beat.includes(y) && beat.length > 1
          ? beat.filter((z) => z !== y)
          : beat.includes(y) && beat.length === 1
          ? 0
          : [...beat, isNaN(y) ? y : parseInt(y)];
      return newSequence;
    });

    playDrumSound(y);
  };

  const scheduleNotes = () => {
    !props.module.muted
      ? scheduleDrumSequence(
          sequencerArray,
          props.instrument,
          Tone.Transport,
          setCurrentBeat,
          setCurrentMeasure,
          props.module.id,
          props.sessionSize,
          props.timeline,
          props.timelineMode
        )
      : clearEvents(props.module.id);
  };

  const playDrumSound = (note) => props.instrument.player(note).start();

  const handleBottomNavClick = (value) => {
    setCurrentMeasure(value);
    Tone.Transport.seconds = value * Tone.Time("1m").toSeconds();
    setCurrentBeat(0);
  };

  const updateModuleSequence = (a) => {
    props.isSessionLoaded &&
      props.setModules((previousModules) => {
        let checker =
          JSON.stringify(previousModules[props.index].score) !==
          JSON.stringify(sequencerArray);
        //console.log(checker);
        let newModules = [...previousModules];
        newModules[props.index].score = JSON.parse(
          JSON.stringify(sequencerArray)
        );
        return checker ? newModules : previousModules;
      });
  };

  const handleMouseOver = (event) => {
    let hoverX =
      (event.nativeEvent.pageX -
        parentRef.current.getBoundingClientRect().left) /
      parentRef.current.offsetWidth;
    setHovered(hoverX < 0.5 ? "left" : "right");
  };

  const toggleCursor = () => {
    setCursorAnimator(
      setInterval(() => {
        let measure =
          parseInt(Tone.Transport.position.split(":")[0]) %
          props.module.score.length;
        let beat = Math.floor(
          (Tone.Transport.seconds % Tone.Time("1m").toSeconds()) /
            (Tone.Time("1m").toSeconds() /
              Object.keys(props.module.score[0]).length)
        );
        //console.log("measure", measure);
        //currentMeasure !== measure &&
        if (measure < props.module.score.length) setCurrentMeasure(measure);
        //currentBeat !== beat &&
        setCurrentBeat(beat);
      }, 32)
    );
  };

  //===================
  /* 
  useEffect(() => {
    console.log("measure", currentMeasure);
  }, [currentMeasure]);

  useEffect(() => {
    console.log("beat", currentBeat);
  }, [currentBeat]); */

  useEffect(() => {
    toggleCursor();
    return () => {
      clearInterval(cursorAnimator);
    };
  }, []);

  useEffect(() => {
    scheduleNotes();
    updateModuleSequence();
  }, [sequencerArray]);

  useEffect(() => {
    setSequence(props.module.score);
  }, [props.module]);

  useEffect(() => {
    scheduleNotes();
    props.instrument &&
      props.instrument._buffers &&
      props.loaded &&
      setSoundsMap(Array.from(props.instrument._buffers._buffers.keys()));
  }, [props.instrument, props.loaded]);

  useEffect(() => {
    scheduleNotes();
  }, [props.sessionSize, props.timeline, props.module.muted]);

  return (
    <div
      className="module-innerwrapper"
      style={props.style}
      onMouseOver={handleMouseOver}
      onMouseLeave={() => {
        setHovered(false);
        setDraggingSelect(false);
      }}
      onMouseDown={() => setDraggingSelect(true)}
      onMouseUp={() => setDraggingSelect(false)}
    >
      <div className="sequencer" ref={parentRef}>
        {soundsMap.map((drumsound, row) => (
          <div className="sequencer-row" key={drumsound}>
            {hovered && (
              <div className="sequencer-row-label">
                <Typography
                  variant="overline"
                  style={{
                    /* textAlign: hovered === "left" ? "right" : "left"; */
                    color: colors[props.module.color][200],
                  }}
                >
                  {props.module.lbls[drumsound]
                    ? props.module.lbls[drumsound]
                    : drumsound}
                </Typography>
              </div>
            )}
            {Object.values(sequencerArray[currentMeasure]).map(
              (beat, column) => (
                <SequencerTile
                  key={[column, drumsound]}
                  inputNote={inputNote}
                  active={
                    typeof beat === "object" &&
                    beat.includes(
                      isNaN(drumsound) ? drumsound : parseInt(drumsound)
                    )
                  }
                  cursor={currentBeat === column}
                  color={colors[props.module.color]}
                  x={column}
                  y={isNaN(drumsound) ? drumsound : parseInt(drumsound)}
                  draggingSelect={draggingSelect}
                />
              )
            )}
          </div>
        ))}
      </div>

      {sequencerArray.length > 1 && (
        <BottomNavigation
          style={{ color: colors[props.module.color][900] }}
          value={currentMeasure}
          showLabels
          onChange={(event, newValue) => {
            handleBottomNavClick(newValue);
          }}
          className="sequencer-bottomnav"
        >
          {sequencerArray.length > 1 &&
            sequencerArray.map((measure, index) => (
              <BottomNavigationAction
                style={{ minWidth: 0, maxWidth: "100%" }}
                key={index}
                label={index + 1}
              />
            ))}
        </BottomNavigation>
      )}
    </div>
  );
}

export default Sequencer;
