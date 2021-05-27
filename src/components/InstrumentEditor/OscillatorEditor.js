import React, { useState, useEffect, useRef, Fragment } from "react";

import * as Tone from "tone";

import { mapLogScale } from "../../assets/musicutils";

import {
  Typography,
  Select,
  InputLabel,
  FormControl,
  Slider,
  Card
} from "@material-ui/core";

import "./OscillatorEditor.css";

const waveForms = ["sine", "square", "triangle", "sawtooth"];
const oscTypes = ["basic", "fm", "am", "fat", "pwm", "pulse"];

function OscillatorEditor(props) {
  const waveSvg = useRef(null);

  const [waveForm, setWaveForm] = useState("");

  const [oscillatorWaveForm, setOscillatorWaveForm] = useState(
    drawWave(waveForm)
  );

  const [oscWave, setOscWave] = useState("");
  const [oscType, setOscType] = useState("");
  const [oscPartials, setOscPartials] = useState("");

  const registerToSynth = () => {
    //tempFilter.dispose();
    //setTempFilter({});
    //setTempFilter(new Tone.Filter(props.instrument.get().filter));
  };

  const getOscillatorData = () => {
    let oscillator = props.instrument.get().oscillator.type;
    let oscillatorWave, oscillatorType, oscillatorPartials;
    oscillatorType = oscillatorPartials = oscillatorWave = "";
    waveForms.forEach((e) => {
      if (oscillator.includes(e)) oscillatorWave = e;
    });
    oscTypes.forEach((e) => {
      if (oscillator.includes(e)) oscillatorWave = e;
    });
    oscillatorPartials = oscillator
      .replace(oscillatorWave, "")
      .replace(oscillatorType, "");

    setOscWave(oscillatorWave);
    setOscType(oscillatorType);
    setOscPartials(oscillatorPartials);

    console.log(oscillatorWave, oscillatorType, oscillatorPartials);
  };

  const handleOscWaveSelect = (event) => {
    setOscWave(event.target.value);
    let newWave = oscType + event.target.value + oscPartials;
    props.instrument.set({ oscillator: { type: newWave } });
  };

  const handleOscTypeSelect = (event) => {
    let newType = event.target.value === "basic" ? "" : event.target.value;

    setOscType(newType);
    let newWave = newType + oscWave + oscPartials;
    //if old type is pulse or pwm, add sine form
    newWave = newWave === "pulse" || newWave === "pwm" ? "sine" : newWave;
    //if new is pulse or pwm remove form and partials
    newWave = newType === "pulse" || newType === "pwm" ? newType : newWave;
    props.instrument.set({ oscillator: { type: newWave } });

  };

  const handleOscPartialsSelect = (e, value) => {
    let newPartial = value === 0 ? "" : value;
    setOscPartials(newPartial);
    let newWave = oscType + oscWave + newPartial;
    props.instrument.set({ oscillator: { type: newWave } });
  };

  const drawOscWave = () => {
    props.instrument._dummyVoice.oscillator
      .asArray(128)
      .then((r) => setOscillatorWaveForm(drawWave(r)));
  };

  useEffect(() => {
    drawOscWave();
  }, [oscWave, oscType, oscPartials]);

  useEffect(() => {
    getOscillatorData();
  }, [props.instrument]);

  return (
    <Card className="oscillator-editor">
    <Typography variant="overline">Oscillator</Typography>
      <svg
        width="128px"
        height="64px"
        style={{ border: "1px solid #05386b", marginBottom: 8 }}
        ref={waveSvg}
      >
        <path d={oscillatorWaveForm} stroke="#05386b" fill="none" />
      </svg>

      <FormControl>
        <InputLabel>Type</InputLabel>
        <Select
          native
          value={oscType}
          onChange={handleOscTypeSelect}
        >
          {oscTypes.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel>Wave</InputLabel>
        <Select
          disabled={oscType === "pwm" || oscType === "pulse"}
          native
          value={oscWave}
          onChange={handleOscWaveSelect}
        >
          {waveForms.map((e) => (
            <option key={e} value={e} className="capitalize">
              {e}
            </option>
          ))}
        </Select>
      </FormControl>
      <Slider
      style={{width:"70%"}}
        disabled={oscType === "pwm" || oscType === "pulse"}
        valueLabelDisplay="auto"
        value={oscPartials}
        onChange={handleOscPartialsSelect}
        min={0}
        max={24}
        valueLabelFormat={(x)=>x===0?"Off":x}

      />

        {/*Object.keys(props.instrument._dummyVoice.oscillator._oscillator).map((e,i)=>{
            console.log(e)

        })*/}
      
    </Card>
  );
}

const drawWave = (wavearray) => {
  if (!wavearray.length) {
    return;
  }
  let wave = wavearray;
  let pathstring = "M 0 32 ";

  for (let x = 0; x < wavearray.length; x++) {
    pathstring += "L " + x + " " + (-wave[x] * 32 + 32).toFixed(1) + " ";
  }

  return pathstring;
};

export default OscillatorEditor;