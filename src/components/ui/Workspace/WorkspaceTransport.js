import React, { useState, useEffect, Fragment } from "react";
import { Helmet } from "react-helmet";

import firebase from "firebase";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

import * as Tone from "tone";

import { Icon, IconButton, Box, Typography } from "@mui/material";

import { Skeleton } from "@mui/material";

import { sessionTags } from "../../../assets/musicutils";

import "./Workspace.css";

function WorkspaceTransport(props) {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);
  const [time, setTime] = useState([]);
  const [timeAnimator, setTimeAnimator] = useState(null);

  const history = useHistory();

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

  /* useEffect(() => {
    console.log(props.editorProfiles);
  }, [props.editorProfiles]); */

  return (
    <Box
      className="ws-transport"
      onClick={() => setExpanded(true)}
      tabIndex="-1"
      sx={(theme) => ({
        [theme.breakpoints.down("md")]: {
          marginY: 1,
          height: 32,
        },
      })}
    >
      <Box style={{ width: 88 }}>
        {props.selectedTrack !== null && (
          <IconButton onClick={() => props.setSelectedTrack(null)}>
            <Icon>arrow_back</Icon>
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
        {[
          { i: "calendar_view_week", t: props.sessionSize },
          { i: "straighten", t: "1/" + props.gridSize },
          {
            i: "timer",
            t: props.sessionData && props.sessionData.bpm,
          },
        ].map((e) => (
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
  );
}

export default WorkspaceTransport;
