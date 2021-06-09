import React, { useState, useRef } from "react";

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

  const changeChordOnBtnClick = (notes) => {
    props.setChords((prev) => {
      let newChords = [...prev];
      newChords[props.selectedChord].notes = notes;
      return newChords;
    });
  };

  const changeChordOnInput = (e) => {
    let chord = chordNametoNotes(e.target.value);
    console.log(chord);
    chord !== null &&
      props.setChords((prev) => {
        let newChords = [...prev];
        newChords[props.selectedChord].notes = chord;
        return newChords;
      });
  };

  return (
    <Dialog open="true" onClose={props.onClose}>
      <DialogTitle>Chord</DialogTitle>
      <DialogContent className="chord-editor-cont">
        <Paper className="chord-editor-text-input-cont">
          <InputBase
            className="chord-editor-text-input"
            label={<p>Chord Name</p>}
            ref={inputRef}
            defaultValue={textInputValue}
            onChange={changeChordOnInput}
          />
        </Paper>

        <div className="break" />
        {scaleChords.map((e, i) => (
          <Fab
            color="primary"
            className="chord-editor-fab"
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
