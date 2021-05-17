import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import { Resizable, ResizableBox } from "react-resizable";
import Draggable from "react-draggable";

import "./AudioClip.css";

function AudioClip(props) {
  const [clipHeight, setClipHeight] = useState(0);
  const [clipWidth, setClipWidth] = useState(
    (props.buffer.duration / Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
      100
  );

  const updateLine = () => {
    let height = document.getElementById("clip" + props.index).clientHeight;
    setClipHeight(height);
  };

  const handleResize = (event, { element, size, handle }) => {
    setClipWidth(size.width);
  };

  useEffect(() => {
    updateLine();
  }, [props.buffer]);

  return (
    <Draggable
    axis="x">
      <Resizable
        resizeHandles={["e"]}
        height={"100%"}
        width={clipWidth}
        onResize={handleResize}
      >
        <div
          className="sampler-audio-clip"
          id={"clip" + props.index}
          style={{
            width: clipWidth +"px",
            backgroundColor: props.color[100],
          }}
        >
          <svg
            className="sampler-audio-clip-wave"
            viewBow={"0 0 " + clipHeight + " " + clipHeight}
          >
            {drawClipWave(props.buffer.toArray(), clipHeight, props.color)}
          </svg>
        </div>
      </Resizable>
    </Draggable>
  );
}

const drawClipWave = (wavearray, clipHeight, color) => {
  let pathstring = "M 0 " + clipHeight / 2 + " ";
  let scale = 450;

  for (let x = 0; x < wavearray.length / 2; x++) {
    pathstring +=
      "L " +
      x +
      " " +
      (wavearray[Math.floor(x * scale)] * clipHeight * 2 + clipHeight / 2) +
      " ";
  }
  return <path d={pathstring} stroke={color[900]} fill="none" />;
};

export default AudioClip;
