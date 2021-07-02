import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

import "./WorkspaceTimeline.css";

import Draggable from "react-draggable";

import { colors } from "../../utils/materialPalette";

function WorkspaceTimeline(props) {
  const TLWrapper = useRef(null);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);

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

  useEffect(() => {
    return () => {
      //console.log("cleared");
      clearInterval(cursorAnimator);
    };
  }, []);

  useEffect(() => {
    toggleCursor(Tone.Transport.state);
  }, [Tone.Transport.state]);

  return (
    <div className="ws-timeline" ref={TLWrapper}>
      {props.modules.map((module, moduleIndex) => {
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
        //console.log(moduleSize);
        return (
          <div
            className="ws-timeline-module"
            style={{
              background: colors[module.color][500],
              width: (moduleSize / props.sessionSize) * 100 + "%",
            }}
          />
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
