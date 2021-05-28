import React, { useState, useEffect, useRef, Fragment } from "react";

import * as Tone from "tone";

import { mapLogScale } from "../../assets/musicutils";

import { Typography, Slider } from "@material-ui/core";

import "./FilterEditor.css";

function FilterEditor(props) {
  const XYSelector = useRef(null);

  const [selecting, setIsSelecting] = useState(false);
  const [tempFilter, setTempFilter] = useState(() => {
    return new Tone.Filter({
      ...props.instrument.get().filter,
      frequency: props.instrument.get().filterEnvelope.baseFrequency,
    });
  });
  const [selectorPos, setSelectorPos] = useState({
    x: tempFilter.get().frequency / 20000,
    y: tempFilter.get().Q / 5,
  });
  const [filterFR, setFilterFR] = useState(tempFilter.getFrequencyResponse(64));
  const [filterFRWave, setFilterFRWave] = useState(drawWave(filterFR));

  const handleXYSelect = (event) => {
    if (selecting) {
      let parentOffset = XYSelector.current.getBoundingClientRect();
      let values = {
        x: (event.clientX - parentOffset.x) / 128,
        y: (1 - (event.clientY - parentOffset.y) / 64).toFixed(2),
      };

      values.x = values.x < 0 ? 0 : values.x > 1 ? 1 : values.x;
      values.y = values.y < 0 ? 0 : values.y > 1 ? 1 : values.y;

      setSelectorPos(values);

      tempFilter.set({
        frequency: Math.floor(
          mapLogScale(selectorPos.x, 0, 1, Math.log(20), Math.log(20000))
        ),
      });
      tempFilter.set({ Q: selectorPos.y * 5 });

      setFilterFR(tempFilter.getFrequencyResponse(64));
    }
  };

  const registerToSynth = () => {
    setIsSelecting(false);
    props.handleFilterChange(tempFilter.get());

    //tempFilter.dispose();
    //setTempFilter({});
    //setTempFilter(new Tone.Filter(props.instrument.get().filter));
  };

  useEffect(() => {
    setSelectorPos({
      x: mapLogScale(
        tempFilter.get().frequency,
        Math.log(20),
        Math.log(20000),
        1,
        0
      ),
      y: tempFilter.get().Q / 5,
      final: true,
    });
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
    console.log("instr change triggered");
  }, [props.instrument]);

  return (
    <div className="filter-editor">
      <svg
        onMouseDown={() => setIsSelecting(true)}
        onMouseMove={handleXYSelect}
        onMouseUp={registerToSynth}
        width="128px"
        height="64px"
        style={{ border: "1px solid #05386b", marginBottom: 8 }}
        ref={XYSelector}
      >
        <path d={filterFRWave} stroke="#05386b" fill="none" />
        <rect
          x={Math.floor((selectorPos.x) * 128)}
          height="100%"
          width="1"
          fill="#05386b"
          fillOpacity="0.7"
        />
        <rect
          y={Math.floor((1 - selectorPos.y) * 64)}
          height="1"
          width="100%"
          fill="#05386b"
          fillOpacity="0.7"
        />
      </svg>
      <Typography variant="overline" className="filter-editor-labels">
        {"Frequency:" +
          Math.floor(tempFilter.get().frequency) +
          "Hz"}
      </Typography>
      <div className="break" />
      <Typography variant="overline" className="filter-editor-labels">
        {"Resonance:" + (selectorPos.y * 5).toFixed(2)}
      </Typography>
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
