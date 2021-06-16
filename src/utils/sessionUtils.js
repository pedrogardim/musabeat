import firebase from "firebase";

export const createNewSession = (session, setCurrentPage, setOpenedSession) => {
  let userId = firebase.auth().currentUser.uid;

  let sessionTemplate = {
    description: "No description",
    tags: ["musa"],
    bpm: 120,
    modules: [
      {
        id: 0,
        name: "Sequencer",
        color: 2,
        score: [[[0], [3], [2, 0], [3], [0], [3], [2, 0], [3]]],
        instrument: "-McEPecUtSOmHmpiuVOU",
        type: 0,
        volume: 0,
        muted: false,
      },
    ],
  };

  let clearStats = {
    name: session !== undefined ? `Copy of ${session.name}` : "New Session",
    copied: 0,
    opened: 0,
    played: 0,
    creator: userId,
    editors: [userId],
    likes: 0,
    likedBy: ["a"],
    createdOn: firebase.database.ServerValue.TIMESTAMP,
  };

  let newSession = Object.assign(
    {},
    session !== undefined ? session : sessionTemplate,
    clearStats
  );

  const sessionsRef = firebase.database().ref("sessions");
  const newSessionRef = sessionsRef.push();
  newSessionRef.set(newSession, setOpenedSession(newSessionRef.key));

  const userSessionsRef = firebase
    .database()
    .ref("users")
    .child(userId)
    .child("sessions");
  userSessionsRef.get().then((snapshot) => {
    let prev = snapshot.val() === null ? [] : snapshot.val();
    userSessionsRef.set([...prev, newSessionRef.key]);
  });

  //temp:only show workspace

  setCurrentPage(null);
};
