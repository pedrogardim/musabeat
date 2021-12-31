import React, { useState } from "react";

import { Slider, Typography, Icon, IconButton } from "@mui/material";

import "./style.css";

//import { scheduleDrumSequence, scheduleChordProgression } from "../utils/exportUtils";

import { useTranslation } from "react-i18next";

function ChannelStrip(props) {
  const { t } = useTranslation();

  const [volume, setVolume] = useState(props.track.volume.toFixed(2));

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
        (props.style, { filter: props.track.muted ? "saturate(0)" : "none" })
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
        <Icon>{props.track.muted ? "volume_off" : "volume_up"}</Icon>
      </IconButton>
      <Typography variant="overline" style={{ textTransform: "none" }}>
        {" "}
        {props.track.muted ? "MUTED" : volume + " dB"}
      </Typography>
      <Typography variant="overline" className="mixer-channel-strip-title">
        {props.track.name
          ? props.track.name
          : t(`trackPicker.types.${props.track.type}.name`)}
      </Typography>
    </div>
  );
}

export default ChannelStrip;
