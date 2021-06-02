import "./App.css";

import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Fab,
  Icon,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
} from "@material-ui/core";

import firebase from "firebase";

import Workspace from "./components/ui/Workspace";
import SideMenu from "./components/ui/SideMenu";

import AuthDialog from "./components/ui/AuthDialog";

function App() {
  const [user, setUser] = useState(null);
  const [authDialog, setAuthDialog] = useState(false);
  const [userOption, setUserOption] = useState(false);
  const [sideMenu, setSideMenu] = useState(false);

  const handleAvatarClick = (e) => {
    !user ? setAuthDialog(true) : setUserOption(e.currentTarget);
  };

  const handleLogOut = () => {
    firebase
      .auth()
      .signOut()
      .then((r) => console.log("singout"));
    setUserOption(false);
  };

  const handleKeyPress = (event) => {
    Tone.start();
    switch (event.code) {
      case "Space":
        event.preventDefault();
        Tone.start();
        if (Tone.Transport.state !== "started") {
          Tone.Transport.start();
        } else {
          Tone.Transport.pause();
        }
        break;
    }
  };

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => setUser(user));
  }, []);

  useEffect(() => {
    console.log(user);
  }, [user]);

  return (
    <div className="app-wrapper" onKeyDown={handleKeyPress}>
      <IconButton className="side-menu-icon" onClick={() => setSideMenu(true)}>
        <Icon>menu</Icon>
      </IconButton>
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
        style={{ marginTop: 48 }}
        anchorEl={userOption}
        keepMounted
        open={Boolean(userOption)}
        onClose={() => setUserOption(false)}
      >
        <MenuItem onClick={() => setUserOption(false)}>Profile</MenuItem>
        <MenuItem onClick={() => setUserOption(false)}>My Sessions</MenuItem>
        <MenuItem onClick={() => setUserOption(false)}>My Samples</MenuItem>
        <MenuItem onClick={() => setUserOption(false)}>
          My Synth Patches
        </MenuItem>
        <MenuItem onClick={handleLogOut}>Logout</MenuItem>
      </Menu>

      <SideMenu open={sideMenu} setSideMenu={setSideMenu} />

      <Workspace className="workspace" user={user} />
    </div>
  );
}

export default App;
