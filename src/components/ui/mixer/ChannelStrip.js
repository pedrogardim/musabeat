import React, { useState, useEffect } from "react";
import * as Tone from "tone";

import { Fab, Slider, Typography, Icon, IconButton } from "@material-ui/core";

import "./ChannelStrip.css";

//import { scheduleDrumSequence, scheduleChordProgression } from "../utils/exportUtils";

function ChannelStrip(props) {
  const moduleName = props.module.name
  const mutedModule = props.muted

  const [volume,setVolume] = useState(props.module.volume);

useEffect(() =>{

  //props.handleSliderMove(props.index,volume)
  

},[volume])


  return (
    <div
      className="mixer-channel-strip"
      style={(props.style, { filter: mutedModule ? "saturate(0)" : "none" })}
    >
      <Slider
        value={volume}
        min={-80}
        step={0.1}
        max={0}
        scale={(x) => (x)}
        onChange={(e, v) => setVolume(v)}
        onChangeCommitted={(e,v)=>props.handleSliderStop(props.index,v)}
        orientation="vertical"
        className="channel-strip-fader"
      />{" "}
      <IconButton onClick={props.handleMute}>
        <Icon>{mutedModule ? "volume_off" : "volume_up"}</Icon>
      </IconButton>
      <Typography variant="overline" style={{ textTransform: "none" }}>
        {" "}
        {mutedModule ? "MUTED" : volume + " dB"}{" "}
      </Typography>
      <Typography variant="overline"> {moduleName} </Typography>
    </div>
  );
}

export default ChannelStrip;
