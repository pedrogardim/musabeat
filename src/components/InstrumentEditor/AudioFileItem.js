import React, { useEffect, useState } from "react";
import { labels } from "../../assets/drumkits";
import { waveTypes } from "../../assets/musicutils";

import "./AudioFileItem.css";

import { Card, Typography, Select } from "@material-ui/core";

function AudioFileItem(props) {
  const isSynth = props.instrument.name === "PolySynth";

  const [waveZoomX, setWaveZoomX] = useState(400);
  const [wavePath, setWavePath] = useState("");
  const [wave, setWave] = useState("");

  const handleClick = () => {
    !isSynth && props.instrument.player(props.index).start(0);
  };

  const handleWaveChange = (event) => {
    var newWave = event.target.value;
    props.instrument.set({ oscillator: { type: newWave } });
    drawWave(props.buffer.asArray(128), 0, isSynth, setWavePath);
  };

  useEffect(
    () =>
      drawWave(
        isSynth ? props.buffer.asArray(128) : props.buffer.toArray(),
        0,
        isSynth,
        setWavePath
      ),
    []
  );

  console.log(props.instrument.get());

  return (
    <Card onClick={handleClick} className={"audio-file-item"}>
      <svg
        width="64px"
        height="64px"
        viewBow={"0 0 64 64"}
        id="ie-mainosc-wave"
      >
        <path d={wavePath} stroke="#05386b" fill="none" />
      </svg>
      {isSynth ? (
        <Select
          native
          value={props.instrument.get().oscillator.type}
          onChange={handleWaveChange}
        >
          {waveTypes.map((e, i) => (
            <option value={e}>{e}</option>
          ))}
        </Select>
      ) : (
        <Typography variant="overline">
          {props.name === undefined ? labels[props.index] : props.name}
        </Typography>
      )}
    </Card>
  );
}

const drawWave = (wavearray, scale, isSynth, setWavePath) => {
  let pathstring = "M 0 32 ";

  let wave = isSynth
    ? wavearray.then((r) => {
        wave = r;

        for (let x = 0; x < wave.length; x++) {
          pathstring += "L " + x + " " + (wave[x * 1] * 32 + 32) + " ";
        }
        setWavePath(pathstring);
      })
    : wavearray;
  console.log(wave);

  for (let x = 0; x < wave.length; x++) {
    pathstring += "L " + x + " " + (wave[x * scale] * 32 + 32) + " ";
  }

  setWavePath(pathstring);
};

export default AudioFileItem;
