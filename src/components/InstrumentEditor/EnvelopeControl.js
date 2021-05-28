import React, { useState, Fragment, useEffect } from "react";

import {
  Select,
  Typography,
  Slider,
  Icon,
  IconButton,
} from "@material-ui/core";

import "./InstrumentEditor.css";

function EnvelopeControl(props) {
  const [envelope, setEnvelope] = useState(props.instrument.get()[props.envelopeType]);

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
      console.log(state);
  };

  useEffect(() => {
    setEnvelope(props.instrument.get()[props.envelopeType]);
   console.log( "change imported to here!")
  }, [props.instrument]);

  return (
    <div className="instrument-editor-envelope-container">
      <Typography
        variant="overline"
        className="instrument-editor-envelope-label"
      >
        {props.envelopeType
          .toLowerCase()
          .replace("envelope", " ADSR")
          .replace("modulation", "mod")}
      </Typography>
      {Object.keys(envelope).includes(
        "octaves"
      ) && (
        <IconButton
          color={envelope.octaves !== 0 ? "primary" : "default"}
          onClick={toggleFilterEnvelope}
          size="small"
          className="turnonoff-button"
        >
          <Icon>power_settings_new</Icon>
        </IconButton>
      )}
      {Object.keys(envelope).map(
        (element, index) =>
          (element === "attack" ||
            element === "decay" ||
            element === "sustain" ||
            element === "release") && (
            <div
              className={"instrument-editor-envelope-slider-container "+ (envelope.octaves === 0 && "disabled")}
              style={{ order: element === "release" ? 2 : 1 }}
            >
              <Slider
                key={index}
                className={"instrument-editor-vertical-slider"}
                orientation="vertical"
                value={envelope[element]}
                min={0}
                step={0.01}
                max={element === "sustain" ? 1 : 2}
                onChange={(e, v) => handleChange(element, v)}
                valueLabelDisplay="auto"
              />
              <Typography variant="overline">{element[0]}</Typography>
            </div>
          )
      )}
      <div className="break"></div>
    </div>
  );
}

export default EnvelopeControl;
