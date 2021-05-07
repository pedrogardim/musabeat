import React, { useState,useEffect } from "react";
import * as Tone from "tone";

import { Fab, Icon } from "@material-ui/core";

import "./Workspace.css";

import Module from "./Module";
import ModulePicker from "./ModulePicker";
import Exporter from "./Exporter";
//import { scheduleDrumSequence, scheduleChordProgression } from "../utils/exportUtils";


const initialModules = [
  {
    id: 0,
    name: "Sequencer",
    type: 0,
    subdiv: 16,
    patch: 0,
    instrument:{},
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
      ],
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
      ],
    ],
  },
  {
    id: 1,
    name: "Chords",
    type: 2,
    subdiv: 16,
    patch: 0,
    instrument:{},
    chords: [
      {
        notes: ["E4", "G4", "B4"],
        duration: 0.5,
        time: 0,
        measure: 0,
        rhythm: [1, 0, 1, 0, 1, 0, 1, 0],
      },
      {
        notes: ["C4", "E4", "G4", "D5"],
        duration: 0.5,
        time: 0.5,
        measure: 0,
        rhythm: [0, 1, 1, 1, 0, 1, 1, 1],
      },
      {
        notes: ["A4", "C4", "E4"],
        duration: 0.5,
        time: 1,
        rhythm: [1, 0, 1, 0, 1, 0,0,1],
      },
      {
        notes: ["G4", "B4", "D5"],
        duration: 0.5,
        time: 1.5,
        rhythm: [1, 0, 1, 0, 1, 0, 1, 0],
      },
    ],
  },
];

const initialSessionData = {
  name:"",
  bpm:90
}
Tone.Transport.bpm.value = initialSessionData.bpm;
Tone.Transport.loop = true;
Tone.Transport.loopStart = 0;
Tone.Transport.loopEnd = "2m";

function Workspace(props) {
  const [modules, setModules] = useState(initialModules);
  const [modulePickerVisibility, chooseNewModule] = useState(false);

  const addModule = (moduletype) => {
    let module = {
      id: modules.length,
      name: "New Module",
      type: moduletype,
      subdiv: 16,
      patch: 0,
      score: [],
      instrument:{}
    };
    setModules((prevModules) => [...prevModules, module]);
    chooseNewModule(false);
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

  useEffect(()=> console.log(modules),[modules])

  return (
    <div className="workspace" tabIndex="0" onKeyDown={handleKeyPress}>
      {modules.map((module) => (
        <Module key={module.id} data={module} updateModule={setModules}/>
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
    <Exporter sessionData={initialSessionData} modules={modules}/>
    </div>
  );
}

export default Workspace;
