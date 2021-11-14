import React, { useState, useEffect, useRef } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import AudioClip from "./AudioClip";
import BackgroundGrid from "./BackgroundGrid";
import PlayerOptions from "./PlayerOptions";
import FileUploader from "../../ui/Dialogs/FileUploader/FileUploader";

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

  const [uploadingFiles, setUploadingFiles] = useState([]);

  const [draggingOver, setDraggingOver] = useState(false);

  const loadPlayer = (audiobuffer) => {
    props.instrument.dispose();

    let newInstrument = new Tone.GrainPlayer(audiobuffer).toDestination();
    props.setInstrument(newInstrument);

    props.updateOnFileLoaded(audiobuffer.duration);
  };

  const toggleCursor = () => {
    setCursorAnimator(
      setInterval(() => {
        //temp fix
        playerWrapper.current !== null &&
          setCursorPosition(
            ((Tone.Transport.seconds %
              (Tone.Time("1m").toSeconds() * props.module.size)) /
              (Tone.Time("1m").toSeconds() * props.module.size)) *
              playerWrapper.current.offsetWidth
          );
      }, 32)
    );
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
          props.module.id,
          props.module.size,
          props.sessionSize,
          props.timeline,
          props.timelineMode
        )
      : clearEvents(props.module.id);
  };

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (element.x / playerWrapper.current.offsetWidth) *
      Tone.Time("1m").toSeconds() *
      props.module.size;

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
    //let file = files[0];
    setDraggingOver(false);
    setUploadingFiles([files[0]]);
  };

  //TODO: Optimize performance: clear on play/plause
  useEffect(() => {
    toggleCursor();
    return () => {
      //console.log("cleared");
      clearInterval(cursorAnimator);
      Tone.Transport.clear(rescheduleEvent);
    };
  }, []);

  useEffect(() => {
    scheduleEvents();
  }, [Tone.Transport.state]);

  useEffect(() => {
    scheduleEvents();
  }, [score, props.instrument, props.timeline, props.module.muted]);

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
    props.isSessionLoaded &&
      props.setModules((prev) => {
        let checker =
          JSON.stringify(prev[props.index].score) !== JSON.stringify(score);
        let newModules = [...prev];
        newModules[props.index].score = [...score];
        return checker ? newModules : prev;
      });
  }, [score]);

  useEffect(() => {
    //TEMP: function on "module" component to make score adapts to audio file
    //console.log("IS LOADED?", props.instrument.loaded);
    props.instrument && props.updateOnFileLoaded();
  }, [props.instrument && props.instrument.loaded]);

  useEffect(() => {
    Tone.Transport.clear(rescheduleEvent);
    let event = Tone.Transport.schedule((time) => {
      //console.log("should schedule");
      scheduleEvents(true);
      props.instrument.stop(time);
    }, Tone.Time("1m").toSeconds() * props.module.size - 0.02);
    setRescheduleEvent(event);
  }, [props.module.size, score]);

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
          moduleSize={props.module.size}
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
            moduleSize={props.module.size}
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
          bounds=".sampler"
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
      <FileUploader
        open={uploadingFiles.length > 0}
        files={uploadingFiles}
        setUploadingFiles={setUploadingFiles}
        loadPlayer={loadPlayer}
        module={props.module}
        instrument={props.instrument}
        setInstrumentLoaded={props.setInstrumentLoaded}
        onInstrumentMod={props.onInstrumentMod}
        updateOnFileLoaded={props.updateOnFileLoaded}
        handlePageNav={props.handlePageNav}
      />
    </div>
  );
}

export default Player;
