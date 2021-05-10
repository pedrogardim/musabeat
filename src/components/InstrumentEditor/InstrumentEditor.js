import React, { useState } from "react";

import { Select } from "@material-ui/core";

import AudioFileItem from "./AudioFileItem";

import { instruments } from "../../assets/instrumentpatches";
import { instrumentContructor } from "../../assets/musicutils";

import "./InstrumentEditor.css";

function InstrumentEditor(props) {
  const [selectedPatch, setSelectedPatch] = useState(0);
  //const [selectedFile, setSelectedFile] = useState(null);
  const [instrument, setInstrument] = useState(props.instrument);

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
        //props.updateModules((previous) => previous.map((e,i)=>{return { ...previous, instrument:instrumentContructor(event.target.value)}}));
        break;
      case 2:
        break;
    }
  };

  let mainContent = "Nothing Here";

  switch (instrument.name) {
    case "Players":
      let list = [];
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
    case 2:
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
