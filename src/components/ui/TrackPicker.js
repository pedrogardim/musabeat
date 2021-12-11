import "./TrackPicker.css";

import React, { useState } from "react";
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
  Select,
  FormControl,
  InputLabel,
} from "@material-ui/core";

import { createChordProgression } from "../../assets/musicutils";

const moduletypes = [
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

  const addModule = (moduletype) => {
    let newModule = {
      id:
        !props.modules || !props.modules.length
          ? 0
          : Math.max(...props.modules.map((e) => e.id)) + 1,
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

    if (typeof newModule.instrument === "string") {
      firebase
        .firestore()
        .collection(newModule.type === 0 ? "drumpatches" : "patches")
        .doc(newModule.instrument)
        .update({
          ld: firebase.firestore.FieldValue.increment(1),
          in: firebase.firestore.FieldValue.increment(1),
        });
      if (newModule.type === 0) {
        firebase
          .firestore()
          .collection(newModule.type === 0 ? "drumpatches" : "patches")
          .doc(newModule.instrument)
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

    let newModules;

    props.setModules((prevModules) => {
      newModules =
        prevModules === null ? [newModule] : [...prevModules, newModule];
      return newModules;
    });

    props.setTrackPicker(false);
    props.loadNewModuleInstrument(newModule, newModules.length - 1);
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
      PaperProps={{ className: "module-picker" }}
    >
      <Typography variant="overline"> {t(`modulePicker.create`)}</Typography>
      <BottomNavigation
        value={selectedType}
        onChange={(event, newValue) => {
          setSelectedType(newValue);
        }}
        showLabels
      >
        {moduletypes.map((e, i) => (
          <BottomNavigationAction
            label={t(`modulePicker.types.${i}.name`)}
            key={e.name}
            icon={<Icon>{e.icon}</Icon>}
          />
        ))}
      </BottomNavigation>

      <Typography variant="overline">
        {t(`modulePicker.types.${selectedType}.description`)}
      </Typography>

      <Button onClick={addModule}>{t("modulePicker.submit")}</Button>

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
