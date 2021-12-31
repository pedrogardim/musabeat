import React, { useState, useEffect } from "react";

import { Typography, Icon, IconButton } from "@mui/material";

import { useTranslation } from "react-i18next";

import Knob from "../../../Knob";

function EnvelopeControl(props) {
  const { t } = useTranslation();

  const envelopeType =
    props.type === "filter" || props.type === "modulation"
      ? props.type + "Envelope"
      : "envelope";

  const [envelope, setEnvelope] = useState(
    props.instrument.get()[envelopeType]
  );

  const handleChange = (element, value) => {
    props.instrument.set({ [envelopeType]: { [element]: value } });
    setEnvelope(props.instrument.get()[envelopeType]);
    /* setEnvelope((prev) => {
      return { ...prev, [element]: value };
    }); */
  };

  const toggleFilterEnvelope = () => {
    const state = props.instrument.get().filterEnvelope.octaves;

    state
      ? props.instrument.set({ filterEnvelope: { octaves: 0 } })
      : props.instrument.set({ filterEnvelope: { octaves: 7 } });

    setEnvelope(props.instrument.get().filterEnvelope);
  };

  useEffect(() => {
    setEnvelope(props.instrument.get()[envelopeType]);
  }, [props.instrument, envelopeType]);

  return (
    <div
      className="ie-envelope-container"
      style={{
        filter:
          props.type === "filter" && envelope.octaves === 0 && "saturate(0)",
      }}
    >
      {props.label !== false && (
        <Typography
          color="textPrimary"
          variant="body1"
          className="ie-envelope-label"
        >
          {envelope.hasOwnProperty("octaves") && (
            <IconButton
              color={envelope.octaves !== 0 ? "primary" : "default"}
              onClick={toggleFilterEnvelope}
              size="small"
              className="turnonoff-button"
            >
              <Icon>power_settings_new</Icon>
            </IconButton>
          )}
          {envelopeType.toUpperCase()}
        </Typography>
      )}
      <div className="break" />

      {["attack", "decay", "sustain", "release"].map((e) => (
        <Knob
          min={0}
          size={32}
          step={0.01}
          max={e === "sustain" ? 1 : e === "attack" ? 4 : e === "decay" ? 4 : 2}
          defaultValue={envelope[e]}
          onChange={(v) => handleChange(e, v)}
          label={e[0]}
          style={{ margin: "0 8px" }}
        />
      ))}

      {/* {Object.keys(envelope).map(
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
                step={0.01}
                max={
                  element === "sustain"
                    ? 1
                    : element === "attack"
                    ? 4
                    : element === "decay"
                    ? 4
                    : 2
                }
                onChangeCommitted={() => props.onInstrumentMod()}
                onChange={(e, v) => handleChange(element, v)}
                valueLabelDisplay="auto"
              />
              <Typography variant="overline">{element[0]}</Typography>
            </div>
          )
      )} */}
    </div>
  );
}

export default EnvelopeControl;
