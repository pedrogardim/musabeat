import React, { useState, useEffect, Fragment } from "react";
import { Helmet } from "react-helmet";

import firebase from "firebase";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

import * as Tone from "tone";

import {
  Icon,
  IconButton,
  Typography,
  Tooltip,
  Avatar,
  Chip,
  Button,
} from "@material-ui/core";

import { Skeleton } from "@material-ui/lab";

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
    <div
      className="ws-transport"
      onClick={() => setExpanded(true)}
      tabIndex="-1"
    >
      <div style={{ width: 88 }}>
        {props.selectedModule !== null && (
          <IconButton onClick={() => props.setSelectedModule(null)}>
            <Icon>arrow_back</Icon>
          </IconButton>
        )}
      </div>

      <div style={{ margin: "auto", fontSize: 40 }}>
        <span style={{ width: 24 }}>{time[1] && time[1][0]}</span>
        <span>|</span>
        <span style={{ width: 24 }}>{time[1] && time[1][1]}</span>
        <span>|</span>
        <span style={{ width: 24 }}>{time[1] && time[1][2]}</span>
      </div>
      <div className="ws-transport-info">
        <div>
          <Icon style={{ opacity: 0.5 }}>timer</Icon>
          <span>{props.sessionSize}</span>
        </div>
        <div>
          <Icon style={{ opacity: 0.5 }}>calendar_view_week</Icon>
          <span>{"1 / " + props.gridSize}</span>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceTransport;
