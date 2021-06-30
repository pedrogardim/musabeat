import React, { useState, useRef, Fragment } from "react";
import * as Tone from "tone";

import {
  Fab,
  Icon,
  Popper,
  Paper,
  Typography,
  Input,
  Slider,
} from "@material-ui/core";

function SessionSettings(props) {
  const btnRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(false);
  const sessionData = props.sessionData;

  const handleBpmChange = (e, value) => {
    Tone.Transport.bpm.value = value;
    props.setSessionData((prev) => {
      let newData = { ...prev };
      newData.bpm = value;
      return newData;
    });
  };

  return (
    <Fragment>
      <Fab
        ref={btnRef}
        color="primary"
        className="ws-fab ws-fab-settings"
        tabIndex={-1}
        onClick={() => setAnchorEl((prev) => (prev ? null : btnRef.current))}
      >
        <Icon>settings</Icon>
      </Fab>
      <Popper
        open={!!anchorEl}
        anchorEl={anchorEl}
        placement="top-end"
        onClose={() => setAnchorEl(null)}
      >
        {sessionData && (
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
            <Typography>BPM</Typography>
            <Slider
              min={50}
              max={300}
              defaultValue={sessionData.bpm}
              valueLabelDisplay="auto"
              onChangeCommitted={handleBpmChange}
            />
          </Paper>
        )}
      </Popper>
    </Fragment>
  );
}

export default SessionSettings;
