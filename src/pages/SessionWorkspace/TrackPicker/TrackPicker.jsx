import React, { useState, useContext } from "react";

import "./style.css";

import { useTranslation } from "react-i18next";

import firebase from "firebase";

import {
  IconButton,
  Typography,
  Icon,
  Dialog,
  BottomNavigation,
  BottomNavigationAction,
  Button,
} from "@mui/material";

import wsCtx from "../../../context/SessionWorkspaceContext";

const tracktypes = [
  {
    name: "Sampler",
    icon: "grid_on",
  },
  {
    name: "Piano Roll",
    icon: "piano",
  },
  {
    name: "Audio Track",
    icon: "graphic_eq",
  },
];

function TrackPicker(props) {
  const { t } = useTranslation();

  const { open, onClose, loadNewTrackInstrument } = props;

  const { tracks, setTracks } = useContext(wsCtx);

  const [selectedType, setSelectedType] = useState(0);

  const addTrack = () => {
    let newTrack = {
      id:
        !tracks || !tracks.length
          ? 0
          : Math.max(...tracks.map((e) => e.id)) + 1,
      name: "",
      type: selectedType,
      score: [],
      volume: 0,
      muted: false,
      instrument:
        selectedType === 0
          ? "8fsbChTqV7aaWNyI1hTC"
          : selectedType === 2
          ? { urls: {} }
          : "jSjo9Rzv3eg1vTkkEj1s",
      color: Math.floor(Math.random() * 14.99),
      fx: [],
    };

    /*  if (typeof newTrack.instrument === "string") {
      firebase
        .firestore()
        .collection(newTrack.type === 0 ? "drumpatches" : "patches")
        .doc(newTrack.instrument)
        .update({
          ld: firebase.firestore.FieldValue.increment(1),
          in: firebase.firestore.FieldValue.increment(1),
        });
      if (newTrack.type === 0) {
        firebase
          .firestore()
          .collection(newTrack.type === 0 ? "drumpatches" : "patches")
          .doc(newTrack.instrument)
          .get()
          .then((r) =>
            Object.values(r.data().urls).map((e) =>
              firebase
                .firestore()
                .collection("files")
                .doc(e)
                .update({
                  ld: firebase.firestore.FieldValue.increment(1),
                  in: firebase.firestore.FieldValue.increment(1),
                })
            )
          );
      }
    } */

    let newTracks;

    setTracks((prev) => {
      newTracks = prev === null ? [newTrack] : [...prev, newTrack];
      return newTracks;
    });

    onClose();
    loadNewTrackInstrument(newTrack, newTracks.length - 1);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ className: "track-picker" }}
    >
      <Typography variant="overline"> {t(`trackPicker.create`)}</Typography>
      <BottomNavigation
        value={selectedType}
        onChange={(event, newValue) => {
          setSelectedType(newValue);
        }}
        showLabels
        style={{ background: "transparent" }}
      >
        {tracktypes.map((e, i) => (
          <BottomNavigationAction
            label={t(`trackPicker.types.${i}.name`)}
            key={e.name}
            icon={<Icon>{e.icon}</Icon>}
          />
        ))}
      </BottomNavigation>

      <Typography variant="overline">
        {t(`trackPicker.types.${selectedType}.description`)}
      </Typography>

      <Button onClick={addTrack}>{t("trackPicker.submit")}</Button>

      <IconButton onClick={onClose} className="mp-closebtn" color="primary">
        <Icon>close</Icon>
      </IconButton>
    </Dialog>
  );
}

export default TrackPicker;
