import React, { useState, Fragment, useRef, useEffect } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import { List, Divider, Button } from "@material-ui/core";

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

import { Fab, Icon, Grid, Select } from "@material-ui/core";

import "./InstrumentEditor.css";
import { colors } from "../../utils/materialPalette";
import { PortraitSharp } from "@material-ui/icons";

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

  const changeInstrumentType = async (e) => {
    let newType = e.target.value;

    props.instrument.dispose();

    let patch =
      typeof props.module.instrument === "string"
        ? await firebase
            .firestore()
            .collection("patches")
            .doc(props.module.instrument)
            .get()
        : props.module.instrument;

    let newInstrument =
      newType === "Sampler"
        ? new Tone.Sampler().toDestination()
        : new Tone.PolySynth(Tone[newType]).toDestination();

    let commonProps = Object.keys(newInstrument.get()).filter(
      (e) => Object.keys(patch).indexOf(e) !== -1
    );

    let conserverdProps = Object.fromEntries(
      commonProps.map((e, i) => [e, patch[e]])
    );

    newInstrument.set(conserverdProps);

    //console.log(newInstrument, conserverdProps);

    props.setInstrument(newInstrument);

    props.setModules &&
      props.setModules((prev) => {
        let newModules = [...prev];
        newModules[props.index].instrument = newInstrument.get();
        if (newType === "Sampler") {
          delete newModules[props.index].instrument.onerror;
          delete newModules[props.index].instrument.onload;
        }
        return newModules;
      });

    props.setPatchInfo &&
      props.setPatchInfo((prev) => {
        let newPatch = { ...prev };
        newPatch.base = newType.replace("Synth", "");
        newPatch.options = newInstrument.get();
        if (newType === "Sampler") {
          delete newPatch.options.onerror;
          delete newPatch.options.onload;
        }
        return newPatch;
      });
  };

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

    props.onInstrumentMod(
      "",
      Tone.Frequency(fileName, "midi").toNote(),
      "",
      true
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
          props.setModules && !props.patchPage
            ? props.setModules((prev) => {
                let newModules = [...prev];
                newModules[props.index].instrument = patch.data();

                return newModules;
              })
            : props.setPatchInfo(patch.data());
        });
    }

    setRenamingLabel(null);
  };

  const changeSamplerNote = (note, newNote) => {
    //console.log(labelName, newName);

    let drumMap = props.instrument._buffers._buffers;
    if (drumMap.has(newNote)) return;

    //props.instrument.add()
    drumMap.set(
      Tone.Frequency(newNote).toMidi(),
      drumMap.get(Tone.Frequency(note).toMidi())
    );
    console.log(drumMap.delete(Tone.Frequency(note).toMidi()));

    if (typeof props.module.instrument === "string") {
      firebase
        .firestore()
        .collection("patches")
        .doc(props.module.instrument)
        .get()
        .then((urls) => {
          setFilesName((prev) => {
            let newFileNames = { ...prev };
            newFileNames[newNote] = newFileNames[note];
            delete newFileNames[note];
            return newFileNames;
          });

          let urlsObj = urls.data().urls;
          urlsObj[newNote] = urlsObj[note];
          delete urlsObj[note];

          !props.patchPage
            ? props.setModules((prev) => {
                let newModules = [...prev];
                newModules[props.index].instrument = { urls: urlsObj };

                return newModules;
              })
            : props.setPatchInfo((prev) => {
                let newPatch = { ...prev };
                newPatch.urls = urlsObj;
                return newPatch;
              });
        });
    } else {
      setFilesName((prev) => {
        let newFileNames = { ...prev };
        newFileNames[newNote] = newFileNames[note];
        delete newFileNames[note];
        return newFileNames;
      });

      let urlsObj = { ...props.module.instrument.urls };
      urlsObj[newNote] = urlsObj[note];
      delete urlsObj[note];

      !props.patchPage
        ? props.setModules((prev) => {
            let newModules = [...prev];
            newModules[props.index].instrument = { urls: urlsObj };

            return newModules;
          })
        : props.setPatchInfo((prev) => {
            let newPatch = { ...prev };
            newPatch.urls = urlsObj;
            return newPatch;
          });
    }
    setRenamingLabel(null);
  };

  const openFilePage = (id) => {
    //console.log(id);
    const win = window.open("/#/file/" + id, "_blank");
    win.focus();
  };

  const saveUserPatch = (name, category) => {
    //console.log(name, category);
    let user = firebase.auth().currentUser;

    let clearInfo = {
      creator: user.uid,
      categ: !!category || isNaN(category) ? category : 0,
      volume: props.module.volume,
      createdOn: firebase.firestore.FieldValue.serverTimestamp(),
      likes: 0,
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
      console.log(bufferObjects, filesName);
      mainContent = (
        <div style={{ overflowY: "scroll", height: "100%", width: "100%" }}>
          <Select
            native
            value={
              props.instrument._dummyVoice
                ? props.instrument._dummyVoice.name
                : props.instrument.name
            }
            onChange={changeInstrumentType}
            className="instrument-editor-type-select"
          >
            {["MonoSynth", "FMSynth", "AMSynth", "Sampler"].map((e, i) => (
              <option value={e}>{e}</option>
            ))}
          </Select>
          <List style={{ width: "100%", height: "calc(100% - 78px)" }}>
            {bufferObjects.length > 0
              ? bufferObjects.map((e, i) => (
                  <Fragment>
                    <AudioFileItem
                      key={i}
                      index={i}
                      instrument={props.instrument}
                      handleFileDelete={handleSamplerFileDelete}
                      buffer={e[0]}
                      fileLabel={Tone.Frequency(e[1], "midi").toNote()}
                      fileName={
                        filesName[Tone.Frequency(e[1], "midi").toNote()]
                      }
                      openFilePage={() => openFilePage(filesId[i])}
                      setRenamingLabel={setRenamingLabel}
                    />
                    <Divider />
                  </Fragment>
                ))
              : "No Files"}
          </List>
        </div>
      );
    } else {
      mainContent = (
        <Fragment>
          <Select
            native
            value={
              props.instrument._dummyVoice
                ? props.instrument._dummyVoice.name
                : props.instrument.name
            }
            onChange={changeInstrumentType}
            className="instrument-editor-type-select"
          >
            {["MonoSynth", "FMSynth", "AMSynth", "Sampler"].map((e, i) => (
              <option value={e}>{e}</option>
            ))}
          </Select>
          <Grid
            container
            spacing={2}
            className="ie-synth-cont"
            direction="column"
            alignItems="stretch"
            justifyContent="center"
          >
            <OscillatorEditor
              onInstrumentMod={props.onInstrumentMod}
              instrument={props.instrument}
              columnRef={oscColumn}
            />

            <SynthParameters
              onInstrumentMod={props.onInstrumentMod}
              instrument={props.instrument}
            />

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
          </Grid>
        </Fragment>
      );
    }
  }

  useEffect(() => {
    //console.log(props.instrument);
    (props.instrument.name === "Players" ||
      props.instrument.name === "Sampler") &&
      getFilesName();
  }, []);

  useEffect(() => {
    //console.log(props.instrument);
    props.instrument &&
      props.instrument.name === "Sampler" &&
      console.log(
        props.instrument._buffers._buffers,
        props.module.instrument.urls,
        filesName
      );
  }, [props.instrument]);

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
          setInstrumentLoaded={props.setInstrumentLoaded}
          setInstrumentsLoaded={props.setInstrumentsLoaded}
          saveUserPatch={saveUserPatch}
          isDrum={isDrum}
        />
      )}

      {fileExplorer && (
        <FileExplorer
          compact
          setInstrumentLoaded={props.setInstrumentLoaded}
          onFileClick={props.handleFileClick}
          setFileExplorer={setFileExplorer}
          setSnackbarMessage={props.setSnackbarMessage}
          module={props.module}
          instrument={props.instrument}
          isDrum={isDrum}
        />
      )}

      {!patchExplorer && mainContent}
      {draggingOver && props.instrument.name !== "PolySynth" && (
        <FileDrop
          onDragLeave={(e) => {
            setDraggingOver(false);
          }}
          onDrop={(files, event) => handleFileDrop(files, event)}
          className={"file-drop"}
          style={{
            backgroundColor: "#3f51b5",
          }}
        >
          Drop your files here!
        </FileDrop>
      )}

      {(props.module.type === 0 || props.instrument.name === "Sampler") && (
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
        note={props.module.type !== 0}
        defaultValue={
          props.module.type === 0
            ? props.module.lbls[renamingLabel]
            : renamingLabel
        }
        open={renamingLabel !== null}
        onClose={() => setRenamingLabel(null)}
        onSubmit={(i) => {
          props.module.type === 0
            ? renamePlayersLabel(renamingLabel, i)
            : changeSamplerNote(renamingLabel, i);
        }}
      />
    </div>
  );
}

export default InstrumentEditor;
