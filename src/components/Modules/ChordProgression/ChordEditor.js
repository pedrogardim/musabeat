import React, { useState, useRef, useEffect } from "react";

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
  };

  useEffect(() => {
    setTextInputValue(
      chordNotestoName(props.chords[props.selectedChord].notes)
    );
    props.playChordPreview();
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

        <Keyboard
          index={props.index}
          color={props.module.color}
          setChords={props.setChords}
          selectedChord={props.selectedChord}
          notes={props.chords[props.selectedChord].notes}
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
