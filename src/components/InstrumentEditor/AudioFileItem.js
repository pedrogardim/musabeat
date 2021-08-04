import React, { useEffect, useState } from "react";
import { labels } from "../../assets/drumkits";

import * as Tone from "tone";

import "./AudioFileItem.css";

import {
  ListItem,
  ListItemText,
  IconButton,
  Icon,
  ListItemSecondaryAction,
  Typography,
} from "@material-ui/core";

function AudioFileItem(props) {
  const [wavePath, setWavePath] = useState("");

  const handleClick = () => {
    props.instrument.name === "Sampler"
      ? props.instrument.triggerAttackRelease(props.fileLabel, "8n")
      : props.instrument.player(props.fileLabel).start(0);
  };

  useEffect(
    () => drawWave(props.buffer.toArray(), setWavePath),
    [props.buffer]
  );

  return (
    <ListItem button onClick={handleClick} className={"audio-file-item"}>
      <svg
        className="audio-file-item-waveform"
        width="64px"
        height="32px"
        viewBow={"0 0 32 32"}
      >
        <path d={wavePath} stroke="#05386b" fill="none" />
      </svg>

      <ListItemText variant="overline">
        <Typography variant="body2">
          {isNaN(props.fileLabel)
            ? props.fileLabel
            : labels[parseInt(props.fileLabel)]}
        </Typography>
        <br />

        <Typography variant="overline">{props.fileName}</Typography>
      </ListItemText>

      <ListItemSecondaryAction>
        <IconButton
          onClick={() =>
            props.handleFileDelete(
              props.instrument.name === "Sampler"
                ? Tone.Frequency(props.fileLabel).toMidi()
                : props.fileLabel
            )
          }
          edge="end"
        >
          <Icon>delete</Icon>
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
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

export default AudioFileItem;
