import firebase from "firebase";

import { useLocation } from "react-router-dom";

export const createNewSession = (session, handlePageNav, setOpenedSession) => {
  let userId = firebase.auth().currentUser
    ? firebase.auth().currentUser.uid
    : null;

  let sessionTemplate = {
    description: "No description",
    tags: ["musa"],
    bpm: 120,
    modules: [
      {
        id: 0,
        name: "Sequencer",
        color: 2,
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
        instrument: "FSnt2y846yp8Q0RfM7V9",
        type: 0,
        volume: 0,
        muted: false,
      },
    ],
  };

  let clearStats = {
    //name: session !== undefined ? `Copy of ${session.name}` : "New Session",
    name: "New Session",
    copied: 0,
    opened: 0,
    played: 0,
    creator: userId,
    editors: [userId],
    likes: 0,
    likedBy: ["a"],
    createdOn: firebase.firestore.FieldValue.serverTimestamp(),
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
    handlePageNav(`session/newSession`);
    return;
  }

  const sessionsRef = firebase.firestore().collection("sessions");
  sessionsRef.add(newSession).then((ref) => handlePageNav(`session/${ref.id}`));
};
