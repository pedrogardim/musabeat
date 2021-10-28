import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";

import {
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Icon,
  IconButton,
  Select,
  Tooltip,
  InputBase,
  ButtonGroup,
} from "@material-ui/core";

import {
  getChordsFromScale,
  chordNotestoName,
  chordNametoNotes,
} from "../../../assets/musicutils";

import { colors } from "../../../utils/materialPalette";

import "./ChordEditor.css";

function ChordArpeggiator(props) {
  const rateOptions = [4, 6, 8, 12, 16, 24, 32];
  const rangeOptions = [1, 2, 3, 4];
  const directionOptions = ["up", "down"];

  const rhythmSample = props.chords[0].rhythm;

  const [parameters, setParameters] = useState({
    rate: rhythmSample.length / props.chords[0].duration,
    range: 1,
    direction: rhythmSample[0] < rhythmSample[1] ? 0 : 1,
  });

  const handleParamChange = (param, value) => {
    setParameters((prev) => {
      return { ...prev, [param]: value };
    });
  };

  useEffect(() => {
    props.setChords((prev) => {
      let newChords = [...prev];
      newChords = newChords.map((e) => {
        return {
          ...e,
          rhythm:
            parameters.direction === "up"
              ? [
                  ...Array(e.duration * parameters.rate)
                    .keys()
                    .map((x) => x % e.notes.length),
                ]
              : [
                  ...Array(e.duration * parameters.rate)
                    .keys()
                    .map((x) => x % e.notes.length),
                ].reverse(),
        };
      });

      return newChords;
    });
  }, [parameters]);

  return (
    <Dialog open="true" onClose={props.onClose} maxWidth="md" fullWidth>
      <DialogTitle>Arpeggiator</DialogTitle>
      <DialogContent className="chord-editor-cont">
        <Select
          native
          label={<span>Rate</span>}
          value={parameters.rate}
          onChange={(e) => handleParamChange("rate", e.target.value)}
        >
          {rateOptions.map((e) => (
            <option value={e}>{"1/" + e}</option>
          ))}
        </Select>
        {/* <Select
          native
          label={<span>Range</span>}
          value={parameters.range}
          onChange={(e) => handleParamChange("range", e.target.value)}
        >
          {rangeOptions.map((e) => (
            <option value={e}>{e + " octaves"}</option>
          ))}
        </Select> */}
        <Select
          native
          label={<span>Direction</span>}
          value={parameters.direction}
          onChange={(e) => handleParamChange("direction", e.target.value)}
        >
          {directionOptions.map((e, i) => (
            <option value={e}>{e}</option>
          ))}
        </Select>

        <div className="break" />
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

/* const getDirection = (rhythm) => {
  return rhythm[0] < rhythm[1] ? 1 : 2



} */

export default ChordArpeggiator;
