import React, { useState, useEffect, useMemo, useRef } from "react";
import * as Tone from "tone";

import { useParams } from "react-router-dom";

import { Icon, IconButton, Snackbar, Box, Fab, Alert } from "@mui/material";

import "./style.css";

import Track from "./Track";
import ClosedTrack from "./Track/ClosedTrack";
import Title from "./Title";
import TransportBar from "./TransportBar";
import TrackPicker from "./TrackPicker";
import SessionSettings from "./SessionSettings";
import Mixer from "./Mixer";
import Grid from "./Grid";
import Ruler from "./Ruler";
import PlayInterface from "./PlayInterface";
import OptionsBar from "./OptionsBar";
import MobileCollapseButtons from "./MobileCollapseButtons";
import TrackOptions from "./TrackOptions";

import InstrumentEditor from "../../components/InstrumentEditor";
import LoadingBar from "../../components/LoadingBar";
import LoadingScreen from "../../components/LoadingScreen";
import FileUploader from "../../components/FileUploader";
import EffectsEditor from "../../components/EffectsEditor";

import Confirm from "../../components/dialogs/Confirm";
import Auth from "../../components/dialogs/Auth";

import NotFoundPage from "../NotFoundPage";

import useSession from "../../hooks/useSession";
import useUndo from "../../hooks/useUndo";
import useFileUpload from "../../hooks/useFileUpload";
import useMetronome from "./hooks/useMetronome";
import useCopyPaste from "./hooks/useCopyPaste";
import useFirebaseConnection from "./hooks/useFirebaseConnection";

import { loadInstrument } from "../../services/Instruments";

import { deleteSelection } from "./services/Edition";

import wsCtx from "../../context/SessionWorkspaceContext";
import { updateSessionCreator } from "../../services/Session/Session";

function SessionWorkspace(props) {
  const sessionKey = useParams().key;

  const playFn = useRef(null);

  const [params, setParams] = useState({
    isLoaded: false,
    playing: false,
    selectedTrack: null,
    trackRows: [],
    editMode: false,
    cursorMode: null,
    gridSize: 4,
    zoomPosition: [0, 3],
    selection: [],
    selNotes: [],
    movingSelDelta: null,
    trackOptions: { showingAll: false },
    expanded: {
      btn: false,
      instr: false,
      opt: false,
    },
    openDialog: null,
    openSubPage: null,
    sessionSize: 0,
    isRecording: false,
    deletingTrack: null,
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
    setInstrumentsLoaded,
    effects,
    setEffects,
    instrumentsInfo,
    setInstrumentsInfo,
    isLoaded,
    action,
    isPlaying,
    scheduleTrack,
    scheduleAllTracks,
  } = useSession({ id: sessionKey, paramSetter });

  const [premiumMode, setPremiumMode] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  const [editorProfiles, setEditorProfiles] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const { user, handlePageNav, hidden } = props;

  const { uploadFile, uploadFiles } = useFileUpload({
    notifications,
    setNotifications,
    uploadingFiles,
    setUploadingFiles,
  });

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
    setInstrumentsLoaded,
    effects,
    setEffects,
    instrumentsInfo,
    setInstrumentsInfo,
    action,
    sessionKey,
    user,
    premiumMode,
    setPremiumMode,
    handlePageNav,
    uploadQueue,
    setUploadQueue,
    uploadingFiles,
    setUploadingFiles,
    hidden,
    setSnackbarMessage,
    params,
    paramSetter,
    isLoaded,
    setNotifications,
    uploadFile,
    uploadFiles,
    scheduleAllTracks,
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

  /*===================================PLAYING==============================================*/

  const toggleRecording = () => {
    if (!params.isRecording) {
      if (isPlaying) action("pause");

      let newTime = `${
        Tone.Time(Tone.Transport.seconds)
          .toBarsBeatsSixteenths()
          .split(":")[0] - 1
      }:0:0`;
      newTime = Tone.Time(newTime).toSeconds() < 0 ? "0:0:0" : newTime;
      Tone.Transport.position = newTime;
      action("play");

      paramSetter("isRecording", true);
    } else {
      paramSetter("isRecording", false);
      action("pause");
    }
  };

  /*=====================================KEYEVENTS==========================================*/

  const handleKeyDown = (e) => {
    if (params.openDialog !== null || !params.editMode) return;
    else e.preventDefault();
    Tone.start();
    let key = e.keyCode;
    if (e.ctrlKey || e.metaKey) {
      if (key === 67) handleCopy();
      if (key === 86) handlePaste();
      if (key === 90) !e.shiftKey ? Undo() : Redo();
    }

    if (key === 18) paramSetter("cursorMode", "edit");
    if (key === 32) action("toggle");
    if (key === 8 && !params.openDialog) deleteSelection(ctxData);
    if (key >= 37 && key <= 40) handleArrowKey(e);

    if (params.selectedTrack !== null && playFn.current) playFn.current[0](e);
  };

  const handleKeyUp = (e) => {
    if (params.openDialog !== null || !params.editMode) return;
    else e.preventDefault();
    let key = e.keyCode;
    if (key === 18) paramSetter("cursorMode", null);
    if (params.selectedTrack !== null && playFn.current) playFn.current[1](e);
  };

  const handleArrowKey = (e) => {
    if (!params.editMode) return;
    let key = e.keyCode;
    if (key === 38) paramSetter("sessionSize", (p) => (p === 128 ? p : p + 1));
    if (key === 40) paramSetter("sessionSize", (p) => (p === 1 ? p : p - 1));
    if (key === 37) paramSetter("gridSize", (p) => (p === 1 ? p : p / 2));
    if (key === 39) paramSetter("gridSize", (p) => (p === 32 ? p : p * 2));
  };

  /*=====================================USEEFFECTS=========================================*/

  useEffect(() => {
    setSavingMode(sessionData.rte ? "rte" : "simple");
  }, [isLoaded]);

  useEffect(() => {
    console.log(notifications);
  }, [notifications]);

  useEffect(() => {
    console.log(tracks);
    tracks && updateUndoHistory(tracks);
  }, [tracks]);

  useEffect(() => {
    if (user && sessionData.bpm && !sessionData.creator) {
      updateSessionCreator(sessionKey, user.uid).then((newSession) =>
        setSessionData((p) => ({ ...p, ...newSession }))
      );
    }
  }, [sessionData, user]);

  useEffect(() => {
    if (sessionData) {
      setSavingMode(sessionData.rte ? "rte" : "simple");
      if (params.sessionSize || sessionData.size)
        paramSetter("sessionSize", sessionData.size);
    }
  }, [sessionData]);

  useEffect(() => {
    let isEditor =
      user && sessionData.editors && sessionData.editors.includes(user.uid);
    paramSetter("editMode", isEditor);
  }, [sessionData, user]);

  useEffect(() => {
    if (
      params.sessionSize < params.zoomPosition[1] + 1 &&
      params.sessionSize > 0
    ) {
      paramSetter("zoomPosition", (prev) => [prev[0], params.sessionSize - 1]);
    }
    if (params.sessionSize || sessionData.size)
      setSessionData((prev) => ({ ...prev, size: params.sessionSize }));
  }, [params.sessionSize]);

  useEffect(() => {
    if (params.isRecording) toggleRecording();
    paramSetter("openSubPage", null);
  }, [params.selectedTrack]);

  useEffect(() => {
    premiumMode && console.log("=====PREMIUM MODE ON=====");
  }, [premiumMode]);

  useEffect(() => {
    props.setUnsavedChanges && props.setUnsavedChanges(areUnsavedChanges);
  }, [areUnsavedChanges]);

  /*===============================JSX============================== */

  return tracks !== undefined ? (
    <wsCtx.Provider value={ctxData}>
      <LoadingBar
        value={
          Object.values(instrumentsLoaded).filter((e) => e).length /
          Object.values(instrumentsLoaded).length
        }
      />
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
          // sx={(theme) => ({
          //   [theme.breakpoints.down("md")]: {
          //     height: "40px",
          //   },
          // })}
        >
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
            {params.editMode && params.selectedTrack !== null && (
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
            <TransportBar
              notifications={notifications}
              setNotifications={setNotifications}
            />
            <Ruler />
          </>
        )}

        <div className="ws-grid-cont" tabIndex="-1">
          {params.openSubPage === "IE" && (
            <InstrumentEditor
              workspace
              resetUndoHistory={resetHistory}
              handlePageNav={handlePageNav}
              setUploadingFiles={setUploadingFiles}
            />
          )}
          {params.openSubPage === "fx" && params.selectedTrack !== null && (
            <EffectsEditor workspace resetHistory={resetHistory} />
          )}
          {params.openSubPage === "mixer" && (
            <Mixer
              setMixerOpen={() =>
                paramSetter("openSubPage", (prev) =>
                  prev === "mixer" ? null : "mixer"
                )
              }
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
              <div style={{ height: "100%", overflowY: "overlay" }}>
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
                {params.editMode && (
                  <Fab
                    style={{
                      width: 48,
                      height: 48,
                      left: "50%",
                      marginTop: 32,
                    }}
                    tabIndex="-1"
                    variant="contained"
                    color="primary"
                    onClick={() => paramSetter("openDialog", "trackPicker")}
                  >
                    <Icon>add</Icon>
                  </Fab>
                )}
              </div>
            )}
          </Grid>
        </div>
        {/* ================================================ */}

        {params.editMode && (
          <OptionsBar
            areUnsavedChanges={areUnsavedChanges}
            save={save}
            scheduleAllTracks={scheduleAllTracks}
          />
        )}

        {params.editMode && <MobileCollapseButtons />}

        {/* ================================================ */}

        {params.selectedTrack !== null &&
          params.editMode &&
          tracks[params.selectedTrack].type !== 2 && (
            <PlayInterface workspace playFn={playFn} />
          )}

        <TrackPicker
          tabIndex={-1}
          open={params.openDialog === "trackPicker"}
          onClose={() => paramSetter("openDialog", null)}
          loadNewTrackInstrument={(a, b) =>
            loadInstrument(
              a,
              b,
              null,
              setInstruments,
              setInstrumentsLoaded,
              setEffects,
              setInstrumentsInfo
            )
          }
        />

        <TrackOptions
          open={params.openDialog && params.openDialog.includes("trackOpt")}
          onClose={() => paramSetter("openDialog", null)}
        />

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

        {/* user && uploadingFiles.length > 0 && (
          <FileUploader
            workspace
            files={uploadingFiles}
            setUploadingFiles={setUploadingFiles}
            tracks={tracks}
            instruments={instruments}
            setTracks={setTracks}
            onUploadFinish={onUploadFinish}
          />
        ) */}

        {/* user === null && tracks !== null && (
          <Auth persistent authDialog={true} setUser={props.setUser} />
        ) */}

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
        {!user && !sessionData.creator && (
          <Alert severity="warning" sx={{ textTransform: "none" }}>
            Looks like you are not logged in. Please login to save your work.
          </Alert>
        )}
        {!params.editMode && (
          <Alert severity="info" sx={{ textTransform: "none" }}>
            This session was created by another user. You can check it out but
            not edit it.
          </Alert>
        )}
        <Confirm
          dupSession
          open={params.openDialog === "dupSession"}
          onClose={() => paramSetter("openDialog", null)}
          action={handleSessionCopy}
        />
      </Box>
    </wsCtx.Provider>
  ) : (
    <NotFoundPage
      type="workspace"
      handlePageNav={(ev) => handlePageNav("explore", "", ev)}
    />
  );
}

export default SessionWorkspace;
