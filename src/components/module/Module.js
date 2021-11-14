import React, { useEffect, useState, Fragment } from "react";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import {
  IconButton,
  Icon,
  Menu,
  MenuItem,
  CircularProgress,
  Tooltip,
} from "@material-ui/core";
import { clearEvents } from "../../utils/TransportSchedule";
import NameInput from "../../components/ui/Dialogs/NameInput";

import { loadEffect, effectTypes, detectPitch } from "../../assets/musicutils";

import Sequencer from "../Modules/DrumSequencer/Sequencer";
import ChordProgression from "../Modules/ChordProgression/ChordProgression";
import MelodyGrid from "../Modules/MelodyGrid/MelodyGrid";
import Player from "../Modules/Player/Player";
import PianoRoll from "../Modules/PianoRoll/PianoRoll";

import InstrumentEditor from "../InstrumentEditor/InstrumentEditor";
import ModuleSettings from "./ModuleSettings";
import ModuleEffects from "./ModuleEffects";

import ActionConfirm from "../ui/Dialogs/ActionConfirm";

import FileExplorer from "../ui/FileExplorer/FileExplorer";

import { colors } from "../../utils/materialPalette";

import "./Module.css";

function Module(props) {
  const { t } = useTranslation();

  const [modulePage, setModulePage] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [renameDialog, setRenameDialog] = useState(false);
  const [effects, setEffects] = useState(new Array(4).fill(false));
  const [fullScreen, setFullScreen] = useState(false);
  //module is disabled in the timeline
  const [TLVisibility, setTLVisibility] = useState(true);
  const [TLVisibilityAnimator, setTLVisibilityAnimator] = useState(null);

  const [moduleZoom, setModuleZoom] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState(false);

  let moduleContent = <span>Nothing Here</span>;

  const handleInstrumentButtonMode = () => {
    setModulePage("instrument");
    closeMenu();
  };

  const handleSettingsButtonMode = () => {
    setModulePage("settings");
    closeMenu();
  };

  const handleFileExplorerButton = () => {
    setModulePage("fileExplorer");
    closeMenu();
  };

  const handleEffectButtonMode = () => {
    setModulePage("effects");
    closeMenu();
  };

  const handleBackButtonClick = () => {
    setModulePage(null);
    closeMenu();
  };

  const setInstrument = (newInstrument) => {
    props.setInstruments((prev) => {
      let newInstruments = [...prev];
      newInstruments[props.index] = newInstrument;
      return newInstruments;
    });
  };

  const setInstrumentLoaded = (loaded) => {
    props.setInstrumentsLoaded((prev) => {
      let instrLdd = [...prev];
      instrLdd[props.index] = loaded;
      return instrLdd;
    });
  };

  const removeModule = () => {
    updateFilesStatsOnChange();

    //Tone.Transport.pause();
    props.setModules((prevModules) => {
      //prevModules.forEach(e=>clearEvents(e.id));
      clearEvents(props.module.id);
      let newModules = [...prevModules];
      newModules = newModules.filter((e, i) => i !== props.index);
      return newModules;
    });

    props.instrument.dispose();
    props.setInstruments((prev) => prev.filter((e, i) => i !== props.index));
    props.setInstrumentsLoaded((prev) =>
      prev.filter((e, i) => i !== props.index)
    );

    props.setFocusedModule((prev) => (prev === props.index ? null : prev));

    let newTimeline = { ...props.timeline };
    delete newTimeline[props.module.id];
    props.setTimeline(newTimeline);

    props.setAreUnsavedChanges(false);
  };

  const handleModuleRename = (name) => {
    props.setModules((prevModules) => {
      let newModules = [...prevModules];
      newModules[props.index].name = name;
      return newModules;
    });
  };

  const handleHeaderClick = (e) => {
    console.log(e.target.className);
    e.target.className === "module-header" && setFullScreen((prev) => !prev);
  };

  //method moved to Workspace
  /* const handleModuleDuplicate = () => {
    props.setModules((prev) => [...prev, { ...prev[props.index] }]);
  }; */

  const openMenu = (e) => {
    setMenuAnchorEl(e.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleZoom = () => {
    setModuleZoom((prev) => (prev <= props.sessionSize ? prev * 2 : 1));
    //console.log(props.sessionSize, moduleZoom);
    //console.log(moduleZoom * 100 + "%");
  };

  const scheduleTLVisibility = () => {
    clearInterval(TLVisibilityAnimator);
    if (props.timelineMode) {
      let event = setInterval(() => {
        let currentMeasure = parseInt(Tone.Transport.position.split(":")[0]);

        let moduleState = Object.values(props.timeline[props.module.id])
          .sort((a, b) => a - b)
          .map(
            (e) =>
              currentMeasure >= e &&
              currentMeasure <= e + (getModuleSize(props.module) - 1)
          );

        let moduleVisiblity = moduleState.includes(true);
        //console.log(moduleVisiblity, TLVisibility);

        setTLVisibility((prev) =>
          moduleVisiblity !== prev ? moduleVisiblity : prev
        );
      }, 200);
      setTLVisibilityAnimator(event);
    }
  };

  //Only used for players

  const updateOnFileLoaded = (dur) => {
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
  };

  const setLabels = (index, newName) => {
    props.setModules((prev) => {
      let newModules = [...prev];
      newModules[props.index].lbls[index] = newName;
      return newModules;
    });
  };

  const onInstrumentMod = async (fileId, name, soundindex, isRemoving) => {
    //update instrument info in module object

    if (props.module.type === 0 || props.instrument.name === "Sampler") {
      let patch =
        typeof props.module.instrument === "string"
          ? (
              await firebase
                .firestore()
                .collection(props.module.type === 0 ? "drumpatches" : "patches")
                .doc(props.module.instrument)
                .get()
            ).data()
          : { ...props.module.instrument };

      typeof props.module.instrument === "string" &&
        firebase
          .firestore()
          .collection(props.module.type === 0 ? "drumpatches" : "patches")
          .doc(props.module.instrument)
          .update({ in: firebase.firestore.FieldValue.increment(-1) });

      firebase
        .firestore()
        .collection("files")
        .doc(fileId)
        .update({
          in: firebase.firestore.FieldValue.increment(isRemoving ? -1 : 1),
          ld: firebase.firestore.FieldValue.increment(isRemoving ? 0 : 1),
        });

      //console.log(props.module.instrument, patch, soundindex, name);

      !isRemoving
        ? (patch.urls[props.module.type === 0 ? soundindex : name] = fileId)
        : delete patch.urls[props.module.type === 0 ? soundindex : name];
      if (props.module.type === 0) {
        //console.log(patch.lbls, soundindex);

        !isRemoving
          ? (patch.lbls[soundindex] = name)
          : delete patch.lbls[soundindex];
      }

      props.setModules((prev) => {
        let newModules = [...prev];
        newModules[props.index].instrument = { ...patch };
        if (props.module.type === 0) {
          newModules[props.index].lbls = { ...patch.lbls };
        }
        return newModules;
      });
    } else {
      props.setModules((prev) => {
        let newModules = [...prev];
        newModules[props.index].instrument = props.instrument.get();
        return newModules;
      });
    }
    props.resetUndoHistory();
  };

  const handleFileClick = (fileId, fileUrl, audiobuffer, name) => {
    let isDrum = props.module.type === 0;
    if (props.module.type === 3) {
      setInstrumentLoaded(false);
      props.instrument.dispose();
      let newPlayer = new Tone.GrainPlayer(
        audiobuffer ? audiobuffer : fileUrl,
        () => setInstrumentLoaded(true)
      ).toDestination();

      setInstrument(newPlayer);
      updateOnFileLoaded();
      onInstrumentMod(fileId);
      setModulePage(null);
    } else {
      setInstrumentLoaded(false);

      let labelOnInstrument = isDrum
        ? name.split(".")[0]
        : Tone.Frequency(detectPitch(audiobuffer)[0]).toNote();

      let slotToInsetFile = 0;

      if (typeof props.module.instrument === "string") {
        firebase
          .firestore()
          .collection(isDrum ? "drumpatches" : "patches")
          .doc(props.module.instrument)
          .get()
          .then((r) => {
            while (
              isDrum &&
              Object.keys(r.data().urls).includes(
                JSON.stringify(slotToInsetFile)
              )
            ) {
              slotToInsetFile++;
            }
            console.log(slotToInsetFile, Object.keys(r.data().urls));

            props.instrument.add(
              isDrum ? slotToInsetFile : labelOnInstrument,
              audiobuffer ? audiobuffer : fileUrl,
              () => setInstrumentLoaded(true)
            );

            onInstrumentMod(fileId, labelOnInstrument, slotToInsetFile);
          });
      } else {
        //console.log(Object.keys(props.module.instrument.urls), slotToInsetFile);

        while (
          Object.keys(props.module.instrument.urls).includes(
            JSON.stringify(slotToInsetFile)
          )
        ) {
          slotToInsetFile++;
        }
        console.log(slotToInsetFile, Object.keys(props.module.instrument.urls));

        props.instrument.add(
          isDrum ? slotToInsetFile : labelOnInstrument,
          audiobuffer ? audiobuffer : fileUrl,
          () => setInstrumentLoaded(true)
        );

        //console.log(props.instrument);

        onInstrumentMod(fileId, labelOnInstrument, slotToInsetFile);
      }
    }
  };

  const loadModuleEffects = () => {
    !!props.module.fx &&
      !!props.module.fx.length &&
      setEffects(
        props.module.fx.map((e, i) => !!e && loadEffect(e.type, e.options))
      );
  };

  const onEffectCreated = () => {
    let effectArray = effects.map((e, i) => {
      return !!e && { type: effectTypes.indexOf(e.name), options: e.get() };
    });

    props.setModules((prev) =>
      prev.map((e, i) => (i === props.index ? { ...e, fx: effectArray } : e))
    );
    //console.log(effects);
  };

  const updateFilesStatsOnChange = async () => {
    //when change the instrument, update file "in" stat by -1

    let instrobj =
      typeof props.module.instrument === "string"
        ? (
            await firebase
              .firestore()
              .collection(props.module.type === 0 ? "drumpatches" : "patches")
              .doc(props.module.instrument)
              .get()
          ).data()
        : props.module.instrument;

    typeof props.module.instrument === "string" &&
      firebase
        .firestore()
        .collection(props.module.type === 0 ? "drumpatches" : "patches")
        .doc(props.module.instrument)
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
  };

  switch (props.module.type) {
    case 0:
      moduleContent = (
        <Sequencer
          style={{
            display: modulePage !== null ? "none" : "flex",
            backgroundColor: colors[props.module.color][500],
          }}
          instrument={props.instrument}
          loaded={props.loaded}
          sessionSize={props.sessionSize}
          index={props.index}
          module={props.module}
          kit={0}
          setModules={props.setModules}
          timeline={props.timeline}
          timelineMode={props.timelineMode}
          isSessionLoaded={props.isSessionLoaded}
        />
      );
      break;
    case 1:
      moduleContent = (
        <MelodyGrid
          style={{
            display: modulePage !== null ? "none" : "flex",
          }}
          instrument={props.instrument}
          sessionSize={props.sessionSize}
          index={props.index}
          module={props.module}
          setModules={props.setModules}
          timeline={props.timeline}
          timelineMode={props.timelineMode}
          isSessionLoaded={props.isSessionLoaded}
          sessionData={props.sessionData}
        />
      );
      break;
    case 2:
      moduleContent = (
        <ChordProgression
          style={{
            display: modulePage !== null ? "none" : "block",
            overflow: "hidden",
          }}
          instrument={props.instrument}
          sessionSize={props.sessionSize}
          index={props.index}
          module={props.module}
          setModules={props.setModules}
          timeline={props.timeline}
          timelineMode={props.timelineMode}
          setTimeline={props.setTimeline}
          selection={props.selection}
          setSelection={props.setSelection}
          isSessionLoaded={props.isSessionLoaded}
          sessionData={props.sessionData}
        />
      );
      break;

    case 3:
      moduleContent = (
        <Player
          style={{
            display: modulePage !== null ? "none" : "flex",
          }}
          onInstrumentMod={onInstrumentMod}
          setInstrument={setInstrument}
          setInstrumentLoaded={setInstrumentLoaded}
          loaded={props.loaded}
          index={props.index}
          instrument={props.instrument}
          sessionSize={props.sessionSize}
          module={props.module}
          setModules={props.setModules}
          moduleZoom={moduleZoom}
          updateOnFileLoaded={updateOnFileLoaded}
          fullScreen={fullScreen}
          timeline={props.timeline}
          timelineMode={props.timelineMode}
          isSessionLoaded={props.isSessionLoaded}
          handlePageNav={props.handlePageNav}
        />
      );
      break;

    case 4:
      moduleContent = (
        <PianoRoll
          style={{
            display: modulePage !== null ? "none" : "flex",
          }}
          instrument={props.instrument}
          sessionSize={props.sessionSize}
          index={props.index}
          module={props.module}
          loaded={props.loaded}
          setModules={props.setModules}
          moduleZoom={moduleZoom}
          fullScreen={fullScreen}
          timeline={props.timeline}
          timelineMode={props.timelineMode}
          selection={props.selection}
          setSelection={props.setSelection}
          isSessionLoaded={props.isSessionLoaded}
        />
      );
      break;
    default:
      break;
  }

  useEffect(() => {
    loadModuleEffects();
    return () => {
      clearEvents(props.module.id);
      clearInterval(TLVisibilityAnimator);
      effects.map((e) => !!e && e.dispose());
    };
  }, []);

  useEffect(() => {
    props.isLoaded && onEffectCreated();
  }, [effects]);

  useEffect(() => {
    !!props.instrument &&
      props.instrument.chain(
        ...effects.filter((e) => e !== false),
        Tone.Destination
      );

    //console.log(props.instrument);
  }, [props.instrument, effects]);

  useEffect(() => {
    if (props.instrument && Tone.Transport.state !== "started") {
      props.instrument.name === "Players"
        ? props.instrument.stopAll()
        : props.instrument.name === "GrainPlayer" ||
          props.instrument.name === "Player"
        ? props.instrument.stop()
        : props.instrument.releaseAll();
    }
  }, [Tone.Transport.state]);

  useEffect(() => {
    scheduleTLVisibility();
  }, [props.timeline]);

  /*  useEffect(() => {
    console.log(props.module.id, TLVisibility);
  }, [TLVisibility]); */

  return (
    <Fragment>
      {fullScreen && (
        <div
          className="module-fs-backdrop"
          onClick={() => setFullScreen(false)}
        />
      )}
      <div
        style={{
          backgroundColor: colors[props.module.color][700],
          pointerEvents: props.editMode ? "auto" : "none",
        }}
        onClick={() => props.setFocusedModule(props.index)}
        className={`module ${props.module.muted && "module-muted"} ${
          fullScreen && "module-fullscreen"
        } ${!TLVisibility && props.timelineMode && "module-tloff"} ${
          props.isFocused && "module-focused"
        }`}
      >
        <div className="module-header" onClick={handleHeaderClick}>
          {modulePage !== null && (
            <IconButton
              className="module-back-button"
              onClick={handleBackButtonClick}
            >
              <Icon style={{ fontSize: 20 }}>arrow_back_ios</Icon>
            </IconButton>
          )}
          <span className="module-title" style={{ cursor: "default" }}>
            {props.module.name
              ? props.module.name
              : t(`modulePicker.types.${props.module.type}.name`)}
          </span>
          {modulePage === "settings" && (
            <Tooltip title="Rename module">
              <IconButton
                onClick={() => setRenameDialog(true)}
                className="module-settings-rename-btn"
              >
                <Icon>edit</Icon>
              </IconButton>
            </Tooltip>
          )}

          {renameDialog && (
            <NameInput
              onSubmit={handleModuleRename}
              open={renameDialog}
              onClose={() => setRenameDialog(false)}
            />
          )}

          {(props.module.type === 3 || props.module.type === 4) && (
            <IconButton
              className="module-zoom-button"
              tabIndex={-1}
              onClick={handleZoom}
            >
              <Icon>search</Icon>
            </IconButton>
          )}
          <IconButton
            tabIndex={-1}
            className="module-options-button"
            onClick={openMenu}
          >
            <Icon>more_vert</Icon>
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            keepMounted
            open={Boolean(menuAnchorEl)}
            onClose={closeMenu}
            tabIndex={-1}
          >
            <MenuItem
              className="module-menu-option"
              onClick={() => setFullScreen((prev) => !prev)}
              tabIndex={-1}
            >
              <Icon>fullscreen</Icon>
              {t("module.options.fullscreen")}
            </MenuItem>
            {/* (props.module.type === 0 || props.module.type === 1) && (
            <MenuItem
              onClick={handleClearMeasure}
              className="module-menu-option"
            >
              <Icon>block</Icon>
              Clear measure
            </MenuItem>
          ) */}
            {props.module.type === 3 ? (
              <MenuItem
                onClick={handleFileExplorerButton}
                className="module-menu-option"
                tabIndex={-1}
              >
                <Icon>graphic_eq</Icon>
                {t("module.options.loadFile")}
              </MenuItem>
            ) : (
              <MenuItem
                onClick={handleInstrumentButtonMode}
                className="module-menu-option"
                tabIndex={-1}
              >
                <Icon>piano</Icon>
                {t("module.options.instrument")}
              </MenuItem>
            )}

            <MenuItem
              onClick={handleSettingsButtonMode}
              className="module-menu-option"
              tabIndex={-1}
            >
              <Icon className="module-menu-option-icon">settings</Icon>
              {t("module.options.settings")}
            </MenuItem>
            {/*COMING_SOON*/}
            <MenuItem
              /* onClick={handleEffectButtonMode} */
              className="module-menu-option"
              tabIndex={-1}
              style={{ color: "gray" }}
            >
              <Icon className="module-menu-option-icon">blur_on</Icon>
              {t("module.options.effects") + " " + t("misc.comingSoon")}
            </MenuItem>
            <MenuItem
              onClick={() => props.duplicateModule(props.index)}
              className="module-menu-option"
              tabIndex={-1}
            >
              <Icon className="module-menu-option-icon">content_copy</Icon>
              {t("module.options.duplicate")}
            </MenuItem>
            <MenuItem
              className="module-menu-option"
              onClick={() => setDeleteDialog(true)}
              tabIndex={-1}
            >
              <Icon>delete</Icon>
              {t("module.options.remove")}
            </MenuItem>
          </Menu>
        </div>
        {props.loaded ? (
          <Fragment>
            {modulePage === "instrument" && (
              <InstrumentEditor
                module={props.module}
                setModules={props.setModules}
                instrument={props.instrument}
                onInstrumentMod={onInstrumentMod}
                setInstruments={props.setInstruments}
                setInstrument={setInstrument}
                setInstrumentsLoaded={props.setInstrumentsLoaded}
                setInstrumentLoaded={setInstrumentLoaded}
                setModulePage={setModulePage}
                index={props.index}
                setSnackbarMessage={props.setSnackbarMessage}
                handleFileClick={handleFileClick}
                setLabels={setLabels}
                handlePageNav={props.handlePageNav}
                updateFilesStatsOnChange={updateFilesStatsOnChange}
              />
            )}
            {modulePage === "fileExplorer" && (
              <FileExplorer
                onFileClick={handleFileClick}
                setInstrumentLoaded={setInstrumentLoaded}
                isDrum={false}
                setFileExplorer={(x) => !x && setModulePage(null)}
                instrument={props.instrument}
                compact
              />
            )}
            {modulePage === "settings" && (
              <ModuleSettings
                instrument={props.instrument}
                module={props.module}
                setModules={props.setModules}
                setSettingsMode={() => setModulePage(null)}
                index={props.index}
                timeline={props.timeline}
                setTimeline={props.setTimeline}
                sessionData={props.sessionData}
              />
            )}
            {modulePage === "effects" && (
              <ModuleEffects
                module={props.module}
                setModules={props.setModules}
                effects={effects}
                setEffects={setEffects}
                index={props.index}
              />
            )}

            {modulePage === null && moduleContent}
          </Fragment>
        ) : (
          <CircularProgress
            className="loading-progress"
            style={{ color: colors[props.module.color][300] }}
          />
        )}
      </div>
      <ActionConfirm
        delete
        open={deleteDialog}
        onClose={() => setDeleteDialog(null)}
        action={removeModule}
      />
    </Fragment>
  );
}

export default Module;

const getModuleSize = (module, index) => {
  let thisModule = module;
  return thisModule.type === 2
    ? Math.ceil(
        thisModule.score[thisModule.score.length - 1].time +
          thisModule.score[thisModule.score.length - 1].duration
      )
    : thisModule.type === 3 || thisModule.type === 4
    ? thisModule.size
    : /* Math.ceil(
            Math.max(
              ...module.score
                .sort((a, b) => a.time + a.duration - (b.time + b.duration))
                .map((e) => e.time + e.duration)
            )
          ) */
      thisModule.score.length;
};
