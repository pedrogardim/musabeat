import firebase from "firebase";

import { useLocation } from "react-router-dom";

import * as Tone from "tone";

import { loadInstrument } from "../Instruments";

export const createNewSession = (session, handlePageNav, setOpenedSession) => {
  let userId = firebase.auth().currentUser
    ? firebase.auth().currentUser.uid
    : null;

  let sessionTemplate = {
    description: "",
    tags: [],
    bpm: 120,
    root: 0,
    scale: 0,
    timeline: { 0: [0], size: 1, on: false },
    tracks: [
      {
        id: 0,
        name: "",
        color: Math.floor(Math.random() * 14.99),
        score: [
          {
            0: [0],
            1: [3],
            2: [2, 0],
            3: [3],
            4: [0],
            5: [3],
            6: [2, 0],
            7: [3],
          },
        ],
        instrument: "8fsbChTqV7aaWNyI1hTC",
        type: 0,
        volume: 0,
        muted: false,
      },
    ],
  };

  let clearStats = {
    //name: session ? `Copy of ${session.name}` : "New Session";
    name: session.name,
    copied: 0,
    opened: 0,
    played: 0,

    creator: userId,
    editors: [userId],
    likes: 0,
    createdOn: firebase.firestore.FieldValue.serverTimestamp(),
    alwcp: true,
    hid: false,
    rte: false,
  };

  let newSession = Object.assign(
    {},
    session ? session : sessionTemplate,
    clearStats
  );

  if (userId) {
    newSession.creator = userId;
    newSession.editors = [userId];
  }

  if (!userId) {
    setOpenedSession(newSession);
    handlePageNav("session", "newSession");
    return;
  }

  const sessionsRef = firebase.firestore().collection("sessions");
  sessionsRef.add(newSession).then((ref) => {
    if (userId) {
      firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .update({ sessions: firebase.firestore.FieldValue.arrayUnion(ref.id) });
    }
    handlePageNav("session", ref.id);
  });
};

export const loadSession = (
  setSessionData,
  setTracks,
  sessionId,
  hidden,
  user,
  sessionObject,
  setIsLoaded,
  setInstruments,
  setInstrumentsLoaded,
  setInstrumentsInfo,
  WSparamSetter,
  setNotifications
) => {
  const loadSessionInstruments = (tracks) => {
    let array = Array(tracks.length).fill(false);

    setInstruments(array);
    tracks.forEach((track, trackIndex) =>
      loadInstrument(
        track,
        trackIndex,
        null,
        setInstruments,
        setInstrumentsLoaded,
        setInstrumentsInfo,
        WSparamSetter,
        setNotifications
      )
    );
  };

  if (hidden) {
    let thisSessionData = { ...sessionObject };
    delete thisSessionData.tracks;
    setSessionData(thisSessionData);
    setTracks(sessionObject.tracks);
    Tone.Transport.bpm.value = sessionObject.bpm;
    WSparamSetter("editMode", true);
    loadSessionInstruments(sessionObject.tracks);
  } else if (sessionId === null) {
    console.log("session is null!");
  }
  //
  else if (typeof sessionId === "string") {
    let sessionRef = firebase.firestore().collection("sessions").doc(sessionId);

    //Check for editMmode and get title
    sessionRef.get().then((snapshot) => {
      if (!snapshot.exists) {
        setTracks(undefined);
        return;
      }

      let data = snapshot.data();

      let sessionInfo = { ...data };
      delete sessionInfo.tracks;
      setSessionData(sessionInfo);
      WSparamSetter("zoomPosition", [0, sessionInfo.size - 1]);

      if (data.hasOwnProperty("tracks")) {
        loadSessionInstruments(data.tracks);
        setTracks(data.tracks);
        if (data.tracks.length === 0) setIsLoaded(true);
      }

      Tone.Transport.bpm.value = data.bpm;

      user &&
        data.editors.includes(user.uid) &&
        WSparamSetter("editMode", true);
    });

    sessionRef.update({
      opened: firebase.firestore.FieldValue.increment(1),
      played: firebase.firestore.FieldValue.increment(1),
    });
  }
};
