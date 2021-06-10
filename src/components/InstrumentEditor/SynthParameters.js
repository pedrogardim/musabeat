import React, { useState, useEffect, Fragment } from "react";

import * as Tone from "tone";

import {
  Select,
  Typography,
  Slider,
  FormControl,
  InputLabel,
} from "@material-ui/core";
import { waveTypes, filterTypes } from "../../assets/musicutils";

import FilterEditor from "./FilterEditor";

import "./InstrumentEditor.css";

const filterRollOffs = [-12, -24, -48, -96];

function SynthParameters(props) {
  //const [selectedFile, setSelectedFile] = useState(null);
  const [instrumentParamenters, setInstrumentParamenters] = useState(
    props.instrument.get()
  );

  //console.log(instrument.get());

  let mainContent = "Nothing Here";

  const handleChange = (parameter, value) => {
    console.log(parameter, value);
    setInstrumentParamenters((prev) => {
      return { ...prev, [parameter]: value };
    });
    props.instrument.set({ [parameter]: value });
  };

  const handleWaveTypeSelect = (parameter, event) => {
    let value = event.target.value;
    console.log(parameter, value);
    setInstrumentParamenters((prev) => {
      return { ...prev, [parameter]: { type: value } };
    });
    props.instrument.set({ [parameter]: { type: value } });
    props.onInstrumentMod();
  };

  const handleFilterChange = (newFilter) => {
    setInstrumentParamenters((prev) => {
      return { ...prev, filter: newFilter };
    });
    props.instrument.set({
      filter: newFilter,
      filterEnvelope: { baseFrequency: newFilter.frequency, octaves: 0 },
    });
    console.log(newFilter, props.instrument.get());
    props.onInstrumentMod();
  };
  //TODO

  useEffect(() => {
    setInstrumentParamenters(props.instrument.get());
    //console.log(props.instrument.get());
  }, [props.instrument]);

  mainContent = (
    <Fragment>
      {Object.keys(instrumentParamenters).map((parameter, index) =>
        parameter === "harmonicity" || parameter === "modulationIndex" ? (
          <Fragment>
            <Typography variant="overline">{parameter}</Typography>
            <Slider
              value={instrumentParamenters[parameter]}
              min={1}
              step={1}
              max={50}
              onChangeCommitted={() => props.onInstrumentMod()}
              onChange={(e, v) => handleChange(parameter, v)}
              valueLabelDisplay="auto"
            />
          </Fragment>
        ) : parameter === "modulation" ? (
          <FormControl>
            <InputLabel id="fm-wave-selector-label">{parameter}</InputLabel>
            <Select
              native
              labelId="fm-wave-selector-label"
              value={instrumentParamenters.modulation.type}
              onChange={(event) => handleWaveTypeSelect(parameter, event)}
            >
              {waveTypes.map((e, i) => (
                <option key={i} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </FormControl>
        ) : (
          ""
        )
      )}
      {props.instrument._dummyVoice.name === "MonoSynth" && (
        <FilterEditor
          instrumentParamenters={instrumentParamenters}
          handleFilterChange={handleFilterChange}
          instrument={props.instrument}
        />
      )}
    </Fragment>
  );

  return mainContent;
}

export default SynthParameters;
