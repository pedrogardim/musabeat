import React, { useState, useEffect } from "react";

import SequencerTile from "./SequencerTile";
import * as Tone from "tone";

import { labels } from "../../assets/drumkits";

import { scheduleDrumSequence } from "../../utils/TransportSchedule";
import { loadDrumPatch } from "../../assets/musicutils";

import {
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
  Typography,
} from "@material-ui/core";

import "./Sequencer.css";

function Sequencer(props) {
  const loadedSequence = props.module.score;

  const [isBufferLoaded, setIsBufferLoaded] = useState(false);
  const [drumPlayers, setDrumPlayers] = useState(props.module.instrument);
  const [sequencerArray, changeSequence] = useState(loadedSequence);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [hovered, setHovered] = useState(false);

  const inputNote = (x, y) => {
    changeSequence((previousSequence) =>
      previousSequence.map((measure, measureIndex) =>
        measure.map((beat, beatIndex) =>
          measureIndex == currentMeasure && beatIndex == x
            ? beat.includes(y)
              ? beat.filter((note) => note != (isNaN(y) ? y : parseInt(y)))
              : (() => {
                  let newbeat = [...beat];
                  newbeat.push(isNaN(y) ? y : parseInt(y));
                  return newbeat;
                })()
            : beat
        )
      )
    );
    playDrumSound(y);
  };

  const scheduleNotes = () => {
    //setScheduledEvents([]);

    let scheduledNotes = [];

    scheduledNotes = scheduleDrumSequence(
      sequencerArray,
      drumPlayers,
      Tone.Transport,
      setCurrentBeat,
      setCurrentMeasure,
      props.module.id,
      props.sessionSize
    );

    setScheduledEvents(scheduledNotes);
  };

  const playDrumSound = (note, time) =>
    drumPlayers.player(note).start(time !== undefined ? time : 0);

  const handleBottomNavClick = (value) => {
    setCurrentMeasure(value);
    Tone.Transport.seconds = value * Tone.Time("1m").toSeconds();
    setCurrentBeat(0);
  };

  const updateModuleSequence = () => {
    props.updateModules((previousModules) => {
      let newmodules = [...previousModules];
      newmodules[props.module.id].score = sequencerArray;
      return newmodules;
    });
  };

  //================

  let bufferObjects = [];
  drumPlayers._buffers._buffers.forEach((e, i) => bufferObjects.push([e, i]));

  //===================

  useEffect(() => {
    scheduleNotes();
    updateModuleSequence();
  }, [sequencerArray]);

  useEffect(() => {
    console.log(drumPlayers);
    //temp
    let loadingChecker = setInterval(() => {
      setIsBufferLoaded(drumPlayers.loaded);
      drumPlayers.loaded && clearInterval(loadingChecker);
    }, 200);
    scheduleNotes();
  }, [drumPlayers]);

  useEffect(() => {
    changeSequence(props.module.score);
  }, [props.module.score]);

  useEffect(() => {
    setDrumPlayers(props.module.instrument);
  }, [props.module.instrument]);

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
      {isBufferLoaded ? (
        <div className="sequencer">
          {bufferObjects.map((drumsound, row) => (
            <div className="sequencer-row" key={drumsound[1]}>
              {hovered && (
                <Typography className="sequencer-row-label" variant="overline">
                  {isNaN(drumsound[1])
                    ? drumsound[1]
                    : labels[parseInt(drumsound[1])]}
                </Typography>
              )}
              {sequencerArray[currentMeasure].map((beat, column) => (
                <SequencerTile
                  key={[column, drumsound[1]]}
                  inputNote={inputNote}
                  active={beat.includes(
                    isNaN(drumsound[1]) ? drumsound[1] : parseInt(drumsound[1])
                  )}
                  cursor={currentBeat == column}
                  color={props.module.color}
                  x={column}
                  y={
                    isNaN(drumsound[1]) ? drumsound[1] : parseInt(drumsound[1])
                  }
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <CircularProgress
          className="loading-progress"
          style={{ color: props.module.color[300] }}
        />
      )}
      {!bufferObjects.length && (
        <Typography style={{ color: "white" }}>
          Oops..! No sounds loaded
        </Typography>
      )}
      {sequencerArray.length > 1 && (
        <BottomNavigation
          style={{ color: props.module.color[900] }}
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
