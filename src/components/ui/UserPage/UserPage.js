import React, { useState, useEffect, Fragment, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import Draggable from "react-draggable";

import { useParams } from "react-router-dom";

import {
  Paper,
  Chip,
  Grid,
  CircularProgress,
  Icon,
  IconButton,
  Avatar,
  Tooltip,
  Divider,
  List,
  ListItem,
  Typography,
  Fab,
} from "@material-ui/core";

import SessionExplorer from "../SessionExplorer/SessionExplorer";

import "./UserPage.css";

import {
  fileExtentions,
  soundChannels,
  fileTags,
} from "../../../assets/musicutils";

import { colors } from "../../../utils/materialPalette";
import { get } from "jquery";
const waveColor = colors[2];

function UserPage(props) {
  const { t } = useTranslation();

  const waveformWrapper = useRef(null);

  const [userKey, setUserKey] = useState(null);

  const [userInfo, setUserInfo] = useState(null);
  const [userSessions, setUserSessions] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);

  const isUser = props.user && userKey === props.user.uid;

  const username = useParams().key;

  const usersRef = firebase.firestore().collection("users");
  const sessionsRef = firebase.firestore().collection("sessions");

  const getUserInfo = () => {
    usersRef
      .where("profile.username", "==", username)
      .limit(1)
      .get()
      .then((r) => setUserInfo(r.docs[0].data()));

    //followed by user
    if (props.user) {
      usersRef
        .doc(props.user.uid)
        .get()
        .then((r) => setIsFollowing(r.data().fllwing.includes(userKey)));
    }
  };

  const handleFollow = () => {
    if (!isFollowing) {
      usersRef.doc(props.user.uid).update({
        fllwing: firebase.firestore.FieldValue.arrayUnion(userKey),
      });

      usersRef.doc(userKey).update({
        fllrs: firebase.firestore.FieldValue.increment(1),
      });

      setIsFollowing(true);

      setUserInfo((prev) => {
        let a = { ...prev };
        a.fllrs++;
        return a;
      });
    } else {
      usersRef.doc(props.user.uid).update({
        fllwing: firebase.firestore.FieldValue.arrayRemove(userKey),
      });

      usersRef.doc(userKey).update({
        fllrs: firebase.firestore.FieldValue.increment(-1),
      });

      setIsFollowing(false);

      setUserInfo((prev) => {
        let a = { ...prev };
        a.fllrs--;
        return a;
      });
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  return (
    <div className="user-page">
      <div className="user-page-background" />
      {userInfo && (
        <Tooltip title={userInfo.profile.username}>
          <Avatar
            alt={userInfo.profile.username}
            src={userInfo.profile.photoURL}
            className="user-page-avatar"
          />
        </Tooltip>
      )}

      <Paper elevation={9} className="user-page-main-content">
        {userInfo && (
          <Typography variant="h3">{userInfo.profile.username}</Typography>
        )}
        <div className="break" />

        {userInfo && (
          <Typography variant="body1">{`${userInfo.fllrs} followers`}</Typography>
        )}
        <div className="break" />

        {/* <div className="player-controls">
        <Tooltip title={fileInfo && fileInfo.likes}>
          <IconButton onClick={handleUserLike}>
            <Icon color={isFileLiked ? "secondary" : "inherit"}>follow</Icon>
          </IconButton>
        </Tooltip>

      
      </div>
      <div className="break" />*/}

        {/* <IconButton onClick={huehue}>
        <Icon>manage_accounts</Icon>
      </IconButton>

      <div className="break" /> */}

        {userInfo && (
          <Grid
            container
            direction="row"
            wrap="nowrap"
            spacing={1}
            component={Paper}
            className="user-page-info"
          >
            <div className="file-info-card">
              <Typography variant="overline">
                Sessions
                <br />
                {userInfo.sessions.length}
              </Typography>
            </div>
            <Divider orientation="vertical" flexItem />

            <div className="file-info-card">
              <Typography variant="overline">
                Instruments
                <br />
                {userInfo.patches.length}
              </Typography>
            </div>
            <Divider orientation="vertical" flexItem />
            <div className="file-info-card">
              <Typography variant="overline">
                Drumsets
                <br />
                {userInfo.drumPatches.length}
              </Typography>{" "}
            </div>
            <Divider orientation="vertical" flexItem />
            <div className="file-info-card">
              <Typography variant="overline">
                Files
                <br />
                {userInfo.files.length}
              </Typography>
            </div>
          </Grid>
        )}
        <div className="break" />
        <Typography variant="overline">Top Sessions</Typography>
        <div className="break" />
        <div className="user-page-sessions-cont">
          <SessionExplorer
            handlePageNav={props.handlePageNav}
            target={userKey}
            user={props.user}
            compact
          />
        </div>
      </Paper>
      {!isUser && (
        <Fab
          onClick={handleFollow}
          className="up-fab"
          color={!isFollowing && "primary"}
        >
          <Icon>{!isFollowing ? "person_add" : "person_remove"}</Icon>
        </Fab>
      )}
    </div>
  );
}

export default UserPage;
