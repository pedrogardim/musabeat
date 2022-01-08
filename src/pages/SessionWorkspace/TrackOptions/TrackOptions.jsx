import React, { useState, useContext, useEffect } from "react";

import { useTranslation } from "react-i18next";

import {
  IconButton,
  Icon,
  Dialog,
  TextField,
  DialogContent,
} from "@mui/material";

import wsCtx from "../../../context/SessionWorkspaceContext";

import ColorPicker from "../../../components/ColorPicker";
import Confirm from "../../../components/dialogs/Confirm";

function TrackOptions(props) {
  const { t } = useTranslation();

  const { open, onClose, loadNewTrackInstrument } = props;

  const {
    tracks,
    setTracks,
    params,
    paramSetter,
    instruments,
    setInstruments,
    setInstrumentsLoaded,
    isLoaded,
  } = useContext(wsCtx);

  const index = open && parseInt(params.openDialog.replace("trackOpt", ""));

  const track = typeof index === "number" ? tracks[index] : {};

  const [trackName, setTrackName] = useState(track.name);
  const [deletingTrack, setDeletingTrack] = useState(false);

  const handleColorSelect = (color) => {
    setTracks((prev) => {
      let newTracks = [...prev];
      newTracks[index].color = color;
      return newTracks;
    });
  };

  const onOptionsClose = () => {
    setTracks((prev) => {
      let newTracks = [...prev];
      newTracks[index].name = trackName;
      return newTracks;
    });
    onClose();
  };

  const deleteTrack = () => {
    instruments[index].dispose();
    setInstruments((prev) => prev.filter((e, i) => i !== index));
    setInstrumentsLoaded((prev) => ({
      ...Array(Object.keys(prev).length - 1).fill(true),
    }));
    setTracks((prev) => prev.filter((e, i) => i !== index));
    paramSetter("selectedTrack", null, "selNotes", []);
    setDeletingTrack(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onOptionsClose} fullWidth maxWidth="sm">
      {open && (
        <DialogContent
          sx={{
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "center",
            pr: 6,
          }}
        >
          <TextField
            autoComplete="off"
            variant="standard"
            size="normal"
            value={trackName}
            label={t("info.name")}
            placeholder={t(`trackPicker.types.${track.type}.name`)}
            onChange={(e) => setTrackName(e.target.value)}
            sx={{ mr: "auto" }}
          />
          <ColorPicker color={track.color} onSelect={handleColorSelect} />

          <IconButton
            onClick={() => setDeletingTrack(true)}
            sx={{ height: 48, width: 48 }}
            color="secondary"
            disabled={!isLoaded}
          >
            <Icon>delete</Icon>
          </IconButton>

          <IconButton onClick={onClose} className="mp-closebtn" color="primary">
            <Icon>close</Icon>
          </IconButton>
        </DialogContent>
      )}

      <Confirm
        delete
        open={deletingTrack}
        onClose={() => setDeletingTrack(false)}
        action={deleteTrack}
      />
    </Dialog>
  );
}

export default TrackOptions;
