import { Dialog, Button } from "@material-ui/core";

import firebase from "firebase";

import "./AuthDialog.css";

function AuthDialog(props) {
  const handleGoogleLogin = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        console.log(result.user.email);
        props.setAuthDialog(false);
        checkForFistTimeLogin(result.user);
      })
      .catch((error) => console.log(error.message));
  };

  const checkForFistTimeLogin = (user) => {
    const userProfileRef = firebase
      .database()
      .ref("users")
      .child(user.uid)
      .child("profile");
    const userProfile = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    };

    console.log(userProfile);

    user.metadata.creationTime === user.metadata.lastSignInTime &&
      userProfileRef.set(userProfile);
  };

  return (
    <Dialog
      className="auth-dialog"
      open={props.authDialog}
      onClose={() => props.setAuthDialog(false)}
    >
      <Button onClick={handleGoogleLogin}>Log In with Google</Button>
    </Dialog>
  );
}

export default AuthDialog;
