import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import "./ChordRhythmSequence.css";

function ChordRhythmTile(props) {
  
  const handleClick = () => {
    props.modifyRhythm(props.chordIndex,props.rhythmIndex,props.rhythm)
  };


  return (
    <div
      onClick={handleClick}
      className="chord-rhythm-tile"
      style={{
        outline: "solid 1px " + props.color[900],
        backgroundColor: props.rhythm === 1 ? props.color[700] : props.color[100],
        filter: props.cursor && "brightness(1.1)"
      }}
    ></div>
  );
}

export default ChordRhythmTile;
