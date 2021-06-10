import React, { useState, useEffect } from "react";

import SequencerTile from "../DrumSequencer/SequencerTile";
import * as Tone from "tone";

import * as Drumdata from "../../../assets/drumkits";

import { scheduleMelodyGrid } from "../../../utils/TransportSchedule";

import { scales, musicalNotes } from "../../../assets/musicutils";

import {
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
  Typography,
} from "@material-ui/core";

import "./MelodyGrid.css";
import { colors } from "../../../utils/materialPalette"


function MelodyGrid(props) {
  const loadedSequence = props.module.score;

  const [isBufferLoaded, setIsBufferLoaded] = useState(true);
  const [instrument, setInstrument] = useState(props.instrument);
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
  const [hovered, setHovered] = useState(false);

  const inputNote = (x, y) => {
    let note = gridScale[y];
    setMelodyArray((previousSequence) =>
      previousSequence.map((measure, measureIndex) =>
      measure.map((beat, beatIndex) =>
      measureIndex == currentMeasure && beatIndex == x
        ? beat === 0
          ? [note]
          : beat.includes(note) && beat.length > 1
          ? beat.filter((z) => z != note)
          : beat.includes(note) && beat.length === 1
          ? 0
          : [...beat, note]
        : beat
    )
      )
    );
    playNote(note);
  };

  const scheduleNotes = () => {
    //setScheduledEvents([]);
    scheduleMelodyGrid(
      melodyArray,
      instrument,
      Tone.Transport,
      setCurrentBeat,
      setCurrentMeasure,
      props.module.id,
      props.sessionSize
    );
  };

  const getScaleFromSequenceNotes = () => {
    let notes = [];
    melodyArray.map(msre=>msre.map(beat=>beat.map(note=>!notes.includes(note) && notes.push(note))));
    notes.sort(function (a, b) {
      if (Tone.Frequency(a).toFrequency() > Tone.Frequency(b).toFrequency()) {
        return 1;
      }
      if (Tone.Frequency(a).toFrequency() < Tone.Frequency(b).toFrequency()) {
        return -1;
      }
      return 0;
    })
    setGridScale(notes);
  }

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

  const updateModuleSequence = () => {
    props.updateModules((previousModules) => {
      let newModules = [...previousModules];
      newModules[props.index].score = melodyArray;
      return newModules;
    });
  };

  const updateGridRows = () => {
    let newNotes = [];
    for (let x = 0; x < props.module.range[1] - props.module.range[0] +1; x++) {
      let root = musicalNotes[props.module.root] + "" + (props.module.range[0] + x);
      //console.log(root,scales[props.module.scale][0])
      Tone.Frequency(root).harmonize(scales[props.module.scale][0]).map((e)=>newNotes.push(e.toNote()));
    }
    newNotes.push(Tone.Frequency(musicalNotes[props.module.root]+""+(props.module.range[1]+1)).toNote())
    setGridScale(newNotes);
    //TODO: Handle Hidden Notes
  };

  useEffect(() => {
    setInstrument(props.instrument);
  }, [props.instrument]);

/* 
  useEffect(() => {
    currentMeasure > props.module.score.length && setCurrentMeasure(0)
    setMelodyArray(props.module.score);
  }, [props.module.score]);
 */

  useEffect(() => {
    instrument && scheduleNotes();
    props.module.score !== melodyArray && updateModuleSequence();
  }, [instrument, melodyArray]);

  useEffect(() => {
    props.module.score !== melodyArray && setMelodyArray(props.module.score);
  }, [props.module]);

  useEffect(() => {
    instrument && scheduleNotes();
  }, [props.sessionSize]);

  useEffect(() => {
    updateGridRows();
    //console.log(gridScale);
  }, [props.module.root, props.module.scale, props.module.range]);

  useEffect(() =>{
    //getScaleFromSequenceNotes();
  },[])


  return (
    <div
      className="module-innerwrapper"
      style={props.style}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
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
                  active={
                    typeof beat === "object" &&
                    beat.includes(
                      isNaN(drumsound) ? drumsound : parseInt(drumsound)
                    )
                  }                  cursor={currentBeat == column}
                  color={colors[props.module.color]}
                  x={column}
                  y={row}
                />
              ))}
            </div>
          ))}
        </div>
      
      {melodyArray.length > 1 && (
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
              <BottomNavigationAction
                style={{ minWidth: 0, maxWidth:"100%"}}
                key={index}
                label={index + 1}
              />
            ))}
        </BottomNavigation>
      )}
    </div>
  );
}

export default MelodyGrid;
