import React, { useState, useEffect, Fragment } from "react";

import * as Tone from "tone";

import { Typography, Slider, Grid } from "@mui/material";

import "./FilterEditor.css";

import Knob from "./Knob";
import EnvelopeControl from "./EnvelopeControl";

import { useTranslation } from "react-i18next";

function FilterEditor(props) {
  const { t } = useTranslation();

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
    props.instrument.set({
      filter: {
        [parameter]: value,
      },
      filterEnvelope: parameter === "frequency" ? { baseFrequency: value } : {},
    });
    parameter === "frequency" ? setFrequency(value) : setFilterQ(value);
    setFilterFR(tempFilter.getFrequencyResponse(64));
  };

  const registerToSynth = () => {
    //console.log("registerToSynth!!!!!!");
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
    props.instrument.get().filter &&
      setTempFilter(
        new Tone.Filter({
          ...props.instrument.get().filter,
          frequency: props.instrument.get().filterEnvelope.baseFrequency,
        })
      );
  }, [props.instrument]);

  return (
    <>
      {/*   <Typography variant="overline">
       
        {t("instrumentEditor.synthEditor.parameters.filter")}
      </Typography>
      <div className="break" /> */}

      <svg
        width="128px"
        height="64px"
        style={{ border: "1px solid #05386b", marginBottom: 8 }}
      >
        {/* filterState && <path d={filterFRWave} stroke="#05386b" fill="none" /> */}
        <path d={filterFRWave} stroke="#05386b" fill="none" />
      </svg>
      <div className="break" />
      <Knob
        min={20}
        max={20000}
        step={10}
        size={48}
        defaultValue={frequency}
        onChange={(v) => handleParameterChange("frequency", v)}
        onChangeCommited={registerToSynth}
        label={"Frequency"}
        style={{ margin: "0 16px" }}
      />

      <Knob
        min={0}
        max={5}
        step={0.1}
        size={48}
        defaultValue={filterQ}
        onChange={(v) => handleParameterChange("Q", v)}
        onChangeCommited={registerToSynth}
        label={"Reso"}
        style={{ margin: "0 16px" }}
      />
      <div className="break" />

      <EnvelopeControl
        onInstrumentMod={props.onInstrumentMod}
        instrument={props.instrument}
        type={"filter"}
        label={props.expanded}
      />
    </>
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
