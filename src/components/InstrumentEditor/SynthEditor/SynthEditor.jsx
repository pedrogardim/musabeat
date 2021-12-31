import React, { useState } from "react";

import Oscillator from "./Oscillator";
import Modifier from "./Modifier";
import Output from "./Output";

import { useTranslation } from "react-i18next";

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
      className="ie-synth-cont"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Oscillator
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

      <Modifier
        onInstrumentMod={props.onInstrumentMod}
        instrument={props.instrument}
        mousePosition={mousePosition}
        expanded={expanded === 1}
        setExpanded={setExpanded}
        changeInstrumentType={props.changeInstrumentType}
      />
      <div
        style={{
          height: 3,
          backgroundColor: "rgba(0,0,0,0.3)",
          minWidth: 24,
        }}
      />
      <Output
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
  );
}

export default SynthEditor;
