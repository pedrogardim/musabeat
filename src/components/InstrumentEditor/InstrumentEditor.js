import React, { useState, Fragment, useRef, useEffect } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import { List, Divider, IconButton, MenuItem } from "@material-ui/core";

import AudioFileItem from "./AudioFileItem";
import DrumComponent from "./DrumComponent";

import EnvelopeControl from "./EnvelopeControl";
import SynthParameters from "./SynthParameters";
import OscillatorEditor from "./OscillatorEditor";
import PatchExplorer from "../ui/PatchExplorer/PatchExplorer";
import FileExplorer from "../ui/FileExplorer/FileExplorer";

import FileUploader from "../ui/Dialogs/FileUploader/FileUploader";
import NameInput from "../ui/Dialogs/NameInput";
import NoteInput from "../ui/Dialogs/NoteInput";
import ActionConfirm from "../ui/Dialogs/ActionConfirm";

import NotFoundPage from "../ui/NotFoundPage";

import { FileDrop } from "react-file-drop";

import {
  detectPitch,
  fileTypes,
  fileExtentions,
} from "../../assets/musicutils";

import { Fab, Icon, Grid, Select } from "@material-ui/core";

import "./InstrumentEditor.css";

function InstrumentEditor(props) {
  const [draggingOver, setDraggingOver] = useState(false);
  const [patchExplorer, setPatchExplorer] = useState(!props.patchPage);

  const [filesName, setFilesName] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [filesId, setFilesId] = useState([]);

  const [fileExplorer, setFileExplorer] = useState(false);

  const [selectedPatch, setSelectedPatch] = useState(
    typeof props.module.instrument === "string"
      ? props.module.instrument
      : "Custom"
  );

  const [renamingLabel, setRenamingLabel] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const oscColumn = useRef(null);
  const ieWrapper = useRef(null);

  const isDrum = props.module.type === 0;

  const changeInstrumentType = async (e) => {
    let newType = e.target.value;

    props.instrument.dispose();

    props.updateFilesStatsOnChange && props.updateFilesStatsOnChange();

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
        if (newType === "Sampler") {
          newPatch.urls = {};
        } else {
          newPatch.options = newInstrument.get();
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

  const handlePlayersFileDelete = (fileId, fileName, soundindex) => {
    //temp solution, Tone.Players doesn't allow .remove()

    //let filteredScore = props.module.score.map((msre)=>msre.map(beat=>beat.filter(el=>JSON.stringify(el)!==fileName)));

    let newInstrument = new Tone.Players().toDestination();

    props.instrument._buffers._buffers.forEach((value, key) => {
      if (JSON.stringify(soundindex) !== key) newInstrument.add(key, value);
    });

    props.instrument.dispose();

    props.setInstrument(newInstrument);
    props.onInstrumentMod(fileId, fileName, soundindex, true);
  };

  const handleSamplerFileDelete = (fileId, fileName) => {
    let newInstrument = new Tone.Sampler().toDestination();

    props.instrument._buffers._buffers.forEach((value, key) => {
      if (parseInt(key) !== fileName) newInstrument.add(key, value);
    });

    props.instrument.dispose();

    props.setInstrument(newInstrument);

    props.onInstrumentMod(
      fileId,
      Tone.Frequency(fileName, "midi").toNote(),
      "",
      true
    );
  };

  const renamePlayersLabel = (index, newName) => {
    props.setLabels(index, newName);
    props.updateFilesStatsOnChange && props.updateFilesStatsOnChange();

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
    // let note = Tone.Frequency(noteN).toMidi();
    // let newNote = Tone.Frequency(newNoteN).toMidi();

    console.log(note, newNote);

    let drumMap = props.instrument._buffers._buffers;
    if (drumMap.has(newNote)) return;

    //props.instrument.add()
    drumMap.set(
      JSON.stringify(Tone.Frequency(newNote).toMidi()),
      JSON.stringify(Tone.Frequency(note).toMidi())
    );

    console.log(drumMap.delete(JSON.stringify(Tone.Frequency(note).toMidi())));

    props.updateFilesStatsOnChange && props.updateFilesStatsOnChange();

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

  const saveUserPatch = (name, category) => {
    //console.log(name, category);
    let user = firebase.auth().currentUser;

    let clearInfo = {
      creator: user.uid,
      categ: !!category || isNaN(category) ? category : 0,
      volume: props.module.volume,
      createdOn: firebase.firestore.FieldValue.serverTimestamp(),
      in: 1,
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
                  handleFileDelete={(a, b, c) => setDeletingItem([a, b, c])}
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
                  openFilePage={() =>
                    props.handlePageNav("file", filesId[i], true)
                  }
                  fileId={filesId[i]}
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
      //console.log(bufferObjects, filesName);
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
          {bufferObjects.length > 0 ? (
            <List style={{ width: "100%", height: "calc(100% - 78px)" }}>
              {bufferObjects
                .sort((a, b) => a[1] - b[1])
                .map((e, i) => (
                  <Fragment>
                    <AudioFileItem
                      key={i}
                      index={i}
                      instrument={props.instrument}
                      handleSamplerFileDelete={(a, b) =>
                        setDeletingItem([a, b])
                      }
                      buffer={e[0]}
                      fileLabel={Tone.Frequency(e[1], "midi").toNote()}
                      fileName={
                        filesName[Tone.Frequency(e[1], "midi").toNote()]
                      }
                      fileId={filesId[i]}
                      openFilePage={() =>
                        props.handlePageNav("file", filesId[i], true)
                      }
                      setRenamingLabel={setRenamingLabel}
                    />
                    <Divider />
                  </Fragment>
                ))}
            </List>
          ) : (
            <NotFoundPage
              type="emptySequencer"
              handlePageNav={() => setFileExplorer(true)}
            />
          )}
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
    props.instrument &&
      props.instrument.name === "Sampler" &&
      console.log(
        props.instrument._buffers._buffers,
        props.module.instrument.urls,
        filesName
      );
  }, [props.instrument]);

  useEffect(() => {
    //console.log(props.instrument);

    console.log(filesId, filesName);
  }, [filesId, filesName]);

  return (
    <div
      className="ws-note-input-options"
      onDragEnter={() => {
        setDraggingOver(true);
        ieWrapper.current.scrollTop = 0;
      }}
      ref={ieWrapper}
    >
      <Select value={selectedPatch}>
        <MenuItem
          value={
            selectedPatch === "Custom" ? "Custom" : props.module.instrument
          }
        >
          {selectedPatch === "Custom"
            ? "Custom"
            : props.instrumentInfo &&
              props.instrumentInfo.patch &&
              props.instrumentInfo.patch.name}
        </MenuItem>
      </Select>
      <IconButton>
        <Icon>tune</Icon>
      </IconButton>
      {selectedPatch === "Custom" && (
        <IconButton>
          <Icon>save</Icon>
        </IconButton>
      )}

      {/* patchExplorer && (
        <PatchExplorer
          compact
          patchExplorer={patchExplorer}
          index={props.index}
          module={props.module}
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
          updateFilesStatsOnChange={props.updateFilesStatsOnChange}
        />
      ) */}

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
        renamePlayersLabel={renamePlayersLabel}
        setRenamingLabel={setRenamingLabel}
        setLabels={props.setLabels}
        handlePageNav={props.handlePageNav}
      />

      {renamingLabel &&
        (props.module.type === 0 ? (
          <NameInput
            select
            defaultValue={props.module.lbls[renamingLabel]}
            open={true}
            onClose={() => setRenamingLabel(null)}
            onSubmit={(i) => renamePlayersLabel(renamingLabel, i)}
          />
        ) : (
          <NoteInput
            open={true}
            onClose={() => setRenamingLabel(null)}
            note={renamingLabel}
            onSubmit={(i) => changeSamplerNote(renamingLabel, i)}
          />
        ))}

      {deletingItem && (
        <ActionConfirm
          instrumentEditor
          action={() =>
            props.instrument.name === "Sampler"
              ? handleSamplerFileDelete(...deletingItem)
              : handlePlayersFileDelete(...deletingItem)
          }
          open={deletingItem}
          onClose={() => setDeletingItem(null)}
        />
      )}
    </div>
  );
}

export default InstrumentEditor;
