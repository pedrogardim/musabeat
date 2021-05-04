import React, { useState } from "react";
import * as Tone from "tone";

import { Fab, Icon } from "@material-ui/core";

import "./Workspace.css";

import Module from "./Module";
import ModulePicker from "./ModulePicker";

const loadedmodules = [
  { id: 1, name: "Sequence", number: Math.random(),type:0, subdiv:16, sounds:8},
  { id: 2, name: "Piano Roll", number: Math.random(),type:0,subdiv:16, sounds:8},
  { id: 3, name: "Synth", number: Math.random(),type:0,subdiv:16, sounds:8},
];

function Workspace(props) {

  const [modules, setModules] = useState(loadedmodules);
  const [modulePickerVisibility, chooseNewModule] = useState(false);

  const addModule = (moduletype) => {
    let module = {id: modules.length+1, name: "Synth", number: Math.random(), type:moduletype, subdiv:16, sounds:8}
    setModules((prevModules) => [...prevModules, module]);
    chooseNewModule(false);

  };

  const handleKeyPress = event => {console.log(event)}

  return (
    <div className="workspace" onKeyDown={handleKeyPress}>
      {modules.map((module) => (
        <Module key={module.id} data={module}/>
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
    </div>
  );
}

export default Workspace;
