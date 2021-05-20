import React, { useState, useEffect } from "react";
import * as Tone from "tone";

import { Fab, Slider, Typography, Icon, IconButton } from "@material-ui/core";

import "./ChannelStrip.css";

//import { scheduleDrumSequence, scheduleChordProgression } from "../utils/exportUtils";

function ChannelStrip(props) {
  const [module, setModule] = useState(props.module);
  const [faderVolume, setFaderVolume] = useState(
    module.instrument.volume.value.toFixed(2)
  );
  const [muted, setMuted] = useState(module.instrument._volume.mute);

  const handleFaderMove = (value) => {
    setMuted(false);
    module.instrument._volume.mute = false;
    setFaderVolume(value);
    module.instrument.volume.value = value;
  };
  const handleMuteButton = () => {
    setMuted(muted ? false : true);
  };

  useEffect(() => {
    module.instrument._volume.mute = muted;
    setFaderVolume(module.instrument.volume.value.toFixed(2));
    props.setMutedModules(prev =>
      prev.includes(props.index)
        ? prev.filter((x) => x != props.index)
        : [...prev, props.index]
    );
  }, [muted]);

  return (
    <div
      className="mixer-channel-strip"
      style={(props.style, { filter: muted ? "saturate(0)" : "none" })}
    >
      <Slider
        value={faderVolume}
        min={-80}
        step={0.1}
        max={0}
        scale={(x) => Math.log(x)}
        onChange={(e, v) => handleFaderMove(v)}
        orientation="vertical"
        className="channel-strip-fader"
      />{" "}
      <IconButton onClick={handleMuteButton}>
        <Icon>{muted ? "volume_off" : "volume_up"}</Icon>
      </IconButton>
      <Typography variant="overline" style={{ textTransform: "none" }}>
        {" "}
        {faderVolume === "-Infinity" ? "MUTED" : faderVolume + " dB"}{" "}
      </Typography>
      <Typography variant="overline"> {module.name} </Typography>
    </div>
  );
}

export default ChannelStrip;
