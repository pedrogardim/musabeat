import React, { useState } from "react";

import { Slider, Typography, Icon, IconButton } from "@material-ui/core";

import "./ChannelStrip.css";

//import { scheduleDrumSequence, scheduleChordProgression } from "../utils/exportUtils";

function ChannelStrip(props) {
  const [volume, setVolume] = useState(props.module.volume.toFixed(2));

  const handleSliderMove = (e, v) => {
    setVolume(v);
    props.handleSliderMove(props.index, v);
  };

  const handleSliderStop = (e, v) => {
    props.handleSliderStop(props.index, v);
  };

  return (
    <div
      className="mixer-channel-strip"
      style={
        (props.style, { filter: props.module.muted ? "saturate(0)" : "none" })
      }
    >
      <Slider
        value={volume}
        min={-80}
        step={0.1}
        max={0}
        scale={(x) => x}
        onChange={handleSliderMove}
        onChangeCommitted={handleSliderStop}
        orientation="vertical"
        className="channel-strip-fader"
      />{" "}
      <IconButton onClick={props.handleMute}>
        <Icon>{props.module.muted ? "volume_off" : "volume_up"}</Icon>
      </IconButton>
      <Typography variant="overline" style={{ textTransform: "none" }}>
        {" "}
        {props.module.muted ? "MUTED" : volume + " dB"}{" "}
      </Typography>
      <Typography variant="overline" className="mixer-channel-strip-title">
        {props.module.name}{" "}
      </Typography>
    </div>
  );
}

export default ChannelStrip;
