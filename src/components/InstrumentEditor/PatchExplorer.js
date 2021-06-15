import React, { useEffect, useState, Fragment } from "react";
import { labels } from "../../assets/drumkits";

import * as Tone from "tone";

import SavePatch from "../../components/ui/Dialogs/SavePatch";

import "./PatchExplorer.css";

import firebase from "firebase";

import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Icon,
  Paper,
  Divider,
  ListItemSecondaryAction,
  CircularProgress,
  Tooltip,
  Typography,
} from "@material-ui/core";

import {
  patchLoader,
  loadDrumPatch,
  instrumentsCategories,
} from "../../assets/musicutils";

function PatchExplorer(props) {
  const [patchesList, setPatchesList] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPatch, setSelectedPatch] = useState(<CircularProgress />);
  const [savePatchDialog, setSavePatchDialog] = useState(false);

  const fetchPatchName = async (patchKey) => {
    let nameRef = firebase.database().ref(`patches/${patchKey}/name`).get();
    let name = (await nameRef).val();
    setSelectedPatch(name);
  };

  const fetchPatchesByCategory = (category) => {
    //temp
    firebase
      .database()
      .ref("patches")
      .orderByChild("categ")
      .equalTo(category)
      .once("value")
      .then((snapshot) => {
        let array = Object.keys(snapshot.val()).map((e, i, a) => {
          return {
            key: e,
            patch: snapshot.val()[e],
          };
        });
        //console.log(array);
        setPatchesList(array);
      });
  };

  const fetchUserPatches = () => {
    var user = firebase.auth().currentUser;

    //temp
    firebase
      .database()
      .ref("patches")
      .orderByChild("creator")
      .equalTo(user.uid)
      .once("value")
      .then((snapshot) => {
        if (snapshot.val() === null) {
          setPatchesList([]);
          return;
        }
        let array = Object.keys(snapshot.val()).map((e, i, a) => {
          return {
            key: e,
            patch: snapshot.val()[e],
          };
        });
        //console.log(array);
        setPatchesList(array);
      });
  };

  const handlePatchSelect = (patchKey, patch) => {
    patchLoader(patchKey, "", props.setInstrumentsLoaded).then((r) =>
      props.setInstruments((prev) => {
        let a = [...prev];
        a[props.index] = r;
        return a;
      })
    );

    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          newModule.instrument = patchKey;
          newModule.volume = patch.volume;

          return newModule;
        } else {
          return module;
        }
      })
    );
    setSelectedPatch(patch.name);
    props.setPatchExplorer(false);
  };

  const saveUserPatch = (name, category) => {
    console.log(name, category);
    let user = firebase.auth().currentUser;

    let patch = {
      base: props.instrument._dummyVoice.name.replace("Synth", ""),
      name: !!name ? name : "Untitled Patch",
      creator: user.uid,
      options: props.instrument.get(),
      volume: props.module.volume,
    };

    if (typeof category === "number") patch.categ = parseInt(category);

    const sessionsRef = firebase.database().ref("patches");
    const newSessionRef = sessionsRef.push();
    newSessionRef.set(patch);

    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          newModule.instrument = newSessionRef.key;
          return newModule;
        } else {
          return module;
        }
      })
    );
    setSelectedPatch(patch.name);
    props.setPatchExplorer(false);
  };

  useEffect(() => {
    typeof props.module.instrument === "string"
      ? fetchPatchName(props.module.instrument)
      : setSelectedPatch("Custom patch");
  }, [props.module]);

  return !props.patchExplorer ? (
    <Paper className="patch-explorer-compact">
      <span>{selectedPatch}</span>
      <div>
        {selectedPatch === "Custom patch" && (
          <IconButton onClick={() => setSavePatchDialog(true)}>
            <Icon>save</Icon>
          </IconButton>
        )}
        <IconButton onClick={() => props.setPatchExplorer(true)}>
          <Icon>expand_more</Icon>
        </IconButton>
      </div>
      {savePatchDialog && (
        <SavePatch
          onClose={() => setSavePatchDialog(false)}
          onSubmit={saveUserPatch}
        />
      )}
    </Paper>
  ) : (
    <div className="patch-explorer">
      <List className="patch-explorer-column">
        <ListItem
          dense
          button
          divider
          onClick={fetchUserPatches}
          className="patch-explorer-first-column-item"
        >
          User Patches
          <Icon style={{ fontSize: 20 }}>chevron_right</Icon>
        </ListItem>
        {instrumentsCategories.map((e, i) => (
          <ListItem
            dense
            button
            divider
            onClick={() => fetchPatchesByCategory(i)}
            className="patch-explorer-first-column-item"
          >
            {e}
            <Icon style={{ fontSize: 20 }}>chevron_right</Icon>
          </ListItem>
        ))}
      </List>
      <Divider variant="vertical" />
      <List className="patch-explorer-column">
        {!!patchesList.length ? (
          patchesList.map((e, i) => (
            <ListItem
              dense
              button
              divider
              className="patch-explorer-second-column-item"
              onClick={() => handlePatchSelect(e.key, e.patch)}
            >
              {e.patch.name}
              {e.patch.base === "Sampler" && (
                <Tooltip arrow placement="top" title="Sampler">
                  <Icon style={{ fontSize: 16, marginLeft: 4 }}>
                    graphic_eq
                  </Icon>
                </Tooltip>
              )}
            </ListItem>
          ))
        ) : (
          <div className="empty-wrapper">
            <Typography variant="h3">;-;</Typography>
            <div className="break" />
            <span>Patches you save will apper here..</span>
          </div>
        )}
      </List>
    </div>
  );
}

export default PatchExplorer;
