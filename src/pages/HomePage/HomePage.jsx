import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/material";

import AvatarRow from "./AvatarRow";
import AppLogo from "../../components/AppLogo";
import SessionExplorer from "../../components/SessionExplorer";

import "./style.css";

import { colors } from "../../utils/Pallete";

const color = colors[2];

function HomePage(props) {
  const { t } = useTranslation();

  const [stats, setStats] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

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

  /* useEffect(() => {
    if (userInfo !== null) fetchFeed(userInfo.feed);
  }, [userInfo]); */

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
          {userInfo ? (
            <span>
              {t("home.userWelcome")}{" "}
              <span style={{ fontStyle: "italic" }}>
                {userInfo.profile.username}
              </span>
            </span>
          ) : (
            t("home.unloggedWelcome")
          )}
        </Typography>
        <div className="break" />
        {props.user === null && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => props.setAuthDialog(true)}
          >
            {t("home.notLoggedButton")}
          </Button>
        )}
        <div className="break" />
        <Typography variant="subtitle2">
          {t(props.user ? "home.userCreated" : "home.communityCreated")}
        </Typography>
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
              {userInfo && userInfo.session
                ? userInfo.sessions.length
                : stats
                ? stats.sessions
                : "..."}
            </Typography>

            <Typography variant={"overline"}>{t("home.sessions")}</Typography>
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item sm={3}>
            <Typography variant={"h6"}>
              {userInfo && userInfo.patches && userInfo.drumPatches
                ? userInfo.patches.length + userInfo.drumPatches.length
                : stats
                ? stats.patches + stats.drumpatches
                : "..."}
            </Typography>

            <Typography variant={"overline"}>
              {t("sidemenu.instruments")}
            </Typography>
          </Grid>
          <Divider orientation="vertical" flexItem />
          <Grid item sm={3}>
            <Typography variant={"h6"}>
              {userInfo && userInfo.files
                ? userInfo.files.length
                : stats
                ? stats.files
                : "..."}
            </Typography>

            <Typography variant={"overline"}>{t("sidemenu.files")}</Typography>
          </Grid>
        </Grid>
      </Card>
      {props.user && (
        <AvatarRow
          userInfo={userInfo}
          setSelectedUser={setSelectedUser}
          user={props.user}
        />
      )}
      <div
        className="home-page-card"
        style={{ position: "relative", flexGrow: 1 }}
      >
        <SessionExplorer
          compact
          target={selectedUser}
          handlePageNav={props.handlePageNav}
        />
      </div>

      <Fab
        className="home-page-new-session-btn"
        color="primary"
        variant="extended"
        sx={{ zIndex: 2 }}
        onClick={() =>
          props.user
            ? props.createNewSession(
                undefined,
                props.handlePageNav,
                props.setOpenedSession
              )
            : props.setAuthDialog(true)
        }
      >
        <Icon style={{ marginRight: 8 }}>add_circle</Icon>
        {t("sidemenu.newSession")}
      </Fab>
    </div>
  );
}

export default HomePage;
