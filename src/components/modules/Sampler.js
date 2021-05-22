import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import AudioClip from "./AudioClip";
import BackgroundGrid from "./BackgroundGrid";

import Draggable from "react-draggable";
import { FileDrop } from "react-file-drop";
import { CircularProgress, Typography } from "@material-ui/core";

import { scheduleSamples } from "../../utils/TransportSchedule";

import "./Sampler.css";

//TODO

function Sampler(props) {
  const [isBufferLoaded, setIsBufferLoaded] = useState(false);
  const [score, setScore] = useState(props.module.score);
  const [instrument, setInstrument] = useState(props.module.instrument);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [dropHover, setDropHover] = useState(false);

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

  const handleFileDrop = (files, event) => {
    setIsBufferLoaded(false);
    Tone.Transport.pause()
    setDropHover(false);
    let file = files[0];
    console.log(file);

    file.arrayBuffer().then((arraybuffer) => {
      instrument.context.rawContext.decodeAudioData(
        arraybuffer,
        (audiobuffer) => {
          console.log(audiobuffer);

          if(audiobuffer.duration > 50){
            alert("Try importing a smaller audio file")
            setIsBufferLoaded(true);
            return;
          }


          setInstrument(new Tone.GrainPlayer(audiobuffer,setIsBufferLoaded(true)).toDestination());
          

        },
        //decode audio error
        (e) =>{
          alert("Upps.. there was an error decoding your audio file, try to convert it to other format");
          setIsBufferLoaded(true);
        }
      );
    });

    //instrument.buffer = new Tone.ToneAudioBuffer(fileUrl,()=>{console.log("yata",fileUrl);setIsBufferLoaded(true)})

    //file.arrayBuffer().then((buffer) => {

    //console.log(instrument.buffer.fromArray(convertBlock(buffer)));
    //});
    //file.arrayBuffer().then(buffer => console.log(instrument.buffer.fromArray(buffer)))
  };

  useEffect(() => {
    scheduleEvents();
  }, [score,instrument]);

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
      <div
        className="sampler"
        onDragEnter={() => setDropHover(true)}
        onDragLeave={() => setDropHover(false)}
      >
        <BackgroundGrid
          sessionSize={props.sessionSize}
          color={props.module.color}
        />
        <FileDrop
          onDrop={(files, event) => handleFileDrop(files, event)}
          className={"file-drop"}
        ></FileDrop>
        {isBufferLoaded ? (
          <AudioClip
            index={0}
            sessionSize={props.sessionSize}
            parentId={props.module.id}
            color={props.module.color}
            buffer={instrument.buffer}
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

const convertBlock = (buffer) => {
  // incoming data is an ArrayBuffer
  var incomingData = new Uint8Array(buffer); // create a uint8 view on the ArrayBuffer
  var i,
    l = incomingData.length; // length, we need this for the loop
  var outputData = new Float32Array(incomingData.length); // create the Float32Array for output
  for (i = 0; i < l; i++) {
    outputData[i] = (incomingData[i] - 128) / 128.0; // convert audio to float
  }
  return outputData; // return the Float32Array
};

export default Sampler;
