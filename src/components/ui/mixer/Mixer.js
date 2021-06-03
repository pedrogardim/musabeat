import React, { useState, useEffect } from "react";
import * as Tone from "tone";

import { Fab, Icon } from "@material-ui/core";

import "./Mixer.css";
import ChannelStrip from "./ChannelStrip";

//import { scheduleDrumSequence, scheduleChordProgression } from "../utils/exportUtils";

function Mixer(props) {
  /* const [modules, setModules] = useState(props.modules);

  useEffect(() => {
    setModules(props.modules);
  }, [props.modules]); */

  const handleSliderMove = (index,value) => {
    /* props.setModulesVolume(prev=>{
      let newVolumes = [...prev];
      prev[index] = value;
      return newVolumes;
    }) */
  };

  const handleSliderStop = (index,value) => {
console.log(value)
    props.setModules(prev=>{
      let newModules = [...prev];
      prev[index].volume = value;
      return newModules;
    })

  };

  const handleMute = (index) => {
    props.setModules(prev=>{
      let newMutedArray = [...prev];
      prev[index].muted = !(prev[index].muted);
      return newMutedArray;
    })
  };

  return (
    <div className="mixer" style={props.style}>
      {props.modules.map((module, index) => (
        <ChannelStrip
          index={index}
          key={index}
          module={props.modules[index]}
          muted={props.modules[index].muted}
          handleSliderMove={handleSliderMove}
          handleSliderStop={handleSliderStop}
          handleMute={()=>handleMute(index)}

        />
      ))}
    </div>
  );
}

export default Mixer;
