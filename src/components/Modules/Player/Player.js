import React, { useState, useEffect, useRef } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import AudioClip from "./AudioClip";
import BackgroundGrid from "./BackgroundGrid";

import Draggable from "react-draggable";
import { FileDrop } from "react-file-drop";
import { CircularProgress, Typography } from "@material-ui/core";

import { scheduleSamples } from "../../../utils/TransportSchedule";

import "./Player.css";

//TODO

function Player(props) {
  const playerWrapper = useRef(null);
  const [score, setScore] = useState(props.module.score);
  //const [instrument, setInstrument] = useState(props.module.instrument);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [buffersChecker, setBuffersChecker] = useState(null);
  const [rescheduleEvent,setRescheduleEvent] = useState(null);

  const [draggingOver, setDraggingOver] = useState(false);

  const startCursor = (started) => {
    started
      ? setCursorAnimator(
          setInterval(() => {
            //temp fix
            playerWrapper.current !== null &&
              setCursorPosition(
                (Tone.Transport.seconds /
                  Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
                  playerWrapper.current.offsetWidth
              );
          }, 16)
        )
      : clearInterval(cursorAnimator);
  };


  const scheduleEvents = () => {
    scheduleSamples(
      score,
      props.instrument,
      Tone.Transport.seconds,
      Tone.Transport,
      props.module.id
    );
    console.log("player scheduled");
  };

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (element.x / playerWrapper.current.offsetWidth) *
      Tone.Time(Tone.Transport.loopEnd).toSeconds();

    setCursorPosition(element.x);
  };

  const handleCursorDragStart = (event, element) => {
    props.instrument.stop(0);
  };

  const handleCursorDragStop = (event, element) => {
    scheduleEvents();
  };

  const handleFileDrop = (files, event) => {
    event.preventDefault();

    Tone.Transport.pause();

    props.setBufferLoaded(false);
    setDraggingOver(false);

    let file = files[0];

    //UPLOAD
   

    //

    file.arrayBuffer().then((arraybuffer) => {
      props.instrument.context.rawContext.decodeAudioData(
        arraybuffer,
        (audiobuffer) => {
          console.log(audiobuffer);

          if (audiobuffer.duration > 180) {
            alert("Try importing a smaller audio file");
            props.setBufferLoaded(true);
            return;
          }

          const user = firebase.auth().currentUser;
          const storageRef = firebase.storage().ref(`/${user.uid}/${file.name}`);
          const task = storageRef.put(file);
      
          task.on(
            "state_changed",
            (snapshot) => {
             console.log((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            },
            (error) => {console.log(error)},
            () => {storageRef.getDownloadURL().then(r=>{
              props.onInstrumentMod(r)
            })}
          );

          props.setInstrument((prev) => {
            prev.dispose();
            return new Tone.GrainPlayer(
              audiobuffer,
              props.setBufferLoaded(true)
            ).toDestination();
          });

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
          props.setBufferLoaded(true);
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
  }, [score, props.instrument]);

  useEffect(() => {
    props.updateModules((previousModules) => {
      let newmodules = [...previousModules];
      newmodules[props.module.id].score = score;
      return newmodules;
    });
  }, [score]);

  /* useEffect(() => {
    props.updateModules((previousModules) => {
      let newmodules = [...previousModules];
      newmodules[props.module.id].instrument = instrument;
      return newmodules;
    });
  }, [instrument]); */

  useEffect(() => {
    setRescheduleEvent(Tone.Transport.schedule((time) => {
      scheduleEvents();
    }, Tone.Transport.loopEnd-0.01))
    return () => {
      clearInterval(cursorAnimator);
      Tone.Transport.clear(rescheduleEvent);
    };
  }, []);


  useEffect(() => {
    setRescheduleEvent(Tone.Transport.schedule((time) => {
      scheduleEvents();
    }, Tone.Transport.loopEnd-0.01))
  }, [props.sessionSize]);

  useEffect(() => {
    clearInterval(cursorAnimator);
    //console.log("triggered");
  }, [props.module.id]);

  return (
    <div
      className="module-innerwrapper"
      style={(props.style, { backgroundColor: props.module.color["900"] })}
    >
      <div
        className="sampler"
        ref={playerWrapper}
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
        {props.bufferLoaded ? (
          <AudioClip
            index={0}
            sessionSize={props.sessionSize}
            parentRef={playerWrapper}
            color={props.module.color}
            buffer={props.instrument.buffer}
            instrument={props.instrument}
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

export default Player;
