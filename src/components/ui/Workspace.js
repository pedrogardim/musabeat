import React, { useState, useEffect } from "react";
import * as Tone from "tone";

import { Fab, Icon } from "@material-ui/core";

import "./Workspace.css";

import Module from "./../module/Module";
import ModulePicker from "./ModulePicker";
import Exporter from "./Exporter";
import Drawer from "./Drawer";

import {
  red,
  pink,
  purple,
  deepPurple,
  indigo,
  blue,
  lightBlue,
  cyan,
  teal,
  green,
  lightGreen,
  lime,
  yellow,
  amber,
  orange,
  deepOrange,
} from "@material-ui/core/colors";
import { instrumentContructor } from "../../assets/musicutils";

//import { scheduleDrumSequence, scheduleChordProgression } from "../utils/exportUtils";

const colors = [
  red,
  deepPurple,
  indigo,
  blue,
  cyan,
  teal,
  lightGreen,
  lime,
  amber,
  orange,
];

const initialModules = [
  {
    id: 0,
    name: "Sequencer",
    type: 0,
    steps: 16,
    patch: 0,
    instrument: {},
    color: colors[2],
    score: [
      [
        [0, 3],
        [],
        [3],
        [],
        [1, 3],
        [],
        [3],
        [],
        [0, 3],
        [],
        [3],
        [],
        [1, 3],
        [],
        [3],
        [],
      ]
    ],
  },
  {
    id: 1,
    name: "Melody",
    type: 1,
    steps: 16,
    instrument: instrumentContructor(2),
    color: colors[2],
    score: [
      [
        ["C3"],
        [],
        ["D3"],
        [],
        ["E3"],
        ["A3"],
        ["C4"],
        [],
        [],
        ["A3"],
        [],
        [],
        ["A3"],
        [],
        ["D3"],
        ["C3"],
      ],
      [
        ["A3"],
        [],
        [],
        ["G3"],
        [],
        [],
        ["E3"],
        [],
        ["G3"],
        ["E3"],
        ["D3"],
        ["E3"],
        ["A3"],
        [],
        ["D3"],
        ["G3"],
      ],
    ],
  },
  {
    id: 2,
    name: "Chords",
    type: 2,
    instrument: instrumentContructor(0),
    color: colors[2],
    score: [
      {
        notes: ["E4", "G4", "B4"],
        duration: 0.5,
        time: 0,
        measure: 0,
        rhythm: [1],
      },
      {
        notes: ["C4", "E4", "G4", "D5"],
        duration: 0.5,
        time: 0.5,
        measure: 0,
        rhythm: [1],
      },
      {
        notes: ["A4", "C4", "E4"],
        duration: 0.5,
        time: 1,
        rhythm: [1],
      },
      {
        notes: ["G4", "B4", "D5"],
        duration: 0.5,
        time: 1.5,
        rhythm: [1],
      },
    ],
  },
];

const initialSessionData = {
  name: "",
  bpm: 90,
};
Tone.Transport.bpm.value = initialSessionData.bpm;
Tone.Transport.loop = true;
Tone.Transport.loopStart = 0;

function Workspace(props) {
  const [modules, setModules] = useState(initialModules);
  const [sessionSize, setSessionSize] = useState(4);
  const [modulePickerVisibility, chooseNewModule] = useState(false);
  const [drawerCont, setDrawerCont] = useState(null);

  const addModule = (moduletype) => {
    let module = {
      id: modules.length,
      name: "New Module",
      type: moduletype,
      subdiv: 16,
      patch: 0,
      score: [],
      instrument: {},
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setModules((prevModules) => [...prevModules, module]);
    chooseNewModule(false);
  };

  const adaptSessionSize = () => {
    let lengths = modules.map((module) =>
      module.type === 2
        ? Math.ceil(module.score[module.score.length - 1].time)
        : module.score.length
    );
    let longestModule = Math.max(...lengths);
    setSessionSize(longestModule);
    Tone.Transport.loopEnd = Tone.Time("1m").toSeconds() * longestModule;

  };

  const handleKeyPress = (event) => {
    Tone.start();
    switch (event.code) {
      case "Space":
        event.preventDefault();
        Tone.Transport.state !== "started"
          ? Tone.Transport.start()
          : Tone.Transport.pause();
        break;
    }
  };

  const handleClick = (event) => {
    let targetClass =
      "classList" in event.target ? event.target.classList[0] : "";
    let drawer = document.querySelector(".adjustments-drawer");
    !drawer.contains(event.target) &&
      !targetClass.includes("chord") &&
      setDrawerCont(null);
  };

  useEffect(() => {
    adaptSessionSize();
    console.log(modules);
  }, [modules]);

  return (
    <div
      className="workspace"
      tabIndex="0"
      onClick={handleClick}
      onKeyDown={handleKeyPress}
    >
      {modules.map((module) => (
        <Module
          key={module.id}
          index={module.id}
          module={module}
          sessionSize={sessionSize}
          updateModules={setModules}
          setDrawer={setDrawerCont}
          drawerCont={drawerCont}
        />
      ))}
      <Fab color="primary" onClick={() => chooseNewModule(true)}>
        <Icon>add</Icon>
      </Fab>

      {modulePickerVisibility && (
        <ModulePicker
          toggleVisibility={chooseNewModule}
          addNewModule={addModule}
        />
      )}
      <Exporter
        sessionSize={sessionSize}
        sessionData={initialSessionData}
        modules={modules}
      />
      <Drawer>{drawerCont}</Drawer>
    </div>
  );
}

export default Workspace;
