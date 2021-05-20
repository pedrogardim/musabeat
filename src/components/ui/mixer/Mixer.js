import React, { useState, useEffect } from "react";
import * as Tone from "tone";

import { Fab, Icon } from "@material-ui/core";

import "./Mixer.css";
import ChannelStrip from "./ChannelStrip";

//import { scheduleDrumSequence, scheduleChordProgression } from "../utils/exportUtils";

function Mixer(props) {
  const [modules, setModules] = useState(props.modules);

  useEffect(() => {
    setModules(props.modules);
  }, [props.modules]);

  return (
    <div className="mixer" style={props.style}>
      {modules.map((module, index) => (
        <ChannelStrip index={index} key={index} module={module} setMutedModules={props.setMutedModules}/>
      ))}
    </div>
  );
}

export default Mixer;
