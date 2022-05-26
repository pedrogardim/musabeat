import React, { useContext } from "react";

import "./style.css";
import ChannelStrip from "./ChannelStrip";

import wsCtx from "../../../context/SessionWorkspaceContext";

import { Icon, IconButton, Box } from "@mui/material";

function Mixer(props) {
  const { tracks, instruments, setTracks } = useContext(wsCtx);

  const handleSliderMove = (index, value) => {
    instruments[index].volume.value = value;
  };

  const handleSliderStop = (index, value) => {
    setTracks((prev) => {
      let newTracks = [...prev];
      prev[index].volume = value;
      return newTracks;
    });
  };

  const handleMute = (index) => {
    setTracks((prev) => {
      let newMutedArray = [...prev];
      prev[index].muted = !prev[index].muted;
      return newMutedArray;
    });
    instruments[index]._volume.mute = !instruments[index]._volume.mute;
  };

  return (
    <Box className="mixer" tabIndex={-1} sx={{ bgcolor: "background.default" }}>
      {tracks.map((track, index) => (
        <ChannelStrip
          index={index}
          key={index}
          track={track}
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
