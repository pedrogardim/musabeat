import React, { useEffect, useState } from "react";
import { labels } from "../../assets/drumkits";

import "./AudioFileItem.css";

import { Card, Typography } from "@material-ui/core";

function AudioFileItem(props) {
  const [waveZoomX, setWaveZoomX] = useState(400);
  const [wave, setWave] = useState(drawWave(props.buffer.toArray(), waveZoomX));
  

  const handleClick = () => {
    props.instrument.player(props.index).start(0);

  };

  useEffect(()=>{
    console.log(props.instrument.player(props.index).state)

  },[props.instrument.player(props.index)])

  return (
    <Card onClick={handleClick} className={"audio-file-item "+ (props.instrument.player(props.index).state === "started" ? "active-audio-file-item" : "")}>
      <svg
        width="64px"
        height="64px"
        viewBow={"0 0 64 64"}
        id="ie-mainosc-wave"
      >
        {wave}
      </svg>
      <Typography variant="overline">
        {props.name === undefined ? labels[props.index] : props.name}
      </Typography>
    </Card>
  );
}

const drawWave = (wavearray, scale) => {
  let pathstring = "M 0 32 ";

  for (let x = 0; x < wavearray.length; x++) {
    pathstring += "L " + x + " " + (wavearray[x * scale] * 32 + 32) + " ";
  }

  return <path d={pathstring} stroke="#05386b" fill="none" />;
};
export default AudioFileItem;
