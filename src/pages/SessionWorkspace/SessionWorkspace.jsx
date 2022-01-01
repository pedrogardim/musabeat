import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";
import { useSpring, animated } from "react-spring";

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

import "./style.css";

import Track from "./Track";
import ClosedTrack from "./Track/ClosedTrack";
import Title from "./Title";
import Transport from "./Transport";
import TrackPicker from "./TrackPicker";
import Exporter from "./Exporter";
import SessionSettings from "./SessionSettings";
import Mixer from "./Mixer";
import Grid from "./Grid";
import Ruler from "./Ruler";
import PlayInterface from "./PlayInterface";

import InstrumentEditor from "../../components/InstrumentEditor";
import LoadingScreen from "../../components/LoadingScreen";
import FileUploader from "../../components/FileUploader";

import Confirm from "../../components/dialogs/Confirm";
import Auth from "../../components/dialogs/Auth";

import NotFoundPage from "../NotFoundPage";

import useUndo from "../../hooks/useUndo";
import useMetronome from "./hooks/useMetronome";
import useFirebaseConnection from "./hooks/useFirebaseConnection";

import { loadInstrument } from "../../services/Instruments";

import { keySamplerMapping, keyboardMapping } from "../../services/MiscData";

import { SessionWorkspaceContext } from "../../context/SessionWorkspaceContext";
import { loadSession } from "./services/Session";

function SessionWorkspace(props) {
  const { t } = useTranslation();

  const [DBSessionRef, setDBSessionRef] = useState(null);

  const [tracks, setTracks] = useState(null);
  const [sessionData, setSessionData] = useState({});
  const [instruments, setInstruments] = useState([]);

  const [params, setParams] = useState({
    isLoaded: false,
    playing: false,
    selectedTrack: null,
    pressedKeys: [],
    playingOctave: 3,
    trackRows: [],
    editMode: false,
    cursorMode: null,
    gridSize: 4,
    zoomPosition: [0, 3],
    selection: [],
    selNotes: [],
    movingSelDelta: null,
    instrLoaded: {},
    instrInfo: {},
    notifications: [],
    trackOptions: { showingAll: false },
    expanded: {
      btn: false,
      instr: false,
      opt: false,
    },
    openDialog: null,
    openSubPage: null,
    sessionSize: 0,
  });

  const [premiumMode, setPremiumMode] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  const [editorProfiles, setEditorProfiles] = useState(null);
  const [pendingUploadFiles, setPendingUploadFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const [playNoteFunction, setPlayNoteFunction] = useState([
    () => {},
    () => {},
  ]);

  const expSpring = useSpring({
    bottom: params.expanded.btn ? 16 : -10,
    right: params.expanded.btn ? 16 : params.selectedTrack !== null ? -58 : -10,
    config: { tension: 200, friction: 13 },
  });

  const AnimatedBox = animated(Box);

  const sessionKey = useParams().key;

  const keyMapping =
    params.selectedTrack !== null && tracks[params.selectedTrack].type === 0
      ? keySamplerMapping
      : keyboardMapping;

  const { user, handlePageNav, hidden } = props;

  const [Undo, Redo, updateUndoHistory, resetHistory] = useUndo(setTracks);

  const setMetronomeState = useMetronome();

  const paramSetter = (key, value, key2, value2) =>
    setParams((prev) => ({
      ...prev,
      [key]: typeof value === "function" ? value(prev[key]) : value,
      [key2]: typeof value2 === "function" ? value2(prev[key]) : value2,
    }));

  const ctxData = useMemo(() => ({
    tracks,
    setTracks,
    sessionData,
    setSessionData,
    instruments,
    setInstruments,
    sessionKey,
    user,
    premiumMode,
    setPremiumMode,
    handlePageNav,
    pendingUploadFiles,
    setPendingUploadFiles,
    uploadingFiles,
    setUploadingFiles,
    hidden,
    setPlayNoteFunction,
    setSnackbarMessage,
    params,
    paramSetter,
  }));

  const [save, setSavingMode, areUnsavedChanges] =
    useFirebaseConnection(ctxData);

  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*===================================LOAD=SESSION=========================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/

  const initSession = () => {
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.seconds = 0;
    instruments.forEach((e) => e.dispose());
    loadSession(
      setSessionData,
      setTracks,
      sessionKey,
      hidden,
      user,
      setDBSessionRef,
      props.session,
      setInstruments,
      paramSetter
    );
  };

  const onSessionReady = () => {
    instruments.forEach((e, i) => {
      e.volume.value = tracks[i].volume;
      e._volume.mute = tracks[i].muted;
    });

    hidden &&
      props.setPlayingLoadingProgress(
        Math.floor(
          (Object.values(params.instrLoaded).filter((e) => e !== false).length /
            Object.values(params.instrLoaded).length) *
            100
        )
      );

    hidden ? Tone.Transport.start() : Tone.Transport.pause();
    console.log("=====session ready!=====");
    paramSetter("isLoaded", true);
    setSavingMode(sessionData.rte ? "rte" : "simple");
  };

  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*===================================SAVING===============================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/

  const handleSessionCopy = () => {
    props.setNewSessionDialog({ ...sessionData, tracks: [...tracks] });
  };

  const duplicateTrack = (index) => {
    let newTrackId = parseInt(Math.max(...tracks.map((e) => e.id))) + 1;
    let trackToCopy = tracks[tracks.length - 1];
    paramSetter("instrLoaded", (prev) => ({ ...prev, [tracks.length]: false }));

    let instrumentBuffers = trackToCopy.type === 0 && trackToCopy._buffers;
    loadInstrument(trackToCopy, tracks.length, instrumentBuffers, paramSetter);

    setTracks((prev) => [
      ...prev,
      {
        ...prev[index],
        id: newTrackId,
      },
    ]);
    resetHistory();
  };

  const handleSnackbarClose = () => {
    setSnackbarMessage(null);
  };

  const onUploadFinish = (filesId) => {
    console.log("ALL UPLOADED");
    if (pendingUploadFiles.length > 0) {
      setTracks((prev) => {
        let newTracks = [...prev];
        uploadingFiles.forEach((file, index) => {
          newTracks[file.track].instrument.urls[file.index] = filesId[index];
        });
        return newTracks;
      });
    }
    save(tracks, sessionData);
    setPendingUploadFiles([]);
  };

  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*===================================PLAYING==============================================*/
  /*========================================================================================*/
  /*========================================================================================*/
  /*========================================================================================*/

  const togglePlaying = (e) => {
    //console.log(Tone.Transport.state);
    Tone.start();
    e.preventDefault();
    if (Tone.Transport.state !== "started" && params.isLoaded) {
      Tone.Transport.start();
      paramSetter("playState", true);
    } else {
      Tone.Transport.pause();
      params.isLoaded &&
        instruments.forEach((e) =>
          e.name === "Players" ? e.stopAll() : e.releaseAll()
        );
      paramSetter("playState", false);
    }
  };

  const toggleRecording = (e) => {
    if (params.playState !== "rec") {
      if (params.playState) {
        Tone.Transport.pause();
        let newTime = `${
          Tone.Time(Tone.Transport.seconds)
            .toBarsBeatsSixteenths()
            .split(":")[0] - 1
        }:0:0`;

        newTime = Tone.Time(newTime).toSeconds() < 0 ? "0:0:0" : newTime;

        Tone.Transport.position = newTime;

        Tone.Transport.start();
      }

      paramSetter("playState", "rec");
    } else {
      Tone.Transport.pause();
      paramSetter("playState", false);
    }
  };

  const playNote = (e) => {
    let sampleIndex = keyMapping[e.code];

    if (sampleIndex === undefined || params.selectedTrack === null) return;

    let note =
      sampleIndex +
      (tracks[params.selectedTrack].type === 1 ? params.playingOctave * 12 : 0);

    if (params.pressedKeys.includes(note)) return;

    paramSetter("pressedKeys", (prev) => [...prev, note]);

    playNoteFunction[0](note);
  };

  const releaseNote = (e) => {
    let sampleIndex = keyMapping[e.code];

    if (sampleIndex === undefined || params.selectedTrack === null) return;

    let note =
      sampleIndex +
      (tracks[params.selectedTrack].type === 1 ? params.playingOctave * 12 : 0);

    if (!params.pressedKeys.includes(note)) return;

    paramSetter("pressedKeys", (prev) => prev.filter((e) => e !== note));

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
    if (!params.selection || params.selection.length < 0) return;
    if (action === "delete") {
      setTracks((prev) =>
        prev.map((track, trackIndex) => ({
          ...track,
          score:
            params.selNotes[trackIndex] &&
            params.selNotes[trackIndex].length > 0
              ? track.score.filter(
                  (note, noteIndex) =>
                    !params.selNotes[trackIndex].includes(noteIndex)
                )
              : track.score,
        }))
      );
      paramSetter("setNotes", []);
    }
  };

  const handleCopy = () => {
    setClipboard({ cont: [...params.selNotes], sel: [...params.selection] });
  };

  const handlePaste = () => {
    //console.log(clipboard);
    if (clipboard)
      setTracks((prev) =>
        prev.map((track, trackIndex) => ({
          ...track,
          score:
            params.selectedTrack === trackIndex || params.selectedTrack === null
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
                          (clipboard.sel[0] / params.gridSize) *
                            Tone.Time("1m").toSeconds()
                      ).toBarsBeatsSixteenths(),
                    })),
                ]
              : track.score,
        }))
      );

    paramSetter("selection", (prev) =>
      prev.map(
        (e) =>
          e +
          (Tone.Transport.seconds / Tone.Time("1m").toSeconds()) *
            params.gridSize
      )
    );
  };

  const updateSelectedNotes = () => {
    paramSetter(
      "selNotes",
      tracks.map((mod, modIndex) => {
        if (params.selectedTrack !== null && params.selectedTrack !== modIndex)
          return [];
        let notes = [];
        for (let x = 0; x < mod.score.length; x++) {
          let note = mod.score[x];
          if (
            Tone.Time(note.time).toSeconds() +
              (note.duration ? Tone.Time(note.duration).toSeconds() : 0) >=
              (params.selection[0] / params.gridSize) *
                Tone.Time("1m").toSeconds() +
                (note.duration ? 0.0001 : 0) &&
            Tone.Time(note.time).toSeconds() <
              (params.selection[1] / params.gridSize) *
                Tone.Time("1m").toSeconds()
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
    if (e.ctrlKey || e.metaKey) {
      switch (e.keyCode) {
        case 67:
          handleCopy();
          break;
        case 86:
          handlePaste();
          break;
        case 90:
          !e.shiftKey ? Undo() : Redo();
          break;

        default:
          break;
      }
    }

    playNote(e);

    switch (e.keyCode) {
      case 18:
        paramSetter("cursorMode", "edit");
        break;
      case 32:
        togglePlaying(e);
        break;
      case 8:
        !params.openDialog === "options" && selectionAction("delete");
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
    switch (e.keyCode) {
      case 18:
        paramSetter("cursorMode", null);
        break;
    }

    Tone.start();
    releaseNote(e);
  };

  const handleArrowKey = (event) => {
    event.preventDefault();
    if (event.keyCode === 38) {
      paramSetter("sessionSize", (prev) => (prev === 128 ? prev : prev + 1));
    }
    if (event.keyCode === 40) {
      paramSetter("sessionSize", (prev) => (prev === 1 ? prev : prev - 1));
    }
    if (event.keyCode === 37) {
      paramSetter("gridSize", (prev) => (prev === 1 ? prev : prev / 2));
    }
    if (event.keyCode === 39) {
      paramSetter("gridSize", (prev) => (prev === 32 ? prev : prev * 2));
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

  useEffect(() => initSession(), [props.session, sessionKey]);

  useEffect(() => {
    console.log(tracks);
    tracks && updateUndoHistory(tracks);
  }, [tracks]);

  useEffect(() => {
    if (sessionData) {
      setSavingMode(sessionData.rte ? "rte" : "simple");
      paramSetter("sessionSize", sessionData.size);
    }

    if (params.isLoaded) save(tracks, sessionData);
  }, [sessionData]);

  useEffect(() => {
    if (sessionData.editors && sessionData.editors.includes(user.uid))
      paramSetter("editMode", true);
  }, [sessionData, user]);

  useEffect(() => {
    Tone.Transport.pause();
    if (
      params.instrLoaded &&
      instruments.every((val) => typeof val === "object") &&
      !instruments.includes(undefined) &&
      Object.values(params.instrLoaded).every((val) => val === true) &&
      !params.isLoaded
    ) {
      onSessionReady();
    }

    //temp
  }, [params.instrLoaded, sessionData, instruments]);

  useEffect(() => {
    //console.log(notifications);
  }, [params.notifications]);

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
  /* 
  useEffect(() => {
    console.log(instrumentsInfo);
  }, [instrumentsInfo]); */

  useEffect(() => {
    setSessionData((prev) => {
      let newSesData = { ...prev };
      newSesData.size = sessionData.size;
      return newSesData;
    });
    if (sessionData.size < params.zoomPosition[1] + 1 && sessionData.size > 0) {
      paramSetter("zoomPosition", (prev) => [prev[0], sessionData.size - 1]);
    }
  }, [sessionData.size]);

  useEffect(() => {
    premiumMode && console.log("=====PREMIUM MODE ON=====");
  }, [premiumMode]);

  useEffect(() => {
    /* if (!hidden && isLoaded && savingMode === "simple" && !areUnsavedChanges)
      triggerSave(tracks, sessionData);
 */
    props.setUnsavedChanges && props.setUnsavedChanges(areUnsavedChanges);
  }, [areUnsavedChanges]);

  useEffect(() => {
    tracks && params.movingSelDelta === null && updateSelectedNotes();
  }, [params.selection]);

  useEffect(() => {
    let begin = params.zoomPosition[0] * Tone.Time("1m").toSeconds();
    Tone.Transport.setLoopPoints(
      begin,
      (params.zoomPosition[1] + 1) * Tone.Time("1m").toSeconds()
    );

    if (Tone.Transport.seconds < begin) {
      Tone.Transport.seconds = begin;
    }
  }, [params.zoomPosition]);

  /*================================================================ */
  /*================================================================ */
  /*===============================JSX============================== */
  /*================================================================ */
  /*================================================================ */

  return tracks !== undefined ? (
    <SessionWorkspaceContext.Provider value={ctxData}>
      <Box
        className="workspace"
        tabIndex={0}
        style={{
          display: hidden ? "none" : "flex",
          cursor:
            params.cursorMode !== null
              ? "url('edit_black_24dp.svg'),pointer"
              : "default",
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
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
            <Title
              sessionData={sessionData}
              setSessionData={setSessionData}
              sessionKey={sessionKey}
              user={user}
              sessionSize={sessionData.size}
              setPremiumMode={setPremiumMode}
              handlePageNav={handlePageNav}
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
              <Icon style={{ color: "white", fontSize: 36 }}>
                skip_previous
              </Icon>
            </IconButton>
            <IconButton size="large" tabIndex="-1" onClick={togglePlaying}>
              <Icon style={{ color: "white", fontSize: 36 }}>
                {params.playing ? "pause" : "play_arrow"}
              </Icon>
            </IconButton>
            {params.editMode && (
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

        {params.openSubPage !== "IE" && params.openSubPage !== "mixer" && (
          <>
            <Transport
              tracks={tracks}
              sessionSize={sessionData.size}
              gridSize={params.gridSize}
              selectedTrack={params.selectedTrack}
              sessionData={sessionData}
              setSessionData={setSessionData}
            />

            <Ruler
              tracks={tracks}
              sessionSize={sessionData.size}
              zoomPosition={params.zoomPosition}
            />
          </>
        )}

        <div className="ws-grid-cont" tabIndex="-1">
          {params.openSubPage === "IE" && (
            <InstrumentEditor
              track={tracks[params.selectedTrack]}
              instrument={instruments[params.selectedTrack]}
              instrumentInfo={params.instrumentsInfo[params.selectedTrack]}
              setTracks={setTracks}
              setInstruments={setInstruments}
              resetUndoHistory={() => resetHistory()}
              index={params.selectedTrack}
              handlePageNav={handlePageNav}
            />
          )}
          {params.openSubPage === "mixer" && (
            <Mixer
              tracks={tracks}
              instruments={instruments}
              setTracks={setTracks}
              setMixerOpen={paramSetter("openSubPage", (prev) =>
                prev === "mixer" ? null : "mixer"
              )}
            />
          )}
          <Grid
            selection={params.selection}
            selectedNotes={params.selNotes}
            movingSelDelta={params.movingSelDelta}
          >
            {params.selectedTrack !== null ? (
              <Track
                selectedNotes={params.selNotes}
                movingSelDelta={params.movingSelDelta}
              />
            ) : (
              <>
                {tracks &&
                  tracks.map((track, trackIndex) => (
                    <ClosedTrack
                      key={track.id}
                      trackIndex={trackIndex}
                      track={track}
                      selection={params.selection}
                      selectedNotes={params.selNotes}
                      movingSelDelta={params.movingSelDelta}
                    />
                  ))}
                <IconButton
                  style={{ width: 48, left: "50%" }}
                  tabIndex="-1"
                  onClick={() => paramSetter("openDialog", "trackPicker")}
                >
                  <Icon>add</Icon>
                </IconButton>
              </>
            )}
          </Grid>
        </div>
        {/* ================================================ */}
        {/* ================================================ */}
        {/* ================================================ */}

        <Box
          className="ws-options-btns"
          sx={(theme) => ({
            [theme.breakpoints.down("md")]: {
              position: !params.expanded.opt && "fixed",
              bottom: !params.expanded.opt && "-64px",
            },
          })}
        >
          <IconButton
            onClick={() =>
              paramSetter("cursor", (prev) => (!prev ? "edit" : null))
            }
          >
            <Icon style={{ transform: !params.cursorMode && "rotate(-45deg)" }}>
              {params.cursorMode ? "edit" : "navigation"}
            </Icon>
          </IconButton>
          <IconButton
            onClick={() =>
              paramSetter("openSubPage", (prev) =>
                prev === "mixer" ? null : "mixer"
              )
            }
          >
            <Icon style={{ transform: "rotate(90deg)" }}>tune</Icon>
          </IconButton>
          <IconButton onClick={() => paramSetter("openDialog", "options")}>
            <Icon>settings</Icon>
          </IconButton>
          <IconButton
            disabled={!areUnsavedChanges}
            onClick={() => save(tracks, sessionData)}
          >
            <Icon>save</Icon>
          </IconButton>
          <Exporter
            sessionSize={sessionData.size}
            sessionData={sessionData}
            tracks={tracks}
            tracksInstruments={instruments}
          />

          {params.selectedTrack !== null && (
            <>
              <Divider orientation="vertical" flexItem />
              {tracks[params.selectedTrack].type !== 2 ? (
                <>
                  <IconButton
                    color={params.openSubPage === "IE" ? "primary" : "default"}
                    onClick={() =>
                      paramSetter("openSubPage", (prev) =>
                        prev === "IE" ? null : "IE"
                      )
                    }
                  >
                    <Icon>piano</Icon>
                  </IconButton>
                  {tracks[params.selectedTrack].type === 0 && (
                    <IconButton
                      onClick={() =>
                        paramSetter("trackOptions", (prev) => ({
                          ...prev.trackOptions,
                          showingAll: !prev.showingAll,
                        }))
                      }
                    >
                      <Icon>
                        {params.trackOptions.showingAll
                          ? "visibility_off"
                          : "visibility"}
                      </Icon>
                    </IconButton>
                  )}
                </>
              ) : (
                <>
                  <IconButton
                    onClick={() => paramSetter("openDialog", "addFile")}
                  >
                    <Icon>add</Icon>
                  </IconButton>
                  <IconButton
                    onClick={() => paramSetter("openDialog", "addFile")}
                  >
                    <Icon>queue_music</Icon>
                  </IconButton>
                </>
              )}
            </>
          )}
          <IconButton
            onClick={() =>
              paramSetter("expanded", (prev) => ({ ...prev, opt: false }))
            }
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
            !params.expanded.btn &&
            paramSetter("expanded", (prev) => ({ ...prev, btn: true }))
          }
          style={{ ...expSpring }}
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
            open={params.expanded.btn}
            onClick={() =>
              paramSetter("expanded", (prev) => ({ ...prev, btn: false }))
            }
          />
          <Fab
            color={
              params.expanded.opt || !params.expanded.btn
                ? "primary"
                : "default"
            }
            onClick={() =>
              params.expanded.btn &&
              paramSetter("expanded", (prev) => ({
                ...prev,
                opt: !prev.opt,
                btn: false,
              }))
            }
            size={"small"}
          >
            <Icon>{params.expanded.btn ? "tune" : ""}</Icon>
          </Fab>
          {params.selectedTrack !== null && (
            <Fab
              color={params.expanded.instr ? "primary" : "default"}
              onClick={() =>
                params.expanded.btn &&
                paramSetter("expanded", (prev) => ({
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

        {params.selectedTrack !== null &&
          tracks[params.selectedTrack].type !== 2 && (
            <Box
              className="ws-note-input"
              sx={(theme) => ({
                [theme.breakpoints.down("md")]: {
                  position: !params.expanded.instr && "fixed",
                  bottom: !params.expanded.instr && "-128px",

                  margin: "4px 0 0 0",
                },
              })}
            >
              <PlayInterface
                keyMapping={keyMapping}
                track={tracks && tracks[params.selectedTrack]}
                instrument={instruments[params.selectedTrack]}
                pressedKeys={params.pressedKeys}
                handlePageNav={handlePageNav}
                playNoteFunction={playNoteFunction}
                playingOctave={params.playingOctave}
                trackRows={params.trackRows}
                instrumentInfo={params.instrumentsInfo[params.selectedTrack]}
              />
            </Box>
          )}
        {params.openDialog === "trackPicker" && (
          <TrackPicker
            tabIndex={-1}
            open={true}
            onClose={() => paramSetter("openDialog", null)}
            setTracks={setTracks}
            loadNewTrackInstrument={(a, b, c) =>
              loadInstrument(a, b, c, setInstruments, paramSetter)
            }
            tracks={tracks}
            sessionSize={sessionData.size}
            sessionData={sessionData}
          />
        )}

        {/*setTracksVolume={setTracksVolume}*/}

        {/*  <FileList
        onClose={() => setFileListOpen(false)}
        open={fileListOpen}
        instrumentsInfo={instrumentsInfo}
        instruments={instruments}
        selectedTrack={selectedTrack}
        tracks={tracks}
      /> */}

        {sessionData && (
          <SessionSettings
            open={params.openDialog === "options"}
            onClose={() => paramSetter("openDialog", null)}
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

        {user && uploadingFiles.length > 0 && (
          <FileUploader
            workspace
            files={uploadingFiles}
            setUploadingFiles={setUploadingFiles}
            tracks={tracks}
            instruments={instruments}
            setTracks={setTracks}
            onUploadFinish={onUploadFinish}
          />
        )}

        {user === null && tracks !== null && (
          <Auth persistent authDialog={true} setUser={props.setUser} />
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
        <Confirm
          dupSession
          open={false}
          onClose={() => paramSetter("openDialog", null)}
          action={handleSessionCopy}
        />
      </Box>
    </SessionWorkspaceContext.Provider>
  ) : (
    <NotFoundPage
      type="workspace"
      handlePageNav={(ev) => handlePageNav("explore", "", ev)}
    />
  );
}

export default SessionWorkspace;
