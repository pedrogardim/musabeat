import React, { useState, useEffect, Fragment, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import { useParams } from "react-router-dom";

import {
  Paper,
  Chip,
  Grid,
  Icon,
  Divider,
  Avatar,
  Tooltip,
  Typography,
  Fab,
  Button,
  CircularProgress,
  Card,
} from "@material-ui/core";

import AppLogo from "./AppLogo";

import "./HomePage.css";

import { colors } from "../../utils/materialPalette";

const color = colors[2];

function HomePage(props) {
  const { t } = useTranslation();

  const waveformWrapper = useRef(null);

  const [stats, setStats] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const getStats = () => {
    firebase
      .firestore()
      .collection("musa")
      .doc("stats")
      .get()
      .then((r) => setStats(r.data()));

    props.user
      ? firebase
          .firestore()
          .collection("users")
          .doc(props.user.uid)
          .get()
          .then((r) => setUserInfo(r.data()))
      : setUserInfo(null);
  };

  useEffect(() => {
    getStats();

    return () => {
      //console.log("cleared");
    };
  }, [props.user]);

  return (
    <div className="home-page">
      <Card elevation={4} className="home-page-card">
        <AppLogo className="hp-card-logo" animated />
        <div className="break" />
        <Typography variant="h5">
          {" "}
          {`Welcome ${userInfo ? userInfo.profile.displayName : "to Musa"}!`}
        </Typography>
        <div className="break" />
        {props.user === null && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => props.setAuthDialog(true)}
          >
            You are not logged in
          </Button>
        )}
        <div className="break" />
        <Typography variant="subtitle2">{`${
          props.user ? "You have" : "Our community has"
        } created:`}</Typography>
        <div className="break" />
        <Grid
          className="home-page-card-grid"
          container
          justify="center"
          alignContent="center"
          alignItems="center"
          wrap="nowrap"
        >
          <Grid item sm={3}>
            <Typography variant={"h6"}>
              {userInfo
                ? userInfo.sessions.length
                : stats
                ? stats.sessions
                : "..."}
            </Typography>

            <Typography variant={"overline"}>Sessions</Typography>
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item sm={3}>
            <Typography variant={"h6"}>
              {userInfo
                ? userInfo.patches.length + userInfo.drumPatches.length
                : stats
                ? stats.patches + stats.drumpatches
                : "..."}
            </Typography>

            <Typography variant={"overline"}>Instruments</Typography>
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item sm={3}>
            <Typography variant={"h6"}>
              {userInfo ? userInfo.files.length : stats ? stats.files : "..."}
            </Typography>

            <Typography variant={"overline"}>Files</Typography>
          </Grid>
        </Grid>
      </Card>
      <Fab
        className="home-page-new-session-btn"
        color="primary"
        variant="extended"
      >
        <Icon>add_circle</Icon>
        Create a session
      </Fab>
    </div>
  );
}

export default HomePage;
