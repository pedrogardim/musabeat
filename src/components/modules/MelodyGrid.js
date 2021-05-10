import React, { useState, useEffect } from "react";

import SequencerTile from "./SequencerTile";
import * as Tone from "tone";

import * as Drumdata from "../../assets/drumkits";

import { scheduleMelodyGrid } from "../../utils/TransportSchedule";

import {
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
  Typography,
} from "@material-ui/core";

import "./MelodyGrid.css";
import "../ui/Module.css";

function MelodyGrid(props) {
  const loadedSequence = props.module.score;

  const [isBufferLoaded, setIsBufferLoaded] = useState(true);
  const [instrument, setInstrument] = useState(props.module.instrument);
  const [melodyArray, setMelodyArray] = useState(loadedSequence);
  const [gridScale, setGridScale] = useState([
    "C3",
    "D3",
    "E3",
    "G3",
    "A3",
    "C4",
  ]);

  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [hovered, setHovered] = useState(false);

  let loadedpatch = props.module.patch;

  const inputNote = (x, y) => {
    let note = gridScale[y];
    setMelodyArray((previousSequence) =>
      previousSequence.map((measure, measureIndex) =>
        measure.map((beat, beatIndex) =>
          measureIndex == currentMeasure && beatIndex == x
            ? beat.includes(note)
              ? beat.filter((z) => z != note)
              : (() => {
                  let newbeat = [...beat];
                  newbeat.push(note);
                  return newbeat;
                })()
            : beat
        )
      )
    );
    playNote(note);
  };

  const scheduleNotes = () => {
    //setScheduledEvents([]);

    let scheduledNotes = [];

    scheduledNotes = scheduleMelodyGrid(
      melodyArray,
      instrument,
      Tone.Transport,
      setCurrentBeat,
      setCurrentMeasure,
      props.module.id
    );

    setScheduledEvents(scheduledNotes);
  };

  const playNote = (note, time) =>
    instrument.triggerAttackRelease(
      note,
      Tone.Time("1m").toSeconds() / melodyArray[currentMeasure].length,
      time
    );

  const handleBottomNavClick = (value) => {
    setCurrentMeasure(value);
    Tone.Transport.seconds = value * Tone.Time("1m").toSeconds();
    setCurrentBeat(0);
  };

  const updateSequence = () => {
    props.updateModules((previousModules) => {
      let newmodules = previousModules;
      newmodules[props.module.id].score = melodyArray;
      return newmodules;
    });
  };

  useEffect(() => {
    instrument.hasOwnProperty("name") && scheduleNotes();
    updateSequence();
  }, [instrument, melodyArray]);

  return (
    <div
      className="module-innerwrapper"
      style={props.style}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
      {isBufferLoaded ? (
        <div className="melody-grid">
          {gridScale.map((drumsound, row) => (
            <div className="melody-grid-row" key={row}>
              {hovered && (
                <Typography
                  className="melody-grid-row-label"
                  variant="overline"
                >
                  {drumsound}
                </Typography>
              )}
              {melodyArray[currentMeasure].map((beat, column) => (
                <SequencerTile
                  key={[column, row]}
                  inputNote={inputNote}
                  active={beat.includes(gridScale[row])}
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
        <CircularProgress />
      )}
      <BottomNavigation
        value={currentMeasure}
        showLabels
        onChange={(event, newValue) => {
          handleBottomNavClick(newValue);
        }}
        className="melody-grid-bottomnav"
      >
        {melodyArray.length > 1 &&
          melodyArray.map((measure, index) => (
            <BottomNavigationAction key={index} label={index + 1} />
          ))}
      </BottomNavigation>
    </div>
  );
}

export default MelodyGrid;
