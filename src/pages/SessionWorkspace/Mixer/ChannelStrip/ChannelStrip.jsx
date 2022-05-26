import React, { useState } from "react";

import { Slider, Typography, Icon, IconButton } from "@mui/material";

import "./style.css";

import { colors } from "../../../../utils/Pallete";

import Knob from "../../../../components/Knob";

import { useTranslation } from "react-i18next";

function ChannelStrip(props) {
  const { t } = useTranslation();

  const { track, index } = props;

  const [volume, setVolume] = useState(track.volume.toFixed(2));
  const [pan, setPan] = useState(0);

  const handleSliderMove = (e, v) => {
    setVolume(v);
    props.handleSliderMove(index, v);
  };

  const handleSliderStop = (e, v) => {
    props.handleSliderStop(index, v);
  };

  return (
    <div
      className="mixer-channel-strip"
      style={{ filter: track.muted ? "saturate(0)" : "none" }}
    >
      {/* <Knob
        size={40}
        value={pan}
        min={-1}
        max={1}
        onChange={(v) => setPan(v)}
        color={colors[track.color][600]}
      /> */}
      <Slider
        value={volume}
        min={-80}
        step={0.1}
        max={0}
        //scale={(x) => x ^ 2}
        onChange={handleSliderMove}
        onChangeCommitted={handleSliderStop}
        orientation="vertical"
        className="channel-strip-fader"
        style={{ color: colors[track.color][600] }}
      />
      <IconButton onClick={props.handleMute}>
        <Icon>{track.muted ? "volume_off" : "volume_up"}</Icon>
      </IconButton>
      <Typography color="textPrimary" style={{ textTransform: "none" }}>
        {track.muted ? "MUTED" : volume + " dB"}
      </Typography>
      <Typography color="textPrimary" className="mixer-channel-strip-title">
        {track.name ? track.name : t(`trackPicker.types.${track.type}.name`)}
      </Typography>
    </div>
  );
}

export default ChannelStrip;
