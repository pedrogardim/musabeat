import React, { useState } from "react";

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
  /* {
    name: "Chord Progression",
    description:
      "Create chord progressions, or generate random ones based on scales",
    icon: "font_download",
  }, */
];

const stepValues = [4, 8, 12, 16, 24, 32];
const lengthValues = [1, 2, 4, 8, 16];

function TrackPicker(props) {
  const { t } = useTranslation();

  const [selectedType, setSelectedType] = useState(0);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedSteps, setSelectedSteps] = useState(8);
  //const [selectedRoot, setSelectedRoot] = useState(0);
  //const [selectedScale, setSelectedScale] = useState(1);
  //const [selectedRange, setSelectedRange] = useState([3, 6]);

  const selectedRoot = 0;
  const selectedScale = 1;
  const selectedRange = [3, 6];

  const addTrack = (tracktype) => {
    let newTrack = {
      id:
        !props.tracks || !props.tracks.length
          ? 0
          : Math.max(...props.tracks.map((e) => e.id)) + 1,
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

    if (typeof newTrack.instrument === "string") {
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
    }

    let newTracks;

    props.setTracks((prevTracks) => {
      newTracks = prevTracks === null ? [newTrack] : [...prevTracks, newTrack];
      return newTracks;
    });

    props.setTrackPicker(false);
    props.loadNewTrackInstrument(newTrack, newTracks.length - 1);
  };

  const handleSizeSelect = (event) => {
    setSelectedSize(event.target.value);
  };

  const handleStepSelect = (event) => {
    setSelectedSteps(event.target.value);
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      PaperProps={{ className: "track-picker" }}
    >
      <Typography variant="overline"> {t(`trackPicker.create`)}</Typography>
      <BottomNavigation
        value={selectedType}
        onChange={(event, newValue) => {
          setSelectedType(newValue);
        }}
        showLabels
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

      <IconButton
        onClick={() => props.setTrackPicker(false)}
        className="mp-closebtn"
        color="primary"
      >
        <Icon>close</Icon>
      </IconButton>
    </Dialog>
  );
}

export default TrackPicker;
