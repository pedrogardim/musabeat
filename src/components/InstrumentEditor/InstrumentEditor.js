import React, { useState, Fragment, useRef, useEffect } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import { List, Divider } from "@material-ui/core";

import AudioFileItem from "./AudioFileItem";
import DrumComponent from "./DrumComponent";

import EnvelopeControl from "./EnvelopeControl";
import SynthParameters from "./SynthParameters";
import OscillatorEditor from "./OscillatorEditor";
import PatchExplorer from "../ui/PatchExplorer/PatchExplorer";
import FileExplorer from "../ui/FileExplorer/FileExplorer";

import FileUploader from "../ui/Dialogs/FileUploader/FileUploader";
import NameInput from "../ui/Dialogs/NameInput";

import { FileDrop } from "react-file-drop";

import {
  detectPitch,
  fileTypes,
  fileExtentions,
} from "../../assets/musicutils";

import { Fab, Icon, Grid } from "@material-ui/core";

import "./InstrumentEditor.css";
import { colors } from "../../utils/materialPalette";

function InstrumentEditor(props) {
  const [draggingOver, setDraggingOver] = useState(false);
  const [patchExplorer, setPatchExplorer] = useState(!props.patchPage);

  const [filesName, setFilesName] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [filesId, setFilesId] = useState([]);

  const [fileExplorer, setFileExplorer] = useState(false);

  const [selectedPatch, setSelectedPatch] = useState(null);

  const [renamingLabel, setRenamingLabel] = useState(null);

  const oscColumn = useRef(null);
  const ieWrapper = useRef(null);

  const isDrum = props.module.type === 0;

  /* 
  const lookForPatch = () => {
    //temp
    let instrumentOptions = Object.toJSON(instrument.get());
    instruments.map((e,i)=>Object.toJSON(e.options) === instrumentOptions && setSelectedPatch(i))

  }
 */

  const handleFileDrop = (files, event) => {
    event.preventDefault();
    Tone.Transport.pause();
    //let file = files[0];
    setDraggingOver(false);
    setUploadingFiles(files);
  };

  const handlePlayersFileDelete = (fileName, soundindex) => {
    //temp solution, Tone.Players doesn't allow .remove()

    //let filteredScore = props.module.score.map((msre)=>msre.map(beat=>beat.filter(el=>JSON.stringify(el)!==fileName)));

    let newInstrument = new Tone.Players().toDestination();

    props.instrument._buffers._buffers.forEach((value, key) => {
      if (JSON.stringify(soundindex) !== key) newInstrument.add(key, value);
    });

    props.instrument.dispose();

    props.setInstrument(newInstrument);
    props.onInstrumentMod("", fileName, soundindex, true);
  };

  const handleSamplerFileDelete = (fileName) => {
    let newInstrument = new Tone.Sampler().toDestination();

    props.instrument._buffers._buffers.forEach((value, key) => {
      if (parseInt(key) !== fileName) newInstrument.add(key, value);
    });

    props.instrument.dispose();

    props.setInstrument(newInstrument);

    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          newModule.instrument = {};
          //newModule.instrument = newInstrument;
          //newModule.score = [];
          //newModule.score = filteredScore;
          return newModule;
        } else {
          return module;
        }
      })
    );
  };

  const getFilesName = () => {
    const getFilesNameFromId = (ids) => {
      let labelsWithFilename = { ...ids };
      Promise.all(
        Object.keys(ids).map(async (e, i) => {
          let filedata = (
            await firebase.firestore().collection("files").doc(ids[e]).get()
          ).data();
          labelsWithFilename[e] =
            filedata.name + "." + fileExtentions[parseInt(filedata.type)];
          return filedata.name + "." + fileExtentions[parseInt(filedata.type)];
        })
      ).then((values) => {
        setFilesName(labelsWithFilename);
      });
    };

    if (typeof props.module.instrument === "string") {
      firebase
        .firestore()
        .collection(props.module.type === 0 ? "drumpatches" : "patches")
        .doc(props.module.instrument)
        .get()
        .then((r) => {
          getFilesNameFromId(r.get("urls"));
          setFilesId(Object.values(r.get("urls")));
        });
    } else {
      getFilesNameFromId(props.module.instrument.urls);
      setFilesId(Object.values(props.module.instrument.urls));
    }
  };

  const renamePlayersLabel = (index, newName) => {
    props.setLabels(index, newName);

    if (typeof props.module.instrument === "string") {
      firebase
        .firestore()
        .collection("drumpatches")
        .doc(props.module.instrument)
        .get()
        .then((patch) => {
          props.setModules((prev) => {
            let newModules = [...prev];
            newModules[props.index].instrument = patch.data();
            return newModules;
          });
        });
    }

    setRenamingLabel(null);
  };

  const openFilePage = (id) => {
    //console.log(id);
    const win = window.open("/file/" + id, "_blank");
    win.focus();
  };

  const saveUserPatch = (name, category) => {
    console.log(name, category);
    let user = firebase.auth().currentUser;

    let clearInfo = {
      creator: user.uid,
      categ: !!category || isNaN(category) ? category : 0,
      volume: props.module.volume,
      createdOn: firebase.firestore.FieldValue.serverTimestamp(),
    };

    let patchInfo = !isDrum
      ? props.instrument.name === "Sampler"
        ? {
            base: "Sampler",
            name: !!name ? name : "Untitled Patch",
            urls: props.module.instrument.urls,
          }
        : {
            base: props.instrument._dummyVoice.name.replace("Synth", ""),
            name: !!name ? name : "Untitled Patch",
            options: props.instrument.get(),
          }
      : {
          name: !!name ? name : "Untitled Drum Patch",
          urls: props.module.instrument.urls,
          lbls: props.module.lbls,
        };

    let patch = Object.assign({}, clearInfo, patchInfo);

    if (typeof category === "number") patch.categ = parseInt(category);

    const newPatchRef = firebase
      .firestore()
      .collection(!isDrum ? "patches" : "drumpatches");

    const userRef = firebase.firestore().collection("users").doc(user.uid);

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

      userRef.update(
        !isDrum
          ? { patches: firebase.firestore.FieldValue.arrayUnion(r.id) }
          : { drumPatches: firebase.firestore.FieldValue.arrayUnion(r.id) }
      );

      setSelectedPatch(r.id);
    });
    setPatchExplorer(false);
  };

  //used for

  let mainContent = "Nothing Here";

  if (props.instrument) {
    if (props.module.type === 0) {
      //console.log(props.instrument);

      //bufferObjects.sort((a, b) => a[1] - b[1]);
      mainContent = (
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          className={"ie-drum-cont"}
          spacing={1}
        >
          {Array(32)
            .fill(false)
            .map((e, i) => (
              <Grid xs={3} sm={3} md={3} lg={3} item>
                <DrumComponent
                  exists={props.instrument._buffers._buffers.has(
                    JSON.stringify(i)
                  )}
                  key={i}
                  index={i}
                  instrument={props.instrument}
                  handleFileDelete={handlePlayersFileDelete}
                  buffer={props.instrument._buffers._buffers.get(
                    JSON.stringify(i)
                  )}
                  fileLabel={
                    props.module.lbls[i]
                      ? `"${props.module.lbls[i]}"`
                      : "Slot " + (i + 1)
                  }
                  fileName={filesName[i]}
                  setRenamingLabel={setRenamingLabel}
                  openFilePage={() => openFilePage(filesId[i])}
                />
              </Grid>
            ))}
        </Grid>
      );
    } else if (props.instrument.name === "Sampler") {
      let bufferObjects = [];
      props.instrument._buffers._buffers.forEach((e, i, a) =>
        bufferObjects.push([e, i])
      );
      mainContent = (
        <div style={{ overflowY: "scroll", height: "100%", width: "100%" }}>
          <List style={{ width: "100%", height: "calc(100% - 78px)" }}>
            {bufferObjects.map((e, i) => (
              <Fragment>
                <AudioFileItem
                  key={i}
                  index={i}
                  instrument={props.instrument}
                  handleFileDelete={handleSamplerFileDelete}
                  buffer={e[0]}
                  fileLabel={Tone.Frequency(e[1], "midi").toNote()}
                  fileName={filesName[e[1]]}
                  openFilePage={() => openFilePage(filesId[i])}
                />
                <Divider />
              </Fragment>
            ))}
          </List>
        </div>
      );
    } else {
      mainContent = (
        <Fragment>
          <div ref={oscColumn} className="instrument-editor-column" key={0}>
            <OscillatorEditor
              onInstrumentMod={props.onInstrumentMod}
              instrument={props.instrument}
              columnRef={oscColumn}
            />
          </div>
          <div className="instrument-editor-column" key={1}>
            <SynthParameters
              onInstrumentMod={props.onInstrumentMod}
              instrument={props.instrument}
            />
          </div>
          <div
            className="instrument-editor-column"
            style={{ flexDirection: "column" }}
            key={2}
          >
            {Object.keys(props.instrument.get()).map(
              (envelope, envelopeIndex) =>
                envelope.toLowerCase().includes("envelope") && (
                  <EnvelopeControl
                    onInstrumentMod={props.onInstrumentMod}
                    instrument={props.instrument}
                    envelopeType={envelope}
                  />
                )
            )}
          </div>
        </Fragment>
      );
    }
  }

  useEffect(() => {
    (props.instrument.name === "Players" ||
      props.instrument.name === "Sampler") &&
      getFilesName();
  }, []);

  return (
    <div
      className="instrument-editor"
      onDragEnter={() => {
        setDraggingOver(true);
        ieWrapper.current.scrollTop = 0;
      }}
      ref={ieWrapper}
    >
      {patchExplorer && (
        <PatchExplorer
          compact
          patchExplorer={patchExplorer}
          index={props.index}
          setModules={props.setModules}
          setModulePage={props.setModulePage}
          setPatchExplorer={setPatchExplorer}
          instrument={props.instrument}
          setInstruments={props.setInstruments}
          setInstrument={props.setInstrument}
          setInstrumentsLoaded={props.setInstrumentsLoaded}
          module={props.module}
          saveUserPatch={saveUserPatch}
          isDrum={isDrum}
        />
      )}

      {fileExplorer && (
        <FileExplorer
          onFileClick={props.handleFileClick}
          setFileExplorer={setFileExplorer}
          sequencer
          compact
          setSnackbarMessage={props.setSnackbarMessage}
        />
      )}

      <div className="break" />

      {!patchExplorer && mainContent}
      {draggingOver && props.instrument.name !== "PolySynth" && (
        <FileDrop
          onDragLeave={(e) => {
            setDraggingOver(false);
          }}
          onDrop={(files, event) => handleFileDrop(files, event)}
          className={"file-drop"}
          style={{
            backgroundColor: colors[props.module.color][300],
          }}
        >
          Drop your files here!
        </FileDrop>
      )}

      {props.module.type === 0 && (
        <Fab
          style={{ position: "absolute", right: 16, bottom: 16 }}
          onClick={() => setFileExplorer(true)}
          color="primary"
        >
          <Icon>graphic_eq</Icon>
        </Fab>
      )}

      <FileUploader
        open={uploadingFiles.length > 0}
        files={uploadingFiles}
        setUploadingFiles={setUploadingFiles}
        onInstrumentMod={props.onInstrumentMod}
        module={props.module}
        instrument={props.instrument}
        setInstrumentLoaded={props.setInstrumentLoaded}
        setFilesName={setFilesName}
        setFilesId={setFilesId}
        getFilesName={getFilesName}
        renamePlayersLabel={renamePlayersLabel}
        setRenamingLabel={setRenamingLabel}
        setLabels={props.setLabels}
      />

      <NameInput
        select
        open={renamingLabel !== null}
        onClose={() => setRenamingLabel(null)}
        onSubmit={(i) => renamePlayersLabel(renamingLabel, i)}
      />
    </div>
  );
}

export default InstrumentEditor;
