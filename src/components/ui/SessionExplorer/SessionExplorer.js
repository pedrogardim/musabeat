import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import { useParams } from "react-router-dom";

import {
  Typography,
  Button,
  TextField,
  InputAdornment,
  Icon,
  Grid,
} from "@material-ui/core";

import { Autocomplete } from "@material-ui/lab";

import SessionGalleryItem from "./SessionGalleryItem";
import PlaceholderSGI from "./PlaceholderSGI";
import NameInput from "../Dialogs/NameInput";
import ActionConfirm from "../Dialogs/ActionConfirm";
import NotFoundPage from "../NotFoundPage";

import Workspace from "../Workspace/Workspace";

import "./SessionExplorer.css";

import firebase from "firebase";
import { useTranslation } from "react-i18next";

import { sessionTags } from "../../../assets/musicutils";

function SessionExplorer(props) {
  const { t } = useTranslation();

  const [sessions, setSessions] = useState([]);
  const [sessionKeys, setSessionKeys] = useState([]);
  const [userLikes, setUserLikes] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [renameDialog, setRenameDialog] = useState(null);
  const [playingSession, setPlayingSession] = useState(null);
  const [playingLoadingProgress, setPlayingLoadingProgress] = useState(0);

  const [searchTags, setSearchTags] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const getSessionList = () => {
    //console.log(keyword);

    if (props.isUser && props.user === null) return;

    let queryRules = () => {
      let rules = firebase.firestore().collection("sessions");

      if (searchValue) {
        //console.log("text");
        rules = rules
          .where("name", ">=", searchValue)
          .where("name", "<=", searchValue + "\uf8ff");
      }
      if (searchTags && searchTags.length > 0) {
        rules = rules.where("tags", "array-contains-any", searchTags);
      }
      if (props.isUser || props.target) {
        rules = rules.where(
          "creator",
          "==",
          props.target ? props.target : props.user.uid
        );
      }
      /* if (!clear && !isFirstQuery && lastItem) {
        console.log("next page");
        rules = rules.startAfter(lastItem);
      } */

      return rules;
    };

    queryRules()
      .get()
      .then((snapshot) => {
        //console.log(snapshot.docs.map((e) => [e.id, e.data()]));
        if (snapshot.empty) {
          setSessionKeys(null);
          setSessions(null);
        } else {
          setSessionKeys(snapshot.docs.map((e) => e.id));
          setSessions(snapshot.docs.map((e) => e.data()));
        }
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

    //clear all files and patches stats first

    sessions[index].modules.forEach(async (e, i) => {
      let instrobj =
        typeof e.instrument === "string"
          ? (
              await firebase
                .firestore()
                .collection(e.type === 0 ? "drumpatches" : "patches")
                .doc(e.instrument)
                .get()
            ).data()
          : e.instrument;

      typeof e.instrument === "string" &&
        firebase
          .firestore()
          .collection(e.type === 0 ? "drumpatches" : "patches")
          .doc(e.instrument)
          .update({ in: firebase.firestore.FieldValue.increment(-1) });

      if (instrobj.urls)
        Object.values(instrobj.urls).forEach((e) =>
          firebase
            .firestore()
            .collection("files")
            .doc(e)
            .update({ in: firebase.firestore.FieldValue.increment(-1) })
        );

      if (instrobj.url)
        firebase
          .firestore()
          .collection("files")
          .doc(instrobj.url)
          .update({ in: firebase.firestore.FieldValue.increment(-1) });
    });

    firebase
      .firestore()
      .collection("sessions")
      .doc(sessionKeys[index])
      .delete();

    firebase
      .firestore()
      .collection("users")
      .doc(sessions[index].creator)
      .update({
        sessions: firebase.firestore.FieldValue.arrayRemove(sessionKeys[index]),
      });

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

  const handleSearch = (e) => {
    getSessionList(e.target.value);
  };

  /*=============================================================*/
  //USEEFFECT
  /*=============================================================*/

  useEffect(() => {
    //console.log(playingSession);
    //Tone.Transport.seconds = 0;
    //Tone.Transport.clear();
    if (playingSession !== null) {
      Tone.Transport.pause();
      //console.log("stop");
      let sessionRef = firebase
        .firestore()
        .collection("sessions")
        .doc(sessionKeys[playingSession]);
      sessionRef.update({ played: firebase.firestore.FieldValue.increment(1) });
    }
  }, [playingSession]);

  useEffect(() => {
    //console.log(searchValue, searchTags);
    getSessionList();
  }, [searchValue, searchTags]);

  useEffect(() => {
    setSessions([]);
    getSessionList();
    props.user && getUserLikes();
  }, [props.isUser, props.user]);

  /*=============================================================*/
  //JSX
  /*=============================================================*/

  return (
    <div
      className={`session-explorer-page ${
        props.compact && "session-explorer-compact"
      }`}
    >
      {!(props.isUser || props.compact) && (
        <Autocomplete
          multiple
          freeSolo
          className={`file-explorer-searchbar ${
            props.compact && "file-explorer-searchbar-compact"
          }`}
          options={Array(129)
            .fill()
            .map((e, i) => (e = i))}
          onKeyPress={handleSearch}
          onChange={(e, v) => setSearchTags(v)}
          value={searchTags}
          getOptionLabel={(e) => sessionTags[e]}
          renderInput={(params) => (
            <TextField
              {...params}
              style={{ fontSize: 24 }}
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <Fragment>
                    <InputAdornment position="start">
                      <Icon>search</Icon>
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </Fragment>
                ),
              }}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          )}
        />
      )}
      <div className="break" />

      {!sessions || !sessionKeys ? (
        <NotFoundPage
          type={"sessionExplorer"}
          handlePageNav={props.createNewSession}
        />
      ) : (
        <Grid
          className="session-explorer-grid-cont"
          style={{
            marginTop: !props.compact && 56,
          }}
          container
          spacing={2}
        >
          {!!sessions.length
            ? sessions.map((session, sessionIndex) => (
                <SessionGalleryItem
                  user={props.user}
                  compact={props.compact}
                  handlePageNav={props.handlePageNav}
                  handleSessionSelect={(ev) =>
                    props.handlePageNav(
                      "session",
                      sessionKeys[sessionIndex],
                      ev
                    )
                  }
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
                  setNewSessionDialog={props.setNewSessionDialog}
                  handleTagClick={(e) =>
                    (!props.compact || !props.isUser) && setSearchTags([e])
                  }
                />
              ))
            : Array(props.isUser ? 3 : 15)
                .fill(1)
                .map((e) => <PlaceholderSGI />)}
        </Grid>
      )}
      <ActionConfirm
        delete
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

      <NameInput
        open={renameDialog !== null}
        onSubmit={handleSessionRename}
        onClose={() => setRenameDialog(null)}
      />

      {playingSession !== null && (
        <Workspace
          hidden
          user={props.user}
          session={sessions[playingSession]}
          isPlaying={true}
          setPlayingLoadingProgress={setPlayingLoadingProgress}
        />
      )}
    </div>
  );
}

export default SessionExplorer;
