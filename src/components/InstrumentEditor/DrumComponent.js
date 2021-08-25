import React, { useEffect, useState } from "react";
import { labels } from "../../assets/drumkits";

import * as Tone from "tone";

import "./DrumComponent.css";

import {
  ListItem,
  ListItemText,
  IconButton,
  Icon,
  ListItemSecondaryAction,
  Typography,
  Tooltip,
  Paper,
  Button,
  ButtonBase,
} from "@material-ui/core";

function DrumElement(props) {
  const [wavePath, setWavePath] = useState("");

  const handleClick = (e) => {
    if (
      e.target.className.includes &&
      e.target.className.includes("drum-component")
    ) {
      props.instrument.name === "Sampler"
        ? props.instrument.triggerAttackRelease(props.fileLabel, "8n")
        : props.instrument.player(props.index).start();
    }
  };

  useEffect(
    () => props.buffer && drawWave(props.buffer.toArray(), setWavePath),
    [props.buffer, props.exists, props.instrument]
  );

  return props.exists ? (
    <ButtonBase
      fullWidth={true}
      component={Paper}
      onClick={handleClick}
      className={"drum-component"}
    >
      <Tooltip placement="top" title={`File: ${props.fileName}`}>
        <svg
          onClick={props.openFilePage}
          className="dc-audio-file-item-waveform"
          width="64px"
          height="32px"
          viewBow={"0 0 32 32"}
        >
          <path d={wavePath} stroke="#05386b" fill="none" />
        </svg>
      </Tooltip>

      <Typography
        variant="body2"
        className="audio-file-item-label"
        onClick={() =>
          props.instrument.name === "Players" &&
          props.setRenamingLabel(props.index)
        }
      >
        {props.fileLabel}
      </Typography>

      <Tooltip title="Remove file from instrument">
        <IconButton
          className="remove-drum-component-button"
          onClick={() =>
            props.handleFileDelete(
              props.instrument.name === "Sampler"
                ? Tone.Frequency(props.fileLabel).toMidi()
                : props.fileLabel,
              props.index
            )
          }
        >
          <Icon style={{ fontSize: 18 }}>close</Icon>
        </IconButton>
      </Tooltip>
      <Typography variant="overline" className="dc-slot-indicator">
        {props.index + 1}
      </Typography>
    </ButtonBase>
  ) : (
    <ButtonBase
      disabled
      fullWidth={true}
      component={Paper}
      className={"drum-component"}
    >
      <Typography variant="overline">Empty slot</Typography>
      <Typography variant="overline" className="dc-slot-indicator">
        {props.index + 1}
      </Typography>
    </ButtonBase>
  );
}

const drawWave = (wavearray, setWavePath) => {
  if (!wavearray.length) {
    return;
  }

  let pathstring = "M 0 16 ";

  let wave = wavearray;
  let scale = wave.length / 64;

  for (let x = 0; x < 64; x++) {
    pathstring +=
      "L " + x + " " + (wave[Math.floor(x * scale)] * 16 + 16) + " ";
  }

  setWavePath(pathstring);
};

export default DrumElement;
