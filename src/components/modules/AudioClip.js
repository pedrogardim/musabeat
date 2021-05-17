import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import { CircularProgress, Typography } from "@material-ui/core";

import "./AudioClip.css";

function AudioClip(props) {
  const [isBufferLoaded, setIsBufferLoaded] = useState(true);
  const [clipHeight,setClipHeight] = useState(0)

  const [audioBuffer, setAudioBuffer] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const updateLine = () => {
    let height = document.getElementById("clip"+props.index).clientHeight;
    setClipHeight(height);
    console.log(clipHeight);

  }

  useEffect(()=>{
    updateLine();
  })

  return (
    <div
      className="sampler-audio-clip"
      id={"clip"+props.index}
      style={{
        width: (props.buffer.duration / Tone.Time(Tone.Transport.loopEnd).toSeconds()) * 100 + "%",
        backgroundColor:props.color[900]
      }}
    >
      {isBufferLoaded ? (
        <svg className="sampler-audio-clip-wave" viewBow={"0 0 "+clipHeight+" "+clipHeight} >
          {drawClipWave(props.buffer.toArray(),clipHeight,props.color)}
        </svg>
      ) : (
        <CircularProgress />
      )}
    </div>
  );
}

const drawClipWave = (wavearray, clipHeight,color) => {
  let pathstring = "M 0 "+clipHeight/2+" ";
  let scale = 570;

  for (let x = 0; x < wavearray.length; x++) {
    pathstring += "L " + x + " " + (wavearray[x*scale] * clipHeight*2 + clipHeight/2) + " ";
  }
  return <path d={pathstring} stroke={color[200]} fill="none" />
  ;
};

export default AudioClip;
