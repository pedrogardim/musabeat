import firebase from "firebase";

export const checkPremium = async () => {
  const user = firebase.auth().currentUser;
  const userRef = firebase.firestore().collection("users").doc(user.uid);
  const userData = (await userRef.get()).data();

  return userData.pr.seconds > ~~(+new Date() / 1000);
};
