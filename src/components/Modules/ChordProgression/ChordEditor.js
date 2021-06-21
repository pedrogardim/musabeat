import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";

import {
  Paper,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Icon,
  IconButton,
  Fab,
  Tooltip,
  InputBase,
  ButtonGroup,
} from "@material-ui/core";

import Keyboard from "./Keyboard";

import {
  getChordsFromScale,
  chordNotestoName,
  chordNametoNotes,
} from "../../../assets/musicutils";

import { colors } from "../../../utils/materialPalette";

import "./ChordEditor.css";

function ChordEditor(props) {
  const inputRef = useRef(null);
  const [scaleChords, setScaleChords] = useState(getChordsFromScale(0, 0, 3));
  const [textInputValue, setTextInputValue] = useState(
    chordNotestoName(props.chords[props.selectedChord].notes)
  );
  const [nullChord, setNullChord] = useState(false);

  const changeChordOnBtnClick = (notes) => {
    props.setChords((prev) => {
      let newChords = [...prev];
      newChords[props.selectedChord].notes = notes;
      return newChords;
    });
    props.playChordPreview();
  };

  const changeChordOnInput = (e) => {
    setTextInputValue(e.target.value);
    let chord = chordNametoNotes(e.target.value);
    console.log(chord);
    setNullChord(8);
    !chord && setNullChord(true);
    if (chord) {
      setNullChord(false);
      props.setChords((prev) => {
        let newChords = [...prev];
        newChords[props.selectedChord].notes = chord;
        return newChords;
      });
    }
    props.playChordPreview();
  };

  const changeChordOctave = (downUp) => {
    props.setChords((prev) => {
      let newChords = [...prev];
      //avoid going out range
      if (
        (!downUp &&
          parseInt(
            newChords[props.selectedChord].notes[0].split(/(\d+)/)[1]
          ) === 1) ||
        (downUp &&
          parseInt(
            newChords[props.selectedChord].notes[
              newChords[props.selectedChord].notes.length - 1
            ].split(/(\d+)/)[1]
          ) === 7)
      ) {
        return prev;
      }
      newChords[props.selectedChord].notes = newChords[
        props.selectedChord
      ].notes.map((e) => {
        let splited = e.split(/(\d+)/);
        let newNum = downUp
          ? parseInt(splited[1]) + 1
          : parseInt(splited[1]) - 1;
        return splited[0] + newNum;
      });
      console.log(newChords[props.selectedChord].notes);
      return newChords;
    });
    props.playChordPreview();
  };

  const changeChordExpansion = (expand) => {
    let thisNotes = props.chords[props.selectedChord].notes;
    let thisMidiNotes = thisNotes.map((e) => Tone.Frequency(e).toMidi());
    let highestNote = thisMidiNotes[thisMidiNotes.length - 1];
    let notesDelta = thisMidiNotes.map((e) => (e + 12 - highestNote) % 12);
    let pitchToAdd =
      thisMidiNotes[
        notesDelta.indexOf(Math.min(...notesDelta.filter((e) => e > 0)))
      ];
    let difference =
      Math.floor(Math.abs(highestNote - pitchToAdd) / 12) * 12 + 12;

    let noteToAdd = Tone.Frequency(pitchToAdd + difference, "midi").toNote();

    //console.log(notesDelta, noteToAdd, difference);

    props.setChords((prev) => {
      let newChords = [...prev];
      //avoid going out range
      newChords[props.selectedChord].notes = expand
        ? [...newChords[props.selectedChord].notes, noteToAdd].sort(
            (a, b) =>
              Tone.Frequency(a).toFrequency() - Tone.Frequency(b).toFrequency()
          )
        : newChords[props.selectedChord].notes.slice(0, -1);
      return newChords;
    });
    props.playChordPreview();
  };

  useEffect(() => {
    setTextInputValue(
      chordNotestoName(props.chords[props.selectedChord].notes)
    );
  }, [props.chords]);

  return (
    <Dialog open="true" onClose={props.onClose} maxWidth="md" fullWidth>
      <DialogTitle>Chord</DialogTitle>
      <DialogContent className="chord-editor-cont">
        <Paper className="chord-editor-text-input-cont">
          <InputBase
            className={`chord-editor-text-input ${
              nullChord ? "nullChord" : "correctChord"
            }`}
            label={<p>Chord Name</p>}
            ref={inputRef}
            defaultValue={textInputValue}
            onChange={changeChordOnInput}
            value={textInputValue}
          />
        </Paper>

        <div className="break" />
        {scaleChords.map((e, i) => (
          <Fab
            color="primary"
            className="chord-editor-fab"
            style={{ background: colors[props.module.color][600] }}
            onClick={() => changeChordOnBtnClick(e, i)}
          >
            {chordNotestoName(e)}
          </Fab>
        ))}
        <Tooltip title="Remove chord notes">
          <IconButton className="chord-editor-fab">
            <Icon>delete</Icon>
          </IconButton>
        </Tooltip>
        <div className="break" />

        <ButtonGroup
          color={colors[props.module.color][500]}
          style={{ margin: "16px 4px" }}
        >
          <Button onClick={() => changeChordOctave(0)}>
            <Icon>arrow_downward</Icon>
          </Button>
          <Button onClick={() => changeChordOctave(1)}>
            <Icon>arrow_upward</Icon>
          </Button>
        </ButtonGroup>

        <ButtonGroup
          color={colors[props.module.color][500]}
          style={{ margin: "16px 4px" }}
        >
          <Button onClick={() => changeChordExpansion(0)}>
            <Icon>close_fullscreen</Icon>
          </Button>
          <Button onClick={() => changeChordExpansion(1)}>
            <Icon>open_in_full</Icon>
          </Button>
        </ButtonGroup>

        <div className="break" />

        <Keyboard
          index={props.index}
          color={props.module.color}
          setChords={props.setChords}
          selectedChord={props.selectedChord}
          notes={props.chords[props.selectedChord].notes}
          playChordPreview={props.playChordPreview}
        />
      </DialogContent>
      <IconButton
        onClick={props.onClose}
        className="mp-closebtn"
        color="primary"
      >
        <Icon>close</Icon>
      </IconButton>
    </Dialog>
  );
}

export default ChordEditor;
