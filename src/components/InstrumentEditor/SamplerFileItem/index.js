import React, { useEffect, useState } from "react";
import { fileExtentions } from "../../assets/musicutils";

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

import { useTranslation } from "react-i18next";

function SamaplerFileItem(props) {
  const { t } = useTranslation();

  const [wavePath, setWavePath] = useState("");

  const handleClick = (e) => {
    if (props.empty) {
      props.handleFileClick();
      return;
    }
    if (
      e.target.className.indexOf("label") !== -1 ||
      e.target.className.indexOf("filename") !== -1
    )
      return;
    //new Tone.Player(props.buffer).toDestination().start(Tone.now()).dispose();
    props.instrument.triggerAttackRelease(
      Tone.Frequency(props.fileLabel, "midi"),
      props.fileInfo.dur
    );
  };

  //useEffect(() => console.log(props.index), []);

  return (
    <ListItem button onClick={handleClick} className={"audio-file-item"}>
      {!props.empty ? (
        <>
          <Fab
            className="audio-file-item-label"
            color="primary"
            onClick={() => props.setRenamingLabel(props.fileLabel)}
            style={{ height: 48, width: 48 }}
          >
            {Tone.Frequency(props.fileLabel, "midi").toNote()}
          </Fab>
          <Typography
            className="audio-file-item-filename"
            onClick={props.handleFileClick}
            variant="body1"
            color="textPrimary"
            style={{ marginLeft: 16 }}
          >
            {props.fileInfo &&
              props.fileInfo.name + "." + fileExtentions[props.fileInfo.type]}
          </Typography>

          <ListItemSecondaryAction>
            <Tooltip title="Remove file from instrument">
              <IconButton
                onClick={() =>
                  props.handleSamplerFileDelete(props.fileId, props.fileLabel)
                }
                edge="end"
              >
                <Icon>remove</Icon>
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </>
      ) : (
        <Typography
          onClick={props.handleFileClick}
          variant="body1"
          color="textPrimary"
          style={{ width: "100%", textAlign: "center" }}
        >
          {t("instrumentEditor.addFile")}
        </Typography>
      )}
    </ListItem>
  );
}

export default SamaplerFileItem;
