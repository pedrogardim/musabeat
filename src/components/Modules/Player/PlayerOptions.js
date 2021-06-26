import React, { useState, useRef, Fragment, useEffect } from "react";
import * as Tone from "tone";

import {
  IconButton,
  Icon,
  Popper,
  Paper,
  Typography,
  Slider,
} from "@material-ui/core";

function PlayerOptions(props) {
  const btnRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(false);
  const [pitch, setPitch] = useState(props.score.pitch ? props.score.pitch : 0);
  const [playbackRate, setPlaybackRate] = useState(
    props.score.playbackRate ? props.score.playbackRate : 1
  );

  const sessionData = props.sessionData;

  const handlePitchChange = (e, v) => {
    if (!e.altKey) {
      setPitch(v);
    } else {
      setPitch(0);
    }
  };

  const handlePlaybackRateChange = (e, v) => {
    if (!e.altKey) {
      setPlaybackRate(v);
    } else {
      setPlaybackRate(0);
    }
  };

  const commitChanges = () => {
    props.setScore((prev) => {
      let newScore = [...prev];
      newScore[0].pitch = pitch;
      newScore[0].playbackRate = playbackRate;
      return newScore;
    });
  };

  useEffect(() => {
    props.instrument.set({ detune: pitch, playbackRate: playbackRate });
    console.log({ detune: pitch, playbackRate: playbackRate });
  }, [pitch, playbackRate]);

  return (
    <Fragment>
      <IconButton
        ref={btnRef}
        color="primary"
        style={{ position: "absolute", bottom: 0, left: 0, color: "white" }}
        tabIndex={-1}
        onClick={() => setAnchorEl((prev) => (prev ? null : btnRef.current))}
      >
        <Icon>settings</Icon>
      </IconButton>
      <Popper
        open={!!anchorEl}
        anchorEl={anchorEl}
        placement="top-center"
        onClose={() => setAnchorEl(null)}
      >
        {props.instrument && (
          <Paper
            style={{
              padding: 16,
              display: "flex",
              alignItems: "center",
              alignContent: "center",
              flexDirection: "column",
              minHeight: 200,
              minWidth: 100,
              marginBottom: 16,
            }}
          >
            <Typography variant="overline"> Pitch</Typography>
            <Slider
              value={pitch}
              min={-2400}
              max={2400}
              step={10}
              valueLabelDisplay="auto"
              onChange={handlePitchChange}
              onChangeCommitted={commitChanges}
            />
            <Typography variant="overline"> Playback Rate</Typography>
            <Slider
              value={playbackRate}
              min={0.1}
              max={4}
              step={0.1}
              valueLabelDisplay="auto"
              onChange={handlePlaybackRateChange}
              onChangeCommitted={commitChanges}
            />
          </Paper>
        )}
      </Popper>
    </Fragment>
  );
}

export default PlayerOptions;
