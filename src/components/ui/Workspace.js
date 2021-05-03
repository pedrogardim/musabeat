import React, { useState } from "react";

import "./Workspace.css";

import Module from "./Module";

import { Fab, Icon } from '@material-ui/core';


let loadedmodules = [
    { id:1, name: "Sequence", number: Math.random() },
    { id:2, name: "Piano Roll", number: Math.random() },
    { id:3, name: "Synth", number: Math.random() },
];

function Workspace(props) {

const [modules,setModules] = useState(loadedmodules);

const addModuleHandler = ()=> {addModule({name:"new",id:modules.length+1,number:Math.random()})}

const addModule = (module) => setModules((prevModules)=>[module, ...prevModules]);

  
  return (
    <div className="workspace">
      {modules.map((module) => (
        <Module key={module.id} data={module} />
      ))}
        <Fab color="primary" aria-label="add" onClick={addModuleHandler}><Icon>add_circle</Icon></Fab>

    </div>
  );
}

export default Workspace;
