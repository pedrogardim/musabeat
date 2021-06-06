import React, { useState, useEffect } from "react";

import SequencerTile from "./SequencerTile";
import * as Tone from "tone";

import { labels } from "../../../assets/drumkits";

import { scheduleDrumSequence } from "../../../utils/TransportSchedule";
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
  const [sequencerArray, changeSequence] = useState(props.module.score);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [hovered, setHovered] = useState(false);

  const inputNote = (x, y) => {
    changeSequence((previousSequence) =>
      previousSequence.map((measure, measureIndex) =>
        measure.map((beat, beatIndex) =>
          measureIndex == currentMeasure && beatIndex == x
            ? beat === 0
              ? [y]
              : beat.includes(y) && beat.length > 1
              ? beat.filter((z) => z != y)
              : beat.includes(y) && beat.length === 1
              ? 0
              : () => {
                  let newbeat = [...beat];
                  newbeat.push(isNaN(y) ? y : parseInt(y));
                  return newbeat;
                }
            : beat
        )
      )
    );
    playDrumSound(y);
  };

  const scheduleNotes = () => {
    let scheduledNotes = [];

    scheduledNotes = scheduleDrumSequence(
      sequencerArray,
      props.instrument,
      Tone.Transport,
      setCurrentBeat,
      setCurrentMeasure,
      props.module.id,
      props.sessionSize
    );
  };

  const playDrumSound = (note, time) =>
    props.instrument.player(note).start(time !== undefined ? time : 0);

  const handleBottomNavClick = (value) => {
    setCurrentMeasure(value);
    Tone.Transport.seconds = value * Tone.Time("1m").toSeconds();
    setCurrentBeat(0);
  };

  const updateModuleSequence = () => {
    props.updateModules((previousModules) => {
      let newModules = [...previousModules];
      newModules[props.module.id].score = sequencerArray;
      return newModules;
    });
  };

  //===================

  useEffect(() => {
    scheduleNotes();
    props.module.score !== sequencerArray && updateModuleSequence();
    console.log(
      sequencerArray[currentMeasure],
      sequencerArray[currentMeasure][4],
      sequencerArray[currentMeasure][4] === undefined
    );
  }, [sequencerArray]);

  useEffect(() => {
    scheduleNotes();
  }, [props.instrument]);

  useEffect(() => {
    currentMeasure > props.module.score.length && setCurrentMeasure(0);
    changeSequence(props.module.score);
  }, [props.module.score]);

  useEffect(() => {
    scheduleNotes();
  }, [props.sessionSize]);

  return (
    <div
      className="module-innerwrapper"
      style={props.style}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
      <div className="sequencer">
        {Object.keys(props.module.instrument.urls).map((drumsound, row) => (
          <div className="sequencer-row" key={drumsound}>
            {hovered && (
              <Typography className="sequencer-row-label" variant="overline">
                {isNaN(drumsound) ? drumsound : labels[parseInt(drumsound)]}
              </Typography>
            )}
            {sequencerArray[currentMeasure].map((beat, column) => (
              <SequencerTile
                key={[column, drumsound]}
                inputNote={inputNote}
                active={
                  sequencerArray[currentMeasure][column] !== 0 &&
                  sequencerArray[currentMeasure][column].includes(
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

      {props.module.instrument === {} && (
        <Typography style={{ color: "white" }}>
          Oops..! No sounds loaded
        </Typography>
      )}
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
