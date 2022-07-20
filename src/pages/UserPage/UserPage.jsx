import React, { useState, useEffect, useRef } from "react";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import { useParams } from "react-router-dom";

import {
  Paper,
  Grid,
  Icon,
  Avatar,
  Tooltip,
  Divider,
  Typography,
  Fab,
} from "@mui/material";

import SessionExplorer from "../../components/SessionExplorer";
import LoadingScreen from "../../components/LoadingScreen";

import NotFoundPage from "../NotFoundPage";

import "./style.css";

function UserPage(props) {
  const { t } = useTranslation();

  const waveformWrapper = useRef(null);

  const [userKey, setUserKey] = useState(null);

  const [userInfo, setUserInfo] = useState(null);
  const [userSessions, setUserSessions] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);

  const username = useParams().key;

  const isUser = props.user && props.user.displayName === username;

  const usersRef = firebase.firestore().collection("users");
  const sessionsRef = firebase.firestore().collection("sessions");

  const getUserInfo = () => {
    usersRef
      .where("profile.username", "==", username)
      .limit(1)
      .get()
      .then((r) => {
        if (r.empty) {
          setUserKey(undefined);
          return;
        } else {
          setUserKey(r.docs[0].id);
          setUserInfo(r.docs[0].data());
        }
      });

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
    userKey !== null && setUserKey(null);
    userInfo !== null && setUserInfo(null);
    getUserInfo();
  }, [username]);

  return userInfo ? (
    <div className="user-page">
      <div className="user-page-background" />

      <Paper elevation={9} className="user-page-main-content">
        {userInfo && (
          <Tooltip title={userInfo.profile.username}>
            <Avatar
              alt={userInfo.profile.username}
              src={userInfo.profile.photoURL}
              className="user-page-avatar"
            />
          </Tooltip>
        )}
        {userInfo && (
          <Typography variant="h3">{userInfo.profile.username}</Typography>
        )}
        <div className="break" />

        {userInfo && (
          <Typography variant="body1">{`${userInfo.fllrs} ${t(
            "user.followers"
          )}`}</Typography>
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
                {t("sidemenu.instruments")}
                <br />
                {userInfo.patches.length}
              </Typography>
            </div>
            <Divider orientation="vertical" flexItem />
            <div className="file-info-card">
              <Typography variant="overline">
                {t("sidemenu.drumsets")}

                <br />
                {userInfo.drumpatches.length}
              </Typography>{" "}
            </div>
            <Divider orientation="vertical" flexItem />
            <div className="file-info-card">
              <Typography variant="overline">
                {t("sidemenu.files")}

                <br />
                {userInfo.files.length}
              </Typography>
            </div>
          </Grid>
        )}
        <div className="break" />
        <Typography variant="overline"> {t("home.sessions")}</Typography>
        <div className="break" />
        <div className="user-page-sessions-cont">
          <SessionExplorer
            handlePageNav={props.handlePageNav}
            target={userKey}
            user={props.user}
            setNewSessionDialog={props.setNewSessionDialog}
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
  ) : userKey === undefined ? (
    <NotFoundPage type="user" />
  ) : (
    <LoadingScreen open={true} />
  );
}

export default UserPage;
