import "./ModulePicker.css";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";

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

const moduletypes = [
  {
    name: "Drum Sequencer",
    description:
      "Rhythm sequencer that controls a drum pack, with a custom subdivision",
    icon: "grid_on",
  },
  {
    name: "Melody Grid",
    description:
      "Makes melody with a grid similar to a sequencer, but with pitches",
    icon: "music_note",
  },
  {
    name: "Chord Progression",
    description:
      "Create chord progressions, or generate random ones based on scales",
    icon: "font_download",
  },
  {
    name: "Player",
    description:
      "Drag audio files to play, and manipulate them on time and pitch",
    icon: "graphic_eq",
  },
  {
    name: "Piano Roll",
    description: "Classic DAW form of making music!",
    icon: "piano",
  },
];

const stepValues = [4, 8, 12, 16, 24, 32];
const lengthValues = [1, 2, 4, 8, 16];

function ModulePicker(props) {
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
      name: t(`modulePicker.types.${selectedType}.name`),
      type: selectedType,
      score:
        selectedType === 0 || selectedType === 1
          ? [{ ...Array(selectedSteps).fill(0) }]
          : selectedType === 2
          ? new Array(selectedSize).fill().map((e, i) => {
              let chord = {
                notes: ["E1", "E3", "E4", "G4", "B4"],
                duration: 1,
                time: i,
                rhythm: [1],
              };
              return chord;
            })
          : selectedType === 3
          ? [{ time: 0, duration: 0 }]
          : [],
      volume: 0,
      muted: false,
      instrument:
        selectedType === 0
          ? "FSnt2y846yp8Q0RfM7V9"
          : selectedType === 3
          ? {
              url: "",
            }
          : "jSjo9Rzv3eg1vTkkEj1s",
      color: Math.floor(Math.random() * 14.99),
    };

    if (selectedType === 1) {
      newModule.root = selectedRoot;
      newModule.scale = selectedScale;
      newModule.range = selectedRange;
    }

    if (selectedType === 4) {
      newModule.size = 1;
    }

    let newModules;

    props.setModules((prevModules) => {
      newModules =
        prevModules === null ? [newModule] : [...prevModules, newModule];
      return newModules;
    });
    props.setModulePicker(false);
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

      <p variant="overline">
        {t(`modulePicker.types.${selectedType}.description`)}
      </p>

      <div className="module-picker-select-cont">
        {
          <FormControl>
            <InputLabel>{t("module.settings.length")}</InputLabel>
            <Select native value={selectedSize} onChange={handleSizeSelect}>
              {lengthValues.map((e) => (
                <option key={`mpl${e}`} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </FormControl>
        }
        {(selectedType === 0 || selectedType === 1) && (
          <FormControl>
            <InputLabel>{t("module.settings.steps")}</InputLabel>
            <Select native value={selectedSteps} onChange={handleStepSelect}>
              {stepValues.map((e) => (
                <option key={`mps${e}`} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </FormControl>
        )}
      </div>

      <Button onClick={addModule}>{t("modulePicker.submit")}</Button>

      <IconButton
        onClick={() => props.setModulePicker(false)}
        className="mp-closebtn"
        color="primary"
      >
        <Icon>close</Icon>
      </IconButton>
    </Dialog>
  );
}

export default ModulePicker;
