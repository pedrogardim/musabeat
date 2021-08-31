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
} from "@material-ui/core";

import SessionGalleryItem from "../SessionExplorer/SessionGalleryItem";

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

  const userKey = useParams().key;

  const usersRef = firebase.firestore().collection("users");
  const userInfoRef = firebase.firestore().collection("users").doc(userKey);
  const sessionsRef = firebase.firestore().collection("sessions");
  const user = firebase.auth().currentUser;

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
    /* if (user) {
      usersRef
        .doc(user.uid)
        .get()
        .then((r) => setIsFileLiked(r.data().likedFiles.includes(fileKey)));
    } */
  };

  const getUserSessions = () => {
    Promise.all(
      userInfo.sessions.map(async (e) => await sessionsRef.doc(e).get())
    ).then((r) => setUserSessions(r.map((e) => e.data())));
  };

  const handleUserFollow = () => {
    /*  if (!isFileLiked) {
      //file is not liked
      setIsFileLiked(true);
      setFileInfo((prev) => {
        let newFileInfo = { ...prev };
        newFileInfo.likes++;
        return newFileInfo;
      });
      fileInfoRef.update({
        likes: firebase.firestore.FieldValue.increment(1),
      });
      usersRef.doc(user.uid).update({
        likedFiles: firebase.firestore.FieldValue.arrayUnion(fileKey),
      });
    } else {
      setIsFileLiked(false);
      setFileInfo((prev) => {
        let newFileInfo = { ...prev };
        newFileInfo.likes--;
        return newFileInfo;
      });
      fileInfoRef.update({
        likes: firebase.firestore.FieldValue.increment(-1),
      });
      usersRef.doc(user.uid).update({
        likedFiles: firebase.firestore.FieldValue.arrayRemove(fileKey),
      });
    } */
  };

  const huehue = () => {
    firebase
      .firestore()
      .collection("sessions")
      .get()
      .then((r) =>
        r.forEach((e) => {
          firebase
            .firestore()
            .collection("users")
            .doc(e.data().creator)
            .update({
              sessions: firebase.firestore.FieldValue.arrayUnion(e.id),
            })
            .then(
              console.log("done on session " + e.id + " to user : " + e.creator)
            );
        })
      );
  };

  useEffect(() => {
    getUserInfo();

    return () => {};
  }, []);

  useEffect(() => {
    userInfo && getUserSessions();
  }, [userInfo]);

  return (
    <div className="user-page">
      {userInfo && (
        <Tooltip title={userInfo.profile.displayName}>
          <Avatar
            alt={userInfo.profile.displayName}
            src={userInfo.profile.photoURL}
            className="user-page-avatar"
          />
        </Tooltip>
      )}

      <div className="break" />

      {userInfo && (
        <Typography variant="h3">{userInfo.profile.displayName}</Typography>
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
      <Typography variant="overline">Sessions</Typography>
      <div className="break" />

      {userSessions &&
        userSessions
          .filter((e, i) => i < 6)
          .map((session, sessionIndex) => (
            <SessionGalleryItem
              handleSessionSelect={() =>
                openPage("session", userInfo.sessions[sessionIndex])
              }
              userPage
              /*handleUserLike={() => handleUserLike(sessionIndex)}
          handleSessionDelete={setDeleteDialog}
          setPlayingSession={() =>
            setPlayingSession((prev) =>
              prev === sessionIndex ? null : sessionIndex
            )
          }
          playingLoadingProgress={playingLoadingProgress}
          setRenameDialog={setRenameDialog}
          playingSession={playingSession === sessionIndex} */
              key={`sgi${sessionIndex}`}
              index={sessionIndex}
              session={session}
              isUser={props.isUser}
              /* likedByUser={
            userLikes && userLikes.includes(userInfo.sessions[sessionIndex])
          } */
              createNewSession={props.createNewSession}
            />
          ))}
    </div>
  );
}

export default UserPage;
