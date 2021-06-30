import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Icon,
  OutlinedInput,
} from "@material-ui/core";

import SessionGalleryItem from "./SessionGalleryItem";
import PlaceholderSGI from "./PlaceholderSGI";
import NameInput from "../Dialogs/NameInput";
import DeleteConfirm from "../Dialogs/DeleteConfirm";

import Workspace from "../Workspace";

import "./SessionExplorer.css";

import firebase from "firebase";

function SessionExplorer(props) {
  const [sessions, setSessions] = useState([]);
  const [sessionKeys, setSessionKeys] = useState([]);
  const [userLikes, setUserLikes] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [renameDialog, setRenameDialog] = useState(null);
  const [playingSession, setPlayingSession] = useState(null);
  const [playingLoadingProgress, setPlayingLoadingProgress] = useState(0);

  const getSessionList = (value) => {
    //console.log(props.props.isUser ? "fetching user sessions" : "fetching explore");

    const dbRef = props.isUser
      ? firebase
          .firestore()
          .collection("sessions")
          .where("creator", "==", props.user.uid)
      : value
      ? firebase
          .firestore()
          .collection("sessions")
          .where("name", ">=", value)
          .where("name", "<=", value + "\uf8ff")
      : firebase.firestore().collection("sessions");

    dbRef.get().then((snapshot) => {
      //console.log(snapshot.docs.map((e) => [e.id, e.data()]));
      setSessionKeys(snapshot.docs.map((e) => e.id));
      setSessions(snapshot.docs.map((e) => e.data()));
    });
  };

  const handleUserLike = (index) => {
    //else:loggin pop-up
    if (props.user) {
      let isLiked = userLikes.includes(sessionKeys[index]);

      let newUserLikes = isLiked
        ? userLikes.filter((e) => e !== sessionKeys[index])
        : [...userLikes, sessionKeys[index]];

      setUserLikes(newUserLikes);

      setSessions((prev) => {
        let newSessions = [...prev];
        newSessions[index].likes = isLiked
          ? newSessions[index].likes - 1
          : newSessions[index].likes + 1;
        return newSessions;
      });

      //add session to user "likes" array

      firebase
        .firestore()
        .collection("users")
        .doc(props.user.uid)
        .update({
          likes: isLiked
            ? firebase.firestore.FieldValue.arrayRemove(sessionKeys[index])
            : firebase.firestore.FieldValue.arrayUnion(sessionKeys[index]),
        });

      firebase
        .firestore()
        .collection("sessions")
        .doc(sessionKeys[index])
        .update({
          likes: isLiked
            ? firebase.firestore.FieldValue.increment(-1)
            : firebase.firestore.FieldValue.increment(1),
        });
    }
  };

  const handleSessionDelete = () => {
    let index = deleteDialog;
    firebase
      .firestore()
      .collection("sessions")
      .doc(sessionKeys[index])
      .delete();

    setSessions((prev) => prev.filter((e, i) => i !== index));
    setSessionKeys((prev) => prev.filter((e, i) => i !== index));

    setDeleteDialog(null);
  };

  const handleSessionRename = (newName) => {
    let index = renameDialog;
    firebase
      .firestore()
      .collection("sessions")
      .doc(sessionKeys[index])
      .update({ name: newName });
    sessions[index].name = newName;
    setRenameDialog(null);
  };

  const getUserLikes = () => {
    let dbLikesRef = firebase
      .firestore()
      .collection("users")
      .doc(props.user.uid);

    dbLikesRef.get().then((snapshot) => {
      let data = snapshot.data().likes;

      setUserLikes(data);
    });
  };

  const handleSessionSelect = (index) => {
    //props.setOpenedSession(sessionKeys[index]);
    //props.setCurrentPage(null);
    props.history.push(`/session/${sessionKeys[index]}`);
  };

  const handleSearch = (e) => {
    e.key === "Enter" && getSessionList(e.target.value);
  };

  useEffect(() => {
    //console.log(playingSession);
    //Tone.Transport.seconds = 0;
    //Tone.Transport.clear();
    if (playingSession !== null) {
      Tone.Transport.pause();
      console.log("stop");
    }
  }, [playingSession]);

  useEffect(() => {
    setSessions([]);
    getSessionList();
    props.user && getUserLikes();
  }, [props.isUser, props.user]);

  return (
    <div className="session-explorer">
      {!!sessions.length ? (
        <Fragment>
          {!props.isUser && (
            <OutlinedInput
              style={{ fontSize: 24 }}
              startAdornment={
                <InputAdornment position="start">
                  <Icon>search</Icon>
                </InputAdornment>
              }
              onKeyPress={handleSearch}
            />
          )}
          <div className="break" />
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
                isUser={props.isUser}
                likedByUser={
                  userLikes && userLikes.includes(sessionKeys[sessionIndex])
                }
                createNewSession={props.createNewSession}
              />
              {/* sessionIndex % 4 === 3 && <div className="break" /> */}
            </Fragment>
          ))}
        </Fragment>
      ) : props.isUser && !sessionKeys ? (
        <Fragment>
          <Typography variant="h1">:p</Typography>
          <div className="break" />
          <p>No sessions here...</p>
          <div className="break" />
          <Button onClick={props.createNewSession} color="primary">
            Create New Session!
          </Button>
        </Fragment>
      ) : !sessions.length ? (
        Array(props.isUser ? 3 : 15)
          .fill(1)
          .map((e) => <PlaceholderSGI />)
      ) : (
        ""
      )}
      <DeleteConfirm
        open={deleteDialog !== null}
        onClose={() => setDeleteDialog(null)}
        action={handleSessionDelete}
      />
      {/* {deleteDialog !== null && (
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
      )} */}
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
