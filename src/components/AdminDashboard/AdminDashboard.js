import React, { useState } from "react";

import { Tab, Tabs, AppBar } from "@material-ui/core";

import PatchEditor from "./PatchEditor";

import firebase from "firebase";

import "./AdminDashboard.css";

import { Button } from "@material-ui/core";

function AdminDashboard(props) {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const updateStats = () => {
    ["drumpatches", "files", "patches", "sessions", "users"].map((e) =>
      firebase
        .firestore()
        .collection(e)
        .get()
        .then((r) =>
          firebase
            .firestore()
            .collection("musa")
            .doc("stats")
            .update({ [e]: r.size })
        )
    );
  };

  const updatePremium = () => {
    firebase
      .firestore()
      .collection("sessions")
      .get()
      .then((r) => r.forEach((e) => e.ref.update({ alwcp: true, hid: false })));
  };

  const updateUsers = () => {
    firebase
      .firestore()
      .collection("users")
      .get()
      .then((r) => r.forEach((e) => e.ref.update({ fllrs: 0, fllwing: [] })));
  };

  return (
    <div className="file-page">
      {/* <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="simple tabs example"
        >
          <Tab label="Item One" />
          <Tab label="Item Two" />
          <Tab label="Item Three" />
        </Tabs>
      </AppBar>
      <div className={"admin-panel-container"}>
        {value === 0 && <PatchEditor />}
      </div> */}
      <Button onClick={updateStats}>Update Stats</Button>
      <br />
      <Button onClick={updatePremium}>updateSessions</Button>
      <br />
      <Button onClick={updateUsers}>Update followers</Button>
    </div>
  );
}

export default AdminDashboard;
