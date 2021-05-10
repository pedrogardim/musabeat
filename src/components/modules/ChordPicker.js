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
  const [chosenExtentions, setChosenExtentions] = useState(3);
  const [scaleChords, setScaleChords] = useState(
    getChordsFromScale(chosenScale, chosenRoot, chosenExtentions)
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

  const handleExtentionsSelect = (event) => {
    setChosenExtentions(event.target.value);
  };



  useEffect(() => {
    setScaleChords(
      getChordsFromScale(chosenScale, chosenRoot, chosenExtentions)
    );
  }, [chosenScale, chosenRoot, chosenExtentions]);

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
      <FormControl>
        <InputLabel id="scale-select-label">Extentions</InputLabel>
        <Select
          native
          labelId="scale-select-label"
          value={chosenExtentions}
          onChange={handleExtentionsSelect}
        >
          <option value={3}>None</option>
          <option value={4}>7ths</option>
          <option value={5}>7ths + 9ths</option>


        </Select>
      </FormControl>
    </div>
  );
}

export default ChordPicker;
