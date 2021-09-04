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

  const [userInfo, setUserInfo] = useState(null);
  const [userSessions, setUserSessions] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);

  const userKey = useParams().key;

  const isUser = userKey === props.user.uid;

  const usersRef = firebase.firestore().collection("users");
  const userInfoRef = firebase.firestore().collection("users").doc(userKey);
  const sessionsRef = firebase.firestore().collection("sessions");

  const openPage = (route, id) => {
    //console.log(id);
    const win = window.open(`/${route}/${id}`, "_blank");
    win.focus();
  };

  const getUserInfo = () => {
    userInfoRef.get().then((r) => {
      setUserInfo(r.data());

      /* let date = new Date(r.data().upOn.seconds * 1000);
      let creationDate = `${t("misc.uploadedOn")} ${date.getDate()}/${
        date.getMonth() + 1
      }/${date.getFullYear()}`;
      setUploadDateString(creationDate);
      Tone.Transport.loop = false;
      Tone.Transport.setLoopPoints(0, r.data().dur);
      //console.log(0, r.data().dur);

      fileInfoRef.update({
        loaded: firebase.firestore.FieldValue.increment(1),
      });

      usersRef
        .doc(r.get("user"))
        .get()
        .then((user) => {
          setCreatorInfo(user.data());
        }); */
    });

    //liked by user
    if (props.user) {
      usersRef
        .doc(props.user.uid)
        .get()
        .then((r) => setIsFollowing(r.data().fllwing.includes(userKey)));
    }
  };

  const handleFollow = () => {
    if (!isFollowing) {
      firebase
        .firestore()
        .collection("users")
        .doc(props.user.uid)
        .update({
          fllwing: firebase.firestore.FieldValue.arrayUnion(userKey),
        });

      firebase
        .firestore()
        .collection("users")
        .doc(userKey)
        .update({
          fllrs: firebase.firestore.FieldValue.increment(1),
        });

      setIsFollowing(true);

      setUserInfo((prev) => {
        let a = { ...prev };
        a.fllrs++;
        return a;
      });
    } else {
      firebase
        .firestore()
        .collection("users")
        .doc(props.user.uid)
        .update({
          fllwing: firebase.firestore.FieldValue.arrayRemove(userKey),
        });

      firebase
        .firestore()
        .collection("users")
        .doc(userKey)
        .update({
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

    return () => {};
  }, []);

  return (
    <div className="user-page">
      <div className="user-page-background" />
      {userInfo && (
        <Tooltip title={userInfo.profile.displayName}>
          <Avatar
            alt={userInfo.profile.displayName}
            src={userInfo.profile.photoURL}
            className="user-page-avatar"
          />
        </Tooltip>
      )}

      <Paper elevation={9} className="user-page-main-content">
        {userInfo && (
          <Typography variant="h3">{userInfo.profile.displayName}</Typography>
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
            history={props.history}
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
