import React, { useState, useEffect, Fragment } from "react";

import {
  Icon,
  IconButton,
  ButtonGroup,
  Button,
  Paper,
  Grow,
  Select,
} from "@material-ui/core";

import { waveTypes } from "../../../assets/musicutils";
import { useTranslation } from "react-i18next";

import { waveformShapes } from "../../../assets/musicutils";

import FilterEditor from "./FilterEditor";
import EnvelopeControl from "./EnvelopeControl";
import Knob from "./Knob";

import "../InstrumentEditor.css";

const waveForms = ["sine", "square", "triangle", "sawtooth"];

//const filterRollOffs = [-12, -24, -48, -96];

function SynthModifier(props) {
  const { t } = useTranslation();

  //const [selectedFile, setSelectedFile] = useState(null);
  const [instrumentParamenters, setInstrumentParamenters] = useState(
    props.instrument.get()
  );

  //console.log(instrument.get());

  const type =
    props.instrument._dummyVoice.name === "MonoSynth" ? "filter" : "modulation";

  const handleChange = (parameter, value) => {
    //console.log(parameter, value);
    setInstrumentParamenters((prev) => {
      return { ...prev, [parameter]: value };
    });
    props.instrument.set({ [parameter]: value });
  };

  const handleWaveTypeSelect = (parameter, value) => {
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
      filterEnvelope: { baseFrequency: newFilter.frequency },
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

  let mainContent = instrumentParamenters.hasOwnProperty("filter") ? (
    <FilterEditor
      instrumentParamenters={instrumentParamenters}
      handleFilterChange={handleFilterChange}
      instrument={props.instrument}
      expanded={props.expanded}
      mousePosition={props.mousePosition}
    />
  ) : (
    <>
      {(instrumentParamenters.hasOwnProperty("modulationIndex")
        ? ["harmonicity", "modulationIndex"]
        : ["harmonicity"]
      ).map((parameter, index) => (
        <Knob
          size={48}
          min={0}
          max={50}
          defaultValue={instrumentParamenters[parameter]}
          onChange={(v) => handleChange(parameter, v)}
          label={t(`instrumentEditor.synthEditor.parameters.${parameter}`)}
          mousePosition={props.mousePosition}
          style={{ margin: "0 16px" }}
        />
      ))}

      <div className="break" />

      {props.expanded && (
        <ButtonGroup variant="outlined">
          {waveForms.map((e, i) => (
            <Button
              color={"primary"}
              onClick={() => handleWaveTypeSelect("modulation", e)}
              variant={
                instrumentParamenters.modulation.type === e
                  ? "contained"
                  : "outlined"
              }
              key={i}
              value={e}
            >
              <svg
                viewBox={waveformShapes.viewBox}
                preserveAspectRatio="none"
                style={{
                  fill: "none",
                  stroke:
                    instrumentParamenters.modulation.type === e
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
      )}

      {/* <Select
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
      </Select> */}

      <div className="break" />

      <EnvelopeControl
        onInstrumentMod={props.onInstrumentMod}
        instrument={props.instrument}
        type={type}
        mousePosition={props.mousePosition}
        label={props.expanded}
      />
    </>
  );

  return props.expanded ? (
    <Grow in={props.expanded} timeout={200}>
      <div className="ie-synth-fs-item">
        <IconButton
          onClick={() => props.setExpanded(null)}
          className="mp-closebtn"
          color="primary"
        >
          <Icon>close</Icon>
        </IconButton>
        <Select
          native
          value={
            props.instrument._dummyVoice
              ? props.instrument._dummyVoice.name
              : props.instrument.name
          }
          onChange={props.changeInstrumentType}
          style={{ position: "absolute", top: 0 }}
        >
          {["MonoSynth", "FMSynth", "AMSynth"].map((e, i) => (
            <option value={e}>{t(`instrumentEditor.types.${e}`)}</option>
          ))}
        </Select>
        {mainContent}
      </div>
    </Grow>
  ) : (
    <Paper
      className="ie-synth-compact-item"
      elevation={5}
      onMouseDown={(e) =>
        e.target.className &&
        e.target.className.includes &&
        e.target.className.includes("ie-synth-compact-item") &&
        props.setExpanded(1)
      }
    >
      {mainContent}
    </Paper>
  );
}

export default SynthModifier;
