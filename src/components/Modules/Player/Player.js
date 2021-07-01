import React, { useState, useEffect, useRef } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import AudioClip from "./AudioClip";
import BackgroundGrid from "./BackgroundGrid";
import PlayerOptions from "./PlayerOptions";

import Draggable from "react-draggable";
import { FileDrop } from "react-file-drop";

import { scheduleSamples, clearEvents } from "../../../utils/TransportSchedule";
import { colors } from "../../../utils/materialPalette";

import "./Player.css";

function Player(props) {
  const playerWrapper = useRef(null);
  const [score, setScore] = useState(props.module.score);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [rescheduleEvent, setRescheduleEvent] = useState(null);
  const [draggingOver, setDraggingOver] = useState(false);

  const loadPlayer = (audiobuffer) => {
    props.instrument.dispose();

    let newInstrument = new Tone.GrainPlayer(audiobuffer).toDestination();

    props.updateOnAudioFileLoaded();

    props.setInstrument(newInstrument);
  };

  const toggleCursor = (state) => {
    clearInterval(cursorAnimator);
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

  const scheduleEvents = (atRestart) => {
    //console.log(props.instrument);
    /* console.log(
      !props.module.muted,
      !!props.instrument,
      props.instrument.loaded,
      Tone.Transport.state === "started"
    ); */
    !props.module.muted &&
    !!props.instrument &&
    props.instrument.loaded &&
    Tone.Transport.state === "started"
      ? scheduleSamples(
          score,
          props.instrument,
          atRestart ? 0 : Tone.Transport.seconds,
          Tone.Transport,
          props.module.id
        )
      : clearEvents(props.module.id);
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

  const handleFileDrop = async (files, event) => {
    event.preventDefault();

    Tone.Transport.pause();

    props.setInstrumentLoaded(false);
    setDraggingOver(false);

    let file = files[0];

    let arrayBuffer = await file.arrayBuffer();

    let audiobuffer = await props.instrument.context.rawContext.decodeAudioData(
      arrayBuffer
    );

    if ((await audiobuffer) > 180) {
      alert("Try importing a smaller audio file");
      props.setInstrumentLoaded(true);
      return;
    } else {
      /* props.setModules((previousModules) => {
        let newmodules = [...previousModules];
        newmodules[props.index].score[0].duration = parseFloat(
          audiobuffer.duration.toFixed(2)
        );
        return newmodules;
      }); */
      loadPlayer(audiobuffer);

      const user = firebase.auth().currentUser;

      //console.log(user);

      if (user) {
        const storageRef = firebase.storage().ref(`/${user.uid}/${file.name}`);
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
      }
    }

    //decode audio error
    /* (e) => {
          alert(
            "Upps.. there was an error decoding your audio file, try to convert it to other format"
          );
          props.setInstrumentLoaded(true);
        } */
  };

  //TODO: Optimize performance: clear on play/plause
  useEffect(() => {
    return () => {
      //console.log("cleared");
      clearInterval(cursorAnimator);
      Tone.Transport.clear(rescheduleEvent);
    };
  }, []);

  useEffect(() => {
    toggleCursor(Tone.Transport.state);
    scheduleEvents();
  }, [Tone.Transport.state]);

  useEffect(() => {
    scheduleEvents();
  }, [score, props.instrument]);

  /* useEffect(() => {
    //console.log(props.instrument.buffer);
    props.setModules((previousModules) => {
      let newmodules = [...previousModules];
      newmodules[props.index].score[0].duration = parseFloat(
        props.instrument.buffer.duration.toFixed(2)
      );
      return newmodules;
    });
  }, [props.loaded]); */

  //todo fix

  useEffect(() => {
    if (JSON.stringify(props.module.score) !== JSON.stringify(score))
      setScore(props.module.score);
  }, [props.module.score]);

  useEffect(() => {
    props.setModules((prev) => {
      let newModules = [...prev];
      newModules[props.index].score = [...score];
      return newModules;
    });
  }, [score]);

  useEffect(() => {
    //TEMP: function on "module" component to make score adapts to audio file
    //console.log("IS LOADED?", props.instrument.loaded);
    props.updateOnAudioFileLoaded();
  }, [props.instrument.loaded]);

  useEffect(() => {
    Tone.Transport.clear(rescheduleEvent);
    let event = Tone.Transport.schedule((time) => {
      //console.log("should schedule");
      scheduleEvents(true);
      props.instrument.stop(time);
    }, Tone.Transport.loopEnd - 0.02);
    setRescheduleEvent(event);
  }, [props.sessionSize, score]);

  return (
    <div
      className="module-innerwrapper"
      style={
        (props.style,
        {
          backgroundColor: colors[props.module.color]["900"],
          overflowX: "overlay",
        })
      }
    >
      <div
        className="sampler"
        ref={playerWrapper}
        onDragEnter={() => setDraggingOver(true)}
        style={{
          width: props.moduleZoom * 100 + "%",
        }}
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
            index={props.index}
            style={{
              backgroundColor: colors[props.module.color][300],
            }}
          >
            Drop your files here!
          </FileDrop>
        )}
        {!!props.instrument && props.loaded && score[0].duration > 0 && (
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
            moduleZoom={props.moduleZoom}
            fullScreen={props.fullScreen}
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

        <PlayerOptions
          instrument={props.instrument}
          score={score}
          setScore={setScore}
        />
      </div>
    </div>
  );
}

export default Player;
