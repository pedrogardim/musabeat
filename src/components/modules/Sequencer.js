import React, { useState, useEffect } from "react";

import SequencerTile from "./SequencerTile";
import * as Tone from "tone";

import * as Drumdata from "../../assets/drumkits";

import { scheduleDrumSequence } from "../../utils/TransportSchedule";

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

  let loadedpatch = props.module.patch;

  const inputNote = (x, y) => {
    changeSequence((previousSequence) =>
      previousSequence.map((measure, measureIndex) =>
        measure.map((beat, beatIndex) =>
          measureIndex == currentMeasure && beatIndex == x
            ? beat.includes(y)
              ? beat.filter((note) => note != y)
              : (() => {
                  let newbeat = [...beat];
                  newbeat.push(y);
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

  const loadDrumPatch = () => {
    //if(Drumdata.kits[loadedpatch].hasOwnProperty('sounds'))
    Drumdata.labels.forEach((element, index) => {
      drumPlayers.add(
        index,
        "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/" +
          Drumdata.kits[loadedpatch].baseUrl +
          "/" +
          index +
          ".wav",
        () => {
          index === Drumdata.labels.length - 1 && setIsBufferLoaded(true);
        }
      );
    });
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

  const updateInstrument = () => {
    props.updateModules((previousModules) => {
      let newmodules = [...previousModules];
      newmodules[props.module.id].instrument = drumPlayers;
      return newmodules;
    });
  };

  useEffect(() => {
    loadDrumPatch();
  }, []);

  useEffect(() => {
    scheduleNotes();
    updateModuleSequence();
    //updateInstrument();
  }, [drumPlayers, sequencerArray]);

  useEffect(() => {
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
      {isBufferLoaded ? (
        <div className="sequencer">
          {Drumdata.labels.map((drumsound, row) => (
            <div className="sequencer-row" key={row}>
              {hovered && (
                <Typography className="sequencer-row-label" variant="overline">
                  {drumsound}
                </Typography>
              )}
              {sequencerArray[currentMeasure].map((beat, column) => (
                <SequencerTile
                  key={[column, row]}
                  inputNote={inputNote}
                  active={beat.includes(row)}
                  cursor={currentBeat == column}
                  color={props.module.color}
                  x={column}
                  y={row}
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
