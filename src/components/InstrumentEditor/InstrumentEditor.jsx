import React, { useState, useRef, useContext } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import {
  List,
  Divider,
  IconButton,
  Icon,
  MenuItem,
  Tooltip,
  Box,
  Grid,
  Select,
  SvgIcon,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import SamplerFileItem from "./SamplerFileItem";
import DrumComponent from "./DrumComponent";
import SynthEditor from "./SynthEditor";
import FileInspector from "./FileInspector";
import ListExplorer from "../ListExplorer";

import NameInput from "../dialogs/NameInput";
import NoteInput from "../dialogs/NoteInput";
import Confirm from "../dialogs/Confirm";

import wsCtx from "../../context/SessionWorkspaceContext";

import { detectPitch } from "../../services/Audio";

import { drumIcon, drumAbbreviations } from "../../services/MiscData";

import "./style.css";

function InstrumentEditor(props) {
  const { t } = useTranslation();

  const {
    workspace,
    resetUndoHistory,
    handlePageNav,
    setUploadingFiles,
    setPagePatchInfo,
  } = props;

  const wsCtxData = useContext(wsCtx);

  const {
    tracks,
    instruments,
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

  const track = workspace ? tracks[selectedTrack] : props.track;
  const instrument = workspace ? instruments[selectedTrack] : props.instrument;
  const instrumentInfo = workspace
    ? instrumentsInfo[selectedTrack]
    : props.patchInfo;
  const index = selectedTrack;

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

  const oscColumn = useRef(null);
  const ieWrapper = useRef(null);

  const patchSizeLimit = 5242880;

  const checkCustomPatch = typeof track.instrument !== "string";

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
      ? //console.log("instrument set", newInstrument._dummyVoice);
        setInstruments((prev) => {
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

  const updatePatchSize = (urlsObj) => {
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
  };

  const changeInstrumentType = async (e) => {
    let newType = typeof e === "string" ? e : e.target.value;

    instrument.releaseAll();

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

  const toggleSamplerMode = () =>
    setPatchInfo((prev) => ({ ...prev, dr: !prev.dr }));

  const handleFileDrop = (files, event) => {
    event.preventDefault();
    Tone.Transport.pause();
    //let file = files[0];
    setDraggingOver(false);
    setUploadingFiles(files);
  };

  const handlePlayersFileDelete = (fileId, fileName, soundindex) => {
    //temp solution, Tone.Players doesn't allow .remove()

    //let filteredScore = track.score.map((msre)=>msre.map(beat=>beat.filter(el=>JSON.stringify(el)!==fileName)));

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

  const handleSamplerFileDelete = (fileId, fileName) => {
    console.log(fileName, instrument._buffers._buffers);
    let newInstrument = new Tone.Sampler().toDestination();

    instrument._buffers._buffers.forEach((value, key) => {
      if (key !== fileName) newInstrument.add(key, value);
    });

    instrument.dispose();

    setInstrument(newInstrument);

    console.log(newInstrument._buffers._buffers);

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

  const changeSamplerNote = async (note, newNote) => {
    let drumMap = instrument._buffers._buffers;
    if (drumMap.has(newNote)) return;

    //TODO:Handle instrument having newNote

    drumMap.set(
      JSON.stringify(Tone.Frequency(newNote).toMidi()),
      drumMap.get(JSON.stringify(Tone.Frequency(note).toMidi()))
    );

    drumMap.delete(JSON.stringify(Tone.Frequency(note).toMidi()));

    updateFilesStatsOnChange && updateFilesStatsOnChange();

    let urlsObj =
      typeof track.instrument === "string"
        ? (
            await firebase
              .firestore()
              .collection("patches")
              .doc(track.instrument)
              .get()
          ).data().urls
        : { ...track.instrument.urls };

    urlsObj[newNote] = urlsObj[note];
    delete urlsObj[note];

    if (workspace) {
      setTracks((prev) => {
        let newTracks = [...prev];
        newTracks[index].instrument = { urls: urlsObj };
        return newTracks;
      });
    }
    setPatchInfo((prev) => {
      let newPatch = { ...prev };
      newPatch.filesInfo[newNote] = newPatch.filesInfo[note];
      delete newPatch.filesInfo[note];
      newPatch.patch.urls = urlsObj;
      return newPatch;
    });

    setRenamingLabel(null);
  };

  const saveUserPatch = (name, category) => {
    //console.log(name, category);
    let user = firebase.auth().currentUser;

    let clearInfo = {
      creator: user.uid,
      categ: !!category || isNaN(category) ? category : 0,
      volume: track.volume,
      createdOn: firebase.firestore.FieldValue.serverTimestamp(),
      in: 1,
      likes: 0,
    };

    let patchInfo = !trackType
      ? instrument.name === "Sampler"
        ? {
            base: "Sampler",
            name: !!name ? name : "Untitled Patch",
            urls: track.instrument.urls,
          }
        : {
            base: instrument._dummyVoice.name.replace("Synth", ""),
            name: !!name ? name : "Untitled Patch",
            options: instrument.get(),
          }
      : {
          name: !!name ? name : "Untitled Drum Patch",
          urls: track.instrument.urls,
        };

    let patch = Object.assign({}, clearInfo, patchInfo);

    if (typeof category === "number") patch.categ = parseInt(category);

    const newPatchRef = firebase
      .firestore()
      .collection(!trackType ? "patches" : "drumpatches");

    const userRef = firebase.firestore().collection("users").doc(user.uid);

    newPatchRef.add(patch).then((r) => {
      setTracks &&
        setTracks((previous) =>
          previous.map((track, i) => {
            if (i === index) {
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
    resetUndoHistory && resetUndoHistory();
  };

  /* const updateOnFileLoaded = (dur) => {
    //console.log(instrument);
    setModules((previousModules) => {
      let newmodules = [...previousModules];
      if (instrument.buffer)
        newmodules[index].score[0].duration = parseFloat(
          (dur ? dur : instrument.buffer.duration).toFixed(2)
        );
      return newmodules;
    });
    resetUndoHistory();
  }; */

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

    //console.log(instrument);

    onInstrumentMod(fileId, labelOnInstrument, labelOnInstrument);
    setEditingFile(null);
  };

  const updateFilesStatsOnChange = async () => {
    //when change the instrument, update file "in" stat by -1
    /*

    let instrobj =
      typeof track.instrument === "string"
        ? (
            await firebase
              .firestore()
              .collection(track.type === 0 ? "drumpatches" : "patches")
              .doc(track.instrument)
              .get()
          ).data()
        : track.instrument;

    typeof track.instrument === "string" &&
      firebase
        .firestore()
        .collection(track.type === 0 ? "drumpatches" : "patches")
        .doc(track.instrument)
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

  let mainContent = "Nothing Here";

  if (instrument) {
    if (track.type === 0) {
      //console.log(instrument);

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
    } else if (instrument.name === "Sampler") {
      let bufferObjects = [];
      instrument._buffers._buffers.forEach((e, i, a) =>
        bufferObjects.push({ buffer: e, midi: i })
      );
      //console.log(instrument._buffers._buffers);
      //console.log(bufferObjects, filesName);
      mainContent = (
        <div className="ie-synth-cont" style={{ overflowY: "overlay" }}>
          <List style={{ width: "100%", height: "calc(100% - 78px)" }}>
            <div style={{ height: 48 }} />
            {bufferObjects
              .sort((a, b) => a[1] - b[1])
              .map((e, i) => (
                <>
                  <SamplerFileItem
                    exists={instrument._buffers._buffers.has(
                      JSON.stringify(e.midi)
                    )}
                    key={i}
                    index={e.midi}
                    instrument={instrument}
                    handleSamplerFileDelete={(a, b) => setDeletingItem([a, b])}
                    buffer={e.buffer}
                    fileInfo={
                      instrumentInfo &&
                      instrumentInfo.filesInfo[
                        Tone.Frequency(e.midi, "midi").toNote()
                      ]
                    }
                    fileLabel={e.midi}
                    fileId={
                      instrumentInfo &&
                      instrumentInfo.patch.urls[
                        Tone.Frequency(e.midi, "midi").toNote()
                      ]
                    }
                    handlePageNav={handlePageNav}
                    setRenamingLabel={setRenamingLabel}
                    handleFileClick={() => setEditingFile(parseInt(e.midi))}
                  />
                  <Divider />
                </>
              ))}
            <SamplerFileItem
              empty
              instrument={instrument}
              handleSamplerFileDelete={(a, b) => setDeletingItem([a, b])}
              handlePageNav={handlePageNav}
              setRenamingLabel={setRenamingLabel}
              handleFileClick={() => setEditingFile(9999)}
            />
          </List>
        </div>
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
      <div className="ie-bottom-menu">
        <Select
          variant="standard"
          value={checkCustomPatch ? "Custom" : track.instrument}
          onMouseDown={() => setPatchExplorer(true)}
          inputProps={{ readOnly: true }}
        >
          <MenuItem value={checkCustomPatch ? "Custom" : track.instrument}>
            {checkCustomPatch
              ? "Custom"
              : instrumentInfo.patch.name
              ? instrumentInfo.patch.name
              : ""}
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
        ) : trackType === 1 ? (
          <>
            <Tooltip
              title={`Switch to ${
                instrument.name === "Sampler" ? "Synth" : "Sampler"
              }`}
            >
              <IconButton
                style={{ width: 48 }}
                color="default"
                onClick={() => setIsSwitchingSampler(true)}
              >
                <Icon>
                  {instrument.name === "Sampler" ? "cable" : "graphic_eq"}
                </Icon>
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <></>
        )}
      </div>
      {/* draggingOver && instrument.name !== "PolySynth" && (
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
      ) */}

      {patchExplorer && (
        <ListExplorer
          compact
          type={isDrum ? "seq" : "instr"}
          patchExplorer={patchExplorer}
          index={index}
          track={track}
          setTracks={setTracks}
          setPatchExplorer={setPatchExplorer}
          instrument={instrument}
          setInstruments={setInstruments}
          setInstrumentLoaded={setInstrumentLoaded}
          setInstrumentsLoaded={setInstrumentsLoaded}
          saveUserPatch={saveUserPatch}
          updateFilesStatsOnChange={updateFilesStatsOnChange}
        />
      )}

      {renamingLabel && (
        <NoteInput
          open={true}
          onClose={() => setRenamingLabel(null)}
          note={renamingLabel}
          onSubmit={(i) =>
            changeSamplerNote(Tone.Frequency(renamingLabel, "midi").toNote(), i)
          }
        />
      )}

      {deletingItem && (
        <Confirm
          instrumentEditor
          action={() =>
            instrument.name === "Sampler"
              ? handleSamplerFileDelete(...deletingItem)
              : handlePlayersFileDelete(...deletingItem)
          }
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
