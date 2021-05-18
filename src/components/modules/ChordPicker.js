import React, { useState, useEffect } from "react";

import Chord from "./Chord";
import * as Tone from "tone";

import {
  getChordsFromScale,
  chordNotestoName,
  scales,
  musicalNotes,
} from "../../assets/musicutils";

import {
  Fab,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Icon,
  Typography,
} from "@material-ui/core";

import "./ChordPicker.css";

function ChordPicker(props) {

  //{props.selectedChord !== null}

  const setChords = props.setChords;
  let instrument = props.instrument;
  let scaleChords = props.scaleChords;

  const clickHandler = (index) => {
    setChords((previousChords) => {
      let newChords = [...previousChords];
      newChords[props.selectedChord].notes =
        index === null ? [] : scaleChords[index];
      /* instrument.releaseAll();
      Tone.Transport.state !== "started" &&
        instrument.triggerAttackRelease(
          scaleChords[index],
          newChords[props.selectedChord].duration * Tone.Time("1m").toSeconds()
        ); */
      return newChords;
    });
  };


  return (
    <div className="chord-picker">
      {scaleChords.map((chord, i) => (
        <Fab
          color="primary"
          onClick={() => clickHandler(i)}
          className="chord-picker-button"
          key={i}
        >
          {chordNotestoName(chord)}
        </Fab>
      ))}
      <Fab
        color="secondary"
        onClick={() => clickHandler(null)}
        className="chord-picker-button"
      >
        <Icon>highlight_off</Icon>
      </Fab>     
    </div>
  );
}

export default ChordPicker;
