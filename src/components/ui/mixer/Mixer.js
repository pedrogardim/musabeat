import "./Mixer.css";
import ChannelStrip from "./ChannelStrip";
import React from "react";

import { Icon, IconButton, Box } from "@mui/material";

function Mixer(props) {
  const handleSliderMove = (index, value) => {
    props.instruments[index].volume.value = value;
  };

  const handleSliderStop = (index, value) => {
    props.setTracks((prev) => {
      let newTracks = [...prev];
      prev[index].volume = value;
      return newTracks;
    });
  };

  const handleMute = (index) => {
    props.setTracks((prev) => {
      let newMutedArray = [...prev];
      prev[index].muted = !prev[index].muted;
      return newMutedArray;
    });
    props.instruments[index]._volume.mute =
      !props.instruments[index]._volume.mute;
  };

  return (
    <Box className="mixer" tabIndex={-1} sx={{ bgcolor: "background.default" }}>
      {props.tracks.map((track, index) => (
        <ChannelStrip
          index={index}
          key={index}
          track={track}
          instrument={props.instruments[index]}
          handleSliderMove={handleSliderMove}
          handleSliderStop={handleSliderStop}
          handleMute={() => handleMute(index)}
        />
      ))}
      <IconButton
        onClick={() => props.setMixerOpen(false)}
        className="mp-closebtn"
        color="primary"
      >
        <Icon>close</Icon>
      </IconButton>
    </Box>
  );
}

export default Mixer;
