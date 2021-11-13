import React, { useState } from "react";

import { Tab, Tabs, AppBar } from "@material-ui/core";

import * as Tone from "tone";

import firebase from "firebase";

import "./AdminDashboard.css";

import { encodeAudioFile } from "../../assets/musicutils";

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

  const updateLikes = () => {
    firebase
      .firestore()
      .collection("files")
      .get()
      .then((r) => r.forEach((e) => e.ref.update({ likes: 0 })));
    firebase
      .firestore()
      .collection("patches")
      .get()
      .then((r) => r.forEach((e) => e.ref.update({ likes: 0 })));
  };

  const updateSessions = () => {
    firebase
      .firestore()
      .collection("sessions")
      .get()
      .then((r) => r.forEach((e) => e.ref.update({ rte: false })));
  };

  const resetPremium = () => {
    firebase
      .firestore()
      .collection("users")
      .get()
      .then((r) => r.forEach((e) => e.ref.update({ pr: null })));
  };

  const resetFilesAndPatchesIn = () => {
    firebase
      .firestore()
      .collection("patches")
      .get()
      .then((r) => r.forEach((e) => e.ref.update({ in: 0, ld: 0 })));

    firebase
      .firestore()
      .collection("drumpatches")
      .get()
      .then((r) => r.forEach((e) => e.ref.update({ in: 0, ld: 0 })));

    firebase
      .firestore()
      .collection("files")
      .get()
      .then((r) => r.forEach((e) => e.ref.update({ in: 0, ld: 0 })));
  };

  //DANGER

  const deleteAllSessions = () => {
    firebase
      .firestore()
      .collection("users")
      .get()
      .then((r) => r.forEach((e) => e.ref.update({ likes: [], sessions: [] })));

    firebase
      .firestore()
      .collection("sessions")
      .get()
      .then((r) => r.forEach((e) => e.ref.delete()));
  };

  const missingFileTest = async () => {
    let missingFiles = [];

    let urlArray = await Promise.all(
      ["2MsHeX6Tg2TLzwqLcyQr", "2MsHeX6Tg2TLzwqLcyQr1"].map(async (e, i) => {
        try {
          return await firebase.storage().ref(e).getDownloadURL();
        } catch (er) {
          missingFiles.push(i);
        }
      })
    );

    console.log(urlArray, missingFiles);
  };

  const convertAudio = (file) => {
    console.log(file);
    file.arrayBuffer().then((r) => {
      Tone.getContext().rawContext.decodeAudioData(r, (audiobuffer) => {
        let blob = encodeAudioFile(audiobuffer, "mp3");

        var bUrl = window.URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.download = file.name.split(".")[0] + ".mp3";
        link.href = bUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    });
  };

  return (
    <div
      className="file-page"
      style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
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
        {value === 0 && <PåatchEditor />}
      </div> */}
      <Button onClick={updateStats}>Update Stats</Button>
      {/* 
      <Button onClick={updatePremium}>updateSessions</Button>
      <Button onClick={updateLikes}>Update files, patches like</Button>*/}
      <Button onClick={updateSessions}>Update session scale</Button>
      <Button onClick={missingFileTest}>missingFileTest</Button>
      <input type="file" onChange={(e) => convertAudio(e.target.files[0])} />
    </div>
  );
}

export default AdminDashboard;
