import "./ModulePicker.css";

import React, { useState, useEffect, Fragment, useRef } from "react";

import {
  IconButton,
  Card,
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
    icon: "piano",
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
    icon: "graphic_eq",
  },
];

const stepValues = [4, 8, 12, 16, 24, 32];
const lengthValues = [1, 2, 4, 8, 16];

function ModulePicker(props) {
  const [selectedType, setSelectedType] = useState(0);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedSteps, setSelectedSteps] = useState(8);
  const [selectedInstrument, setSelectedInstrument] = useState(0);
  const [selectedRoot, setSelectedRoot] = useState(0);
  const [selectedScale, setSelectedScale] = useState(1);
  const [selectedRange, setSelectedRange] = useState([3, 6]);

  const addModule = (moduletype) => {
    let newModule = {
      id:
        !props.modules || !props.modules.length
          ? 0
          : Math.max(...props.modules.map((e) => e.id)) + 1,
      name: moduletypes[selectedType].name,
      type: selectedType,
      score:
        selectedType === 0 || selectedType === 1
          ? [new Array(selectedSteps).fill(0)]
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
          : [{ time: 0, duration: 0 }],
      volume: 0,
      muted: false,
      instrument:
        selectedType === 0
          ? "-McEPecUtSOmHmpiuVOU"
          : selectedType === 3
          ? {
              url: "",
            }
          : "-MbBygzylMiMRWrAv1kh",
      color: Math.floor(Math.random() * 14.99),
    };

    if (selectedType === 1) {
      newModule.root = selectedRoot;
      newModule.scale = selectedScale;
      newModule.range = selectedRange;
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

  const handleInstrumentSelect = (event) => {
    setSelectedInstrument(event.target.value);
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      PaperProps={{ className: "module-picker" }}
    >
      <Typography variant="overline"> Create a new module</Typography>
      <BottomNavigation
        value={selectedType}
        onChange={(event, newValue) => {
          setSelectedType(newValue);
        }}
        showLabels
      >
        {moduletypes.map((e) => (
          <BottomNavigationAction
            label={e.name}
            key={e.name}
            icon={<Icon>{e.icon}</Icon>}
          />
        ))}
      </BottomNavigation>

      <p variant="overline"> {moduletypes[selectedType].description}</p>

      <div className="module-picker-select-cont">
        {
          <FormControl>
            <InputLabel>Length, in measures</InputLabel>
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
            <InputLabel>Steps</InputLabel>
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

      <Button onClick={addModule}>ADD MODULE</Button>

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
