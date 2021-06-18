import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Paper,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@material-ui/core";

import SessionGalleryItem from "./SessionGalleryItem";
import NameInput from "../Dialogs/NameInput";
import Workspace from "../Workspace";

import "./SessionExplorer.css";

import firebase from "firebase";

function SessionExplorer(props) {
  const [sessions, setSessions] = useState([]);
  const [sessionKeys, setSessionKeys] = useState([]);
  const [userLikes, setUserLikes] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [renameDialog, setRenameDialog] = useState(null);
  const [playingSession, setPlayingSession] = useState(null);
  const [playingLoadingProgress, setPlayingLoadingProgress] = useState(0);

  const isUser = props.currentPage === "userSessions";

  const getSessionList = async () => {
    //console.log(isUser ? "fetching user sessions" : "fetching explore");
    let dbRef = isUser
      ? firebase.database().ref("users").child(props.user.uid).child("sessions")
      : firebase.database().ref("sessions");
    const sessionKeys = (await dbRef.get()).val();
    isUser
      ? setSessionKeys(sessionKeys)
      : setSessionKeys(Object.keys(sessionKeys));
    !isUser && setSessions(Object.values(sessionKeys));

    isUser &&
      !!sessionKeys &&
      (await Promise.all(
        sessionKeys.map(async (e, i) => {
          let sessionRef = firebase.database().ref("sessions").child(e);
          let session = (await sessionRef.get()).val();
          //console.log(session);
          setSessions((prev) => [...prev, session]);
        })
      ));
  };

  const handleUserLike = (index) => {
    let newUserLikes = userLikes.includes(sessionKeys[index])
      ? userLikes.filter((e) => e !== sessionKeys[index])
      : [...userLikes, sessionKeys[index]];

    setUserLikes(newUserLikes);

    //add session to user "likes" array

    let userLikesRef = firebase
      .database()
      .ref("users")
      .child(props.user.uid)
      .child("likes");
    userLikesRef.set(newUserLikes);

    //add user to session "likedBy" array and increment like number on session

    let sessionRef = firebase
      .database()
      .ref("sessions")
      .child(sessionKeys[index]);
    sessionRef.get().then((snapshot) => {
      let session = snapshot.val();

      session.likes = session.hasOwnProperty("likedBy")
        ? session.likedBy.includes(props.user.uid)
          ? session.likes - 1
          : session.likes + 1
        : 1;

      session.likedBy = session.hasOwnProperty("likedBy")
        ? session.likedBy.includes(props.user.uid)
          ? session.likedBy.filter((e) => e !== props.user.uid)
          : [...session.likedBy, props.user.uid]
        : [props.user.uid];

      sessionRef.set(session);

      setSessions((prev) => {
        let newSessions = [...prev];
        newSessions[index] = session;
        return newSessions;
      });
    });
  };

  const handleSessionDelete = () => {
    let index = deleteDialog;
    const sessionRef = firebase
      .database()
      .ref(`sessions/${sessionKeys[index]}`);
    sessionRef.remove();
    const userSessionsRef = firebase
      .database()
      .ref(`users/${props.user.uid}/sessions`);

    userSessionsRef
      .get()
      .then((snapshot) =>
        userSessionsRef.set(
          snapshot.val().filter((e) => e !== sessionKeys[index])
        )
      );

    setSessions((prev) => prev.filter((e, i) => i !== index));
    setSessionKeys((prev) => prev.filter((e, i) => i !== index));

    setDeleteDialog(null);
  };

  const handleSessionRename = (newName) => {
    let index = renameDialog;
    const sessionRefName = firebase
      .database()
      .ref(`sessions/${sessionKeys[index]}/name`);
    sessionRefName.set(newName);
    sessions[index].name = newName;
    setRenameDialog(null);
  };

  const getUserLikes = () => {
    let dbLikesRef = firebase
      .database()
      .ref("users")
      .child(props.user.uid)
      .child("likes");
    dbLikesRef.get().then((snapshot) => {
      !!snapshot.val() && setUserLikes(snapshot.val());
    });
  };

  const handleSessionSelect = (index) => {
    //props.setOpenedSession(sessionKeys[input]);
    props.setOpenedSession(sessionKeys[index]);
    props.setCurrentPage(null);
  };

  useEffect(() => {
    return () => {};
  }, []);

  useEffect(() => {
    //console.log(playingSession);
    //Tone.Transport.seconds = 0;
    //Tone.Transport.clear();
    if (playingSession === null) {
      Tone.Transport.pause();
      console.log("stop");
    }
  }, [playingSession]);

  useEffect(() => {
    setSessions([]);
    getSessionList();
    props.user && getUserLikes();
  }, [props.currentPage]);

  return (
    <div className="session-explorer">
      {!!sessions.length ? (
        <Fragment>
          {sessions.map((session, sessionIndex) => (
            <Fragment>
              <SessionGalleryItem
                handleSessionSelect={handleSessionSelect}
                handleUserLike={() => handleUserLike(sessionIndex)}
                handleSessionDelete={setDeleteDialog}
                setPlayingSession={() =>
                  setPlayingSession((prev) =>
                    prev === sessionIndex ? null : sessionIndex
                  )
                }
                playingLoadingProgress={playingLoadingProgress}
                setRenameDialog={setRenameDialog}
                playingSession={playingSession === sessionIndex}
                key={`sgi${sessionIndex}`}
                index={sessionIndex}
                session={session}
                isUser={isUser}
                likedByUser={userLikes.includes(sessionKeys[sessionIndex])}
                createNewSession={props.createNewSession}
              />
              {sessionIndex % 4 === 3 && <div className="break" />}
            </Fragment>
          ))}
        </Fragment>
      ) : !sessionKeys || !sessionKeys.length ? (
        <Fragment>
          <Typography variant="h1">:p</Typography>
          <div className="break" />
          <p>No sessions here...</p>
          <div className="break" />
          <Button onClick={props.createNewSession} color="primary">
            Create New Session!
          </Button>
        </Fragment>
      ) : (
        <CircularProgress />
      )}
      {deleteDialog !== null && (
        <Dialog open="true" onClose={() => setDeleteDialog(null)}>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Deleting a session is an action that can't be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button>Cancel</Button>
            <Button color="secondary" onClick={handleSessionDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {renameDialog !== null && (
        <NameInput
          onSubmit={handleSessionRename}
          onClose={() => setRenameDialog(null)}
        />
      )}
      {playingSession !== null && (
        <Workspace
          hidden
          session={sessions[playingSession]}
          isPlaying={true}
          setPlayingLoadingProgress={setPlayingLoadingProgress}
        />
      )}
    </div>
  );
}

export default SessionExplorer;
