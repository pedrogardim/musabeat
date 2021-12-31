import React, { useRef, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Icon,
  Typography,
  Avatar,
} from "@mui/material";

import { Autocomplete } from "@mui/material";

import firebase from "firebase";

import { useTranslation } from "react-i18next";

function AddUserDialog(props) {
  const inputRef = useRef(null);
  const { t } = useTranslation();

  const [userQueryResult, setUserQueryResult] = useState([]);

  const user = firebase.auth().currentUser;

  const userQuery = (value) => {
    const usersRef = firebase.firestore().collection("users");

    if (!value) {
      setUserQueryResult([]);
      return;
    }

    let query = usersRef
      .where("profile.username", ">=", value)
      .where("profile.username", "<=", value + "\uf8ff")
      .limit(10);

    query.get().then((snapshot) =>
      setUserQueryResult(
        !snapshot.empty
          ? snapshot.docs
              .map((e) => {
                return { id: e.id, ...e.data().profile };
              })
              .filter((e) => e.id !== user.uid)
          : []
      )
    );
  };

  const handleSubmit = (userId) => {
    console.log(userId);
    props.setEditorProfiles((prev) => {
      let newEdProf = { ...prev };
      userQueryResult.forEach((e) => {
        if (e.id === userId) {
          newEdProf[userId] = { profile: e };
        }
      });
      return newEdProf;
    });

    props.setNewSessionData((prev) => {
      let newSessionData = { ...prev };
      newSessionData.editors = [...newSessionData.editors, userId];
      return newSessionData;
    });
    props.onClose();
  };

  return (
    <Dialog
      open={props.open}
      maxWidth={"md"}
      fullWidth={true}
      onClose={props.onClose}
    >
      <DialogTitle>{t("dialogs.insertName")}</DialogTitle>
      <DialogContent>
        <Autocomplete
          className={`patch-explorer-searchbar ${
            props.compact && "patch-explorer-searchbar-compact"
          }`}
          options={userQueryResult}
          onChange={(e, v) => handleSubmit(v.id)}
          getOptionLabel={(option) => option.username}
          renderOption={(op, st) => (
            <ul style={{ display: "flex", alignItems: "center" }}>
              <Avatar
                style={{ height: 24, width: 24, marginRight: 16 }}
                src={op.photoURL}
                alt={op.username}
              />
              <Typography style={{ marginRight: 16, lineHeight: 1 }}>
                {op.username}
              </Typography>
              <Typography variant={"overline"} style={{ lineHeight: 1 }}>
                {op.email}
              </Typography>
            </ul>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              style={{ fontSize: 24 }}
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <Icon>search</Icon>
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
              onChange={(e) => userQuery(e.target.value)}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>{t("dialogs.cancel")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddUserDialog;
