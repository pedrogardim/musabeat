import React, { useState, useEffect, Fragment } from "react";

import {
  Select,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Grid,
} from "@material-ui/core";

import { waveTypes } from "../../assets/musicutils";
import { useTranslation } from "react-i18next";

import FilterEditor from "./FilterEditor";

import "./InstrumentEditor.css";

//const filterRollOffs = [-12, -24, -48, -96];

function SynthParameters(props) {
  const { t } = useTranslation();

  const waveForms = ["sine", "square", "triangle", "sawtooth"];

  //const [selectedFile, setSelectedFile] = useState(null);
  const [instrumentParamenters, setInstrumentParamenters] = useState(
    props.instrument.get()
  );

  //console.log(instrument.get());

  let mainContent = "Nothing Here";

  const handleChange = (parameter, value) => {
    //console.log(parameter, value);
    setInstrumentParamenters((prev) => {
      return { ...prev, [parameter]: value };
    });
    props.instrument.set({ [parameter]: value });
  };

  const handleWaveTypeSelect = (parameter, event) => {
    let value = event.target.value;
    //console.log(parameter, value);
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
    //console.log(newFilter, props.instrument.get());
    props.onInstrumentMod();
  };
  //TODO

  useEffect(() => {
    setInstrumentParamenters(props.instrument.get());
    //console.log(props.instrument.get());
  }, [props.instrument]);

  /* useEffect(() => {
    console.log(instrumentParamenters);
  }, [instrumentParamenters]); */

  return props.instrument._dummyVoice.name === "MonoSynth" ? (
    <FilterEditor
      instrumentParamenters={instrumentParamenters}
      handleFilterChange={handleFilterChange}
      instrument={props.instrument}
    />
  ) : (
    <Grid
      item
      xs={12}
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        alignContent: "center",
        flexWrap: "wrap",
      }}
    >
      {Object.keys(instrumentParamenters)
        .filter((e) => e === "harmonicity" || e === "modulationIndex")
        .map((parameter, index) => (
          <Fragment>
            <Typography variant="overline">
              {t(`instrumentEditor.synthEditor.parameters.${parameter}`)}
            </Typography>
            <div className="break" />
            <Slider
              value={instrumentParamenters[parameter]}
              min={0}
              step={0.1}
              max={50}
              onChangeCommitted={() => props.onInstrumentMod()}
              onChange={(e, v) => handleChange(parameter, v)}
              valueLabelDisplay="auto"
            />
            <div className="break" />
          </Fragment>
        ))}
      {instrumentParamenters.modulation && (
        <FormControl>
          <InputLabel id="fm-wave-selector-label">
            {t("instrumentEditor.synthEditor.parameters.modwave")}
          </InputLabel>
          <Select
            native
            labelId="fm-wave-selector-label"
            value={instrumentParamenters.modulation.type}
            onChange={(event) => handleWaveTypeSelect("modulation", event)}
          >
            {waveForms.map((e, i) => (
              <option key={i} value={e}>
                {t(`instrumentEditor.synthEditor.waveTypes.${e}`)}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
    </Grid>
  );
}

export default SynthParameters;
