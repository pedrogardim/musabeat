import React, { useState, useEffect, useRef } from "react";

import * as Tone from "tone";

import AudioClip from "./AudioClip";
import BackgroundGrid from "./BackgroundGrid";

import Draggable from "react-draggable";
import { FileDrop } from "react-file-drop";
import { CircularProgress, Typography } from "@material-ui/core";

import { scheduleSamples } from "../../../utils/TransportSchedule";

import "./Player.css";

//TODO

function Sampler(props) {
  const sampleWrapper = useRef(null);
  const [isBufferLoaded, setIsBufferLoaded] = useState(false);
  const [score, setScore] = useState(props.module.score);
  const [instrument, setInstrument] = useState(props.module.instrument);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [buffersChecker, setBuffersChecker] = useState(null);

  const [draggingOver, setDraggingOver] = useState(false);

  const startCursor = (started) => {
    started
      ? setCursorAnimator(
          setInterval(() => {
            setCursorPosition(
              (Tone.Transport.seconds /
                Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
                sampleWrapper.current.offsetWidth
            );
          }, 16)
        )
      : clearInterval(cursorAnimator);
  };

  const checkForLoadedBuffers = () => {
    if (instrument.buffer.loaded) {
      setIsBufferLoaded(true);
      clearInterval(buffersChecker);
    }
  };

  const scheduleEvents = () => {
    scheduleSamples(
      score,
      instrument,
      Tone.Transport.seconds,
      Tone.Transport,
      props.module.id
    );
    console.log("scheduled");
  };

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (element.x / sampleWrapper.current.offsetWidth) *
      Tone.Time(Tone.Transport.loopEnd).toSeconds();

    setCursorPosition(element.x);
  };

  const handleCursorDragStart = (event, element) => {
    instrument.stop(0);
  };

  const handleCursorDragStop = (event, element) => {
    scheduleEvents();
  };

  const handleFileDrop = (files, event) => {
    event.preventDefault();

    Tone.Transport.pause();

    setIsBufferLoaded(false);
    setDraggingOver(false);
    let file = files[0];
    console.log(file);

    file.arrayBuffer().then((arraybuffer) => {
      instrument.context.rawContext.decodeAudioData(
        arraybuffer,
        (audiobuffer) => {
          console.log(audiobuffer);

          if (audiobuffer.duration > 180) {
            alert("Try importing a smaller audio file");
            setIsBufferLoaded(true);
            return;
          }

          setInstrument((prev)=>{
            prev.dispose()
            return new Tone.GrainPlayer(
              audiobuffer,
              setIsBufferLoaded(true)
            ).toDestination()}
          );

          //update score duration

          setScore((prev) => {
            let newScore = [...prev];
            newScore[0].duration = audiobuffer.duration;
            return newScore;
          });
        },
        //decode audio error
        (e) => {
          alert(
            "Upps.. there was an error decoding your audio file, try to convert it to other format"
          );
          setIsBufferLoaded(true);
        }
      );
    });
  };

  useEffect(() => {
    startCursor(Tone.Transport.state === "started");
    Tone.Transport.state === "started" && scheduleEvents();
  }, [Tone.Transport.state]);

  useEffect(() => {
    scheduleEvents();
  }, [score, instrument]);

  useEffect(() => {
    props.updateModules((previousModules) => {
      let newmodules = [...previousModules];
      newmodules[props.module.id].score = score;
      return newmodules;
    });
  }, [score]);

  useEffect(() => {
    props.updateModules((previousModules) => {
      let newmodules = [...previousModules];
      newmodules[props.module.id].instrument = instrument;
      return newmodules;
    });
  }, [instrument]);

  useEffect(() => {
    setBuffersChecker(setInterval(checkForLoadedBuffers, 1000));
    Tone.Transport.schedule((time) => {
      scheduleEvents();
    }, 0);
  }, []);
  /* 
  useEffect(() => {
    Tone.Transport.seconds === 0 && console.log(Tone.Transport.position);
  }, [Tone.Transport.seconds]);

   */
  return (
    <div
      className="module-innerwrapper"
      style={(props.style, { backgroundColor: props.module.color["900"] })}
    >
      <div
        className="sampler"
        ref={sampleWrapper}
        onDragEnter={() => setDraggingOver(true)}
      >
        <BackgroundGrid
          sessionSize={props.sessionSize}
          color={props.module.color}
        />
        {draggingOver && (
          <FileDrop
            onDragLeave={(e) => {
              setDraggingOver(false);
            }}
            onDrop={(files, event) => handleFileDrop(files, event)}
            className={"file-drop"}
            style={{
              backgroundColor: props.module.color[300],
            }}
          >
            Drop your files here!
          </FileDrop>
        )}
        {isBufferLoaded ? (
          <AudioClip
            index={0}
            sessionSize={props.sessionSize}
            parentRef={sampleWrapper}
            color={props.module.color}
            buffer={instrument.buffer}
            instrument={instrument}
            scheduleEvents={scheduleEvents}
            score={score[0]}
            setScore={setScore}
          />
        ) : (
          <CircularProgress
            className="loading-progress"
            style={{ color: props.module.color[300] }}
          />
        )}
        <Draggable
          axis="x"
          onDrag={handleCursorDrag}
          onStart={handleCursorDragStart}
          onStop={handleCursorDragStop}
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
