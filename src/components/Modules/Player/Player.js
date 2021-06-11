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

import { colors } from "../../../utils/materialPalette";

function Player(props) {
  const playerWrapper = useRef(null);
  const [score, setScore] = useState(props.module.score);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [rescheduleEvent, setRescheduleEvent] = useState(null);
  const [draggingOver, setDraggingOver] = useState(false);

  const loadPlayer = (audiobuffer) => {
    props.instrument.dispose();

    let newInstrument = new Tone.GrainPlayer(
      audiobuffer,
      props.setInstrumentsLoaded((prev) =>
        prev.map((e, i) => (i === props.index ? true : e))
      )
    ).toDestination();

    props.setInstruments((prev) =>
      prev.map((e, i) => (i === props.index ? newInstrument : e))
    );
  };

  const toggleCursor = (state) => {
    state
      ? setCursorAnimator(
          setInterval(() => {
            //temp fix
            playerWrapper.current !== null &&
              Tone.Transport.state === "started" &&
              setCursorPosition(
                (Tone.Transport.seconds /
                  Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
                  playerWrapper.current.offsetWidth
              );
          }, 32)
        )
      : clearInterval(cursorAnimator);
  };

  const scheduleEvents = () => {
    !!props.instrument &&
      !!props.module.instrument.url &&
      scheduleSamples(
        score,
        props.instrument,
        Tone.Transport.seconds,
        Tone.Transport,
        props.module.id
      );
    //!!props.instrument &&
    //  !!props.module.instrument.url &&
    //  console.log("player scheduled");
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

    props.setInstrumentsLoaded((prev) =>
      prev.map((e, i) => (i === props.index ? false : e))
    );
    setDraggingOver(false);

    let file = files[0];

    file.arrayBuffer().then((arraybuffer) => {
      props.instrument.context.rawContext.decodeAudioData(
        arraybuffer,
        (audiobuffer) => {
          if (audiobuffer.duration > 180) {
            alert("Try importing a smaller audio file");
            props.setInstrumentsLoaded((prev) => {
              let a = [...prev];
              a[props.index] = true;
              return a;
            });
            return;
          }

          loadPlayer(audiobuffer);

          const user = firebase.auth().currentUser;
          const storageRef = firebase
            .storage()
            .ref(`/${user.uid}/${file.name}`);
          const task = storageRef.put(file);

          task.on(
            "state_changed",
            (snapshot) => {
              //console.log(
              //  (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              //);
            },
            (error) => {
              console.log(error);
            },
            () => {
              storageRef.getDownloadURL().then((r) => {
                props.onInstrumentMod(r);
              });
            }
          );
        },
        //decode audio error
        (e) => {
          alert(
            "Upps.. there was an error decoding your audio file, try to convert it to other format"
          );
          props.setInstrumentsLoaded((prev) => {
            let a = [...prev];
            a[props.index] = true;
            return a;
          });
        }
      );
    });
  };

  //TODO: Optimize performance: clear on play/plause

  useEffect(() => {
    toggleCursor(true);
    scheduleEvents();
  }, [Tone.Transport.state]);

  useEffect(() => {
    scheduleEvents();
  }, [score, props.instrument]);

  useEffect(() => {
    console.log(score[0].duration);
    props.setModules((previousModules) => {
      let newmodules = [...previousModules];
      newmodules[props.index].score = score;
      return newmodules;
    });
  }, [score]);

  useEffect(() => {
    return () => {
      clearInterval(cursorAnimator);
      Tone.Transport.clear(rescheduleEvent);
    };
  }, []);

  useEffect(() => {
    Tone.Transport.clear(rescheduleEvent);
    setRescheduleEvent(
      Tone.Transport.schedule((time) => {
        scheduleEvents();
      }, Tone.Transport.loopEnd - 0.01)
    );
  }, [props.sessionSize]);

  useEffect(() => {
    setScore((prev) => {
      console.log("SET SCORE TRIGGERED");
      let newScore = [...prev];
      newScore[0].duration = props.instrument.buffer.duration;
      return newScore;
    });
  }, [props.instrument]);

  return (
    <div
      className="module-innerwrapper"
      style={
        (props.style, { backgroundColor: colors[props.module.color]["900"] })
      }
    >
      <div
        className="sampler"
        ref={playerWrapper}
        onDragEnter={() => setDraggingOver(true)}
      >
        <BackgroundGrid
          sessionSize={props.sessionSize}
          color={colors[props.module.color]}
        />
        {draggingOver && (
          <FileDrop
            onDragLeave={(e) => {
              setDraggingOver(false);
            }}
            onDrop={(files, event) => handleFileDrop(files, event)}
            className={"file-drop"}
            style={{
              backgroundColor: colors[props.module.color][300],
            }}
          >
            Drop your files here!
          </FileDrop>
        )}
        {!!props.instrument && score[0].duration > 0 && (
          <AudioClip
            index={0}
            sessionSize={props.sessionSize}
            parentRef={playerWrapper}
            color={colors[props.module.color]}
            instrument={props.instrument}
            scheduleEvents={scheduleEvents}
            score={score[0]}
            setScore={setScore}
            loaded={props.loaded}
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
