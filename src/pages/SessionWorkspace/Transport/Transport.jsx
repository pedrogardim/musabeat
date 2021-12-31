import React, { useState, useEffect, useRef } from "react";

import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

import * as Tone from "tone";

import { Icon, IconButton, Box, Typography, Dialog, Grid } from "@mui/material";

function WorkspaceTransport(props) {
  const { t } = useTranslation();

  const boxRefs = [useRef(null), useRef(null), useRef(null)];

  const [expanded, setExpanded] = useState(false);
  const [time, setTime] = useState([]);
  const [timeAnimator, setTimeAnimator] = useState(null);
  const [selecting, setSelecting] = useState(null);
  const [inputDelta, setInputDelta] = useState(null);
  const [paramsValue, setParamsValue] = useState({
    0: props.sessionSize,
    1: props.gridSize,
    2: props.sessionData && props.sessionData.bpm,
  });
  const [mousePosition, setMousePosition] = useState([0, 0]);

  //t: value only for display when closed
  const sessionParams = [
    {
      i: "calendar_view_week",
      t: props.sessionSize,
      lbl: "Session Size",
      range: [1, 128],
      sens: 30,
    },
    {
      i: "straighten",
      t: "1/" + props.gridSize,
      lbl: "Grid",
      range: [1, 32],
      sens: 64,
    },
    {
      i: "timer",
      t: props.sessionData && props.sessionData.bpm,
      lbl: "BPM",
      range: [50, 300],
      sens: 3,
    },
  ];

  const handleParameterChange = (pageY) => {
    let inputValue = pageY / document.body.scrollHeight;
    let valueDelta = -Math.floor(
      (pageY -
        boxRefs[0].current.getBoundingClientRect().top -
        boxRefs[0].current.offsetHeight / 2) /
        sessionParams[selecting].sens
    );

    let value =
      selecting === 0
        ? props.sessionSize + valueDelta
        : selecting === 1
        ? Math.pow(2, Math.log2(props.gridSize) + valueDelta)
        : props.sessionData.bpm + valueDelta;

    //console.log(selecting, valueDelta, value);

    if (
      value >= sessionParams[selecting].range[0] &&
      value <= sessionParams[selecting].range[1]
    ) {
      setParamsValue((prev) => ({ ...prev, [selecting]: value }));
    }
  };

  const handleArrowClick = (param, increment) => {
    //console.log(param, increment);
    let value =
      param === 0
        ? props.sessionSize + (increment ? 1 : -1)
        : param === 1
        ? Math.pow(2, Math.log2(props.gridSize) + (increment ? 1 : -1))
        : props.sessionData.bpm + (increment ? 1 : -1);

    if (
      value >= sessionParams[param].range[0] &&
      value <= sessionParams[param].range[1]
    ) {
      setParamsValue((prev) => ({ ...prev, [param]: value }));
      param === 0
        ? props.setSessionSize(value)
        : param === 1
        ? props.setGridSize(value)
        : props.setSessionData((prev) => ({ ...prev, bpm: value }));
    }
  };

  const commitValue = () => {
    props.setSessionSize(paramsValue[0]);
    props.setGridSize(paramsValue[1]);
    props.setSessionData((prev) => ({ ...prev, bpm: paramsValue[2] }));
  };

  useEffect(() => {
    clearInterval(timeAnimator);
    setTimeAnimator(
      setInterval(() => {
        //temp fix

        setTime([
          Tone.Transport.seconds.toFixed(2) + "s",
          Tone.Transport.position
            .split(".")[0]
            .split(":")
            .map((e) => parseInt(e) + 1),
        ]);
      }, 16)
    );

    return () => {
      //console.log("cleared");
      clearInterval(timeAnimator);
    };
  }, []);

  useEffect(() => {
    props.sessionSize !== paramsValue[0] &&
      setParamsValue((prev) => ({ ...prev, 0: props.sessionSize }));
  }, [props.sessionSize]);

  useEffect(() => {
    props.gridSize !== paramsValue[1] &&
      setParamsValue((prev) => ({ ...prev, 1: props.gridSize }));
  }, [props.gridSize]);

  useEffect(() => {
    props.sessionData &&
      props.sessionData.bpm !== paramsValue[2] &&
      setParamsValue((prev) => ({ ...prev, 2: props.sessionData.bpm }));
  }, [props.sessionData]);

  useEffect(() => {
    if (typeof selecting === "number")
      handleParameterChange(props.mousePosition[1]);
  }, [mousePosition]);

  useEffect(() => {
    if (selecting === null) {
      commitValue();
    }
  }, [selecting]);

  return (
    <>
      <Box
        className="ws-transport"
        onClick={(e) =>
          !e.target.className.includes("wstr-back") && setExpanded(true)
        }
        tabIndex={-1}
        sx={(theme) => ({
          [theme.breakpoints.down("md")]: {
            marginY: 1,
            height: 32,
          },
        })}
      >
        <Box style={{ width: 88 }}>
          {props.selectedTrack !== null && (
            <IconButton
              className="wstr-back"
              onClick={() => props.setSelectedTrack(null)}
            >
              <Icon className="wstr-back">arrow_back</Icon>
            </IconButton>
          )}
        </Box>

        <Box sx={{ typography: { fontSize: 40 }, margin: "auto" }}>
          {time[1] &&
            time[1].map((e, i) => (
              <>
                <Typography color="textPrimary" variant="h4" sx={{ width: 24 }}>
                  {e}
                </Typography>
                {i !== 2 && (
                  <Typography color="textPrimary" variant="h4">
                    |
                  </Typography>
                )}
              </>
            ))}
        </Box>
        <Box className="ws-transport-info">
          {sessionParams.map((e) => (
            <Box key={e.i}>
              <Icon
                sx={(theme) => ({
                  color: "text.primary",
                  fontSize: "1rem",
                  [theme.breakpoints.down("md")]: {
                    fontSize: 12,
                  },
                })}
              >
                {e.i}
              </Icon>
              <Typography
                variant="body1"
                color="textPrimary"
                sx={(theme) => ({
                  [theme.breakpoints.down("md")]: {
                    fontSize: 8,
                  },
                })}
              >
                {e.t}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Dialog
        open={expanded}
        onClose={() => setExpanded(false)}
        maxWidth="lg"
        fullWidth
      >
        <Grid
          container
          spacing={2}
          justifyContent="space-around"
          sx={{ py: 3 }}
        >
          {sessionParams.map((e, i) => (
            <Grid
              item
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Box
                ref={boxRefs[i]}
                className="ws-transport-box"
                onMouseDown={(e) => {
                  if (e.target.className.includes("material-icons")) return;
                  setSelecting(i);
                }}
              >
                <Icon onClick={() => handleArrowClick(i, true)}>
                  keyboard_arrow_up
                </Icon>
                <div className="break" />
                <Typography variant="h4">{paramsValue[i]}</Typography>
                <div className="break" />
                <Icon onClick={() => handleArrowClick(i, false)}>
                  keyboard_arrow_down
                </Icon>
              </Box>
              <div className="break" style={{ height: 16 }} />
              <Icon>{e.i}</Icon>
              <Typography sx={{ ml: 1 }} variant="body1">
                {e.lbl}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Dialog>
      {selecting !== null && (
        <div
          className="knob-backdrop"
          onMouseMove={(e) => setMousePosition([e.pageX, e.pageY])}
          onMouseUp={() => setSelecting(null)}
          onMouseOut={() => setSelecting(null)}
        />
      )}
    </>
  );
}

export default WorkspaceTransport;
