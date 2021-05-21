import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import AudioClip from "./AudioClip";
import BackgroundGrid from "./BackgroundGrid";


import Draggable from "react-draggable";

import { CircularProgress, Typography } from "@material-ui/core";

import { scheduleSamples } from "../../utils/TransportSchedule";

import "./Sampler.css";

//TODO

function Sampler(props) {
  const [isBufferLoaded, setIsBufferLoaded] = useState(false);
  const [score, setScore] = useState(props.module.score);
  const [instrument, setInstrument] = useState(props.module.instrument);
  const [cursorPosition, setCursorPosition] = useState(0);

  let buffersChecker, cursorAnimator;

  const startCursor = () => {
    setInterval(() => {
      //console.log((Tone.Transport.seconds/Tone.Time(Tone.Transport.loopEnd).toSeconds())*100+"%")
      setCursorPosition(
        (Tone.Transport.seconds /
          Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
          document.getElementById("module-" + props.module.id).clientWidth
      );
    }, 36);
  };

  const checkForLoadedBuffers = () => {
    console.log(instrument);
    if (instrument.buffer.loaded) {
      setIsBufferLoaded(true);
      clearInterval(buffersChecker);
    }
  };

  const scheduleEvents = () => {
    scheduleSamples(score, instrument, Tone.Transport, props.module.id);
  };

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (element.x /
        document.getElementById("module-" + props.module.id).clientWidth) *
      Tone.Time(Tone.Transport.loopEnd).toSeconds();
  };

  useEffect(() => {
    scheduleEvents();
  }, [score]);

  useEffect(() => {
    buffersChecker = setInterval(checkForLoadedBuffers, 1000);
    startCursor();
    //watch to window resize to update clips position
    //window.addEventListener("resize", displayWindowSize);

  }, []);

  return (
    <div
      className="module-innerwrapper"
      style={(props.style, { backgroundColor: props.module.color["900"] })}
    >
      <div className="sampler">
        <BackgroundGrid sessionSize={props.sessionSize} color={props.module.color}/>
        {isBufferLoaded ? (
          <AudioClip
            index={0}
            parentId={props.module.id}
            color={props.module.color}
            buffer={instrument.buffer}
            scheduleEvents={scheduleEvents}
            score={score[0]}
            setScore={setScore}
          />
        ) : (
          <CircularProgress />
        )}
        <Draggable
          axis="x"
          onDrag={handleCursorDrag}
          position={{ x: cursorPosition, y: 0 }}
        >
          <div
            className="sampler-cursor"
            style={{ backgroundColor: "white" }}
          />
        </Draggable>
      </div>
    </div>
  );
}

export default Sampler;
