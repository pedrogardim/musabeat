import React, { useState } from "react";

import { Tab, Tabs, AppBar } from "@material-ui/core";

import * as Tone from "tone";

import firebase from "firebase";

import "./AdminDashboard.css";

import { encodeAudioFile, dete } from "../../assets/musicutils";

import { Button, Typography } from "@material-ui/core";

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

  const fixUserSpace = () => {
    firebase
      .firestore()
      .collection("files")
      .get()
      .then((r) =>
        r.forEach((e) =>
          firebase
            .firestore()
            .collection("users")
            .doc(e.data().user)
            .update({
              sp: firebase.firestore.FieldValue.increment(e.data().size),
            })
        )
      );
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

  const updatePatchesPremium = () => {
    firebase
      .firestore()
      .collection("patches")
      .where("base", "==", "Sampler")
      .get()
      .then((qrry) => {
        console.log("qrry", qrry.size);
        qrry.docs.forEach((patch) => {
          Promise.all(
            Object.values(patch.data().urls).map(
              async (url) =>
                (
                  await firebase.firestore().collection("files").doc(url).get()
                ).data().size
            )
          ).then((sizeArray) => {
            /* patchSnap.ref.update({pr}) */
            let patchSize = sizeArray.reduce((a, b) => a + b, 0);
            console.log(patch.data().name, formatBytes(patchSize));
            patch.ref.update({ pr: patchSize >= 5242880 ? true : false });
          });
        });
      });

    firebase
      .firestore()
      .collection("drumpatches")
      .get()
      .then((qrry) => {
        console.log("qrry", qrry.size);
        qrry.docs.forEach((patch) => {
          Promise.all(
            Object.values(patch.data().urls).map(
              async (url) =>
                (
                  await firebase.firestore().collection("files").doc(url).get()
                ).data().size
            )
          ).then((sizeArray) => {
            /* patchSnap.ref.update({pr}) */
            let patchSize = sizeArray.reduce((a, b) => a + b, 0);
            console.log(patch.data().name, formatBytes(patchSize));
            patch.ref.update({ pr: patchSize >= 5242880 ? true : false });
          });
        });
      });
  };

  const resetPatchesOfficial = () => {
    firebase
      .firestore()
      .collection("drumpatches")
      .get()
      .then((r) => r.docs.forEach((e) => e.ref.update({ of: false })));

    firebase
      .firestore()
      .collection("patches")
      .get()
      .then((r) => r.docs.forEach((e) => e.ref.update({ of: false })));
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
      <Button onClick={updatePatchesPremium}>Update Patches Premium</Button>

      {/* <Button onClick={resetPatchesOfficial}>Reset Patches Official</Button> */}

      {/* 
      <Button onClick={updatePremium}>updateSessions</Button>
      <Button onClick={updateLikes}>Update files, patches like</Button>*/}
      {/* <Button onClick={updateSessions}>Update session scale</Button>
      <Button onClick={missingFileTest}>missing File Test</Button> */}
      <Button onClick={fixUserSpace}>fix User Space</Button>

      <input type="file" onChange={(e) => convertAudio(e.target.files[0])} />
    </div>
  );
}

export default AdminDashboard;

function formatBytes(a, b = 2) {
  if (0 === a) return "0 Bytes";
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024));
  return (
    parseFloat((a / Math.pow(1024, d)).toFixed(c)) +
    " " +
    ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
  );
}
