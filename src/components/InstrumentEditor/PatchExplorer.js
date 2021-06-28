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
  Avatar,
} from "@material-ui/core";

import {
  patchLoader,
  loadDrumPatch,
  instrumentsCategories,
  drumCategories,
} from "../../assets/musicutils";

function PatchExplorer(props) {
  const isDrum = props.module.type === 0;
  const categories = !isDrum ? instrumentsCategories : drumCategories;
  const user = firebase.auth().currentUser;

  const [patchesList, setPatchesList] = useState(null);
  const [patchesCreatorList, setPatchesCreatorList] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPatch, setSelectedPatch] = useState(<CircularProgress />);
  const [savePatchDialog, setSavePatchDialog] = useState(false);

  const fetchPatchName = async (patchKey) => {
    let nameRef = firebase
      .database()
      .ref(`${!isDrum ? "patches" : "drumpatches"}/${patchKey}/name`)
      .get();
    let name = (await nameRef).val();
    setSelectedPatch(name);
  };

  const fetchPatches = (category) => {
    let patchesRef =
      category === "all"
        ? firebase
            .database()
            .ref(!isDrum ? "patches" : "drumpatches")
            .limitToFirst(50)
        : firebase
            .database()
            .ref(!isDrum ? "patches" : "drumpatches")
            .orderByChild("categ")
            .equalTo(category);

    patchesRef.once("value").then((snapshot) => {
      if (!snapshot.val()) {
        setPatchesList(null);
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

  const fetchUserPatches = () => {
    firebase
      .database()
      .ref(isDrum ? "drumpatches" : "patches")
      .orderByChild("creator")
      .equalTo(user.uid)
      .once("value")
      .then((snapshot) => {
        if (snapshot.val() === null) {
          setPatchesList(null);
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
    isDrum
      ? loadDrumPatch(patchKey, props.setInstrumentsLoaded, props.index).then(
          (r) =>
            props.setInstruments((prev) => {
              let a = [...prev];
              a[props.index] = r;
              return a;
            })
        )
      : patchLoader(patchKey, "", props.setInstrumentsLoaded).then((r) =>
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
    //props.setPatchExplorer(false);
    props.setModulePage(null);
  };

  const saveUserPatch = (name, category) => {
    console.log(name, category);
    let user = firebase.auth().currentUser;

    let patch = !isDrum
      ? {
          base: props.instrument._dummyVoice.name.replace("Synth", ""),
          name: !!name ? name : "Untitled Patch",
          creator: user.uid,
          categ: !!category || isNaN(category) ? category : 0,
          options: props.instrument.get(),
          volume: props.module.volume,
        }
      : {
          name: !!name ? name : "Untitled Drum Patch",
          creator: user.uid,
          categ: !!category || isNaN(category) ? category : 0,
          urls: props.module.instrument.urls,
          volume: props.module.volume,
        };

    if (typeof category === "number") patch.categ = parseInt(category);

    const sessionsRef = firebase
      .database()
      .ref(!isDrum ? "patches" : "drumpatches");
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

  const loadPatchCreatorInfo = async (creatorKey) => {
    setPatchesCreatorList([]);
    await Promise.all(
      patchesList.map(async (e, i) => {
        let userProfileRef = firebase
          .database()
          .ref(`users/${e.patch.creator}/profile`);
        let userProfile = (await userProfileRef.get()).val();
        //console.log(session);
        setPatchesCreatorList((prev) => [...prev, userProfile]);
      })
    );
  };

  useEffect(() => {
    typeof props.module.instrument === "string"
      ? fetchPatchName(props.module.instrument)
      : setSelectedPatch("Custom patch");
  }, [props.module]);

  useEffect(() => {
    //user && fetchUserPatches();
    fetchPatches("all");
  }, []);

  useEffect(() => {
    patchesList && patchesList.length && loadPatchCreatorInfo();
  }, [patchesList]);

  return !props.patchExplorer ? (
    <Paper className="patch-explorer-compact">
      <span>{selectedPatch}</span>
      <div>
        {selectedPatch === "Custom patch" && !!user && (
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
          isDrum
          onClose={() => setSavePatchDialog(false)}
          onSubmit={saveUserPatch}
        />
      )}
    </Paper>
  ) : (
    <div className="patch-explorer">
      <List className="patch-explorer-column">
        <ListItem
          key={"allcateg"}
          dense
          button
          divider
          onClick={() => fetchPatches("all")}
          className="patch-explorer-first-column-item"
        >
          All Categories
          <Icon style={{ fontSize: 20 }}>chevron_right</Icon>
        </ListItem>
        {categories.map((e, i) => (
          <ListItem
            key={e}
            dense
            button
            divider
            onClick={() => fetchPatches(i)}
            className="patch-explorer-first-column-item"
          >
            {e}
            <Icon style={{ fontSize: 20 }}>chevron_right</Icon>
          </ListItem>
        ))}
        <Divider />
        <ListItem
          dense
          button
          divider
          onClick={() => props.setPatchExplorer(false)}
          className="patch-explorer-first-column-item"
        >
          Instrument Editor <span className="beta-text">beta</span>
          <Icon style={{ fontSize: 20 }}>chevron_right</Icon>
        </ListItem>
        {!!user && (
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
        )}
      </List>
      <Divider variant="vertical" />
      <List className="patch-explorer-column">
        {patchesList === null ? (
          <CircularProgress />
        ) : !!patchesList.length ? (
          patchesList.map((e, i) => (
            <ListItem
              key={`liipe${i}`}
              dense
              button
              divider
              className="patch-explorer-second-column-item"
              onClick={() => handlePatchSelect(e.key, e.patch)}
            >
              {e.patch.name}
              {e.patch.creator !== undefined && (
                <Tooltip
                  title={
                    patchesCreatorList[i] && patchesCreatorList[i].displayName
                  }
                >
                  <Avatar
                    style={{
                      height: 16,
                      width: 16,
                      marginLeft: 8,
                      fontSize: 10,
                    }}
                    alt={
                      patchesCreatorList[i] && patchesCreatorList[i].displayName
                    }
                    src={
                      patchesCreatorList[i] && patchesCreatorList[i].photoURL
                    }
                  ></Avatar>
                </Tooltip>
              )}
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
