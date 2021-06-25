import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import { Resizable, ResizableBox } from "react-resizable";
import Draggable from "react-draggable";

import "./AudioClip.css";

function AudioClip(props) {
  const [clipHeight, setClipHeight] = useState(0);
  const [clipWidth, setClipWidth] = useState(0);
  const [clipPosition, setClipPosition] = useState(0);

  const [waveForm, setWaveForm] = useState([]);

  const updateClipPosition = () => {
    if (props.parentRef.current === null) return;
    let timePerPixel =
      props.parentRef.current.offsetWidth /
      Tone.Time(Tone.Transport.loopEnd).toSeconds();
    setClipPosition(props.score.time * timePerPixel);
    setClipWidth(props.score.duration * timePerPixel);
    setClipHeight(props.parentRef.current.offsetHeight);
  };

  const handleDrag = (event, element) => {
    setClipPosition(element.x);
  };

  const handleDragStart = () => {
    props.instrument.stop();
  };

  const handleDragStop = () => {
    let newTime =
      (clipPosition / props.parentRef.current.offsetWidth) *
      Tone.Time(Tone.Transport.loopEnd).toSeconds();

    props.setScore((prev) => {
      let newScore = [...prev];
      newScore[props.index].time = newTime;
      return newScore;
    });
  };

  useEffect(() => {
    //watch to window resize to update clips position

    window.addEventListener("resize", updateClipPosition);
  }, []);

  useEffect(() => {
    updateClipPosition();
  }, [
    props.sessionSize,
    props.score,
    props.instrument,
    props.instrument.loaded,
    props.moduleZoom,
    props.fullScreen,
  ]);

  useEffect(() => {
    //watch to window resize to update clips position
    //console.log(clipWidth, clipHeight);
    props.loaded &&
      drawClipWave(
        props.instrument.buffer.toArray(0),
        clipHeight,
        clipWidth,
        props.color,
        props.index
      );
  }, [
    props.instrument,
    props.instrument.buffer.loaded,
    props.loaded,
    clipWidth,
    clipHeight,
  ]);

  return (
    <Draggable
      axis="x"
      onDrag={handleDrag}
      onStart={handleDragStart}
      onStop={handleDragStop}
      position={{ x: clipPosition, y: 0 }}
    >
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
        <canvas
          className="sampler-audio-clip-wave"
          id={`canvas-${props.index}`}
          height={clipHeight}
          width={clipWidth}
          style={{ height: clipHeight, width: clipWidth }}
        />
        {/*<svg
          className="sampler-audio-clip-wave"
          preserveAspectRatio="xMinYMin slice"
        >
          {waveForm}
        </svg>*/}
      </div>
      {/*</Resizable>*/}
    </Draggable>
  );
}

const drawClipWave = (buffer, clipHeight, clipWidth, color, index) => {
  if (clipHeight === 0 || clipWidth === 0) return;

  const canvas = document.getElementById(`canvas-${index}`);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let waveArray = buffer;
  let scale = waveArray.length / clipWidth;

  ctx.fillStyle = color[100];

  for (let x = 0; x < clipWidth / 2; x++) {
    let rectHeight = Math.abs(
      Math.floor(waveArray[Math.floor(x * 2 * scale)] * clipHeight)
    );
    //console.log("rect");
    ctx.fillRect(x * 2, clipHeight / 2 - rectHeight / 2, 1, rectHeight);
  }
};

/* 
const drawClipWave = (buffer, clipHeight, clipWidth, color) => {
  //console.log(buffer);
  let waveArray = buffer;

  let scale = waveArray.length / clipWidth;

  let pathString = "M 0 " + clipHeight / 2 + " ";

  for (let x = 0; x < clipWidth; x++) {
    pathString +=
      "L " +
      x +
      " " +
      Math.floor(
        waveArray[Math.floor(x * scale)] * clipHeight + clipHeight / 2
      ) +
      " ";
  }
  return <path d={pathString} stroke={color[100]} fill="none" />;
};
 */

export default AudioClip;
