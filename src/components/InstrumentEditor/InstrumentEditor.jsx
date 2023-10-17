import React, { useState, useRef, useContext } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import { IconButton, Icon, Box, Grid, CircularProgress } from "@mui/material";

import { useTranslation } from "react-i18next";

import DrumComponent from "./DrumComponent";
import SynthEditor from "./SynthEditor";
import FileInspector from "./FileInspector";

import Confirm from "../dialogs/Confirm";

import wsCtx from "../../context/SessionWorkspaceContext";

import { detectPitch } from "../../services/Audio";

import { drumAbbreviations } from "../../services/MiscData";

import "./style.css";

function InstrumentEditor(props) {
  const { t } = useTranslation();

  const { workspace, resetHistory, handlePageNav } = props;

  const wsCtxData = useContext(wsCtx);

  const {
    tracks,
    instruments,
    instrumentsLoaded,
    setTracks,
    setInstruments,
    setInstrumentsLoaded,
    instrumentsInfo,
    setInstrumentsInfo,
    params,
    paramSetter,
    uploadFile,
  } = workspace ? wsCtxData : props;

  const { selectedTrack } = workspace ? params : props;

  const index = selectedTrack;

  const track = workspace ? tracks[index] : props.track;
  const instrument = workspace ? instruments[index] : props.instrument;
  const instrumentInfo = workspace ? instrumentsInfo[index] : props.patchInfo;

  const instrumentLoaded = instrumentsLoaded[index];

  const trackType = track.type;

  const [draggingOver, setDraggingOver] = useState(false);
  const [patchExplorer, setPatchExplorer] = useState(
    trackType === 0 || !workspace ? false : true
  );

  const [selectedPatch, setSelectedPatch] = useState(
    typeof track.instrument === "string" ? track.instrument : "Custom"
  );

  const [renamingLabel, setRenamingLabel] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [isSwitchingSampler, setIsSwitchingSampler] = useState(false);

  const [patchSize, setPatchSize] = useState(0);

  const ieWrapper = useRef(null);

  const isDrum = trackType === 0 && instrumentInfo.patch.dr;

  const newFileName =
    (track.name || t(`trackPicker.types.${track.type}.name`)) + "_" + isDrum
      ? drumAbbreviations[editingFile]
      : editingFile;

  const setPatchInfo = (value) =>
    workspace
      ? setInstrumentsInfo((prev) => ({
          ...prev,
          patch: typeof value === "function" ? value(prev[index]) : value,
        }))
      : props.setPatchInfo((prev) =>
          typeof value === "function" ? value(prev) : value
        );

  const setInstrument = (newInstrument) =>
    workspace
      ? setInstruments((prev) => {
          let newInstruments = [...prev];
          newInstruments[index].dispose();
          delete newInstruments[index];
          newInstruments[index] = newInstrument;
          return newInstruments;
        })
      : props.setInstrument(newInstrument);

  const setInstrumentLoaded = (state) =>
    setInstrumentsLoaded((prev) => ({
      ...prev,
      [index]: state,
    }));

  /* ================================= */

  const changeInstrumentType = async (e) => {
    let newType = typeof e === "string" ? e : e.target.value;

    instrument.releaseAll();

    resetHistory && resetHistory();

    updateFilesStatsOnChange && updateFilesStatsOnChange();

    let patch =
      typeof track.instrument === "string"
        ? await firebase
            .firestore()
            .collection("patches")
            .doc(track.instrument)
            .get()
        : track.instrument;

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

    if (workspace)
      setTracks((prev) => {
        let newTracks = [...prev];
        newTracks[index].instrument = newInstrument.get();
        if (newType === "Sampler") {
          delete newTracks[index].instrument.onerror;
          delete newTracks[index].instrument.onload;
        }
        return newTracks;
      });

    setPatchInfo((prev) => {
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

  const handlePlayersFileDelete = (fileId, fileName, soundindex) => {
    let newInstrument = new Tone.Players().toDestination();

    instrument._buffers._buffers.forEach((value, key) => {
      if (JSON.stringify(soundindex) !== key) newInstrument.add(key, value);
    });

    instrument.dispose();

    setInstrument(newInstrument);
    onInstrumentMod(fileId, fileName, soundindex, true);

    setPatchInfo((prev) => {
      let newInfo = { ...prev };
      delete newInfo.filesInfo.soundindex;
      return newInfo;
    });

    firebase
      .firestore()
      .collection("files")
      .doc(fileId)
      .get()
      .then((r) => setPatchSize((prev) => prev - r.data().size));
  };

  const onInstrumentMod = async (fileId, name, soundindex, isRemoving) => {
    if (track.type === 0 || instrument.name === "Sampler") {
      let patch =
        typeof track.instrument === "string"
          ? (
              await firebase
                .firestore()
                .collection(track.type === 0 ? "drumpatches" : "patches")
                .doc(track.instrument)
                .get()
            ).data()
          : { ...track.instrument };

      typeof track.instrument === "string" &&
        firebase
          .firestore()
          .collection(track.type === 0 ? "drumpatches" : "patches")
          .doc(track.instrument)
          .update({ in: firebase.firestore.FieldValue.increment(-1) });

      firebase
        .firestore()
        .collection("files")
        .doc(fileId)
        .update({
          in: firebase.firestore.FieldValue.increment(isRemoving ? -1 : 1),
          ld: firebase.firestore.FieldValue.increment(isRemoving ? 0 : 1),
        });

      //console.log(track.instrument, patch, soundindex, name);

      !isRemoving
        ? (patch.urls[track.type === 0 ? soundindex : name] = fileId)
        : delete patch.urls[track.type === 0 ? soundindex : name];

      setTracks &&
        setTracks((prev) => {
          let newTracks = [...prev];
          newTracks[index].instrument = { ...patch };
          return newTracks;
        });
    } else {
      setTracks &&
        setTracks((prev) => {
          let newTracks = [...prev];
          newTracks[index].instrument = instrument.get();
          return newTracks;
        });
    }
    resetHistory && resetHistory();
  };

  const setFile = (fileId, fileUrl, audiobuffer, data) => {
    let isDrum = track.type === 0;

    //Only unload when file comes from url, when there is audiobuffer do nothing

    if (!audiobuffer && fileUrl) setInstrumentLoaded(false);

    let labelOnInstrument = isDrum
      ? editingFile
      : Tone.Frequency(detectPitch(audiobuffer)[0]).toNote();

    if (instrument.name === "Players" && instrument.has(labelOnInstrument)) {
      let newInstrument = new Tone.Players().toDestination();

      instrument._buffers._buffers.forEach((value, key) => {
        if (JSON.stringify(editingFile) !== key) newInstrument.add(key, value);
      });

      newInstrument.add(
        labelOnInstrument,
        audiobuffer ? audiobuffer : fileUrl,
        () => setInstrumentLoaded(true)
      );

      instrument.dispose();

      setInstrument(newInstrument);
    } else {
      instrument.add(
        labelOnInstrument,
        audiobuffer ? audiobuffer : fileUrl,
        () => setInstrumentLoaded(true)
      );
    }

    setPatchInfo((prev) => {
      let a = { ...prev };
      a.filesInfo[labelOnInstrument] = data;
      return a;
    });

    onInstrumentMod(fileId, labelOnInstrument, labelOnInstrument);
    setEditingFile(null);
  };

  const updateFilesStatsOnChange = async () => {};

  let mainContent = (
    <div className="ie-synth-cont">
      <CircularProgress />
    </div>
  );

  if (instrument && instrumentLoaded) {
    if (track.type === 0) {
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
          {instrumentInfo.filesInfo &&
            Array(20)
              .fill(false)
              .map((e, i) => (
                <DrumComponent
                  exists={instrument._buffers._buffers.has(JSON.stringify(i))}
                  key={i}
                  index={i}
                  instrument={instrument}
                  handleFileDelete={(a, b, c) => setDeletingItem([a, b, c])}
                  buffer={instrument._buffers._buffers.get(JSON.stringify(i))}
                  fileInfo={instrumentInfo.filesInfo[i]}
                  setRenamingLabel={setRenamingLabel}
                  openFilePage={(ev) =>
                    handlePageNav("file", instrumentInfo.patch.urls[i], ev)
                  }
                  fileId={instrumentInfo.patch.urls[i]}
                  isDrum={isDrum}
                  handleFileClick={() => setEditingFile(i)}
                />
              ))}
        </Grid>
      );
    } else {
      mainContent = (
        <SynthEditor
          instrument={instrument}
          onInstrumentMod={onInstrumentMod}
          changeInstrumentType={changeInstrumentType}
        />
      );
    }
  }

  /*  useEffect(() => {
    //console.log(instrument);

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
      {mainContent}
      {deletingItem && (
        <Confirm
          instrumentEditor
          action={() => handlePlayersFileDelete(...deletingItem)}
          open={deletingItem}
          onClose={() => setDeletingItem(null)}
        />
      )}

      {isSwitchingSampler && (
        <Confirm
          switchingSampler
          action={() =>
            changeInstrumentType(
              instrument.name === "Sampler" ? "MonoSynth" : "Sampler"
            )
          }
          open={isSwitchingSampler}
          onClose={() => setIsSwitchingSampler(false)}
        />
      )}

      {editingFile !== null && (
        <FileInspector
          instrumentEditor
          open={editingFile !== null}
          onClose={() => setEditingFile(null)}
          exists={instrument._buffers._buffers.has(JSON.stringify(editingFile))}
          index={editingFile}
          instrument={instrument}
          handleFileDelete={(a, b, c) => setDeletingItem([a, b, c])}
          buffer={instrument._buffers._buffers.get(JSON.stringify(editingFile))}
          fileInfo={
            instrumentInfo &&
            instrumentInfo.filesInfo &&
            instrumentInfo.filesInfo[
              instrument.name === "Sampler"
                ? Tone.Frequency(editingFile, "midi").toNote()
                : editingFile
            ]
          }
          fileId={
            instrumentInfo &&
            instrumentInfo.patch.urls[
              instrument.name === "Sampler"
                ? Tone.Frequency(editingFile, "midi").toNote()
                : editingFile
            ]
          }
          isDrum={isDrum}
          handlePageNav={handlePageNav}
          setInstrumentLoaded={setInstrumentLoaded}
          setFile={setFile}
          uploadFile={uploadFile}
          newFileName={newFileName}
        />
      )}
      {workspace && (
        <IconButton
          onClick={() => paramSetter("openSubPage", null)}
          className="mp-closebtn"
          color="primary"
          sx={{ zIndex: 9 }}
        >
          <Icon>close</Icon>
        </IconButton>
      )}
    </Box>
  );
}

export default InstrumentEditor;
