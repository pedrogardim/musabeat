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
  Tooltip,
  ListItemButton,
  Fab,
} from "@mui/material";

function AudioFileItem(props) {
  const [wavePath, setWavePath] = useState("");

  const handleClick = (e) => {
    if (
      e.target.className.indexOf("label") !== -1 ||
      e.target.className.indexOf("filename") !== -1
    )
      return;
    props.instrument.triggerAttackRelease(props.fileLabel, "4n");
  };

  /* useEffect(
    () => drawWave(props.buffer.toArray(), setWavePath),
    [props.buffer]
  ); */

  return (
    <ListItem button onClick={handleClick} className={"audio-file-item"}>
      <Fab
        className="audio-file-item-label"
        color="primary"
        onClick={() => props.setRenamingLabel(props.fileLabel)}
        style={{ height: 48, width: 48 }}
      >
        {props.fileLabel}
      </Fab>
      <Typography
        className="audio-file-item-filename"
        onClick={props.openFilePage}
        variant="overline"
        style={{ marginLeft: 16 }}
      >
        {props.fileName}
      </Typography>

      <ListItemSecondaryAction>
        <Tooltip title="Remove file from instrument">
          <IconButton
            onClick={() =>
              props.handleSamplerFileDelete(
                props.fileId,
                Tone.Frequency(props.fileLabel).toMidi()
              )
            }
            edge="end"
          >
            <Icon>remove</Icon>
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

export default AudioFileItem;
