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
          100 +
          "%"
      );
    }, 100);
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
    console.log(score);
  }, [score]);

  useEffect(() => {
    buffersChecker = setInterval(checkForLoadedBuffers, 20);
  }, []);


  return (
    <div
      className="module-innerwrapper"
      id={"sampler-"+props.module.id}
      style={(props.style, { backgroundColor: props.module.color["400"] })}
    >
      {isBufferLoaded ? (
        <AudioClip
          index={0}
          parentId={"sampler-"+props.module.id}
          color={props.module.color}
          buffer={instrument.buffer}
          scheduleEvents={scheduleEvents}
          setScore={setScore}
        />
      ) : (
        <CircularProgress />
      )}
    </div>
  );
}

export default Sampler;
