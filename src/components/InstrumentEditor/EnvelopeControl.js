import React, { useState, useEffect, Fragment } from "react";

import { Typography, Slider, Icon, IconButton, Grid } from "@material-ui/core";

import "./InstrumentEditor.css";

function EnvelopeControl(props) {
  const [envelope, setEnvelope] = useState(
    props.instrument.get()[props.envelopeType]
  );

  const handleChange = (element, value) => {
    props.instrument.set({ [props.envelopeType]: { [element]: value } });
    setEnvelope((prev) => {
      return { ...prev, [element]: value };
    });
  };

  const toggleFilterEnvelope = () => {
    const state = props.instrument.get().filterEnvelope.octaves;

    state
      ? props.instrument.set({ filterEnvelope: { octaves: 0 } })
      : props.instrument.set({ filterEnvelope: { octaves: 7 } });

    setEnvelope(props.instrument.get().filterEnvelope);
  };

  useEffect(() => {
    setEnvelope(props.instrument.get()[props.envelopeType]);
  }, [props.instrument, props.envelopeType]);

  return (
    <Grid item xs={6} className="instrument-editor-envelope-container">
      <Typography
        variant="overline"
        className="instrument-editor-envelope-label"
      >
        {Object.keys(envelope).includes("octaves") && (
          <IconButton
            color={envelope.octaves !== 0 ? "primary" : "default"}
            onClick={toggleFilterEnvelope}
            size="small"
            className="turnonoff-button"
          >
            <Icon>power_settings_new</Icon>
          </IconButton>
        )}
        {props.envelopeType
          .toLowerCase()
          .replace("envelope", " ADSR")
          .replace("modulation", "mod")}
      </Typography>

      {Object.keys(envelope).map(
        (element, index) =>
          (element === "attack" ||
            element === "decay" ||
            element === "sustain" ||
            element === "release") && (
            <div
              className={
                "instrument-editor-envelope-slider-container " +
                (envelope.octaves === 0 && "disabled")
              }
              style={{ order: element === "release" ? 2 : 1 }}
            >
              <Slider
                key={index}
                className={"instrument-editor-vertical-slider"}
                orientation="vertical"
                value={envelope[element]}
                min={0}
                step={0.1}
                max={element === "sustain" ? 1 : 2}
                onChangeCommitted={() => props.onInstrumentMod()}
                onChange={(e, v) => handleChange(element, v)}
                valueLabelDisplay="auto"
              />
              <Typography variant="overline">{element[0]}</Typography>
            </div>
          )
      )}
    </Grid>
  );
}

export default EnvelopeControl;
