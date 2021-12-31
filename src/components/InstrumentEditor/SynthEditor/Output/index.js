import React, { useState, useEffect, Fragment } from "react";

import { Icon, IconButton, Paper, Grow, Box } from "@mui/material";

import "../InstrumentEditor.css";

import Knob from "./Knob";

import { useTranslation } from "react-i18next";
import EnvelopeControl from "./EnvelopeControl";

function SynthOutput(props) {
  const { t } = useTranslation();

  const handleChange = (element, value) => {
    props.instrument.set({ [element]: value });
    /* setEnvelope((prev) => {
      return { ...prev, [element]: value };
    }); */
  };

  let mainContent = (
    <>
      <Knob
        min={-60}
        step={0.01}
        max={0}
        size={48}
        defaultValue={props.instrument.get().volume}
        onChange={(v) => handleChange("volume", v)}
        label={"Volume"}
        step={1}
      />
      <div className="break" />
      <EnvelopeControl
        onInstrumentMod={props.onInstrumentMod}
        instrument={props.instrument}
        type={"envelope"}
      />
    </>
  );

  return props.expanded ? (
    <Grow in={props.expanded} timeout={200}>
      <Box className="ie-synth-fs-item" sx={{ bgcolor: "background.default" }}>
        <IconButton
          onClick={() => props.setExpanded(null)}
          className="mp-closebtn"
          color="primary"
          style={{ zIndex: 10 }}
        >
          <Icon>close</Icon>
        </IconButton>
        {mainContent}
      </Box>
    </Grow>
  ) : (
    <Paper
      className="ie-synth-compact-item"
      elevation={5}
      onMouseDown={(e) =>
        e.target.className &&
        e.target.className.includes &&
        e.target.className.includes("ie-synth-compact-item") &&
        props.setExpanded(2)
      }
    >
      {mainContent}
    </Paper>
  );
}

export default SynthOutput;
