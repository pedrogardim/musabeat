import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import AudioClip from "./AudioClip";

import { CircularProgress, Typography } from "@material-ui/core";

import { scheduleSamples } from "../../utils/TransportSchedule";

import "./Sampler.css";

//TODO

function Sampler(props) {
  const [isBufferLoaded, setIsBufferLoaded] = useState(false);
  const [score, setScore] = useState(props.module.score);
  const [instrument, setInstrument] = useState(props.module.instrument);
  const [cursorPosition, setCursorPosition] = useState(0);

  let buffersChecker;

  const startCursor = () => {
    setInterval(() => {
      //console.log((Tone.Transport.seconds/Tone.Time(Tone.Transport.loopEnd).toSeconds())*100+"%")
      setCursorPosition(
        (Tone.Transport.seconds /
          Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
          document.getElementById("module-"+props.module.id).clientWidth

      );
    }, 16);
  };

  const checkForLoadedBuffers = () => {
    let check = instrument.buffer.duration !== 0;

    if (check) {
      setIsBufferLoaded(true);
      clearInterval(buffersChecker);
    }
  };

  const scheduleEvents = () => {
    scheduleSamples(score, instrument, Tone.Transport, props.module.id);
  };


  useEffect(() => {
    scheduleEvents();
  }, [score]);

  useEffect(() => {
    buffersChecker = setInterval(checkForLoadedBuffers, 20);
    startCursor();

  }, []);


  return (
    <div
      className="module-innerwrapper"
      style={(props.style, { backgroundColor: props.module.color["400"] })}
    >
      <div className="sampler">
      {isBufferLoaded ? (
        <AudioClip
          index={0}
          parentId={props.module.id}
          color={props.module.color}
          buffer={instrument.buffer}
          scheduleEvents={scheduleEvents}
          setScore={setScore}
        />
      ) : (
        <CircularProgress />
      )}
      <div className="sampler-cursor" style={{left:cursorPosition,backgroundColor: props.module.color["900"]}}/>
      </div>
    </div>
  );
}

export default Sampler;
