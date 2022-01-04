import { useState, useEffect, useContext } from "react";

import { SessionWorkspaceContext } from "../../../context/SessionWorkspaceContext";
import { loadInstrument } from "../../../services/Instruments";

import useInterval from "../../../hooks/useInterval";

import firebase from "firebase";

import { useTranslation } from "react-i18next";

const userSubmitedSessionProps = [
  "alwcp",
  "bpm",
  "description",
  "editors",
  "hid",
  "name",
  "root",
  "rte",
  "scale",
  "tags",
  "timeline",
];

function useFirebaseConnection(ctx) {
  const { t } = useTranslation();

  const [savingMode, setSavingMode] = useState("simple");
  const [areUnsavedChanges, setAreUnsavedChanges] = useState(false);
  const [isLastChangeFromServer, setIsLastChangeFromServer] = useState(false);
  const [clearRTEListener, setRTEListener] = useState(() => () => {});

  const {
    tracks,
    setTracks,
    sessionData,
    setSessionData,
    sessionKey,
    user,
    isLoaded,
    setSnackbarMessage,
    hidden,
    editMode,
    pendingUploadFiles,
    setUploadFiles,
    setInstrumentsLoaded,
    setInstruments,
    setNotifications,
    setInstrumentsInfo,
  } = ctx;

  const DBSessionRef = firebase
    .firestore()
    .collection("sessions")
    .doc(sessionKey);

  const autoSaverTime = 5 * 60 * 1000;

  const triggerSave = (tracks, sessionData) => {
    if (pendingUploadFiles.length > 0)
      setUploadFiles(
        pendingUploadFiles.filter(
          (file) =>
            tracks[file.track].score.findIndex((e) => e.clip === file.index) !==
            -1
        )
      );
    else save(tracks, sessionData);
  };

  useInterval(() => {
    if (areUnsavedChanges) triggerSave(tracks, sessionData);
  }, autoSaverTime);

  const changeSavingMode = (input) => {
    if (input === "simple") {
      clearRTEListener();
    } else {
      //console.log(DBSessionRef);
      if (hidden || DBSessionRef === null) return;
      //console.log("RTE Activated");
      clearRTEListener();
      setAreUnsavedChanges(false);
      save(tracks, sessionData);
      let listener = DBSessionRef.onSnapshot(
        (snapshot) => {
          !snapshot.metadata.hasPendingWrites &&
            updateFromDatabase(snapshot.data());
        },
        (er) => {
          console.log("onSnapshot Error:", er);
        }
      );

      setRTEListener(() => () => listener());
    }
  };

  const updateFromDatabase = (sessionSnapshot) => {
    setIsLastChangeFromServer(true);
    //check for new track
    setTracks((prev) => {
      let index = sessionSnapshot.tracks.length - 1;
      if (prev.length < sessionSnapshot.tracks.length)
        loadInstrument(
          sessionSnapshot.tracks[index],
          index,
          null,
          setInstrumentsLoaded,
          setInstruments,
          setNotifications,
          setInstrumentsInfo
        );
      return sessionSnapshot.tracks;
    });

    let data = { ...sessionSnapshot };
    delete data.tracks;

    setSessionData((prev) =>
      !compareObjectProperties(data, prev) ? data : prev
    );
  };

  const save = (tracks, data) => {
    if (DBSessionRef === null) return;
    setSnackbarMessage(t("misc.changesSaved"));

    let newSessionData = data ? deepCopy(data) : {};

    let newTracks = tracks ? deepCopy(tracks) : {};

    //delete properties to avoid overwrites
    if (data) {
      ["createdOn", "creator", "opened", "played", "copied", "likes"].map(
        (e) => delete newSessionData[e]
      );
    }

    if (tracks) {
      newSessionData.tracks = newTracks;
    }

    DBSessionRef.update({
      ...newSessionData,
    }).then(() => {
      if (savingMode === "simple") {
        setSnackbarMessage(t("misc.changesSaved"));
        setAreUnsavedChanges(false);
      }
    });
  };

  useEffect(() => {
    if (isLoaded) {
      savingMode === "simple" && setAreUnsavedChanges(true);

      if (savingMode === "rte") {
        if (!isLastChangeFromServer) {
          save(tracks, null);
        }
      }
    }

    setIsLastChangeFromServer(false);
  }, [tracks]);

  useEffect(() => {
    //console.log("savingMode", savingMode, isLoaded, !!user, editMode);
    if (isLoaded && !!user && editMode) setSavingMode(savingMode);
  }, [isLoaded, editMode, savingMode, DBSessionRef, user]);

  return [triggerSave, changeSavingMode, areUnsavedChanges];
}

const deepCopy = (a) => JSON.parse(JSON.stringify(a));

const compareObjectProperties = (a, b) =>
  userSubmitedSessionProps
    .map(
      (e) =>
        //e === "name" && console.log(JSON.stringify(a[e]), JSON.stringify(b[e]));
        JSON.stringify(a[e]) === JSON.stringify(b[e])
    )
    .every((e) => e === true);

export default useFirebaseConnection;
