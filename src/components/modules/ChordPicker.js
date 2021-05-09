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
  const [chosenScale, setChosenScale] = useState(0);
  const [chosenRoot, setChosenRoot] = useState(0);
  const [chosenComplexity, setChosenComplexity] = useState(3);
  const [scaleChords, setScaleChords] = useState(
    getChordsFromScale(chosenScale, chosenRoot, chosenComplexity)
  );
  //{props.selectedChord !== null}

  const setChords = props.setChords;
  let instrument = props.instrument;

  const clickHandler = (index) => {
    setChords((previousChords) => {
      let newChords = [...previousChords];
      newChords[props.selectedChord].notes =
        index === null ? [] : scaleChords[index];
      instrument.releaseAll();
      Tone.Transport.state !== "started" &&
        instrument.triggerAttackRelease(
          scaleChords[index],
          newChords[props.selectedChord].duration * Tone.Time("1m").toSeconds()
        );
      return newChords;
    });
  };

  const handleRootChange = (event) => {
    setChosenRoot(event.target.value);
  };

  const handleScaleChange = (event) => {
    setChosenScale(event.target.value);
  };

  useEffect(() => {
    setScaleChords(
      getChordsFromScale(chosenScale, chosenRoot, chosenComplexity)
    );
  }, [chosenScale, chosenRoot, chosenComplexity]);

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
      <div className="break" />
      <FormControl>
        <InputLabel id="root-select-label">Root</InputLabel>
        <Select
          native
          labelId="root-select-label"
          value={chosenRoot}
          onChange={handleRootChange}
        >
          {musicalNotes.map((note, noteIndex) => (
            <option key={noteIndex} value={noteIndex}>
              {note}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel id="scale-select-label">Scales</InputLabel>
        <Select
          native
          labelId="scale-select-label"
          value={chosenScale}
          onChange={handleScaleChange}
        >
          {scales.map((scale, scaleIndex) => (
            <option key={scaleIndex} value={scaleIndex}>
              {scale[1]}
            </option>
          ))}
        </Select>
      </FormControl>
      <div className="break" />
      <Typography variant="body2">Extentions</Typography>
      <Slider
        className="chord-picker-slider"
        defaultValue={3}
        labelId="complexity-slide-label"
        step={1}
        min={2}
        max={7}
      />
      <div className="break" />
      <Typography variant="body2">Width</Typography>
      <Slider
        className="chord-picker-slider"
        defaultValue={3}
        labelId="complexity-slide-label"
        step={1}
        min={2}
        max={7}
      />
    </div>
  );
}

export default ChordPicker;
