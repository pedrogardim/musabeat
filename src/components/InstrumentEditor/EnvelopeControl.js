import React, { useState, Fragment } from "react";

import { Select, Typography, Slider } from "@material-ui/core";

import "./InstrumentEditor.css";

function EnvelopeControl(props) {
  const [envelope, setEnvelope] = useState(props.instrument.get().envelope);

  const handleChange = (element, value) => {
    props.instrument.set({ [props.envelopeType]: { [element]: value } });
    setEnvelope(prev => {return {...prev, [element]: value }})
  }

  return (
    <Fragment>
      <Typography variant="overline">
        {props.envelopeType.toLowerCase().replace("envelope", " ADSR")}
      </Typography>
      <div className="break"></div>

      {Object.keys(props.instrument.get()[props.envelopeType]).map(
        (element, index) =>
          (element === "attack" ||
            element === "decay" ||
            element === "sustain" ||
            element === "release") && (
            <Slider
              className={"instrument-editor-vertical-slider " + element}
              orientation="vertical"
              value={envelope[element]}
              min={0}
              step={0.01}
              max={element === "sustain" ? 1 : 2}
              onChange={(e, v) => handleChange(element, v)}
              valueLabelDisplay="auto"
            />
          )
      )}
      <div className="break"></div>
    </Fragment>
  );
}

export default EnvelopeControl;

