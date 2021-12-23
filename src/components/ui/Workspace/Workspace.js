import React, { useState, useEffect, Fragment } from "react";
import { Helmet } from "react-helmet";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";
import { useSprings, animated } from "react-spring";

import { useParams } from "react-router-dom";

import {
  Icon,
  IconButton,
  Snackbar,
  Divider,
  Box,
  Fab,
  Backdrop,
} from "@mui/material";

import "./Workspace.css";

import Track from "../../Track/Track";
import ClosedTrack from "../../Track/ClosedTrack";

import WorkspaceTitle from "./WorkspaceTitle";
import WorkspaceTransport from "./WorkspaceTransport";
import ScreenButtons from "./ScreenButtons";

import TrackPicker from "../TrackPicker";
import InstrumentEditor from "../../InstrumentEditor/InstrumentEditor";

import Exporter from "../Exporter";
import SessionSettings from "../SessionSettings";
import Mixer from "../Mixer/Mixer";
import WorkspaceGrid from "./WorkspaceGrid";
import WorkspaceRuler from "./WorkspaceRuler";

import NotesInput from "./NotesInput";
import FileList from "./FileList";

import LoadingScreen from "../LoadingScreen";
import ActionConfirm from "../Dialogs/ActionConfirm";
import AuthDialog from "../Dialogs/AuthDialog";
import FileUploader from "../Dialogs/FileUploader/FileUploader";

import NotFoundPage from "../NotFoundPage";

import {
  patchLoader,
  loadDrumPatch,
  loadSynthFromGetObject,
  adaptSequencetoSubdiv,
  loadSamplerFromObject,
  keySamplerMapping,
  keyboardMapping,
  loadAudioTrack,
} from "../../../assets/musicutils";

const userSubmitedSessionProps = [
  "alwcp",
  "bpm",
  "description",
  "editors",
  "hid",
  "name",
  "root",
  "rte",
  "scale",
  "tags",
  "timeline",
];

function Workspace(props) {
  const { t } = useTranslation();

  /* 
  There are 2 savingModes for the workspace:
    -Simple: changes are saved in the db between X minutes, and changes are not detected
    -Collaborative: all changes you make are stored in realtime, and changes in th db will be stored in real time. It's more resource expensive, meant to cowork 
 */

  const [savingMode, setSavingMode] = useState("simple");
  const [autosaver, setAutosaver] = useState(null);
  const [areUnsavedChanges, setAreUnsavedChanges] = useState(false);

  const [DBSessionRef, setDBSessionRef] = useState(null);

  const [tracks, setTracks] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [sessionSize, setSessionSize] = useState(0);

  const [selectedTrack, setSelectedTrack] = useState(null);

  const [instruments, setInstruments] = useState([]);
  const [instrumentsLoaded, setInstrumentsLoaded] = useState([]);
  const [instrumentsInfo, setInstrumentsInfo] = useState([]);
  const [buffers, setBuffers] = useState([]);

  const [isLoaded, setIsLoaded] = useState(false);

  const [metronome, setMetronome] = useState(null);
  const [metronomeState, setMetronomeState] = useState(false);
  const [metronomeEvent, setMetronomeEvent] = useState(null);

  const [pressedKeys, setPressedKeys] = useState([]);
  const [playingOctave, setPlayingOctave] = useState(3);
  const [playNoteFunction, setPlayNoteFunction] = useState([
    () => {},
    () => {},
  ]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mousePosition, setMousePosition] = useState([0, 0]);

  const [trackRows, setTrackRows] = useState([]);

  const [fileListOpen, setFileListOpen] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [cursorMode, setCursorMode] = useState(null);
  const [gridSize, setGridSize] = useState(4);
  const [zoomPosition, setZoomPosition] = useState([0, 3]);

  const [IEOpen, setIEOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  //for mobile devices
  const [expanded, setExpanded] = useState({
    btn: false,
    instr: false,
    opt: false,
  });

  const expSprings = useSprings(1, [
    {
      bottom: expanded.btn ? 16 : -10,
      right: expanded.btn ? 16 : selectedTrack !== null ? -58 : -10,
      config: { tension: 200, friction: 13 },
    },
    {
      bottom: !expanded.instr && "-128px",
      config: { tension: 200, friction: 13 },
    },
  ]);

  const AnimatedBox = animated(Box);

  const [premiumMode, setPremiumMode] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [trackPicker, setTrackPicker] = useState(false);
  const [mixerOpen, setMixerOpen] = useState(false);
  const [sessionDupDialog, setSessionDupDialog] = useState(false);

  const [clipboard, setClipboard] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);
  const [sessionHistory, setSessionHistory] = useState({
    past: [],
    present: null,
    future: [],
  });

  const [editorProfiles, setEditorProfiles] = useState(null);
  const [selection, setSelection] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [movingSelDelta, setMovingSelDelta] = useState(null);

  const [pendingUploadFiles, setPendingUploadFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const [listener, setListener] = useState(() => () => {});
  const [isLastChangeFromServer, setIsLastChangeFromServer] = useState(false);

  const sessionKey = useParams().key;
  const autoSaverTime = 5 * 60 * 1000; //5min

  const keyMapping =
    selectedTrack !== null && tracks[selectedTrack].type === 0
      ? keySamplerMapping
      : keyboardMapping;

  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*===================================LOAD=SESSION=========================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/

  const loadSession = () => {
    //TODO: optimize this, avoid call from server for each session load
    console.log("loading session: ", sessionKey);
    if (props.hidden) {
      let thisSessionData = { ...props.session };
      delete thisSessionData.tracks;
      setSessionData(thisSessionData);
      setTracks(props.session.tracks);
      Tone.Transport.bpm.value = props.session.bpm;
      setEditMode(true);
      loadSessionInstruments(props.session.tracks);
    } else if (sessionKey === null) {
      console.log("session is null!");
    }
    //
    else if (typeof sessionKey === "string") {
      let sessionRef = firebase
        .firestore()
        .collection("sessions")
        .doc(sessionKey);

      setDBSessionRef(!sessionRef ? null : sessionRef);
      //Check for editMmode and get title
      sessionRef.get().then((snapshot) => {
        if (!snapshot.exists) {
          setSessionData(undefined);
          setTracks(undefined);
          return;
        }

        let data = snapshot.data();

        let sessionInfo = { ...data };
        delete sessionInfo.tracks;
        setSessionData(sessionInfo);
        setZoomPosition([0, sessionInfo.size - 1]);

        if (data.hasOwnProperty("tracks")) {
          loadSessionInstruments(data.tracks);
          setTracks(data.tracks);
          if (data.tracks.length === 0) setIsLoaded(true);
        }

        Tone.Transport.bpm.value = data.bpm;

        props.user &&
          data.editors.includes(props.user.uid) &&
          setEditMode(true);
      });

      sessionRef.update({
        opened: firebase.firestore.FieldValue.increment(1),
        played: firebase.firestore.FieldValue.increment(1),
      });
    } /* else if (typeof sessionKey === "object") {
      setTracks(sessionKey.tracks);
      Tone.Transport.bpm.value = sessionKey.bpm;
      if (
        (!props.hidden &&
          props.user &&
          sessionKey.editors.includes(props.user.uid)) ||
        !sessionKey.creator
      ) {
        setEditMode(true);
        setSessionEditors(props.session.creator);
      }
      loadSessionInstruments(sessionKey.tracks);
    } */
  };

  const onSessionReady = () => {
    instruments.forEach((e, i) => {
      //console.log(tracks[i].name, 1, e.volume.value);
      e.volume.value = tracks[i].volume;
      e._volume.mute = tracks[i].muted;
      //console.log(tracks[i].name, 2, e.volume.value);
    });

    props.hidden &&
      props.setPlayingLoadingProgress(
        Math.floor(
          (instrumentsLoaded.filter((e) => e !== false).length /
            instrumentsLoaded.length) *
            100
        )
      );

    //TODO, realtime collaborative editing. Must activate only when multiple editors are in the same session
    /* if (!props.hidden && DBSessionRef !== null) {
      DBSessionRef.onSnapshot((snapshot) => {
        updateFromDatabase(snapshot.data());
      });
    } */

    Tone.Transport.seconds = 0;
    props.hidden ? Tone.Transport.start() : Tone.Transport.pause();
    console.log("=====session ready!=====");
    setIsLoaded(true);
    setSavingMode(sessionData.rte ? "rte" : "simple");
  };

  const loadSessionInstruments = (sessionTracks) => {
    console.log("session instr loading");
    let array = Array(sessionTracks.length).fill(false);

    setInstruments(array);

    sessionTracks.forEach((track, trackIndex) => {
      //console.log(instrument)
      //sequencer
      if (track.type === 0) {
        //console.log(`loading drums: ${track.instrument}`);
        loadDrumPatch(
          track.instrument,
          setInstrumentsLoaded,
          trackIndex,
          "",
          setTracks,
          () => {},
          setInstrumentsInfo,
          setNotifications
        ).then((r) =>
          setInstruments((prev) => {
            let a = [...prev];
            a[trackIndex] = r;
            return a;
          })
        );
      }

      //player
      else if (track.type === 2) {
        loadAudioTrack(
          track.instrument,
          setInstrumentsLoaded,
          trackIndex,
          setNotifications,
          setInstrumentsInfo
        ).then((r) =>
          setInstruments((prev) => {
            let a = [...prev];
            a[trackIndex] = r;
            return a;
          })
        );
      }
      //load from patch id
      else if (typeof track.instrument === "string") {
        patchLoader(
          track.instrument,
          setInstrumentsLoaded,
          trackIndex,
          setNotifications,
          setInstrumentsInfo
        ).then((r) =>
          setInstruments((prev) => {
            let a = [...prev];
            a[trackIndex] = r;
            return a;
          })
        );
      } //load from obj
      else if (typeof track.instrument === "object") {
        //console.log(track.instrument);

        if (track.instrument.hasOwnProperty("urls")) {
          loadSamplerFromObject(
            track.instrument,
            setInstrumentsLoaded,
            trackIndex,
            () => {},
            setNotifications
          ).then((r) =>
            setInstruments((prev) => {
              let a = [...prev];
              a[trackIndex] = r;
              return a;
            })
          );
        } else {
          let instrument = loadSynthFromGetObject(track.instrument);

          setInstruments((prev) => {
            let a = [...prev];
            a[trackIndex] = instrument;
            return a;
          });
          setInstrumentsLoaded((prev) => {
            let a = [...prev];
            a[trackIndex] = true;
            return a;
          });
        }
      }
    });

    //loadMetromome

    if (!props.compact) {
      let metro = new Tone.FMSynth({
        envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.2 },
        oscillator: { type: "sine" },
        modulationIndex: 10,
        harmonicity: 10,
        modulationEnvelope: {
          attack: 0.001,
          decay: 0.3,
          sustain: 0,
          release: 0.01,
        },
      }).toDestination();

      metro.volume.value = -9999;

      setMetronome((prev) => {
        prev && prev.dispose();
        return metro;
      });

      metronomeEvent && metronomeEvent.forEach((e) => Tone.Transport.clear(e));

      let events = [];

      for (let mse = -1; mse < 128; mse++) {
        for (let qtr = 0; qtr < 4; qtr++) {
          events.push(
            Tone.Transport.schedule((time) => {
              metro.triggerAttackRelease(qtr === 0 ? "C5" : "C4", "4n", time);
            }, `${mse}:${qtr}:0`)
          );
        }
      }

      setMetronomeEvent(events);
    }
  };

  const loadNewTrackInstrument = (track, index, buffers) => {
    let instrument;

    //console.log("inserting new instrument on" + index);
    if (track.type === 0) {
      if (buffers) {
        instrument = new Tone.Players(
          {},
          setInstrumentsLoaded((prev) =>
            prev.map((e, i) => (i === index ? true : e))
          )
        ).toDestination();
        instrument._buffers = buffers;
      } else {
        loadDrumPatch(
          track.instrument,
          setInstrumentsLoaded,
          index,
          "",
          setTracks,
          () => {},
          setInstrumentsInfo,
          setNotifications
        ).then((r) =>
          setInstruments((prev) => {
            let a = [...prev];
            a[index] = r;
            return a;
          })
        );
      }
    }
    //player
    else if (track.type === 2) {
      loadAudioTrack(
        track.instrument,
        setInstrumentsLoaded,
        index,
        setNotifications,
        setInstrumentsInfo
      ).then((r) =>
        setInstruments((prev) => {
          let a = [...prev];
          a[index] = r;
          return a;
        })
      );
    }
    //load from patch id
    else if (typeof track.instrument === "string") {
      patchLoader(
        track.instrument,
        setInstrumentsLoaded,
        index,
        setNotifications,
        setInstrumentsInfo
      ).then((r) =>
        setInstruments((prev) => {
          let a = [...prev];
          a[index] = r;
          return a;
        })
      );
    } //load from obj
    else if (typeof track.instrument === "object" && !instruments[index]) {
      if (track.instrument.hasOwnProperty("urls")) {
        loadSamplerFromObject(
          track.instrument,
          setInstrumentsLoaded,
          index,
          () => {},
          setNotifications
        ).then((r) =>
          setInstruments((prev) => {
            let a = [...prev];
            a[index] = r;
            return a;
          })
        );
      } else {
        instrument = loadSynthFromGetObject(track.instrument);
        setInstrumentsLoaded((prev) => {
          let a = [...prev];
          a[index] = true;
          return a;
        });
      }
    }

    setInstruments((prev) => {
      let a = [...prev];
      a[index] = instrument;
      return a;
    });
  };

  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*===================================SAVING===============================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/

  const triggerSave = (tracks, sessionData) => {
    //first, upload files and filter unwanted
    if (pendingUploadFiles.length > 0) {
      setUploadingFiles(
        pendingUploadFiles.filter(
          (file) =>
            tracks[file.track].score.findIndex((e) => e.clip === file.index) !==
            -1
        )
      );
    } else {
      saveToDatabase(tracks, sessionData);
    }
  };

  const saveToDatabase = (mod, data, a) => {
    //console.log("isLoaded", isLoaded);
    if (DBSessionRef !== null) {
      savingMode === "simple" && setSnackbarMessage(t("misc.changesSaved"));

      let newSessionData = data ? deepCopy(data) : {};

      let newTracks = mod ? deepCopy(mod) : {};

      //temp fix: delete properties to avoid overwrites
      if (data) {
        delete newSessionData.createdOn;
        delete newSessionData.creator;
        delete newSessionData.opened;
        delete newSessionData.played;
        delete newSessionData.copied;
        delete newSessionData.likes;
      }

      if (mod) {
        newSessionData.tracks = newTracks;
      }

      //console.log("write");

      DBSessionRef.update({
        ...newSessionData,
      });
    }
  };

  const updateSavingMode = (input) => {
    //console.log("inin", input);
    if (input === "simple") {
      listener();
      setListener(() => () => {});
      clearInterval(autosaver);
      //console.log("autosaver initialized");

      let intervalId = setInterval(() => {
        setAreUnsavedChanges((prev) => (prev ? false : prev));
      }, autoSaverTime);

      setAutosaver(intervalId);
    } else {
      //console.log(DBSessionRef);
      if (!props.hidden && DBSessionRef !== null) {
        //console.log("RTE Activated");
        listener();
        setAreUnsavedChanges(false);
        saveToDatabase(tracks, sessionData);
        let DBlistener = DBSessionRef.onSnapshot(
          (snapshot) => {
            !snapshot.metadata.hasPendingWrites &&
              updateFromDatabase(snapshot.data());
          },
          (er) => {
            console.log("onSnapshot Error:", er);
          }
        );

        setListener(() => () => DBlistener());
      }
    }
  };

  const updateFromDatabase = (sessionSnapshot) => {
    setIsLastChangeFromServer(true);
    //console.log("read");
    setTracks((prev) => {
      let index = sessionSnapshot.tracks.length - 1;
      if (prev.length < sessionSnapshot.tracks.length)
        loadNewTrackInstrument(sessionSnapshot.tracks[index], index);
      //console.log("inside setter");
      return sessionSnapshot.tracks;
    });

    let data = { ...sessionSnapshot };
    delete data.tracks;

    setSessionData((prev) => {
      let check = !compareObjectProperties(data, prev);
      //console.log(check ? "It's different data" : "It's the same data");
      return check ? data : prev;
    });
  };

  const resetWorkspace = () => {
    setSavingMode("simple");
    setAutosaver(null);
    setAreUnsavedChanges(false);

    setDBSessionRef(null);

    setTracks(null);
    setSessionData(null);
    setSessionSize(0);

    setInstruments([]);
    setInstrumentsLoaded([]);
    setIsLoaded(false);
    setEditMode(false);

    setIsPlaying(false);

    setTrackPicker(false);
    setMixerOpen(false);

    //true: timeline ; false: loopmode
  };

  const handleSessionCopy = () => {
    props.setNewSessionDialog({ ...sessionData, tracks: [...tracks] });
  };

  const duplicateTrack = (index) => {
    let newTrackId = parseInt(Math.max(...tracks.map((e) => e.id))) + 1;
    let trackToCopy = tracks[tracks.length - 1];
    setInstrumentsLoaded((prev) => [...prev, false]);
    let instrumentBuffers = trackToCopy.type === 0 && trackToCopy._buffers;
    loadNewTrackInstrument(
      tracks[tracks.length - 1],
      tracks.length,
      instrumentBuffers
    );
    setTracks((prev) => [
      ...prev,
      {
        ...prev[index],
        id: newTrackId,
      },
    ]);
    handleUndo("RESET");
  };

  const handleSnackbarClose = () => {
    setSnackbarMessage(null);
  };

  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*===================================REPRODUCTION=========================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/

  const togglePlaying = (e) => {
    //console.log(Tone.Transport.state);
    Tone.start();
    e.preventDefault();
    //console.log(Tone.Transport.state, isLoaded, instrumentsLoaded);
    if (
      Tone.Transport.state !== "started" &&
      isLoaded
      //&&
      //!instrumentsLoaded.includes(false)
    ) {
      Tone.Transport.start();
      setIsPlaying(true);
    } else {
      Tone.Transport.pause();
      isLoaded &&
        instruments.forEach((e) =>
          e.name === "Players" ? e.stopAll() : e.releaseAll()
        );
      setIsRecording(false);
      setIsPlaying(false);
    }
  };

  const toggleRecording = (e) => {
    if (!isRecording) {
      Tone.Transport.pause();
      let newTime = `${
        Tone.Time(Tone.Transport.seconds)
          .toBarsBeatsSixteenths()
          .split(":")[0] - 1
      }:0:0`;

      newTime = Tone.Time(newTime).toSeconds() < 0 ? "0:0:0" : newTime;

      Tone.Transport.position = newTime;

      Tone.Transport.start();
      setIsPlaying(true);
      setIsRecording(true);
    } else {
      Tone.Transport.pause();
      setIsPlaying(false);
      setIsRecording(false);
    }
  };

  const playNote = (e) => {
    let sampleIndex = keyMapping[e.code];

    if (sampleIndex === undefined || selectedTrack === null) return;

    let note =
      sampleIndex + (tracks[selectedTrack].type === 1 ? playingOctave * 12 : 0);

    if (pressedKeys.includes(note)) return;

    setPressedKeys((prev) => [...prev, note]);

    playNoteFunction[0](note);
  };

  const releaseNote = (e) => {
    let sampleIndex = keyMapping[e.code];

    if (sampleIndex === undefined || selectedTrack === null) return;

    let note =
      sampleIndex + (tracks[selectedTrack].type === 1 ? playingOctave * 12 : 0);

    if (!pressedKeys.includes(note)) return;

    setPressedKeys((prev) => prev.filter((e) => e !== note));

    playNoteFunction[1](note);
  };

  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*===================================EDIT=ACTIONS=========================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/

  const selectionAction = (action) => {
    if (!selection || selection.length < 0) return;
    if (action === "delete") {
      setTracks((prev) =>
        prev.map((track, trackIndex) => ({
          ...track,
          score:
            selectedNotes[trackIndex] && selectedNotes[trackIndex].length > 0
              ? track.score.filter(
                  (note, noteIndex) =>
                    !selectedNotes[trackIndex].includes(noteIndex)
                )
              : track.score,
        }))
      );
      setSelectedNotes([]);
    }
  };

  const handleCopy = () => {
    setClipboard({ cont: [...selectedNotes], sel: [...selection] });
  };

  const handlePaste = () => {
    //console.log(clipboard);
    if (clipboard)
      setTracks((prev) =>
        prev.map((track, trackIndex) => ({
          ...track,
          score:
            selectedTrack === trackIndex || selectedTrack === null
              ? [
                  ...track.score,
                  ...clipboard.cont[trackIndex]
                    .map((index) => ({ ...track.score[index] }))
                    .map((note, i) => ({
                      //fn: console.log(note, i),
                      ...note,
                      time: Tone.Time(
                        Tone.Time(note.time).toSeconds() +
                          Tone.Transport.seconds -
                          (clipboard.sel[0] / gridSize) *
                            Tone.Time("1m").toSeconds()
                      ).toBarsBeatsSixteenths(),
                    })),
                ]
              : track.score,
        }))
      );
    setSelection((prev) =>
      prev.map(
        (e) =>
          e + (Tone.Transport.seconds / Tone.Time("1m").toSeconds()) * gridSize
      )
    );
  };

  const handleUndo = (action) => {
    let currentTracks = deepCopy(tracks);

    //console.log(action);

    setSessionHistory((prev) => {
      let { past, present, future } = { ...prev };

      let cleanHistory = {
        past: [],
        present: currentTracks,
        future: [],
      };

      switch (action) {
        case "UNDO":
          if (past.length === 0 || past[past.length - 1] === null) return prev;
          let previous = past[past.length - 1];
          let newPast = past.slice(0, past.length - 1);
          setTracks(deepCopy(previous));
          return {
            past: newPast,
            present: previous,
            future: [present, ...future],
          };

        case "REDO":
          if (future.length === 0) return prev;
          let next = future[0];
          let newFuture = future.slice(1);
          setTracks(deepCopy(next));
          return {
            past: [...past, present],
            present: next,
            future: newFuture,
          };
        case "RESET":
          return cleanHistory;
        default:
          let areDifferent =
            JSON.stringify(present) !== JSON.stringify(currentTracks);

          //TEMP Solution: (currentTracks.length < past[past.length - 1].length) ===> Reset undo to prevent bringing back deleted tracks

          return areDifferent
            ? {
                past: [...past, present],
                present: deepCopy(currentTracks),
                future: [],
              }
            : prev;
      }
    });
    //newObject && setSessionHistory(newObject);
  };

  const updateSelectedNotes = () => {
    setSelectedNotes(
      tracks.map((mod, modIndex) => {
        if (selectedTrack !== null && selectedTrack !== modIndex) return [];
        let notes = [];
        for (let x = 0; x < mod.score.length; x++) {
          let note = mod.score[x];
          if (
            Tone.Time(note.time).toSeconds() +
              (note.duration ? Tone.Time(note.duration).toSeconds() : 0) >=
              (selection[0] / gridSize) * Tone.Time("1m").toSeconds() +
                (note.duration ? 0.0001 : 0) &&
            Tone.Time(note.time).toSeconds() <
              (selection[1] / gridSize) * Tone.Time("1m").toSeconds()
          )
            notes.push(x);
        }
        return notes;
      })
    );
  };

  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*=====================================KEYEVENTS==========================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/

  const handleKeyDown = (e) => {
    Tone.start();
    //console.log(e);
    if (e.ctrlKey || e.metaKey) {
      switch (e.keyCode) {
        case 67:
          handleCopy();
          break;
        case 86:
          handlePaste();
          break;
        case 90:
          !e.shiftKey ? handleUndo("UNDO") : handleUndo("REDO");
          break;

        default:
          break;
      }
    }

    playNote(e);

    switch (e.keyCode) {
      case 32:
        togglePlaying(e);
        break;
      case 8:
        !optionsOpen && selectionAction("delete");
        break;
      case 65:
        break;
      case 37:
      case 38:
      case 39:
      case 40:
        handleArrowKey(e);
        break;
      case 90:
        /* setCursorMode((prev) => (prev ? null : "edit")); */
        break;
      default:
        break;
    }
  };

  const handleKeyUp = (e) => {
    Tone.start();
    releaseNote(e);
  };

  const handleArrowKey = (event) => {
    event.preventDefault();
    if (event.keyCode === 38) {
      setSessionSize((prev) => (prev === 128 ? prev : prev + 1));
    }
    if (event.keyCode === 40) {
      setSessionSize((prev) => (prev === 1 ? prev : prev - 1));
    }
    if (event.keyCode === 37) {
      setGridSize((prev) => (prev === 1 ? prev : prev / 2));
    }
    if (event.keyCode === 39) {
      setGridSize((prev) => (prev === 32 ? prev : prev * 2));
    }
  };

  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*=====================================USEEFFECTS=========================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/

  useEffect(() => {
    //TODO: Completely clear Tone instance, disposing context
    return () => {
      instruments.forEach((e) => e.dispose());
      //clearEvents("all");
      console.log("transport cleared");
    };
  }, []);

  useEffect(() => {
    //resetWorkspace();
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    instruments.forEach((e) => e.dispose());
    //clearEvents("all");
    console.log("transport cleared");

    let session = {
      description: "",
      tags: [],
      bpm: Tone.Transport.bpm.value,
      tracks: tracks,
    };

    if (props.user && props.user.uid !== firebase.auth().currentUser.uid) {
      props.createNewSession(session);
      return;
    }

    loadSession();
    //!props.session.length && Tone.Transport.start()
  }, [props.session, sessionKey]);

  useEffect(() => {
    //registerSession();
    //console.log(isLastChangeFromServer ? "server change" : "local change");
    console.log(tracks);
    //console.log(tracks, instruments, instrumentsLoaded);
    if (isLoaded) {
      savingMode === "simple" && setAreUnsavedChanges(true);

      if (savingMode === "rte") {
        if (isLastChangeFromServer) {
        } else {
          saveToDatabase(tracks, null);
        }
      }
    }

    tracks && handleUndo();

    setIsLastChangeFromServer(false);
  }, [tracks]);

  useEffect(() => {
    //console.log("savingMode", savingMode, isLoaded, !!props.user, editMode);
    if (isLoaded && !!props.user && editMode) updateSavingMode(savingMode);
  }, [isLoaded, editMode, savingMode, DBSessionRef, props.user]);

  useEffect(() => {
    sessionData && setSavingMode(sessionData.rte ? "rte" : "simple");
    if (isLoaded) {
      savingMode === "simple" && setAreUnsavedChanges(true);
      savingMode === "rte" && saveToDatabase(null, sessionData);
    }
    sessionData &&
      setSessionSize((prev) =>
        sessionData.size === prev ? prev : sessionData.size
      );
  }, [sessionData]);

  useEffect(() => {
    if (
      props.user &&
      sessionData &&
      sessionData.editors &&
      sessionData.editors.includes(props.user.uid)
    )
      setEditMode(true);
  }, [sessionData, props.user]);

  useEffect(() => {
    //console.log(cursorMode);
  }, [cursorMode]);

  useEffect(() => {
    Tone.Transport.pause();
    if (
      tracks &&
      sessionData &&
      instrumentsLoaded &&
      instruments.every((val) => typeof val === "object") &&
      !instruments.includes(undefined) &&
      instrumentsLoaded.every((val) => val === true) &&
      !instrumentsLoaded.includes(undefined) &&
      !isLoaded
    ) {
      //console.log(instrumentsLoaded, sessionData, instruments);
      onSessionReady();
    }

    //temp
  }, [instrumentsLoaded, sessionData, instruments]);

  useEffect(() => {
    //console.log(notifications);
  }, [notifications]);

  useEffect(() => {
    //console.log("listener", listener);
  }, [listener]);

  useEffect(() => {
    //console.log("WP UseEffect triggerd");
    instruments.forEach((e, i) => {
      if (tracks && tracks[i] && e) {
        e.volume.value = tracks[i].volume;
        e._volume.mute = tracks[i].muted;
      }
      //console.log(tracks[i].name, 1, e.volume.value);

      //console.log(tracks[i].name, 2, e.volume.value);
    });
  }, [instruments]);

  useEffect(() => {
    //console.log(instrumentsInfo);
  }, [instrumentsInfo]);

  useEffect(() => {
    setSessionData((prev) => {
      let newSesData = { ...prev };
      newSesData.size = sessionSize;
      return newSesData;
    });
    if (sessionSize < zoomPosition[1] + 1 && sessionSize > 0) {
      setZoomPosition((prev) => [prev[0], sessionSize - 1]);
    }

    //console.log("sessionSize", sessionSize);
  }, [sessionSize]);

  useEffect(() => {
    premiumMode && console.log("=====PREMIUM MODE ON=====");
  }, [premiumMode]);

  useEffect(() => {
    //console.log("areUnsavedChanges", areUnsavedChanges);

    if (
      !props.hidden &&
      isLoaded &&
      savingMode === "simple" &&
      !areUnsavedChanges
    )
      triggerSave(tracks, sessionData);

    props.setUnsavedChanges && props.setUnsavedChanges(areUnsavedChanges);
  }, [areUnsavedChanges]);

  useEffect(() => {
    //console.log(editorProfiles);
  }, [editorProfiles]);

  useEffect(() => {
    if (metronome) metronome.volume.value = metronomeState ? 0 : -999;
  }, [metronomeState]);

  useEffect(() => {
    tracks && movingSelDelta === null && updateSelectedNotes();
  }, [selection]);

  useEffect(() => {
    //console.log(sessionHistory);
  }, [sessionHistory]);

  useEffect(() => {
    let begin = zoomPosition[0] * Tone.Time("1m").toSeconds();
    Tone.Transport.setLoopPoints(
      begin,
      (zoomPosition[1] + 1) * Tone.Time("1m").toSeconds()
    );

    if (Tone.Transport.seconds < begin) {
      Tone.Transport.seconds = begin;
    }
  }, [zoomPosition]);

  useEffect(() => {
    //console.log(selectedNotes);
  }, [selectedNotes]);

  /*================================================================ */
  /*================================================================ */
  /*===============================JSX============================== */
  /*================================================================ */
  /*================================================================ */

  return tracks !== undefined ? (
    <Box
      className="workspace"
      tabIndex={0}
      style={{
        display: props.hidden ? "none" : "flex",
        cursor:
          cursorMode !== null
            ? "url('edit_black_24dp.svg'),pointer"
            : "default",
      }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseDown={() => setIsMouseDown(true)}
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)}
      onMouseMove={(e) => setMousePosition([e.pageX, e.pageY])}
    >
      <LoadingScreen open={tracks === null} />
      <Box
        className="ws-header"
        sx={(theme) => ({
          [theme.breakpoints.down("md")]: {
            height: "40px",
          },
        })}
      >
        {sessionKey && (
          <WorkspaceTitle
            sessionData={sessionData}
            setSessionData={setSessionData}
            sessionKey={sessionKey}
            editMode={editMode}
            user={props.user}
            sessionSize={sessionSize}
            setPremiumMode={setPremiumMode}
            handlePageNav={props.handlePageNav}
            editorProfiles={editorProfiles}
            setEditorProfiles={setEditorProfiles}
          />
        )}
        <div className="ws-commands" tabIndex="-1">
          <IconButton
            size="large"
            tabIndex="-1"
            onClick={() => {
              Tone.Transport.seconds = 0;
            }}
          >
            <Icon style={{ color: "white", fontSize: 36 }}>skip_previous</Icon>
          </IconButton>
          <IconButton size="large" tabIndex="-1" onClick={togglePlaying}>
            <Icon style={{ color: "white", fontSize: 36 }}>
              {isPlaying ? "pause" : "play_arrow"}
            </Icon>
          </IconButton>
          {editMode && (
            <IconButton
              size="large"
              tabIndex="-1"
              color="secondary"
              onClick={toggleRecording}
            >
              <Icon style={{ fontSize: 36 }}>fiber_manual_record</Icon>
            </IconButton>
          )}
        </div>
      </Box>

      {!IEOpen && !mixerOpen && (
        <>
          <WorkspaceTransport
            tracks={tracks}
            sessionSize={sessionSize}
            setSessionSize={setSessionSize}
            gridSize={gridSize}
            setGridSize={setGridSize}
            selectedTrack={selectedTrack}
            setSelectedTrack={setSelectedTrack}
            sessionData={sessionData}
            setSessionData={setSessionData}
            mousePosition={mousePosition}
            isMouseDown={isMouseDown}
            setIsMouseDown={setIsMouseDown}
          />

          <WorkspaceRuler
            tracks={tracks}
            sessionSize={sessionSize}
            zoomPosition={zoomPosition}
            setZoomPosition={setZoomPosition}
            mousePosition={mousePosition}
            isMouseDown={isMouseDown}
            setIsMouseDown={setIsMouseDown}
          />
        </>
      )}

      <div className="ws-grid-cont" tabIndex="-1">
        {IEOpen && (
          <InstrumentEditor
            track={tracks[selectedTrack]}
            instrument={instruments[selectedTrack]}
            instrumentInfo={instrumentsInfo[selectedTrack]}
            setInstrumentsInfo={setInstrumentsInfo}
            setTracks={setTracks}
            setInstruments={setInstruments}
            resetUndoHistory={() => handleUndo("RESET")}
            index={selectedTrack}
            setIEOpen={setIEOpen}
            handlePageNav={props.handlePageNav}
          />
        )}
        {mixerOpen && (
          <Mixer
            tracks={tracks}
            instruments={instruments}
            setTracks={setTracks}
            setMixerOpen={setMixerOpen}
          />
        )}
        <WorkspaceGrid
          tracks={tracks}
          sessionSize={sessionSize}
          setSessionSize={setSessionSize}
          gridSize={gridSize}
          isRecording={isRecording}
          selection={selection}
          setSelection={setSelection}
          selectedNotes={selectedNotes}
          cursorMode={cursorMode}
          zoomPosition={zoomPosition}
          selectedTrack={selectedTrack}
          hiddenNumbers={IEOpen || mixerOpen}
          isMouseDown={isMouseDown}
          movingSelDelta={movingSelDelta}
          setMovingSelDelta={setMovingSelDelta}
          setTracks={setTracks}
        >
          {selectedTrack !== null ? (
            <Track
              tabIndex={-1}
              key={tracks[selectedTrack].id}
              index={selectedTrack}
              selectedTrack={selectedTrack}
              track={tracks[selectedTrack]}
              instrument={instruments[selectedTrack]}
              instruments={instruments}
              setInstruments={setInstruments}
              loaded={instrumentsLoaded[selectedTrack]}
              instrumentInfo={instrumentsInfo[selectedTrack]}
              setInstrumentsInfo={setInstrumentsInfo}
              setInstrumentsLoaded={setInstrumentsLoaded}
              sessionData={sessionData}
              sessionSize={sessionSize}
              setTracks={setTracks}
              editMode={editMode}
              resetUndoHistory={() => handleUndo("RESET")}
              selection={selection}
              setSelection={setSelection}
              selectedNotes={selectedNotes[selectedTrack]}
              setSelectedNotes={setSelectedNotes}
              duplicateTrack={duplicateTrack}
              setSnackbarMessage={setSnackbarMessage}
              isLoaded={isLoaded}
              handlePageNav={props.handlePageNav}
              setAreUnsavedChanges={setAreUnsavedChanges}
              cursorMode={cursorMode}
              gridSize={gridSize}
              isPlaying={isPlaying}
              isRecording={isRecording}
              playingOctave={playingOctave}
              setPlayNoteFunction={setPlayNoteFunction}
              zoomPosition={zoomPosition}
              setTrackRows={setTrackRows}
              setIsMouseDown={setIsMouseDown}
              setPendingUploadFiles={setPendingUploadFiles}
              movingSelDelta={movingSelDelta}
            />
          ) : (
            <>
              {tracks &&
                tracks.map((track, trackIndex) => (
                  <ClosedTrack
                    tabIndex={-1}
                    key={track.id}
                    index={trackIndex}
                    selectedTrack={selectedTrack}
                    setSelectedTrack={setSelectedTrack}
                    track={track}
                    instrument={instruments[trackIndex]}
                    setInstruments={setInstruments}
                    loaded={instrumentsLoaded[trackIndex]}
                    setInstrumentsLoaded={setInstrumentsLoaded}
                    sessionData={sessionData}
                    sessionSize={sessionSize}
                    setTracks={setTracks}
                    editMode={editMode}
                    resetUndoHistory={() => handleUndo("RESET")}
                    selection={selection}
                    setSelection={setSelection}
                    selectedNotes={selectedNotes[trackIndex]}
                    duplicateTrack={duplicateTrack}
                    setSnackbarMessage={setSnackbarMessage}
                    isLoaded={isLoaded}
                    handlePageNav={props.handlePageNav}
                    setAreUnsavedChanges={setAreUnsavedChanges}
                    cursorMode={cursorMode}
                    gridSize={gridSize}
                    isRecording={isRecording}
                    zoomPosition={zoomPosition}
                    movingSelDelta={movingSelDelta}
                  />
                ))}
              <IconButton
                style={{ width: 48, left: "50%" }}
                tabIndex="-1"
                onClick={() => setTrackPicker(true)}
              >
                <Icon>add</Icon>
              </IconButton>
            </>
          )}
        </WorkspaceGrid>
      </div>
      {/* ================================================ */}
      {/* ================================================ */}
      {/* ================================================ */}

      <Box
        className="ws-options-btns"
        sx={(theme) => ({
          [theme.breakpoints.down("md")]: {
            position: !expanded.opt && "fixed",
            bottom: !expanded.opt && "-64px",
          },
        })}
      >
        <IconButton
          onClick={() => setCursorMode((prev) => (!prev ? "edit" : null))}
        >
          <Icon style={{ transform: !cursorMode && "rotate(-45deg)" }}>
            {cursorMode ? "edit" : "navigation"}
          </Icon>
        </IconButton>
        <IconButton onClick={() => setMixerOpen((prev) => !prev)}>
          <Icon style={{ transform: "rotate(90deg)" }}>tune</Icon>
        </IconButton>
        <IconButton onClick={() => setOptionsOpen((prev) => !prev)}>
          <Icon>settings</Icon>
        </IconButton>
        <IconButton
          disabled={!areUnsavedChanges}
          onClick={() => setAreUnsavedChanges(false)}
        >
          <Icon>save</Icon>
        </IconButton>
        <Exporter
          sessionSize={sessionSize}
          sessionData={sessionData}
          tracks={tracks}
          tracksInstruments={instruments}
        />

        {typeof selectedTrack === "number" && (
          <>
            <Divider orientation="vertical" flexItem />
            {tracks[selectedTrack].type !== 2 ? (
              <IconButton onClick={() => setIEOpen((prev) => !prev)}>
                <Icon>piano</Icon>
              </IconButton>
            ) : (
              <>
                <IconButton onClick={() => setFileListOpen((prev) => !prev)}>
                  <Icon>add</Icon>
                </IconButton>
                <IconButton onClick={() => setFileListOpen((prev) => !prev)}>
                  <Icon>queue_music</Icon>
                </IconButton>
              </>
            )}
          </>
        )}
        <IconButton
          onClick={() => setExpanded((prev) => ({ ...prev, opt: false }))}
          sx={(theme) => ({
            display: "none",
            marginLeft: "auto",
            [theme.breakpoints.down("md")]: {
              display: "block",
            },
          })}
        >
          <Icon>close</Icon>
        </IconButton>
      </Box>

      {/*==========================================================*/}
      {/*==========================================================*/}
      {/*==========================================================*/}

      <AnimatedBox
        onClick={(prev) =>
          !expanded.btn && setExpanded((prev) => ({ ...prev, btn: true }))
        }
        style={{ ...expSprings[0] }}
        sx={(theme) => ({
          display: "none",
          position: "fixed",
          zIndex: 6,
          [theme.breakpoints.down("md")]: {
            display: "flex",
          },
        })}
      >
        <Backdrop
          open={expanded.btn}
          onClick={() => setExpanded((prev) => ({ ...prev, btn: false }))}
        />
        <Fab
          color={expanded.opt || !expanded.btn ? "primary" : "default"}
          onClick={() =>
            expanded.btn &&
            setExpanded((prev) => ({ ...prev, opt: !prev.opt, btn: false }))
          }
          size={"small"}
        >
          <Icon>{expanded.btn ? "tune" : ""}</Icon>
        </Fab>
        {selectedTrack !== null && (
          <Fab
            color={expanded.instr ? "primary" : "default"}
            onClick={() =>
              expanded.btn &&
              setExpanded((prev) => ({
                ...prev,
                instr: !prev.instr,
                btn: false,
              }))
            }
            size={"small"}
            sx={{ ml: 1 }}
          >
            <Icon>piano</Icon>
          </Fab>
        )}
      </AnimatedBox>

      {/* <Fab
        sx={(theme) => ({
          position: "fixed",
          bottom: -20,
          right: -20,
        })}
        color="primary"
        onClick={() => setExpanded("options")}
        size={"small"}
      >
        <Icon>tune</Icon>
      </Fab> */}

      {/* ================================================ */}
      {/* ================================================ */}
      {/* ================================================ */}

      {selectedTrack !== null && tracks[selectedTrack].type !== 2 && (
        <Box
          className="ws-note-input"
          sx={(theme) => ({
            [theme.breakpoints.down("md")]: {
              position: !expanded.instr && "fixed",
              bottom: !expanded.instr && "-128px",

              margin: "4px 0 0 0",
            },
          })}
        >
          <NotesInput
            keyMapping={keyMapping}
            track={tracks && tracks[selectedTrack]}
            instrument={instruments[selectedTrack]}
            pressedKeys={pressedKeys}
            setPressedKeys={setPressedKeys}
            handlePageNav={props.handlePageNav}
            playNoteFunction={playNoteFunction}
            playingOctave={playingOctave}
            setPlayingOctave={setPlayingOctave}
            trackRows={trackRows}
            instrumentInfo={instrumentsInfo[selectedTrack]}
            isMouseDown={isMouseDown}
          />
        </Box>
      )}
      {trackPicker && (
        <TrackPicker
          tabIndex={-1}
          open={trackPicker}
          onClose={() => setTrackPicker(false)}
          setTrackPicker={setTrackPicker}
          setTracks={setTracks}
          loadNewTrackInstrument={loadNewTrackInstrument}
          tracks={tracks}
          sessionSize={sessionSize}
          sessionData={sessionData}
        />
      )}

      {/*setTracksVolume={setTracksVolume}*/}

      <FileList
        onClose={() => setFileListOpen(false)}
        open={fileListOpen}
        instrumentsInfo={instrumentsInfo}
        instruments={instruments}
        selectedTrack={selectedTrack}
        tracks={tracks}
      />

      {sessionData && (
        <SessionSettings
          open={optionsOpen}
          onClose={() => setOptionsOpen(false)}
          premiumMode={premiumMode}
          sessionData={sessionData}
          setSessionData={setSessionData}
          editorProfiles={editorProfiles}
          setEditorProfiles={setEditorProfiles}
        />
      )}

      {/* <ScreenButtons
        cursorMode={cursorMode}
        setCursorMode={setCursorMode}
        setIEOpen={setIEOpen}
        setFileListOpen={setFileListOpen}
        selectedTrack={selectedTrack}
        areUnsavedChanges={areUnsavedChanges}
        saveSession={() => setAreUnsavedChanges(false)}
      /> */}

      {props.user && uploadingFiles.length > 0 && (
        <FileUploader
          workspace
          open={uploadingFiles.length > 0}
          files={uploadingFiles}
          setUploadingFiles={setUploadingFiles}
          tracks={tracks}
          instruments={instruments}
          setInstrumentsInfo={setInstrumentsInfo}
          setTracks={setTracks}
          index={props.index}
          onFinished={() => {
            saveToDatabase(tracks, sessionData);
            setPendingUploadFiles([]);
          }}
        />
      )}

      {props.user === null && tracks !== null && (
        <AuthDialog persistent authDialog={true} setUser={props.setUser} />
      )}

      <Snackbar
        open={!!snackbarMessage}
        message={snackbarMessage}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleSnackbarClose}
          >
            <Icon fontSize="small">close</Icon>
          </IconButton>
        }
      />
      <ActionConfirm
        dupSession
        open={sessionDupDialog}
        onClose={() => setSessionDupDialog(false)}
        action={handleSessionCopy}
      />
    </Box>
  ) : (
    <NotFoundPage
      type="workspace"
      handlePageNav={(ev) => props.handlePageNav("explore", "", ev)}
    />
  );
}

export default Workspace;

const deepCopy = (a) => JSON.parse(JSON.stringify(a));

const compareObjectProperties = (a, b) =>
  userSubmitedSessionProps
    .map(
      (e) =>
        //e === "name" && console.log(JSON.stringify(a[e]), JSON.stringify(b[e]));
        JSON.stringify(a[e]) === JSON.stringify(b[e])
    )
    .every((e) => e === true);
