import { Dialog, Button } from "@material-ui/core";

import firebase from "firebase";
import { useTranslation } from "react-i18next";

import "./AuthDialog.css";

function AuthDialog(props) {
  const { t } = useTranslation();

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
      .firestore()
      .collection("users")
      .doc(user.uid);

    const userProfile = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    };

    if (user.metadata.creationTime === user.metadata.lastSignInTime) {
      userProfileRef.set({ profile: userProfile });
    }
  };

  return (
    <Dialog
      className="auth-dialog"
      open={props.authDialog}
      onClose={() => props.setAuthDialog(false)}
    >
      <Button onClick={handleGoogleLogin}>
        {t("dialogs.loginWithGoogle")}
      </Button>
    </Dialog>
  );
}

export default AuthDialog;
