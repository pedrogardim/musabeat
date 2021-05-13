import React, { useState, Fragment } from "react";

import { Select, Typography, Slider } from "@material-ui/core";

import AudioFileItem from "./AudioFileItem";
import EnvelopeControl from "./EnvelopeControl";

import { instruments } from "../../assets/instrumentpatches";
import { instrumentContructor } from "../../assets/musicutils";

import "./InstrumentEditor.css";

function InstrumentEditor(props) {
  const [selectedPatch, setSelectedPatch] = useState(0);
  //const [selectedFile, setSelectedFile] = useState(null);
  const [instrument, setInstrument] = useState(props.instrument);

  //console.log(instrument.get());

  const handlePatchSelect = (event) => {
    setSelectedPatch(event.target.value);
    switch (instrument.name) {
      case "PolySynth":
        props.updateModules((previous) =>
          previous.map((module, i) => {
            if (i === props.index) {
              let newModule = { ...module };
              newModule.instrument = {};
              newModule.instrument = instrumentContructor(event.target.value);
              return newModule;
            } else {
              return module;
            }
          })
        );
        break;
      case 2:
        break;
    }
    //auto close
    props.setInstrumentEditorMode(false);
    //
  };


  let mainContent = "Nothing Here";

  let list = [];

  switch (instrument.name) {
    case "Players":
      instrument._buffers._buffers.forEach((e, i) =>
        list.push(
          <AudioFileItem
            active={instrument.player(i).state === "started"}
            key={i}
            index={i}
            instrument={instrument}
            buffer={e}
          />
        )
      );
      mainContent = list;
      break;
    case "PolySynth":
      list.push(
        <div className="instrument-editor-column" key={0}>
          <AudioFileItem
            instrument={instrument}
            buffer={instrument._dummyVoice.oscillator}
            name={instrument.get().oscillator.type}
          />
        </div>
      );
      list.push(
        <div className="instrument-editor-column" key={1}>
          {Object.keys(instrument.get()).map(
            (envelope, envelopeIndex) =>
              (envelope.toLowerCase().includes("envelope")) && (
                <EnvelopeControl instrument={instrument} envelopeType={envelope}/>
              )
          )}
        </div>
      );
      list.push(<div className="instrument-editor-column" key={2}></div>);
      mainContent = list;
      break;
  }

  return (
    <div className="instrument-editor">
      <Select
        native
        className="instrument-editor-patch-select"
        value={selectedPatch}
        onChange={handlePatchSelect}
      >
        {instruments.map((kit, kitIndex) => (
          <option key={kitIndex} value={kitIndex}>
            {kit.name}
          </option>
        ))}
      </Select>
      <div className="break" />

      {mainContent}
    </div>
  );
}

export default InstrumentEditor;
