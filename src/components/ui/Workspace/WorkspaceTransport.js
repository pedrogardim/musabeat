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
            .map((e) => parseInt(e) + 1)
            .join("|"),
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
      <div>{time[0]}</div>

      <div>{time[1]}</div>
      <div>{props.sessionSize}</div>
      <div>1/{props.gridSize}</div>
    </div>
  );
}

export default WorkspaceTransport;
