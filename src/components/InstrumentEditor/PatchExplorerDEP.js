import React, { useEffect, useState } from "react";

import SavePatch from "../../components/ui/Dialogs/SavePatch";

import "./PatchExplorerDEP.css";

import firebase from "firebase";
import { useTranslation } from "react-i18next";

import {
  List,
  ListItem,
  IconButton,
  Icon,
  Paper,
  Divider,
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
  const { t } = useTranslation();

  const isDrum = props.module.type === 0;
  const categories = !isDrum ? instrumentsCategories : drumCategories;
  const user = firebase.auth().currentUser;

  const [patchesList, setPatchesList] = useState(null);
  const [patchesCreatorList, setPatchesCreatorList] = useState([]);
  const [savePatchDialog, setSavePatchDialog] = useState(false);

  const fetchPatchName = (patchKey) => {
    firebase
      .firestore()
      .collection(!isDrum ? "patches" : "drumpatches")
      .doc(patchKey)
      .get()
      .then((r) => setSelectedPatch(r.data().name));
  };

  const fetchPatches = (category) => {
    let patchesRef =
      category === "all"
        ? firebase
            .firestore()
            .collection(!isDrum ? "patches" : "drumpatches")
            .limit(50)
        : firebase
            .firestore()
            .collection(!isDrum ? "patches" : "drumpatches")
            .where("categ", "==", category);

    patchesRef.get().then((snapshot) => {
      if (snapshot.empty) {
        setPatchesList(null);
        return;
      }
      let array = snapshot.docs.map((e) => {
        return {
          key: e.id,
          patch: e.data(),
        };
      });
      //console.log(array);
      setPatchesList(array);
    });
  };

  const fetchUserPatches = () => {
    firebase
      .firestore()
      .collection(isDrum ? "drumpatches" : "patches")
      .where("creator", "==", user.uid)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          setPatchesList(null);
          return;
        }
        let array = snapshot.docs.map((e) => {
          return {
            key: e.id,
            patch: e.data(),
          };
        });
        //console.log(array);
        setPatchesList(array);
      });
  };

  const handlePatchSelect = (patchKey, patch) => {
    isDrum
      ? loadDrumPatch(patchKey, props.setInstrumentsLoaded, props.index).then(
          (r) => props.setInstrument(r)
        )
      : patchLoader(patchKey, props.setInstrumentsLoaded).then((r) =>
          props.setInstrument(r)
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

    const newPatchRef = firebase
      .firestore()
      .collection(!isDrum ? "patches" : "drumpatches");
    newPatchRef.add(patch).then((r) => {
      props.setModules((previous) =>
        previous.map((module, i) => {
          if (i === props.index) {
            let newModule = { ...module };
            newModule.instrument = r.id;
            return newModule;
          } else {
            return module;
          }
        })
      );
    });
    setSelectedPatch(patch.name);
    props.setPatchExplorer(false);
  };

  const loadPatchCreatorInfo = async () => {
    setPatchesCreatorList([]);
    await Promise.all(
      patchesList.map(async (e, i) => {
        if (e.patch.creator) {
          let userProfileRef = firebase
            .firestore()
            .collection("users")
            .doc(e.patch.creator);
          let userProfile = (await userProfileRef.get()).data().profile;
          //console.log(session);
          setPatchesCreatorList((prev) => [...prev, userProfile]);
        }
      })
    );
  };

  useEffect(() => {
    typeof props.module.instrument === "string"
      ? fetchPatchName(props.module.instrument)
      : setSelectedPatch("Custom patch");
  }, [props.module]);

  useEffect(() => {
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
          isDrum={isDrum}
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
          {t("misc.allCategories")}
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
            {isDrum
              ? t(`music.drumCategories.${i}`)
              : t(`music.instrumentsCategories.${i}`)}

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
          <div>
            {t("patchExplorer.instrumentEditor")}
            <span className="beta-text">beta</span>
          </div>
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
            {t("patchExplorer.userPatches")}
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
              {e.patch.creator && (
                <Tooltip
                  title={
                    patchesCreatorList[i] && patchesCreatorList[i].username
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
                      patchesCreatorList[i] && patchesCreatorList[i].username
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
            <span>{t("patchExplorer.empty")}</span>
          </div>
        )}
      </List>
    </div>
  );
}

export default PatchExplorer;
