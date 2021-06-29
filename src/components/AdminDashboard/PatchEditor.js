import React, { useEffect, useState } from "react";
import { labels } from "../../assets/drumkits";
import firebase from "firebase";

import * as Tone from "tone";

import { List, ListItem } from "@material-ui/core";

import InstrumentEditor from "../InstrumentEditor/InstrumentEditor";

import { patchLoader, loadDrumPatch } from "../../assets/musicutils";

import "./AdminDashboard.css";

function PatchEditor(props) {
  const [instrument, setInstrument] = useState("");
  const [instrumentLoaded, setInstrumentLoaded] = useState(false);
  const [selectedPatch, setSelectedPatch] = useState(0);
  const [patches, setPatches] = useState(null);

  const loadAllPatches = () => {
    firebase
      .firestore()
      .collection("patches")
      .where("creator", "==", null)
      .get()
      .then((snapshot) => {
        setPatches(snapshot.docs.map((e) => [e.id, e.data()]));
      });
  };

  const patchesMigration = () => {
    const newDBref = firebase.firestore().collection("patches");
    const oldDBref = firebase
      .database()
      .ref("patches")
      .get()
      .then((r) => {
        let values = Object.values(r.val());
        console.log(values);
        values = values.map((e) => {
          let newPatch = { ...e };
          delete newPatch.fx;
          return newPatch;
        });
        values.forEach((e) => newDBref.add(e));
      });
  };

  const handlePatchClick = (input) => {
    patchLoader(input);
  };

  useEffect(() => {
    loadAllPatches();
  }, []);

  return (
    <div>
      <List>
        {patches &&
          patches.map((e, i) => (
            <ListItem button onClick={() => handlePatchClick(e[0])}>
              {e[1].name}
            </ListItem>
          ))}
      </List>
      {instrument && <InstrumentEditor instrument={instrument} />}
    </div>
  );
}

export default PatchEditor;
