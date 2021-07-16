import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

import "./WorkspaceTimeline.css";

import Draggable from "react-draggable";

import { colors } from "../../utils/materialPalette";

import { IconButton, Icon, Tooltip } from "@material-ui/core";
import { PermPhoneMsgTwoTone } from "@material-ui/icons";

function WorkspaceTimeline(props) {
  const TLWrapper = useRef(null);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [compact, setCompact] = useState(true);

  const toggleCursor = (state) => {
    clearInterval(cursorAnimator);
    state
      ? setCursorAnimator(
          setInterval(() => {
            //temp fix
            TLWrapper.current !== null &&
              Tone.Transport.state === "started" &&
              setCursorPosition(
                (Tone.Transport.seconds /
                  Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
                  TLWrapper.current.offsetWidth
              );
          }, 32)
        )
      : clearInterval(cursorAnimator);
  };

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (element.x / TLWrapper.current.offsetWidth) *
      Tone.Time(Tone.Transport.loopEnd).toSeconds();

    setCursorPosition(element.x);
  };

  const handleCursorDragStart = (event, element) => {
    Tone.Transport.pause();
  };

  const handleCursorDragStop = (event, element) => {};

  const handleMouseDown = (event) => {
    if (
      (!props.timelineMode || compact) &&
      event.target.className.includes("ws-timeline")
    ) {
      Tone.Transport.seconds =
        ((event.pageX - TLWrapper.current.offsetLeft) /
          TLWrapper.current.offsetWidth) *
        Tone.Transport.loopEnd;
    }
  };

  const handleTimelineTileClick = (moduleId, moduleSize, tile) => {
    let newTimeline = { ...props.timeline };
    let tlModule = newTimeline[moduleId];
    let timeToEdit = tile * moduleSize;
    newTimeline[moduleId] = tlModule.includes(timeToEdit)
      ? tlModule.filter((e) => e !== timeToEdit)
      : [...tlModule, timeToEdit];
    props.setTimeline(newTimeline);
  };

  useEffect(() => {
    return () => {
      //console.log("cleared");
      clearInterval(cursorAnimator);
    };
  }, []);

  useEffect(() => {
    //toggleCursor(Tone.Transport.state);
    setCursorAnimator(
      setInterval(() => {
        //temp fix
        TLWrapper.current !== null &&
          setCursorPosition(
            (Tone.Transport.seconds /
              Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
              TLWrapper.current.offsetWidth
          );
      }, 32)
    );
  }, []);

  return (
    <div
      className={`ws-timeline ${!props.timelineMode && "ws-timeline-loop"}`}
      ref={TLWrapper}
      onMouseDown={handleMouseDown}
    >
      <Tooltip title={props.timelineMode ? "Loop Mode" : "Timeline Mode"}>
        <IconButton
          className="ws-timeline-btn"
          onClick={() => props.setTimelineMode((prev) => !prev)}
          style={{ position: "absolute", left: -64 }}
        >
          <Icon>{props.timelineMode ? "loop" : "linear_scale"}</Icon>
        </IconButton>
      </Tooltip>
      {props.timelineMode && (
        <IconButton
          className="ws-timeline-btn"
          onClick={() => setCompact((prev) => !prev)}
          style={{ position: "absolute", right: -64 }}
        >
          <Icon>expand</Icon>
        </IconButton>
      )}
      {props.timelineMode &&
        props.modules.map((module, moduleIndex) => {
          let moduleSize =
            module.type === 2
              ? Math.ceil(
                  module.score[module.score.length - 1].time +
                    module.score[module.score.length - 1].duration
                )
              : module.type === 3
              ? props.sessionSize
              : module.type === 4
              ? module.size
              : module.score.length;
          //console.log(moduleSize, props.sessionSize);
          return (
            <div
              className={
                !compact ? "ws-timeline-module" : "ws-timeline-module-compact"
              }
              style={{
                background: colors[module.color][100],
              }}
            >
              {props.sessionSize / moduleSize > 0 &&
                Array(Math.floor(props.sessionSize / moduleSize))
                  .fill(0)
                  .map((e, i) => (
                    <div
                      className="ws-timeline-module-tile"
                      style={{
                        backgroundColor: props.timeline[module.id].includes(
                          i * moduleSize
                        )
                          ? colors[module.color][200]
                          : colors[module.color][50],
                        outline: "solid 1px " + colors[module.color][800],
                        width: (moduleSize / props.sessionSize) * 100 + "%",
                      }}
                      onClick={() =>
                        handleTimelineTileClick(module.id, moduleSize, i)
                      }
                    />
                  ))}
            </div>
          );
        })}
      <Draggable
        axis="x"
        onDrag={handleCursorDrag}
        onStart={handleCursorDragStart}
        onStop={handleCursorDragStop}
        position={{ x: cursorPosition, y: 0 }}
        bounds=".ws-timeline"
      >
        <div className="ws-timeline-cursor" />
      </Draggable>
    </div>
  );
}

export default WorkspaceTimeline;
