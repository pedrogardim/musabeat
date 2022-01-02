import React, { useState, useEffect, useMemo } from "react";
import * as Tone from "tone";

import { useParams } from "react-router-dom";

import { Icon, IconButton, Snackbar, Box } from "@mui/material";

import "./style.css";

import Track from "./Track";
import ClosedTrack from "./Track/ClosedTrack";
import Title from "./Title";
import Transport from "./Transport";
import TrackPicker from "./TrackPicker";
import SessionSettings from "./SessionSettings";
import Mixer from "./Mixer";
import Grid from "./Grid";
import Ruler from "./Ruler";
import PlayInterface from "./PlayInterface";
import OptionsBar from "./OptionsBar";
import MobileCollapseButtons from "./MobileCollapseButtons";

import InstrumentEditor from "../../components/InstrumentEditor";
import LoadingScreen from "../../components/LoadingScreen";
import FileUploader from "../../components/FileUploader";

import Confirm from "../../components/dialogs/Confirm";
import Auth from "../../components/dialogs/Auth";

import NotFoundPage from "../NotFoundPage";

import useSession from "../../hooks/useSession";
import useUndo from "../../hooks/useUndo";
import useMetronome from "./hooks/useMetronome";
import useCopyPaste from "./hooks/useCopyPaste";
import useFirebaseConnection from "./hooks/useFirebaseConnection";

import { loadInstrument } from "../../services/Instruments";

import { deleteSelection } from "./services/Edition";

import { SessionWorkspaceContext } from "../../context/SessionWorkspaceContext";

function SessionWorkspace(props) {
  const sessionKey = useParams().key;

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
    isRecording: true,
    instrInfo: {},
  });

  const paramSetter = (key, value, key2, value2) =>
    setParams((prev) => ({
      ...prev,
      [key]: typeof value === "function" ? value(prev[key]) : value,
      [key2]: typeof value2 === "function" ? value2(prev[key]) : value2,
    }));

  const {
    tracks,
    setTracks,
    sessionData,
    setSessionData,
    instruments,
    setInstruments,
    instrumentsLoaded,
    isLoaded,
    action,
    isPlaying,
    scheduleTrack,
  } = useSession({ id: sessionKey, paramSetter });

  const [premiumMode, setPremiumMode] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  const [editorProfiles, setEditorProfiles] = useState(null);
  const [pendingUploadFiles, setPendingUploadFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const [[playNote, releaseNote], setPlayFn] = useState([() => {}, () => {}]);

  const { user, handlePageNav, hidden } = props;

  const [Undo, Redo, updateUndoHistory, resetHistory] = useUndo(setTracks);

  const setMetronomeState = useMetronome();

  const ctxData = useMemo(() => ({
    tracks,
    setTracks,
    sessionData,
    setSessionData,
    instruments,
    setInstruments,
    isLoaded,
    instrumentsLoaded,
    action,
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
    setSnackbarMessage,
    params,
    paramSetter,
  }));

  const [save, setSavingMode, areUnsavedChanges] =
    useFirebaseConnection(ctxData);

  const [handleCopy, handlePaste] = useCopyPaste(ctxData);

  /*===================================SAVING===============================================*/

  const handleSessionCopy = () =>
    props.setNewSessionDialog({ ...sessionData, tracks: [...tracks] });

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

  /*===================================PLAYING==============================================*/

  const toggleRecording = (e) => {
    if (params.isRecording !== "rec") {
      if (isPlaying) {
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

      paramSetter("isRecording", true);
    } else {
      Tone.Transport.pause();
      paramSetter("isRecording", false);
      action("pause");
    }
  };

  /*===================================EDIT=ACTIONS=========================================*/

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

  /*=====================================KEYEVENTS==========================================*/

  const handleKeyDown = (e) => {
    Tone.start();
    if (e.ctrlKey || e.metaKey) {
      if (e.keyCode === 67) handleCopy();
      if (e.keyCode === 87) handlePaste();
      if (e.keyCode === 90) !e.shiftKey ? Undo() : Redo();
    }

    playNote(e);

    if (e.keyCode === 18) paramSetter("cursorMode", "edit");
    if (e.keyCode === 32) action("toggle");
    if (e.keyCode === 8)
      !params.openDialog === "options" && deleteSelection(ctxData);
    if (e.keyCode >= 37 && e.keyCode <= 40) handleArrowKey(e);
  };

  const handleKeyUp = (e) => {
    if (e.keyCode === 18) paramSetter("cursorMode", null);

    releaseNote(e);
  };

  const handleArrowKey = (event) => {
    event.preventDefault();
    if (event.keyCode === 38)
      paramSetter("sessionSize", (prev) => (prev === 128 ? prev : prev + 1));

    if (event.keyCode === 40)
      paramSetter("sessionSize", (prev) => (prev === 1 ? prev : prev - 1));

    if (event.keyCode === 37)
      paramSetter("gridSize", (prev) => (prev === 1 ? prev : prev / 2));

    if (event.keyCode === 39)
      paramSetter("gridSize", (prev) => (prev === 32 ? prev : prev * 2));
  };

  /*=====================================USEEFFECTS=========================================*/

  useEffect(() => {
    setSavingMode(sessionData.rte ? "rte" : "simple");
  }, [isLoaded]);

  useEffect(() => {
    console.log(tracks);
    tracks && updateUndoHistory(tracks);
  }, [tracks]);

  useEffect(() => {
    if (sessionData) {
      setSavingMode(sessionData.rte ? "rte" : "simple");
      paramSetter("sessionSize", sessionData.size);
    }

    if (isLoaded) save(tracks, sessionData);
  }, [sessionData]);

  useEffect(() => {
    if (sessionData.editors && sessionData.editors.includes(user.uid))
      paramSetter("editMode", true);
  }, [sessionData, user]);

  useEffect(() => {
    if (
      params.sessionSize < params.zoomPosition[1] + 1 &&
      params.sessionSize > 0
    ) {
      paramSetter("zoomPosition", (prev) => [prev[0], params.sessionSize - 1]);
    }
  }, [params.sessionSize]);

  useEffect(() => {
    premiumMode && console.log("=====PREMIUM MODE ON=====");
  }, [premiumMode]);

  useEffect(() => {
    props.setUnsavedChanges && props.setUnsavedChanges(areUnsavedChanges);
  }, [areUnsavedChanges]);

  useEffect(() => {
    tracks && params.movingSelDelta === null && updateSelectedNotes();
  }, [params.selection]);

  /*===============================JSX============================== */

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
            <IconButton
              size="large"
              tabIndex="-1"
              onClick={() => action("toggle")}
            >
              <Icon style={{ color: "white", fontSize: 36 }}>
                {isPlaying ? "pause" : "play_arrow"}
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
            <Transport />
            <Ruler />
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
                scheduleTrack={scheduleTrack}
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

        <OptionsBar />

        <MobileCollapseButtons />

        {/* ================================================ */}

        {params.selectedTrack !== null &&
          tracks[params.selectedTrack].type !== 2 && (
            <PlayInterface setPlayFn={setPlayFn} />
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
