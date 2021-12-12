import React, { useState, Fragment } from "react";

import {
  Dialog,
  Button,
  Typography,
  DialogTitle,
  DialogContentText,
  DialogContent,
  TextField,
  Avatar,
  Icon,
} from "@mui/material";

import firebase from "firebase";
import { useTranslation } from "react-i18next";

import Compressor from "compressorjs";

import "./AuthDialog.css";

import googleLogo from "./../../../assets/img/btn_google_light_normal_ios.svg";

function AuthDialog(props) {
  const { t } = useTranslation();

  const [emailLogIn, setEmailLogIn] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountInfo, setAccountInfo] = useState({});
  const [fieldErrors, setFieldErrors] = useState([]);

  const [usernameAvaliable, setUsernameAvaliable] = useState(null);

  const [profileAvatar, setProfileAvatar] = useState("");

  const [usernameNotification, setUsernameNotification] = useState(null);

  const handleGoogleLogin = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        checkForFistTimeLogin(result.user);
        props.setAuthDialog(false);
        firebase
          .firestore()
          .collection("users")
          .doc(result.user.uid)
          .update({ "profile.photoURL": result.user.photoURL });
        //result.user.updateProfile({ displayName: "musabeat" });
      })
      .catch((error) => console.log(error.message));
  };

  const handleEmailLogin = () => {
    if (!accountInfo.email || !/\S+@\S+\.\S+/.test(accountInfo.email))
      setFieldErrors((prev) => [...prev, "email"]);

    if (!accountInfo.password) setFieldErrors((prev) => [...prev, "password"]);

    if (!accountInfo.email || !accountInfo.password) return;

    firebase
      .auth()
      .signInWithEmailAndPassword(accountInfo.email, accountInfo.password)
      .then((userCredential) => {
        // Signed in
        var user = userCredential.user;
        console.log(user);
        // ...
      })
      .catch((e) => {
        e.code === "auth/user-not-found" && setCreatingAccount(true);
      });
  };

  const handleEmailAccCreation = () => {
    if (!accountInfo.name || accountInfo.name.length > 15)
      setFieldErrors((prev) => [...prev, "name"]);

    if (!accountInfo.email || !/\S+@\S+\.\S+/.test(accountInfo.email))
      setFieldErrors((prev) => [...prev, "email"]);

    if (!accountInfo.password) setFieldErrors((prev) => [...prev, "password"]);

    if (
      !accountInfo.password2 ||
      accountInfo.password !== accountInfo.password2
    )
      setFieldErrors((prev) => [...prev, "password2"]);

    if (
      !accountInfo.name ||
      !accountInfo.email ||
      !/\S+@\S+\.\S+/.test(accountInfo.email) ||
      !accountInfo.password ||
      !accountInfo.password2 ||
      accountInfo.password !== accountInfo.password2 ||
      !usernameAvaliable
    ) {
      return;
    }

    //console.log("creatingAccount");

    firebase
      .auth()
      .createUserWithEmailAndPassword(accountInfo.email, accountInfo.password)
      .then((r) => {
        console.log(r.user.uid);
        // Signed in

        const storageRef = firebase
          .storage()
          .ref("profilepics/" + r.user.uid + ".jpg");
        const task = storageRef.put(accountInfo.photo);

        task.on(
          "state_changed",
          (snapshot) => {},
          (error) => {
            console.log(error);
          },
          () =>
            storageRef.getDownloadURL().then((downloadURL) => {
              r.user.updateProfile({
                displayName: accountInfo.name,
                photoURL: downloadURL,
              });

              const userProfile = {
                profile: {
                  username: accountInfo.name,
                  email: accountInfo.email,
                  photoURL: downloadURL,
                },
                sessions: [],
                likes: [],
                patches: [],
                likedPatches: [],
                drumPatches: [],
                likedDrumPatches: [],
                files: [],
                likedFiles: [],
                fllrs: 0,
                fllwing: [],
              };
              firebase
                .firestore()
                .collection("users")
                .doc(r.user.uid)
                .set(userProfile)
                .then((r) => {
                  props.setAuthDialog(false);
                });
            })
        );

        // ...
      })
      .catch((error) => {
        console.log(error.code);
      });
  };

  const checkForFistTimeLogin = (user) => {
    const userProfileRef = firebase
      .firestore()
      .collection("users")
      .doc(user.uid);

    const userProfile = {
      profile: {
        username: (
          user.email.split("@")[0] +
          user.uid.charCodeAt(0) +
          user.uid.charCodeAt(1) +
          user.uid.charCodeAt(2)
        ).toLowerCase(),
        email: user.email,
        photoURL: user.photoURL,
      },
      sessions: [],
      likes: [],
      patches: [],
      likedPatches: [],
      drumPatches: [],
      likedDrumPatches: [],
      files: [],
      likedFiles: [],
    };

    if (user.metadata.creationTime === user.metadata.lastSignInTime) {
      userProfileRef.set({ profile: userProfile });
      user.updateProfile({ displayName: userProfile.username });
    }

    setUsernameNotification(
      (
        user.email.split("@")[0] +
        user.uid.charCodeAt(0) +
        user.uid.charCodeAt(1) +
        user.uid.charCodeAt(2)
      ).toLowerCase()
    );
  };

  const checkUsername = (name) => {
    setUsernameAvaliable(null);
    firebase
      .firestore()
      .collection("users")
      .where("profile.username", "==", name)
      .limit(1)
      .get()
      .then((r) => {
        !r.empty && setFieldErrors((prev) => [...prev, "name"]);
        setUsernameAvaliable(r.empty ? true : false);
      });
  };

  const handleFieldChange = (field, e) => {
    let value = e.target ? e.target.value : e;
    if (field === "name") checkUsername(value);
    setFieldErrors((prev) => prev.filter((e) => e !== field));
    setAccountInfo((prev) => {
      let newaccinfo = { ...prev };
      newaccinfo[field] = value;
      return newaccinfo;
    });
  };

  const handlePhotoSelect = (e, i) => {
    e.preventDefault();

    new Compressor(e.target.files[0], {
      quality: 0.6,
      height: 200,
      width: 200,
      convertSize: 1000,
      success(result) {
        console.log(result);
        handleFieldChange("photo", result);
        let reader = new FileReader();
        reader.readAsDataURL(result);
        reader.onload = () => setProfileAvatar(reader.result);
      },
      error(err) {
        console.log(err.message);
      },
    });
  };

  return (
    <>
      <Dialog
        className="auth-dialog"
        open={props.authDialog}
        maxWidth="sm"
        fullWidth={true}
        onClose={() => props.setAuthDialog(false)}
      >
        <DialogTitle>
          {" "}
          {!creatingAccount ? t("auth.login") : t("auth.createAccount")}
        </DialogTitle>
        {!emailLogIn && !creatingAccount && (
          <>
            <DialogContent>
              <DialogContentText className="auth-dialog-text">
                {t("auth.description")}
              </DialogContentText>
            </DialogContent>

            <div className="auth-dialog-btn-cont">
              <Button
                className="auth-dialog-opt-btn"
                variant="outlined"
                fullWidth={false}
                onClick={handleGoogleLogin}
              >
                <img src={googleLogo} />
                {t("auth.googleLogin")}
              </Button>
              <Button
                className="auth-dialog-opt-btn"
                variant="outlined"
                color={"primary"}
                fullWidth={false}
                onClick={() => setEmailLogIn(true)}
              >
                {t("auth.emailLogin")}
              </Button>
            </div>
          </>
        )}

        {emailLogIn && (
          <DialogContent className="auth-dialog-input-cont">
            {creatingAccount && (
              <Typography variant="overline">
                {t("auth.creatingAccount")}
              </Typography>
            )}

            {creatingAccount && (
              <Avatar src={profileAvatar} className="auth-dialog-avatar">
                <input
                  accept="image/png, image/jpeg"
                  onInput={handlePhotoSelect}
                  type="file"
                />
                <Icon>add_a_photo</Icon>
              </Avatar>
            )}
            {creatingAccount && (
              <TextField
                required
                variant="standard"
                value={accountInfo.username}
                onChange={(e) => handleFieldChange("name", e)}
                label={t("auth.name")}
                inputProps={{ type: "name" }}
                helperText={usernameAvaliable === false ? "Unavailable" : null}
                error={fieldErrors.includes("name")}
              />
            )}
            <TextField
              required
              variant="standard"
              value={accountInfo.email}
              onChange={(e) => handleFieldChange("email", e)}
              label={t("auth.email")}
              inputProps={{ type: "email" }}
              error={fieldErrors.includes("email")}
            />
            <TextField
              required
              variant="standard"
              value={accountInfo.password}
              onChange={(e) => handleFieldChange("password", e)}
              label={t("auth.password")}
              inputProps={{ type: "password" }}
              error={fieldErrors.includes("password")}
            />
            {creatingAccount && (
              <TextField
                required
                variant="standard"
                value={accountInfo.password2}
                onChange={(e) => handleFieldChange("password2", e)}
                label={t("auth.confirmPassword")}
                inputProps={{ type: "password" }}
                error={fieldErrors.includes("password2")}
              />
            )}
            <br />
            {!creatingAccount && (
              <Button
                onClick={() => setCreatingAccount(true)}
                variant="contained"
              >
                {t("auth.createAccount")}
              </Button>
            )}
            <Button
              onClick={
                creatingAccount ? handleEmailAccCreation : handleEmailLogin
              }
              color="primary"
              variant="contained"
            >
              {t(creatingAccount ? "auth.createAccount" : "auth.login")}
            </Button>
          </DialogContent>
        )}
      </Dialog>
      {usernameNotification && (
        <Dialog open={true} onClose={() => setUsernameNotification(null)}>
          <DialogContent>
            Your username is
            <Typography variant="overline">{usernameNotification}</Typography>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default AuthDialog;
