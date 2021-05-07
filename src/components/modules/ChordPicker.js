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
  MenuItem,
} from "@material-ui/core";

import "./ChordPicker.css";

function ChordPicker(props) {
  const [chosenScale, setChosenScale] = useState(0);
  const [chosenRoot, setChosenRoot] = useState(0);
  const [chosenComplexity, setChosenComplexity] = useState(3);
  const [scaleChords, setScaleChords] = useState(
    getChordsFromScale(chosenScale, chosenRoot, chosenComplexity)
  );
  //{props.selectedChord !== null}

  const setChords = props.setChords;

  const clickHandler = (index) => {
    setChords((previousChords) => {
      let newChords = [...previousChords];
      newChords[props.selectedChord].notes = scaleChords[index];
      return newChords;
    });
  };

  const handleRootChange = (event) => {
    setChosenRoot(event.target.value);
  };

  const handleScaleChange = (event) => {
    setChosenScale(event.target.value);

  };

  useEffect(()=>{
    setScaleChords(getChordsFromScale(chosenScale, chosenRoot, chosenComplexity))
  },[chosenScale,chosenRoot,chosenComplexity])

  return (
    <div
      className={
        "chord-picker " +
        (props.selectedChord !== null && "chord-picker-active")
      }
    >
      {scaleChords.map((chord, i) => (
        <Fab
          color="primary"
          onClick={() => clickHandler(i)}
          className="chord-picker-button"
        >
          {chordNotestoName(chord)}
        </Fab>
      ))}
      <div className="break" />
      <FormControl>
        <InputLabel id="root-select-label">Root</InputLabel>
        <Select
          labelId="root-select-label"
          value={chosenRoot}
          onChange={handleRootChange}
        >
          {musicalNotes.map((note, noteIndex) => (
            <MenuItem key={noteIndex} value={noteIndex}>{note}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel id="scale-select-label">Scales</InputLabel>
        <Select
          labelId="scale-select-label"
          value={chosenScale}
          onChange={handleScaleChange}
        >
          {scales.map((scale, scaleIndex) => (
            <MenuItem key={scaleIndex} value={scaleIndex}>{scale[1]}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}

export default ChordPicker;
