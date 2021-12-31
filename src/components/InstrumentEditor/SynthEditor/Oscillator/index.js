import React, { useState, useEffect, useRef, Fragment } from "react";

import {
  Typography,
  Select,
  InputLabel,
  FormControl,
  Slider,
  Paper,
  Icon,
  IconButton,
  ButtonGroup,
  Button,
  Grow,
  Box,
} from "@mui/material";

import Knob from "./Knob";

import { useTranslation } from "react-i18next";

import { waveformShapes } from "../../../assets/musicutils";

import "./OscillatorEditor.css";

const waveForms = ["sine", "square", "triangle", "sawtooth"];
const oscTypes = ["basic", "fm", "am", "fat", "pwm", "pulse"];

function OscillatorEditor(props) {
  const { t } = useTranslation();
  const waveSvg = useRef(null);

  const [oscillatorWaveForm, setOscillatorWaveForm] = useState("");
  const [oscWave, setOscWave] = useState("");
  const [oscType, setOscType] = useState("");
  const [oscPartials, setOscPartials] = useState("");

  const getOscillatorData = () => {
    let oscillator = props.instrument.get().oscillator.type;
    let oscillatorWave, oscillatorType, oscillatorPartials;
    oscillatorType = oscillatorPartials = oscillatorWave = "";
    waveForms.forEach((e) => {
      if (oscillator.includes(e)) oscillatorWave = e;
    });
    oscTypes.forEach((e) => {
      if (oscillator.includes(e)) oscillatorType = e;
    });
    oscillatorPartials = oscillator
      .replace(oscillatorWave, "")
      .replace(oscillatorType, "");

    setOscWave(oscillatorWave);
    setOscType(oscillatorType);
    setOscPartials(oscillatorPartials);

    //console.log(oscillatorWave, oscillatorType, oscillatorPartials);
  };

  const handleOscWaveSelect = (v) => {
    setOscWave(v);
    setOscPartials("");
    let newWave = oscType + v;
    props.instrument.set({ oscillator: { type: newWave } });
    props.onInstrumentMod();
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

    props.onInstrumentMod();
  };

  const handleOscPartialsSelect = (value) => {
    let newPartial = value === 0 ? "" : value;
    setOscPartials(newPartial);
    let newWave = oscType + oscWave + newPartial;
    props.instrument.set({ oscillator: { type: newWave } });
  };

  const handleOscParamSelect = (param, value) => {
    props.instrument.set({ oscillator: { [param]: value } });
    drawOscWave();
  };

  const drawOscWave = () => {
    props.instrument._dummyVoice.oscillator
      .asArray(128)
      .then((r) => setOscillatorWaveForm(drawWave(r)));
  };

  useEffect(
    drawOscWave,
    //console.log(oscWave, oscType, oscPartials);
    [oscWave, oscType, oscPartials, props.instrument._dummyVoice.oscillator]
  );

  useEffect(getOscillatorData, [props.instrument]);

  /*================================================================================*/
  /*================================================================================*/
  /*======================================JSX=======================================*/
  /*================================================================================*/
  /*================================================================================*/

  let mainContent = (
    <>
      {props.expanded && (
        <Typography variant="overline">
          {t("instrumentEditor.synthEditor.parameters.oscillator")}
        </Typography>
      )}
      <div className="break" />
      <svg
        width="128px"
        height="64px"
        style={{ border: "1px solid #3f51b5", marginBottom: 8 }}
        ref={waveSvg}
      >
        <path d={oscillatorWaveForm} stroke="#3f51b5" fill="none" />
      </svg>

      <div className="break" />

      <ButtonGroup
        variant="outlined"
        disabled={oscType === "pwm" || oscType === "pulse"}
      >
        {waveForms.map((e, i) => (
          <Button
            color={"primary"}
            onClick={() => handleOscWaveSelect(e)}
            variant={oscWave === e ? "contained" : "outlined"}
            key={i}
            value={e}
          >
            <svg
              viewBox={waveformShapes.viewBox}
              preserveAspectRatio="none"
              style={{
                fill: "none",
                stroke: oscWave === e ? "white" : "rgb(63, 81, 181)",
                strokeWidth: 8,
                height: 16,
                width: 32,
                overflow: "visible",
              }}
            >
              {waveformShapes[e]}
            </svg>
          </Button>
        ))}
      </ButtonGroup>

      {oscType !== "pwm" &&
        oscType !== "pulse" &&
        oscWave === "sine" &&
        props.expanded && (
          <Knob
            defaultValue={oscPartials}
            onChange={handleOscPartialsSelect}
            onChangeCommitted={() => props.onInstrumentMod()}
            style={{ marginLeft: 16 }}
            min={0}
            max={24}
            size={36}
            step={1}
            label={"Mod"}
          />
        )}
    </>
  );

  let oscillatorOptions = (
    <>
      <FormControl>
        <InputLabel>
          {t("instrumentEditor.synthEditor.parameters.type")}
        </InputLabel>
        <Select
          variant="standard"
          tabIndex={-1}
          native
          value={oscType}
          onChange={handleOscTypeSelect}
          style={{ marginBottom: 32 }}
        >
          {oscTypes.map((e) => (
            <option key={e} value={e}>
              {t(`instrumentEditor.synthEditor.oscMode.${e}`)}
            </option>
          ))}
        </Select>
      </FormControl>
      <div className="break" />
      {oscType === "fat" && (
        <>
          <Knob
            defaultValue={props.instrument.get().oscillator.count}
            onChange={(v) => handleOscParamSelect("count", v)}
            onChangeCommitted={() => props.onInstrumentMod()}
            style={{ margin: 16 }}
            min={1}
            max={8}
            size={36}
            step={1}
            label={"Count"}
          />
          <Knob
            defaultValue={props.instrument.get().oscillator.spread}
            onChange={(v) => handleOscParamSelect("spread", v)}
            onChangeCommitted={() => props.onInstrumentMod()}
            style={{ margin: 16 }}
            min={0}
            max={100}
            size={36}
            step={1}
            label={"Spread"}
          />
        </>
      )}
      {(oscType === "fm" || oscType === "am") && (
        <>
          <ButtonGroup variant="outlined">
            {waveForms.map((e, i) => (
              <Button
                color={"primary"}
                onClick={() => handleOscParamSelect("modulationType", e)}
                variant={
                  props.instrument.get().oscillator.modulationType === e
                    ? "contained"
                    : "outlined"
                }
                key={e}
              >
                <svg
                  viewBox={waveformShapes.viewBox}
                  preserveAspectRatio="none"
                  style={{
                    fill: "none",
                    stroke:
                      props.instrument.get().oscillator.modulationType === e
                        ? "white"
                        : "rgb(63, 81, 181)",
                    strokeWidth: 8,
                    height: 16,
                    width: 32,
                    overflow: "visible",
                  }}
                >
                  {waveformShapes[e]}
                </svg>
              </Button>
            ))}
          </ButtonGroup>

          <Knob
            defaultValue={props.instrument.get().oscillator.harmonicity}
            onChange={(v) => handleOscParamSelect("harmonicity", v)}
            onChangeCommitted={() => props.onInstrumentMod()}
            style={{ margin: 16 }}
            min={0}
            max={50}
            size={36}
            label={t(`instrumentEditor.synthEditor.parameters.harmonicity`)}
          />
        </>
      )}
      {oscType === "fm" && (
        <Knob
          defaultValue={props.instrument.get().oscillator.modulationIndex}
          onChange={(v) => handleOscParamSelect("modulationIndex", v)}
          onChangeCommitted={() => props.onInstrumentMod()}
          style={{ margin: 16 }}
          min={0}
          max={50}
          size={36}
          label={"Mod.index"}
        />
      )}
      {oscType === "pwm" && (
        <Knob
          defaultValue={props.instrument.get().oscillator.modulationFrequency}
          onChange={(v) => handleOscParamSelect("modulationFrequency", v)}
          onChangeCommitted={() => props.onInstrumentMod()}
          style={{ margin: 16 }}
          min={0.1}
          max={20000}
          size={36}
          step={0.1}
          label={"Mod.Frec"}
        />
      )}

      {oscType === "pulse" && (
        <Knob
          defaultValue={props.instrument.get().oscillator.width}
          onChange={(v) => handleOscParamSelect("width", v)}
          onChangeCommitted={() => props.onInstrumentMod()}
          style={{ margin: 16 }}
          min={-1}
          max={0}
          size={36}
          label={"Width"}
        />
      )}
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
        <div
          style={{
            flex: "1 0 50%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            alignContent: "space-evenly",
          }}
        >
          {mainContent}
        </div>
        <div
          style={{
            flex: "1 0 50%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            alignContent: "center",
          }}
        >
          {oscillatorOptions}
        </div>
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
        props.setExpanded(0)
      }
    >
      {mainContent}
    </Paper>
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
