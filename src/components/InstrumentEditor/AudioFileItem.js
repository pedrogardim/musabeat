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
} from "@material-ui/core";

function AudioFileItem(props) {
  const [wavePath, setWavePath] = useState("");

  const handleClick = (e) => {
    if (
      e.target.className.indexOf("label") !== -1 ||
      e.target.className.indexOf("filename") !== -1
    )
      return;
    props.instrument.name === "Sampler"
      ? props.instrument.triggerAttackRelease(props.fileLabel, "8n")
      : props.instrument.player(props.fileLabel).start(0);
  };

  /* useEffect(
    () => drawWave(props.buffer.toArray(), setWavePath),
    [props.buffer]
  ); */

  return (
    <ListItem button onClick={handleClick} className={"audio-file-item"}>
      <ListItemText
        primary={props.fileLabel}
        primaryTypographyProps={{
          variant: "body2",
          className: "audio-file-item-label",
          onClick: () => props.setRenamingLabel(props.fileLabel),
        }}
        secondary={props.fileName}
        secondaryTypographyProps={{
          className: "audio-file-item-filename",
          variant: "overline",
          onClick: props.openFilePage,
        }}
      />

      <ListItemSecondaryAction>
        <Tooltip title="Remove file from instrument">
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
            <Icon>remove</Icon>
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

export default AudioFileItem;
