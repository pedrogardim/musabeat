import React, { useState, Fragment, useRef, useEffect } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import {
  List,
  Divider,
  IconButton,
  MenuItem,
  Tooltip,
  LinearProgress,
  Fab,
  Icon,
  Grid,
  Select,
} from "@material-ui/core";

import EnvelopeControl from "./EnvelopeControl";
import OscillatorEditor from "./OscillatorEditor";
import SynthModifier from "./SynthModifier";
import SynthOutput from "./SynthOutput";

import { useTranslation } from "react-i18next";

import {
  detectPitch,
  fileTypes,
  fileExtentions,
} from "../../../assets/musicutils";

import "./../InstrumentEditor.css";

function SynthEditor(props) {
  const { t } = useTranslation();

  const [mousePosition, setMousePosition] = useState([]);
  const [expanded, setExpanded] = useState(null);

  const handleMouseMove = (e) => {
    setMousePosition([e.pageX, e.pageY]);
    //console.log(e.pageX, e.pageY);
  };

  const handleMouseUp = () => {
    setMousePosition(null);
  };

  /* 
  useEffect(() => {
    console.log(mousePosition);
  }, [mousePosition]);
   */

  return (
    <div
      className="instrument-editor"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Select
        native
        value={
          props.instrument._dummyVoice
            ? props.instrument._dummyVoice.name
            : props.instrument.name
        }
        onChange={props.changeInstrumentType}
        className="instrument-editor-type-select"
      >
        {["MonoSynth", "FMSynth", "AMSynth", "Sampler"].map((e, i) => (
          <option value={e}>{t(`instrumentEditor.types.${e}`)}</option>
        ))}
      </Select>
      <div className="ie-synth-cont">
        <OscillatorEditor
          onInstrumentMod={props.onInstrumentMod}
          instrument={props.instrument}
          mousePosition={mousePosition}
          expanded={expanded === 0}
          setExpanded={setExpanded}
        />
        <div
          style={{
            height: 3,
            backgroundColor: "rgba(0,0,0,0.3)",
            minWidth: 24,
          }}
        />

        <SynthModifier
          onInstrumentMod={props.onInstrumentMod}
          instrument={props.instrument}
          mousePosition={mousePosition}
          expanded={expanded === 1}
          setExpanded={setExpanded}
        />
        <div
          style={{
            height: 3,
            backgroundColor: "rgba(0,0,0,0.3)",
            minWidth: 24,
          }}
        />
        <SynthOutput
          onInstrumentMod={props.onInstrumentMod}
          instrument={props.instrument}
          mousePosition={mousePosition}
          expanded={expanded === 2}
          setExpanded={setExpanded}
        />

        {/* {Object.keys(props.instrument.get()).map(
          (envelope, envelopeIndex) =>
            envelope.toLowerCase().includes("envelope") && (
              <EnvelopeControl
                onInstrumentMod={props.onInstrumentMod}
                instrument={props.instrument}
                envelopeType={envelope}
                mousePosition={mousePosition}
              />
            )
        )} */}
      </div>
    </div>
  );
}

export default SynthEditor;
