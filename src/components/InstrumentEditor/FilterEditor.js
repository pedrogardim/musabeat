import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import { Typography, Slider } from "@material-ui/core";

import "./FilterEditor.css";

function FilterEditor(props) {
  //temp

  /* const [filterState, setFilterState] = useState(
    //!(
    //  props.instrument.get().filter.frequency === 20001 &&
    //  props.instrument.get().filter.type === "notch"
    //)
    true
  ); */

  const [tempFilter, setTempFilter] = useState(() => {
    return new Tone.Filter({
      ...props.instrument.get().filter,
      frequency: props.instrument.get().filterEnvelope.baseFrequency,
    });
  });
  const [frequency, setFrequency] = useState(tempFilter.get().frequency);
  const [filterQ, setFilterQ] = useState(tempFilter.get().Q);

  const [filterFR, setFilterFR] = useState(tempFilter.getFrequencyResponse(64));
  const [filterFRWave, setFilterFRWave] = useState(drawWave(filterFR));

  const handleParameterChange = (parameter, value) => {
    tempFilter.set({
      [parameter]: value,
    });
    parameter === "frequency" ? setFrequency(value) : setFilterQ(value);
    setFilterFR(tempFilter.getFrequencyResponse(64));
  };

  const registerToSynth = () => {
    props.handleFilterChange(tempFilter.get());
    //setFilterFR(tempFilter.getFrequencyResponse(64));

    //tempFilter.dispose();
    //setTempFilter({});
    //setTempFilter(new Tone.Filter(props.instrument.get().filter));
  };

  /* const toggleFilter = () => {
    filterState
      ? props.handleFilterChange({
          type: "notch",
          frequency: "20001",
        })
      : props.handleFilterChange(tempFilter.get());

    setFilterState((prev) => !prev);
  }; */

  useEffect(() => {
    /*  setFilterState(
      !(
        tempFilter.get().frequency === 20001 &&
        tempFilter.get().type === "notch"
      )
    ); */
  }, [tempFilter]);

  useEffect(() => {
    setFilterFRWave(drawWave(filterFR));
  }, [filterFR]);

  useEffect(() => {
    setTempFilter(
      new Tone.Filter({
        ...props.instrument.get().filter,
        frequency: props.instrument.get().filterEnvelope.baseFrequency,
      })
    );
  }, [props.instrument]);

  return (
    <div className="filter-editor">
      <Typography variant="overline">
        {/*<IconButton
          color={filterState ? "primary" : "default"}
          onClick={toggleFilter}
          size="small"
          className="turnonoff-button"
        >
          <Icon>power_settings_new</Icon>
        </IconButton>*/}
        Filter
      </Typography>
      <div className="break" />

      <svg
        width="128px"
        height="64px"
        style={{ border: "1px solid #05386b", marginBottom: 8 }}
      >
        {/* filterState && <path d={filterFRWave} stroke="#05386b" fill="none" /> */}
        <path d={filterFRWave} stroke="#05386b" fill="none" />
      </svg>
      <Typography variant="overline" className="filter-editor-labels">
        {"Frequency:" + Math.floor(frequency) + "Hz"}
      </Typography>
      <Slider
        valueLabelDisplay="auto"
        min={20}
        max={20000}
        step={10}
        value={frequency}
        onChange={(e, v) => handleParameterChange("frequency", v)}
        onChangeCommitted={registerToSynth}
      />
      <div className="break" />
      <Typography variant="overline" className="filter-editor-labels">
        {"Resonance:" + filterQ}
      </Typography>
      <Slider
        valueLabelDisplay="auto"
        min={0}
        max={5}
        step={0.1}
        value={filterQ}
        onChange={(e, v) => handleParameterChange("Q", v)}
        onChangeCommitted={registerToSynth}
      />
    </div>
  );
}

const drawWave = (wavearray, setWavePath) => {
  if (!wavearray.length) {
    return;
  }
  let wave = wavearray;
  let pathstring = "M 0 " + wave[0] + " ";

  for (let x = 0; x < wavearray.length; x++) {
    pathstring += "L " + x * 2 + " " + (-wave[x] * 32 + 64).toFixed(1) + " ";
  }

  return pathstring;
};

export default FilterEditor;
