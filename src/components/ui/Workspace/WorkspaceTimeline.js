import React, { useState, useEffect, useRef, Fragment } from "react";
import * as Tone from "tone";

import "./WorkspaceTimeline.css";

import Draggable from "react-draggable";

import { colors } from "../../../utils/materialPalette";

import {
  IconButton,
  Icon,
  Tooltip,
  TextField,
  Slider,
} from "@material-ui/core";

function WorkspaceTimeline(props) {
  const TLWrapper = useRef(null);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [compact, setCompact] = useState(true);
  const [draggingSelect, setDraggingSelect] = useState(false);
  const [TLinputSessionSize, setTLinputSessionSize] = useState(
    props.sessionSize
  );

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
      (compact && event.target.className === "ws-timeline-module-tile") ||
      !props.timelineMode
    ) {
      let newTime =
        ((event.pageX - TLWrapper.current.offsetLeft) /
          TLWrapper.current.offsetWidth) *
        Tone.Transport.loopEnd;

      Tone.Transport.seconds =
        newTime < 0
          ? 0
          : newTime > Tone.Transport.loopEnd
          ? Tone.Transport.loopEnd
          : newTime;
    } else if (
      props.timelineMode &&
      event.target.className === "ws-timeline-module-tile"
    ) {
      setDraggingSelect(true);
    }
  };

  const handleTimelineTileClick = (moduleId, moduleSize, tile) => {
    if (compact) return;
    let newTimeline = { ...props.timeline };
    let tlModule = newTimeline[moduleId];
    let timeToEdit = tile * moduleSize;
    newTimeline[moduleId] = tlModule.includes(timeToEdit)
      ? tlModule.filter((e) => e !== timeToEdit)
      : [...tlModule, timeToEdit];
    props.setTimeline(newTimeline);
  };

  const handleSessionSizeChange = (e) => {
    let newValue = e.target.value;
    let newSize;
    if (props.sessionSize === e.target.value) return;
    if (newValue <= 1) {
      newSize = 1;
    } else if (newValue >= 128) {
      newSize = 128;
    } else if (newValue > 1 && newValue < 128) {
      newSize = newValue;
    }
    props.setSessionSize(parseInt(newSize));

    let newTimeline = { ...props.timeline, size: parseInt(newSize) };

    //filter modules greater than new value
    Object.keys(newTimeline)
      .filter((e) => !isNaN(e))
      .forEach((id) => {
        newTimeline[id] = newTimeline[id].filter((e) => e < newSize);
      });
    props.setTimeline(newTimeline);
  };

  useEffect(() => {
    setTLinputSessionSize(props.sessionSize);
  }, [props.sessionSize]);

  useEffect(() => {
    //toggleCursor(Tone.Transport.state);
    setCursorAnimator(
      setInterval(() => {
        //temp fix

        Tone.Transport.seconds <= Tone.Transport.loopEnd &&
          Tone.Transport.seconds >= 0 &&
          setCursorPosition(Tone.Transport.seconds / Tone.Transport.loopEnd);
      }, 16)
    );

    return () => {
      //console.log("cleared");
      clearInterval(cursorAnimator);
    };
  }, [props.timelineMode]);

  return (
    <div className="ws-timeline-cont">
      <Tooltip title={props.timelineMode ? "Loop Mode" : "Timeline Mode"}>
        <IconButton
          className="ws-timeline-btn"
          onClick={() => props.setTimelineMode((prev) => !prev)}
          tabIndex={-1}
        >
          <Icon>{props.timelineMode ? "loop" : "linear_scale"}</Icon>
        </IconButton>
      </Tooltip>

      {props.timelineMode ? (
        <div
          className={`ws-timeline ${!props.timelineMode && "ws-timeline-loop"}`}
          ref={TLWrapper}
          onMouseDown={handleMouseDown}
          onMouseUp={() => setDraggingSelect(false)}
          onMouseLeave={() => setDraggingSelect(false)}
        >
          {props.modules.map((module, moduleIndex) => {
            let moduleSize =
              module.type === 2
                ? Math.ceil(
                    module.score[module.score.length - 1].time +
                      module.score[module.score.length - 1].duration
                  )
                : module.type === 3 || module.type === 4
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
                        onMouseEnter={() =>
                          draggingSelect &&
                          handleTimelineTileClick(module.id, moduleSize, i)
                        }
                        onMouseDown={() =>
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
            position={{
              x:
                TLWrapper.current &&
                cursorPosition * TLWrapper.current.offsetWidth,
              y: 0,
            }}
            bounds=".ws-timeline"
          >
            <div
              className={`ws-timeline-cursor ${
                compact && "ws-timeline-cursor-compact"
              }`}
            />
          </Draggable>
        </div>
      ) : (
        <Slider
          min={0}
          max={0.9999}
          className={"ws-timeline-slider"}
          step={0.01}
          value={cursorPosition}
          onChange={(e, v) =>
            (Tone.Transport.seconds = v * Tone.Transport.loopEnd)
          }
        />
      )}

      {props.timelineMode && (
        <div>
          <IconButton
            className="ws-timeline-btn"
            onClick={() => setCompact((prev) => !prev)}
            tabIndex={-1}
          >
            <Icon>expand</Icon>
          </IconButton>
          <TextField
            label="Session Size"
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{ min: 1, max: 128 }}
            defaultValue={props.sessionSize}
            onKeyDown={(e) => e.keyCode === 13 && handleSessionSizeChange(e)}
            onBlur={(e) => handleSessionSizeChange(e)}
            onMouseUp={(e) => handleSessionSizeChange(e)}
            value={TLinputSessionSize}
            onChange={(e) => setTLinputSessionSize(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export default WorkspaceTimeline;
