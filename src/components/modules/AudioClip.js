import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import { Resizable, ResizableBox } from "react-resizable";
import Draggable from "react-draggable";


import "./AudioClip.css";

function AudioClip(props) {
  const nodeRef = React.useRef(null);
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
    console.log(size)
    setClipWidth(size.width);
  };

  const handleDrag = (event, element) => {
    props.setScore((prev) => {
      let newScore = [...prev];
      let newTime =
        (element.x / document.getElementById(props.parentId).clientWidth) *
        Tone.Time(Tone.Transport.loopEnd).toSeconds();
      newScore[props.index].time = newTime;
      return newScore;
    });
  };

  useEffect(() => {
    updateLine();
  }, []);

  return (
    <Draggable axis="x" onStop={handleDrag} >
      {/*TODO: bounds={'parent'}*/}
      <Resizable
        //resizeHandles={["e"]}
        height={document.getElementById(props.parentId).clientHeight}
        width={clipWidth}
        onResize={handleResize}
      >
        <div
          className="sampler-audio-clip"
          id={"clip" + props.index}
          style={{
            height:"100%",
            width: clipWidth + "px",
            backgroundColor: "white",
          }}
        >
          <svg
            className="sampler-audio-clip-wave"
            preserveAspectRatio="xMinYMin slice"

          >
            {drawClipWave(
              props.buffer.toArray(),
              clipHeight,
              clipWidth,
              props.color
            )}
          </svg>
        </div>
      </Resizable>
    </Draggable>
  );
}

const drawClipWave = (wavearray, clipHeight, clipWidth, color) => {
  let pathstring = "M 0 " + clipHeight / 2 + " ";
  let scale = 450;

  for (let x = 0; x < clipWidth; x++) {
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
