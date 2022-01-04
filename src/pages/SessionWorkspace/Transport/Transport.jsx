import React, { useState, useEffect, useRef, useContext } from "react";

import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

import * as Tone from "tone";

import { Icon, IconButton, Box, Typography, Dialog, Grid } from "@mui/material";

import wsCtx from "../../../context/SessionWorkspaceContext";

function Transport(props) {
  const { t } = useTranslation();

  const boxRefs = [useRef(null), useRef(null), useRef(null)];

  const { params, paramSetter, setSessionData, sessionData } =
    useContext(wsCtx);

  const { gridSize, sessionSize, selectedTrack } = params;

  const { bpm } = sessionData ? sessionData : {};

  const [expanded, setExpanded] = useState(false);
  const [time, setTime] = useState([]);
  const [timeAnimator, setTimeAnimator] = useState(null);
  const [selecting, setSelecting] = useState(null);
  const [paramsValue, setParamsValue] = useState({
    0: sessionSize,
    1: gridSize,
    2: bpm,
  });
  const [mousePosition, setMousePosition] = useState([0, 0]);

  //t: value only for display when closed
  const sessionParams = [
    {
      i: "straighten",
      lbl: "Session Size",
      range: [1, 128],
      sens: 30,
    },
    {
      i: "calendar_view_week",
      lbl: "Grid",
      range: [1, 32],
      sens: 64,
    },
    {
      i: "timer",
      lbl: "BPM",
      range: [50, 300],
      sens: 3,
    },
  ];

  const handleParameterChange = (pageY) => {
    let valueDelta = -Math.floor(
      (pageY -
        boxRefs[0].current.getBoundingClientRect().top -
        boxRefs[0].current.offsetHeight / 2) /
        sessionParams[selecting].sens
    );

    let value =
      selecting === 0
        ? sessionSize + valueDelta
        : selecting === 1
        ? Math.pow(2, Math.log2(gridSize) + valueDelta)
        : bpm + valueDelta;

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
        ? sessionSize + (increment ? 1 : -1)
        : param === 1
        ? Math.pow(2, Math.log2(gridSize) + (increment ? 1 : -1))
        : bpm + (increment ? 1 : -1);

    if (
      value >= sessionParams[param].range[0] &&
      value <= sessionParams[param].range[1]
    ) {
      setParamsValue((prev) => ({ ...prev, [param]: value }));
      param === 0
        ? paramSetter("sessionSize", value)
        : param === 1
        ? paramSetter("gridSize", value)
        : setSessionData((prev) => ({ ...prev, bpm: value }));
    }
  };

  const commitValue = () => {
    paramSetter("sessionSize", paramsValue[0], "gridSize", paramsValue[1]);
    setSessionData((prev) => ({ ...prev, bpm: paramsValue[2] }));
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
    sessionSize !== paramsValue[0] &&
      setParamsValue((prev) => ({ ...prev, 0: sessionSize }));
  }, [sessionSize]);

  useEffect(() => {
    gridSize !== paramsValue[1] &&
      setParamsValue((prev) => ({ ...prev, 1: gridSize }));
  }, [gridSize]);

  useEffect(() => {
    bpm !== paramsValue[2] && setParamsValue((prev) => ({ ...prev, 2: bpm }));
  }, [bpm]);

  useEffect(() => {
    if (typeof selecting === "number") handleParameterChange(mousePosition[1]);
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
        tabIndex={-1}
        sx={(theme) => ({
          [theme.breakpoints.down("md")]: {
            marginY: 1,
            height: 32,
          },
        })}
      >
        <Box style={{ width: 88 }}>
          {selectedTrack !== null && (
            <IconButton
              className="wstr-back"
              onClick={() => paramSetter("selectedTrack", null)}
              sx={{ width: 48, height: 48 }}
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
        <Box className="ws-transport-info" onClick={() => setExpanded(true)}>
          {sessionParams.map((e, i) => (
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
                {paramsValue[i]}
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

export default Transport;
