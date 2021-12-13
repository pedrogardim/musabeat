import React, { useState, useEffect, Fragment, useRef } from "react";

import { useTranslation } from "react-i18next";

import { Paper, Slider, TextField } from "@mui/material";

import "./Knob.css";

function Knob(props) {
  const { t } = useTranslation();
  const knobRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [input, setInput] = useState(false);
  const [value, setValue] = useState(props.defaultValue);
  const [angle, setAngle] = useState(
    ((props.defaultValue - props.min) / (props.max - props.min)) *
      (135 - -135) -
      135
  );

  const handleKnobMove = (e) => {
    let centerPosition = [
      knobRef.current.getBoundingClientRect().left +
        knobRef.current.getBoundingClientRect().width / 2,
      knobRef.current.getBoundingClientRect().top +
        knobRef.current.getBoundingClientRect().height / 2,
    ];
    let deltaXY = [
      props.mousePosition[0] - centerPosition[0],
      centerPosition[1] - props.mousePosition[1],
    ];

    if (
      Math.abs(deltaXY[0]) < props.size / 2 &&
      Math.abs(deltaXY[1]) < props.size / 2
    )
      return;

    let angle = (Math.atan2(...deltaXY) * 180) / Math.PI;

    angle = angle >= 135 ? 135 : angle < -135 ? -135 : angle;

    setAngle(Math.floor(angle));

    let value =
      ((angle - -135) / (135 - -135)) * (props.max - props.min) + props.min;

    value = props.logScale
      ? props.min === 0
        ? linearToLogScale(value, props.min + 1, props.max + 1) - 1
        : linearToLogScale(value, props.min, props.max)
      : value;

    value =
      typeof props.step === "number"
        ? Math.round(value / props.step) * props.step
        : value;

    setValue(value);
  };

  const handleValueInput = (v) => {
    //let val = v;
    let val = v < props.min ? props.min : v > props.max ? props.max : v;

    setValue(val);

    let angle =
      ((val - props.min) / (props.max - props.min)) * (135 - -135) + -135;

    //angle = props.logScale ? logToLinearScale(val, -135, 135) : angle;

    setAngle(Math.floor(angle));
    setOpen(false);
  };

  useEffect(() => {
    if (typeof value === "number") props.onChange(value);
  }, [value]);

  useEffect(() => {
    if (!open && typeof value === "number" && props.onChangeCommited)
      props.onChangeCommited(value);
  }, [open]);

  useEffect(() => {
    !props.mousePosition && setOpen(false);
    if (props.mousePosition && open) handleKnobMove();
  }, [props.mousePosition]);
  /* 
  useEffect(() => {
    console.log(input);
  }, [input]); */

  return (
    <Paper
      className="track-knob"
      style={{
        height: props.size,
        width: props.size,
        backgroundColor: props.color ? props.color : "#3f51b5",
        filter: props.disabled && "saturate(0)",
        pointerEvents: props.disabled && "none",
        ...props.style,
      }}
      onMouseDown={() => setOpen(true)}
      onClick={(e) => e.detail === 2 && setInput(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={knobRef}
    >
      {(open || hovered) && !props.hideValue && (
        <div className="knob-value-label">
          {value.toString().split(".")[1] &&
          value.toString().split(".")[1].length > 2
            ? value.toFixed(2)
            : value}
        </div>
      )}
      <div
        className="knob-mark-cont"
        style={{
          transform: `rotate(${angle}deg)`,
        }}
      >
        <div />
      </div>

      {input && (
        <TextField
          autoFocus
          style={{
            position: "absolute",
            minWidth: "100%",
            top: 0,
            outline: "black",
            textAlign: "center",
          }}
          defaultValue={value}
          type="number"
          inputProps={{ min: props.min, max: props.max, step: props.step }}
          onBlur={(e) => {
            handleValueInput(e.target.value);
            setInput(false);
          }}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              handleValueInput(e.target.value);
              setInput(false);
            }
          }}
        />
      )}
      <span className="knob-lbl">{props.label && props.label}</span>
    </Paper>
  );
}

export default Knob;

const linearToLogScale = (value, min, max) => {
  let b = Math.log(max / min) / (max - min);
  let a = max / Math.exp(b * max);
  let tempAnswer = a * Math.exp(b * value);

  return tempAnswer;
};

//var newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
