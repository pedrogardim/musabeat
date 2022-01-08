import React, { useState, useContext } from "react";

import { useTranslation } from "react-i18next";

import {
  IconButton,
  MenuItem,
  Icon,
  Dialog,
  InputLabel,
  Select,
  FormControl,
  TextField,
} from "@mui/material";

import wsCtx from "../../../context/SessionWorkspaceContext";

import ColorPicker from "../../../components/ColorPicker";

function TrackOptions(props) {
  const { t } = useTranslation();

  const { open, onClose, loadNewTrackInstrument } = props;

  const { tracks, setTracks, params } = useContext(wsCtx);

  const index = open && parseInt(params.openDialog.replace("trackOpt", ""));

  const track = typeof index === "number" ? tracks[index] : {};

  const handleColorSelect = (color) => {
    setTracks((prev) => {
      let newTracks = [...prev];
      newTracks[index].color = color;
      return newTracks;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      {open && (
        <>
          <TextField />
          <ColorPicker color={track.color} onSelect={handleColorSelect} />

          <IconButton onClick={onClose} className="mp-closebtn" color="primary">
            <Icon>close</Icon>
          </IconButton>
        </>
      )}
    </Dialog>
  );
}

export default TrackOptions;
