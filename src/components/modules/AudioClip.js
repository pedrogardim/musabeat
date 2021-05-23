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
    (props.score.duration / Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
      document.getElementById("module-" + props.parentId).clientWidth
  );

  const [clipPosition, setClipPosition] = useState(
    (props.score.time / Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
      document.getElementById("module-" + props.parentId).clientWidth
  );

/*   
  const [waveForm, setWaveForm] = useState(
    drawClipWave(
      props.buffer.toArray(),
      props.buffer.duration,
      props.score.duration,
      clipHeight,
      clipWidth,
      props.color
    )
  );
 */

  const updateClipPosition = () => {
    let timePerPixel =
      document.getElementById("module-" + props.parentId).clientWidth /
      Tone.Time(Tone.Transport.loopEnd).toSeconds();
    setClipPosition(props.score.time * timePerPixel);
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
    window.addEventListener("resize", updateClipPosition);
  }, []);

  useEffect(() => {
    //watch to window resize to update clips position
    updateClipPosition();
  }, [props.sessionSize]);

  useEffect(() => {
    //watch to window resize to update clips position
    /* setWaveForm(
      drawClipWave(
        props.buffer.toArray(),
        props.buffer.duration,
        props.score.duration,
        clipHeight,
        clipWidth,
        props.color
      )
    ); */
  }, [props.buffer]);

  return (
    <Draggable
      axis="x"
      onDrag={handleDrag}
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
        <svg
          className="sampler-audio-clip-wave"
          preserveAspectRatio="xMinYMin slice"
        >
          {/*waveForm*/}
        </svg>
      </div>
      {/*</Resizable>*/}
    </Draggable>
  );
}

const drawClipWave = (
  buffer,
  clipDuration,
  scheduledDuration,
  clipHeight,
  clipWidth,
  color
) => {
  let waveArray = typeof buffer[0] === "number" ? buffer : buffer[0];

  let scale = Math.floor(buffer.length / clipWidth * clipDuration );

  let pathString = "M 0 " + clipHeight / 2 + " ";

  for (let x = 0; x < clipWidth; x++) {
    pathString +=
      "L " +
      x +
      " " +
      (waveArray[x * clipWidth] * clipHeight * 2 + clipHeight / 2) +
      " ";
  }
  return <path d={pathString} stroke={color[100]} fill="none" />;
};

/*

const drawClipWave = (wavearray, clipHeight, clipWidth, color) => {

  return <path stroke={color[100]} fill="none" />;
};

*/

export default AudioClip;
