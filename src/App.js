import "./App.css";

import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import { Fab, Icon, IconButton, Avatar, Menu, MenuItem } from "@material-ui/core";

import firebase from "firebase";

import Workspace from "./components/ui/Workspace";
import AuthDialog from "./components/ui/AuthDialog";

function App() {
  const [user, setUser] = useState(null);
  const [authDialog, setAuthDialog] = useState(false);
  const [userOption, setUserOption] = useState(false);

  const handleAvatarClick = (e) => {
    !user ? setAuthDialog(true) : setUserOption(e.currentTarget);
  };

  const handleLogOut = () => {
    firebase.auth().signOut().then(r=>console.log("singout"));
    setUserOption(false);
  }

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => setUser(user));
  }, []);

  useEffect(() => {
    console.log(user);
  }, [user]);

  return (
    <Fragment>
      <Avatar
        onClick={handleAvatarClick}
        className="main-avatar"
        alt={user && user.displayName}
        src={user && user.photoURL}
      />

      {authDialog && (
        <AuthDialog
          authDialog={authDialog}
          setAuthDialog={setAuthDialog}
          setUser={setUser}
        />
      )}

    <Menu
      style={{marginTop:48}}
      anchorEl={userOption}
      keepMounted
      open={Boolean(userOption)}
      onClose={()=>setUserOption(false)}
    >
      <MenuItem onClick={()=>setUserOption(false)}>Profile</MenuItem>
      <MenuItem onClick={()=>setUserOption(false)}>My Sessions</MenuItem>
      <MenuItem onClick={()=>setUserOption(false)}>My Samples</MenuItem>
      <MenuItem onClick={()=>setUserOption(false)}>My Synth Patches</MenuItem>
      <MenuItem onClick={handleLogOut}>Logout</MenuItem>
    </Menu>

      <Workspace className="workspace" />
    </Fragment>
  );
}

export default App;
