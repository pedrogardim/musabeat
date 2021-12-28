import React, { useState, Fragment, useRef, useEffect } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import {
  List,
  Divider,
  IconButton,
  MenuItem,
  Tooltip,
  LinearProgress,
  Fab,
  Box,
  Grid,
  Select,
  SvgIcon,
} from "@mui/material";

import AudioFileItem from "./AudioFileItem";
import DrumComponent from "./DrumComponent";

import PatchExplorer from "../ui/PatchExplorer/PatchExplorer";
import FileExplorer from "../ui/FileExplorer/FileExplorer";
import SynthEditor from "./SynthEditor/SynthEditor";

import FileUploader from "../ui/Dialogs/FileUploader/FileUploader";
import NameInput from "../ui/Dialogs/NameInput";
import NoteInput from "../ui/Dialogs/NoteInput";
import ActionConfirm from "../ui/Dialogs/ActionConfirm";
import FileEditor from "./FileEditor";

import NotFoundPage from "../ui/NotFoundPage";

import { FileDrop } from "react-file-drop";

import { useTranslation } from "react-i18next";

//import sdImg from "../../../src/assets/img/sd.svg";

import {
  detectPitch,
  fileTypes,
  fileExtentions,
  drumIcon,
} from "../../assets/musicutils";

import "./InstrumentEditor.css";

function InstrumentEditor(props) {
  const { t } = useTranslation();

  const trackType = props.track.type;

  const [draggingOver, setDraggingOver] = useState(false);
  const [patchExplorer, setPatchExplorer] = useState(
    trackType === 0 ? false : true
  );

  const [filesName, setFilesName] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [filesId, setFilesId] = useState([]);

  const [fileExplorer, setFileExplorer] = useState(false);

  const [selectedPatch, setSelectedPatch] = useState(
    typeof props.track.instrument === "string"
      ? props.track.instrument
      : "Custom"
  );

  const [renamingLabel, setRenamingLabel] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [editingFile, setEditingFile] = useState(null);

  const [patchSize, setPatchSize] = useState(0);

  const oscColumn = useRef(null);
  const ieWrapper = useRef(null);

  const patchSizeLimit = 5242880;

  const checkCustomPatch = typeof props.track.instrument !== "string";

  const isDrum = trackType === 0 && props.instrumentInfo.patch.dr;

  const setInstrument = (newInstrument) => {
    //console.log("instrument set", newInstrument._dummyVoice);
    props.setInstruments((prev) => {
      let newInstruments = [...prev];
      newInstruments[props.index].dispose();
      delete newInstruments[props.index];
      newInstruments[props.index] = newInstrument;
      return newInstruments;
    });
  };

  const setInstrumentLoaded = (state) =>
    props.setInstrumentsLoaded((prev) => {
      let a = [...prev];
      a[props.index] = state;
      return a;
    });

  const changeInstrumentType = async (e) => {
    let newType = e.target.value;

    console.log(newType);

    props.updateFilesStatsOnChange && props.updateFilesStatsOnChange();

    let patch =
      typeof props.track.instrument === "string"
        ? await firebase
            .firestore()
            .collection("patches")
            .doc(props.track.instrument)
            .get()
        : props.track.instrument;

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

    setSelectedPatch("Custom");

    setInstrument(newInstrument);

    props.setTracks &&
      props.setTracks((prev) => {
        let newTracks = [...prev];
        newTracks[props.index].instrument = newInstrument.get();
        if (newType === "Sampler") {
          delete newTracks[props.index].instrument.onerror;
          delete newTracks[props.index].instrument.onload;
        }
        return newTracks;
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

  const toggleSamplerMode = () => {
    props.setInstrumentsInfo((prev) => {
      let newInstrInfo = [...prev];
      newInstrInfo[props.index].patch.dr = !newInstrInfo[props.index].patch.dr;
      return newInstrInfo;
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

    //let filteredScore = props.track.score.map((msre)=>msre.map(beat=>beat.filter(el=>JSON.stringify(el)!==fileName)));

    let newInstrument = new Tone.Players().toDestination();

    props.instrument._buffers._buffers.forEach((value, key) => {
      if (JSON.stringify(soundindex) !== key) newInstrument.add(key, value);
    });

    props.instrument.dispose();

    setInstrument(newInstrument);
    onInstrumentMod(fileId, fileName, soundindex, true);

    props.setInstrumentsInfo((prev) => {
      let newInfo = [...prev];
      delete newInfo[props.index].filesInfo.soundindex;
      return newInfo;
    });

    firebase
      .firestore()
      .collection("files")
      .doc(fileId)
      .get()
      .then((r) => setPatchSize((prev) => prev - r.data().size));
  };

  const handleSamplerFileDelete = (fileId, fileName) => {
    let newInstrument = new Tone.Sampler().toDestination();

    props.instrument._buffers._buffers.forEach((value, key) => {
      if (parseInt(key) !== fileName) newInstrument.add(key, value);
    });

    props.instrument.dispose();

    setInstrument(newInstrument);

    onInstrumentMod(
      fileId,
      Tone.Frequency(fileName, "midi").toNote(),
      "",
      true
    );
    firebase
      .firestore()
      .collection("files")
      .doc(fileId)
      .get()
      .then((r) => setPatchSize((prev) => prev - r.data().size));
  };

  const renamePlayersLabel = (index, newName) => {
    //props.setLabels(index, newName);
    props.updateFilesStatsOnChange && props.updateFilesStatsOnChange();

    if (typeof props.track.instrument === "string") {
      firebase
        .firestore()
        .collection("drumpatches")
        .doc(props.track.instrument)
        .get()
        .then((patch) => {
          props.setTracks && !props.patchPage
            ? props.setTracks((prev) => {
                let newTracks = [...prev];
                newTracks[props.index].instrument = patch.data();

                return newTracks;
              })
            : props.setPatchInfo(patch.data());
        });
    }

    setRenamingLabel(null);
  };

  const changeSamplerNote = (note, newNote) => {
    // let note = Tone.Frequency(noteN).toMidi();
    // let newNote = Tone.Frequency(newNoteN).toMidi();

    //console.log(note, newNote);

    let drumMap = props.instrument._buffers._buffers;
    if (drumMap.has(newNote)) return;

    //props.instrument.add()
    drumMap.set(
      JSON.stringify(Tone.Frequency(newNote).toMidi()),
      JSON.stringify(Tone.Frequency(note).toMidi())
    );

    console.log(drumMap.delete(JSON.stringify(Tone.Frequency(note).toMidi())));

    props.updateFilesStatsOnChange && props.updateFilesStatsOnChange();

    if (typeof props.track.instrument === "string") {
      firebase
        .firestore()
        .collection("patches")
        .doc(props.track.instrument)
        .get()
        .then((urls) => {
          /*    setFilesName((prev) => {
            let newFileNames = { ...prev };
            newFileNames[newNote] = newFileNames[note];
            delete newFileNames[note];
            return newFileNames;
          }); */

          let urlsObj = urls.data().urls;
          urlsObj[newNote] = urlsObj[note];
          delete urlsObj[note];

          let totalSize = 0;
          Promise.all(
            Object.keys(urlsObj).map(async (e, i) => {
              let filedata = (
                await firebase
                  .firestore()
                  .collection("files")
                  .doc(urlsObj[e])
                  .get()
              ).data();
              totalSize += filedata.size;
              return filedata.size;
            })
          ).then((values) => {
            setPatchSize(totalSize);
          });

          !props.patchPage
            ? props.setTracks &&
              props.setTracks((prev) => {
                let newTracks = [...prev];
                newTracks[props.index].instrument = { urls: urlsObj };

                return newTracks;
              })
            : props.setPatchInfo((prev) => {
                let newPatch = { ...prev };
                newPatch.urls = urlsObj;
                return newPatch;
              });
        });
    } else {
      /*  setFilesName((prev) => {
        let newFileNames = { ...prev };
        newFileNames[newNote] = newFileNames[note];
        delete newFileNames[note];
        return newFileNames;
      }); */

      let urlsObj = { ...props.track.instrument.urls };
      urlsObj[newNote] = urlsObj[note];
      delete urlsObj[note];

      let totalSize = 0;

      Promise.all(
        Object.keys(urlsObj).map(async (e, i) => {
          let filedata = (
            await firebase.firestore().collection("files").doc(urlsObj[e]).get()
          ).data();
          totalSize += filedata.size;
          return filedata.size;
        })
      ).then((values) => {
        setPatchSize(totalSize);
      });

      !props.patchPage
        ? props.setTracks &&
          props.setTracks((prev) => {
            let newTracks = [...prev];
            newTracks[props.index].instrument = { urls: urlsObj };

            return newTracks;
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
      volume: props.track.volume,
      createdOn: firebase.firestore.FieldValue.serverTimestamp(),
      in: 1,
      likes: 0,
    };

    let patchInfo = !trackType
      ? props.instrument.name === "Sampler"
        ? {
            base: "Sampler",
            name: !!name ? name : "Untitled Patch",
            urls: props.track.instrument.urls,
          }
        : {
            base: props.instrument._dummyVoice.name.replace("Synth", ""),
            name: !!name ? name : "Untitled Patch",
            options: props.instrument.get(),
          }
      : {
          name: !!name ? name : "Untitled Drum Patch",
          urls: props.track.instrument.urls,
        };

    let patch = Object.assign({}, clearInfo, patchInfo);

    if (typeof category === "number") patch.categ = parseInt(category);

    const newPatchRef = firebase
      .firestore()
      .collection(!trackType ? "patches" : "drumpatches");

    const userRef = firebase.firestore().collection("users").doc(user.uid);

    newPatchRef.add(patch).then((r) => {
      props.setTracks &&
        props.setTracks((previous) =>
          previous.map((track, i) => {
            if (i === props.index) {
              let newTrack = { ...track };
              newTrack.instrument = r.id;
              return newTrack;
            } else {
              return track;
            }
          })
        );

      userRef.update(
        !trackType
          ? { patches: firebase.firestore.FieldValue.arrayUnion(r.id) }
          : { drumPatches: firebase.firestore.FieldValue.arrayUnion(r.id) }
      );

      setSelectedPatch(r.id);
    });
    setPatchExplorer(false);
  };

  const onInstrumentMod = async (fileId, name, soundindex, isRemoving) => {
    //update instrument info in track object

    if (props.track.type === 0 || props.instrument.name === "Sampler") {
      let patch =
        typeof props.track.instrument === "string"
          ? (
              await firebase
                .firestore()
                .collection(props.track.type === 0 ? "drumpatches" : "patches")
                .doc(props.track.instrument)
                .get()
            ).data()
          : { ...props.track.instrument };

      typeof props.track.instrument === "string" &&
        firebase
          .firestore()
          .collection(props.track.type === 0 ? "drumpatches" : "patches")
          .doc(props.track.instrument)
          .update({ in: firebase.firestore.FieldValue.increment(-1) });

      firebase
        .firestore()
        .collection("files")
        .doc(fileId)
        .update({
          in: firebase.firestore.FieldValue.increment(isRemoving ? -1 : 1),
          ld: firebase.firestore.FieldValue.increment(isRemoving ? 0 : 1),
        });

      //console.log(props.track.instrument, patch, soundindex, name);

      !isRemoving
        ? (patch.urls[props.track.type === 0 ? soundindex : name] = fileId)
        : delete patch.urls[props.track.type === 0 ? soundindex : name];

      props.setTracks &&
        props.setTracks((prev) => {
          let newTracks = [...prev];
          newTracks[props.index].instrument = { ...patch };
          return newTracks;
        });
    } else {
      props.setTracks &&
        props.setTracks((prev) => {
          let newTracks = [...prev];
          newTracks[props.index].instrument = props.instrument.get();
          return newTracks;
        });
    }
    props.resetUndoHistory && props.resetUndoHistory();
  };

  /* const updateOnFileLoaded = (dur) => {
    //console.log(props.instrument);
    props.setModules((previousModules) => {
      let newmodules = [...previousModules];
      if (props.instrument.buffer)
        newmodules[props.index].score[0].duration = parseFloat(
          (dur ? dur : props.instrument.buffer.duration).toFixed(2)
        );
      return newmodules;
    });
    props.resetUndoHistory();
  }; */

  const onFileClick = (fileId, fileUrl, audiobuffer, index, data) => {
    let isDrum = props.track.type === 0;
    if (props.track.type === 3) {
      setInstrumentLoaded(false);
      props.instrument.dispose();
      let newPlayer = new Tone.GrainPlayer(
        audiobuffer ? audiobuffer : fileUrl,
        () => setInstrumentLoaded(true)
      ).toDestination();

      setInstrument(newPlayer);
      //updateOnFileLoaded();
      onInstrumentMod(fileId);
      //setModulePage(null);
    } else {
      setInstrumentLoaded(false);

      let labelOnInstrument = isDrum
        ? index
        : Tone.Frequency(detectPitch(audiobuffer)[0]).toNote();

      if (typeof props.track.instrument === "string") {
        firebase
          .firestore()
          .collection(isDrum ? "drumpatches" : "patches")
          .doc(props.track.instrument)
          .get()
          .then((r) => {
            if (props.instrument.has(labelOnInstrument)) {
              let newInstrument = new Tone.Players().toDestination();

              props.instrument._buffers._buffers.forEach((value, key) => {
                if (JSON.stringify(index) !== key)
                  newInstrument.add(key, value);
              });

              newInstrument.add(
                labelOnInstrument,
                audiobuffer ? audiobuffer : fileUrl,
                () => setInstrumentLoaded(true)
              );

              props.instrument.dispose();

              setInstrument(newInstrument);
            } else {
              props.instrument.add(
                labelOnInstrument,
                audiobuffer ? audiobuffer : fileUrl,
                () => setInstrumentLoaded(true)
              );
            }

            props.setInstrumentsInfo((prev) => {
              let a = [...prev];
              a[props.index].filesInfo[index] = data;
              return a;
            });

            onInstrumentMod(fileId, labelOnInstrument, labelOnInstrument);
          });
      } else {
        //console.log(Object.keys(props.track.instrument.urls), labelOnInstrument);

        if (props.instrument.has(labelOnInstrument)) {
          let newInstrument = new Tone.Players().toDestination();

          props.instrument._buffers._buffers.forEach((value, key) => {
            if (JSON.stringify(index) !== key) newInstrument.add(key, value);
          });

          newInstrument.add(
            labelOnInstrument,
            audiobuffer ? audiobuffer : fileUrl,
            () => setInstrumentLoaded(true)
          );

          props.instrument.dispose();

          setInstrument(newInstrument);
        } else {
          props.instrument.add(
            labelOnInstrument,
            audiobuffer ? audiobuffer : fileUrl,
            () => setInstrumentLoaded(true)
          );
        }

        //console.log(props.instrument);

        onInstrumentMod(fileId, labelOnInstrument, labelOnInstrument);
      }
    }
  };

  const updateFilesStatsOnChange = async () => {
    //when change the instrument, update file "in" stat by -1
    /*

    let instrobj =
      typeof props.track.instrument === "string"
        ? (
            await firebase
              .firestore()
              .collection(props.track.type === 0 ? "drumpatches" : "patches")
              .doc(props.track.instrument)
              .get()
          ).data()
        : props.track.instrument;

    typeof props.track.instrument === "string" &&
      firebase
        .firestore()
        .collection(props.track.type === 0 ? "drumpatches" : "patches")
        .doc(props.track.instrument)
        .update({ in: firebase.firestore.FieldValue.increment(-1) });

    if (instrobj.urls)
      Object.values(instrobj.urls).forEach((e) =>
        firebase
          .firestore()
          .collection("files")
          .doc(e)
          .update({ in: firebase.firestore.FieldValue.increment(-1) })
      );

    if (instrobj.url)
      firebase
        .firestore()
        .collection("files")
        .doc(instrobj.url)
        .update({ in: firebase.firestore.FieldValue.increment(-1) });

        */
  };

  //used for

  /* ================================================================ */
  /* ================================================================ */
  // USEEFFECTs
  /* ================================================================ */
  /* ================================================================ */

  /*  useEffect(() => {
    //console.log(props.instrument);
    props.instrument &&
      props.instrument.name === "Sampler" &&
      console.log(
        props.instrument._buffers._buffers,
        props.track.instrument.urls,
        filesName
      );
  }, [props.instrument]);

  useEffect(() => {
    console.log(formatBytes(patchSize));
  }, [patchSize]); */

  /* ================================================================ */
  /* ================================================================ */
  // JSX
  /* ================================================================ */
  /* ================================================================ */

  let mainContent = "Nothing Here";

  if (props.instrument) {
    if (props.track.type === 0) {
      //console.log(props.instrument);

      //bufferObjects.sort((a, b) => a[1] - b[1]);
      mainContent = (
        <Grid
          container
          columns={{ xs: 20, sm: 20, md: 20, lg: 20 }}
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          className="ie-drum-cont"
          spacing={1}
        >
          {Array(20)
            .fill(false)
            .map((e, i) => (
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
                fileInfo={props.instrumentInfo.filesInfo[i]}
                setRenamingLabel={setRenamingLabel}
                openFilePage={(ev) =>
                  props.handlePageNav(
                    "file",
                    props.instrumentInfo.patch.urls[i],
                    ev
                  )
                }
                fileId={props.instrumentInfo.patch.urls[i]}
                isDrum={isDrum}
                handleFileClick={() => setEditingFile(i)}
              />
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
        <div style={{ overflowY: "overlay", height: "100%", width: "100%" }}>
          <Select
            variant="standard"
            native
            value={
              props.instrument._dummyVoice
                ? props.instrument._dummyVoice.name
                : props.instrument.name
            }
            onChange={changeInstrumentType}
            className="instrument-editor-type-select"
          >
            {["MonoSynth", "Sampler", "FMSynth", "AMSynth"].map((e, i) => (
              <option value={e}>{t(`instrumentEditor.types.${e}`)}</option>
            ))}
          </Select>
          {bufferObjects.length > 0 ? (
            <List style={{ width: "100%", height: "calc(100% - 78px)" }}>
              {bufferObjects
                .sort((a, b) => a[1] - b[1])
                .map((e, i) => (
                  <>
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
                      openFilePage={(ev) =>
                        props.handlePageNav("file", filesId[i], ev)
                      }
                      setRenamingLabel={setRenamingLabel}
                    />
                    <Divider />
                  </>
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
        <SynthEditor
          instrument={props.instrument}
          onInstrumentMod={onInstrumentMod}
          changeInstrumentType={changeInstrumentType}
        />
      );
    }
  }

  /*  useEffect(() => {
    //console.log(props.instrument);

    console.log(filesId, filesName);
  }, [filesId, filesName]); */

  return (
    <Box
      sx={{ bgcolor: "background.default" }}
      className="instrument-editor"
      onDragEnter={() => {
        setDraggingOver(true);
        ieWrapper.current.scrollTop = 0;
      }}
      ref={ieWrapper}
    >
      {/* {fileExplorer && (
        <FileExplorer
          compact
          setInstrumentLoaded={setInstrumentLoaded}
          onFileClick={props.handleFileClick}
          setFileExplorer={setFileExplorer}
          setSnackbarMessage={props.setSnackbarMessage}
          track={props.track}
          instrument={props.instrument}
          trackType={trackType}
          patchSize={patchSize}
          setPatchSize={setPatchSize}
        />
      )} */}

      {mainContent}
      <div className="ie-bottom-menu">
        <Select
          variant="standard"
          value={checkCustomPatch ? "Custom" : props.track.instrument}
          onMouseDown={() => setPatchExplorer(true)}
          inputProps={{ readOnly: true }}
        >
          <MenuItem
            value={checkCustomPatch ? "Custom" : props.track.instrument}
          >
            {checkCustomPatch
              ? "Custom"
              : props.instrumentInfo &&
                props.instrumentInfo.patch &&
                props.instrumentInfo.patch.name}
          </MenuItem>
        </Select>

        {/* checkCustomPatch && (
          <IconButton>
            <Icon>save</Icon>
          </IconButton>
        ) */}
        <Divider orientation="vertical" flexItem />
        {trackType === 0 ? (
          <>
            <IconButton
              color={isDrum ? "primary" : "default"}
              onClick={toggleSamplerMode}
            >
              <SvgIcon viewBox="0 0 351 322.7">{drumIcon}</SvgIcon>
            </IconButton>
          </>
        ) : (
          <></>
        )}
      </div>
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

      {/* (props.track.type === 0 || props.instrument.name === "Sampler") && (
        <>
          <Fab
            style={{ position: "absolute", right: 16, bottom: 16 }}
            onClick={() => setFileExplorer(true)}
            color="primary"
          >
            <Icon>graphic_eq</Icon>
          </Fab>

          {
            <Tooltip
              title={`${formatBytes(patchSize)} / ${formatBytes(
                patchSizeLimit
              )}`}
            >
              <LinearProgress
                variant="determinate"
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: "100%",
                  height: 8,
                }}
                value={(patchSize / patchSizeLimit) * 100}
              />
            </Tooltip>
          }
        </>
      ) */}

      {/* <FileUploader
        open={uploadingFiles.length > 0}
        files={uploadingFiles}
        setUploadingFiles={setUploadingFiles}
        onInstrumentMod={onInstrumentMod}
        track={props.track}
        instrument={props.instrument}
        setInstrumentLoaded={setInstrumentLoaded}
        setFilesName={setFilesName}
        setFilesId={setFilesId}
        renamePlayersLabel={renamePlayersLabel}
        setRenamingLabel={setRenamingLabel}
        setLabels={props.setLabels}
        handlePageNav={props.handlePageNav}
        patchSize={patchSize}
        setPatchSize={setPatchSize}
      /> */}

      {patchExplorer && (
        <PatchExplorer
          compact
          patchExplorer={patchExplorer}
          index={props.index}
          track={props.track}
          setTracks={props.setTracks}
          setIEOpen={props.setIEOpen}
          setPatchExplorer={setPatchExplorer}
          instrument={props.instrument}
          setInstruments={props.setInstruments}
          setInstrumentLoaded={props.setInstrumentLoaded}
          setInstrumentsLoaded={props.setInstrumentsLoaded}
          saveUserPatch={saveUserPatch}
          isDrum={isDrum}
          updateFilesStatsOnChange={updateFilesStatsOnChange}
        />
      )}

      {renamingLabel &&
        (props.track.type === 0 ? (
          <NameInput
            select
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

      {editingFile !== null && (
        <FileEditor
          open={editingFile !== null}
          onClose={() => setEditingFile(null)}
          exists={props.instrument._buffers._buffers.has(
            JSON.stringify(editingFile)
          )}
          index={editingFile}
          instrument={props.instrument}
          handleFileDelete={(a, b, c) => setDeletingItem([a, b, c])}
          buffer={props.instrument._buffers._buffers.get(
            JSON.stringify(editingFile)
          )}
          fileInfo={props.instrumentInfo.filesInfo[editingFile]}
          setRenamingLabel={setRenamingLabel}
          openFilePage={(ev) =>
            props.handlePageNav(
              "file",
              props.instrumentInfo.patch.urls[editingFile],
              ev
            )
          }
          fileId={props.instrumentInfo.patch.urls[editingFile]}
          isDrum={isDrum}
          handlePageNav={props.handlePageNav}
          setInstrumentLoaded={setInstrumentLoaded}
          onFileClick={onFileClick}
        />
      )}
    </Box>
  );
}

export default InstrumentEditor;

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
