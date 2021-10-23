import firebase from "firebase";

import { useLocation } from "react-router-dom";

export const createNewSession = (session, handlePageNav, setOpenedSession) => {
  let userId = firebase.auth().currentUser
    ? firebase.auth().currentUser.uid
    : null;

  let sessionTemplate = {
    description: "No description",
    tags: [],
    bpm: 120,
    root: 0,
    scale: 0,
    timeline: { 0: [0], size: 1, on: false },
    modules: [
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
    name: session ? `Copy of ${session.name}` : "New Session",
    copied: 0,
    opened: 0,
    played: 0,

    creator: userId,
    editors: [userId],
    likes: 0,
    createdOn: firebase.firestore.FieldValue.serverTimestamp(),
    alwcp: true,
    hid: false,
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
