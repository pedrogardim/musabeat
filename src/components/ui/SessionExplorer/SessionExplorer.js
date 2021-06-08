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

import "./SessionExplorer.css";

import firebase from "firebase";

function SessionExplorer(props) {
  const [sessions, setSessions] = useState([]);
  const [sessionKeys, setSessionKeys] = useState([]);
  const [userLikes, setUserLikes] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(null);

  const [renameDialog, setRenameDialog] = useState(null);

  const isUser = props.currentPage === "userSessions";

  const getSessionList = async () => {
    console.log(isUser ? "fetching user sessions" : "fetching explore");
    let dbRef = isUser
      ? firebase.database().ref("users").child(props.user.uid).child("sessions")
      : firebase.database().ref("sessions");
    const sessionKeys = (await dbRef.get()).val();
    isUser
      ? setSessionKeys(sessionKeys)
      : setSessionKeys(Object.keys(sessionKeys));
    !isUser && setSessions(Object.values(sessionKeys));

    isUser &&
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
    props.setOpenedSession(sessionKeys[index]);
    props.setCurrentPage(null);
  };

  useEffect(() => {
    return () => {};
  }, []);

  useEffect(() => {
    console.log(renameDialog, deleteDialog);
  }, [renameDialog, deleteDialog]);

  useEffect(() => {
    setSessions([]);
    getSessionList();
    getUserLikes();
  }, [props.currentPage]);
  /* 
  useEffect(() => {
    console.log(sessionKeys, sessions);
  }, [sessions, sessionKeys]);
 */
  return (
    <div className="session-explorer">
      {!!sessions.length ? (
        <Fragment>
          {sessions.map((session, sessionIndex) => (
            <SessionGalleryItem
              handleSessionSelect={handleSessionSelect}
              handleUserLike={() => handleUserLike(sessionIndex)}
              handleSessionDelete={setDeleteDialog}
              setRenameDialog={setRenameDialog}
              key={`sgi${sessionIndex}`}
              index={sessionIndex}
              session={session}
              isUser={isUser}
              likedByUser={userLikes.includes(sessionKeys[sessionIndex])}
            />
          ))}
        </Fragment>
      ) : (
        <CircularProgress />
      )}
      {deleteDialog !== null && (
        <Dialog open="true" onClose={()=>setDeleteDialog(null)}>
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
          onClose={()=>setRenameDialog(null)}
        />
      )}
    </div>
  );
}

export default SessionExplorer;
