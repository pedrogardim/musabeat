import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import { Resizable, ResizableBox } from "react-resizable";
import Draggable from "react-draggable";

import "./AudioClip.css";

function AudioClip(props) {
  const [clipHeight, setClipHeight] = useState(
    document.getElementById("module-" + props.parentId).clientHeight
  );
  const [clipWidth, setClipWidth] = useState(
    (props.buffer.duration / Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
      document.getElementById("module-" + props.parentId).clientWidth
  );

  const [clipPosition, setClipPosition] = useState(
    (props.score.time / Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
      document.getElementById("module-" + props.parentId).clientWidth
  );

  const updateLine = () => {
    setClipHeight(
      (props.buffer.duration / Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
        document.getElementById("module-" + props.parentId).clientWidth
    );
  };
  
  const handleWindowResize = () => {
    setClipWidth((props.buffer.duration / Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
    document.getElementById("module-" + props.parentId).clientWidth);
    setClipPosition((props.score.time / Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
    document.getElementById("module-" + props.parentId).clientWidth)
  };
  
  const handleDrag = (event, element) => {
    setClipPosition(element.x);
    props.setScore((prev) => {
      let newScore = [...prev];
      let newTime =
        (element.x /
          document.getElementById("module-" + props.parentId).clientWidth) *
        Tone.Time(Tone.Transport.loopEnd).toSeconds();
      newScore[props.index].time = newTime;
      return newScore;
    });
  };

  useEffect(() => {
    //watch to window resize to update clips position
    window.addEventListener("resize", handleWindowResize);
  }, []);

  return (
    <Draggable axis="x" onDrag={handleDrag} position={{ x: clipPosition, y:0 }}>
      {/*TODO:*/}
      {/*<Resizable
        resizeHandles={["e"]}
        height={clipHeight}
        width={clipWidth}
        onResize={handleResize}
      >*/}
      <div
        className="sampler-audio-clip"
        id={"clip" + props.index}
        style={{
          width: clipWidth + "px",
          backgroundColor: props.color[700],
          border: "solid 2px " + props.color[400],
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
      {/*</Resizable>*/}
    </Draggable>
  );
}

const drawClipWave = (wavearray, clipHeight, clipWidth, color) => {
  let scale = Math.floor(wavearray.length / clipWidth);

  let pathstring = "M 0 " + clipHeight / 2 + " ";

  for (let x = 0; x < clipWidth; x++) {
    pathstring +=
      "L " +
      x +
      " " +
      (wavearray[x * scale] * clipHeight * 2 + clipHeight / 2) +
      " ";
  }
  return <path d={pathstring} stroke={color[100]} fill="none" />;
};

export default AudioClip;
