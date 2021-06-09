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
    props.instruments[index].volume.value = value
  };

  const handleSliderStop = (index,value) => {
    //console.log(value)
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
    props.instruments[index]._volume.mute = !(props.instruments[index]._volume.mute)

  };

  return (
    <div className="mixer" style={props.style}>
      {props.modules.map((module, index) => (
        <ChannelStrip
          index={index}
          key={index}
          module={module}
          instrument={props.instruments[index]}
          handleSliderMove={handleSliderMove}
          handleSliderStop={handleSliderStop}
          handleMute={()=>handleMute(index)}

        />
      ))}
    </div>
  );
}

export default Mixer;
