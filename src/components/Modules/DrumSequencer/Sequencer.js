import React, { useState, useEffect, useRef } from "react";

import SequencerTile from "./SequencerTile";
import * as Tone from "tone";

import { labels } from "../../../assets/drumkits";

import {
  scheduleDrumSequence,
  clearEvents,
} from "../../../utils/TransportSchedule";
import { loadDrumPatch } from "../../../assets/musicutils";

import {
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
  Typography,
} from "@material-ui/core";

import "./Sequencer.css";
import { colors } from "../../../utils/materialPalette";

function Sequencer(props) {
  const parentRef = useRef(null);
  const [sequencerArray, setSequence] = useState(props.module.score);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [soundsMap, setSoundsMap] = useState([]);

  const inputNote = (x, y) => {
    setSequence((previousSequence) =>
      previousSequence.map((measure, measureIndex) =>
        measure.map((beat, beatIndex) =>
          measureIndex == currentMeasure && beatIndex == x
            ? beat === 0
              ? [y]
              : beat.includes(y) && beat.length > 1
              ? beat.filter((z) => z != y)
              : beat.includes(y) && beat.length === 1
              ? 0
              : [...beat, isNaN(y) ? y : parseInt(y)]
            : beat
        )
      )
    );
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
          props.sessionSize
        )
      : clearEvents(props.module.id);
  };

  const playDrumSound = (note) => props.instrument.player(note).start();

  const handleBottomNavClick = (value) => {
    setCurrentMeasure(value);
    Tone.Transport.seconds = value * Tone.Time("1m").toSeconds();
    setCurrentBeat(0);
  };

  const updateModuleSequence = () => {
    props.updateModules((previousModules) => {
      let newModules = [...previousModules];
      newModules[props.index].score = sequencerArray;
      return newModules;
    });
  };

  const handleMouseOver = (event) => {
    let hoverX =
      (event.nativeEvent.pageX -
        parentRef.current.getBoundingClientRect().left) /
      parentRef.current.offsetWidth;
    setHovered(hoverX < 0.5 ? "left" : "right");
  };

  //===================

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
      props.loaded &&
      setSoundsMap(Array.from(props.instrument._buffers._buffers.keys()));
  }, [props.instrument, props.loaded]);

  useEffect(() => {
    scheduleNotes();
  }, [props.sessionSize]);

  return (
    <div
      className="module-innerwrapper"
      style={props.style}
      onMouseOver={handleMouseOver}
      onMouseOut={() => setHovered(false)}
    >
      <div className="sequencer" ref={parentRef}>
        {soundsMap.map((drumsound, row) => (
          <div className="sequencer-row" key={drumsound}>
            {hovered && (
              <Typography
                className="sequencer-row-label"
                variant="overline"
                style={{ textAlign: hovered === "left" ? "right" : "left" }}
              >
                {isNaN(drumsound) ? drumsound : labels[parseInt(drumsound)]}
              </Typography>
            )}
            {sequencerArray[currentMeasure].map((beat, column) => (
              <SequencerTile
                key={[column, drumsound]}
                inputNote={inputNote}
                active={
                  typeof beat === "object" &&
                  beat.includes(
                    isNaN(drumsound) ? drumsound : parseInt(drumsound)
                  )
                }
                cursor={currentBeat == column}
                color={colors[props.module.color]}
                x={column}
                y={isNaN(drumsound) ? drumsound : parseInt(drumsound)}
              />
            ))}
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
