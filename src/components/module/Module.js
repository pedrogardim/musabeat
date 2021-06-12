import React, { useEffect, useState, Fragment } from "react";
import * as Tone from "tone";

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

import { loadEffect, effectTypes } from "../../assets/musicutils";

import Sequencer from "../Modules/DrumSequencer/Sequencer";
import ChordProgression from "../Modules/ChordProgression/ChordProgression";
import MelodyGrid from "../Modules/MelodyGrid/MelodyGrid";
import Player from "../Modules/Player/Player";
import InstrumentEditor from "../InstrumentEditor/InstrumentEditor";
import ModuleSettings from "./ModuleSettings";
import ModuleEffects from "./ModuleEffects";

import FileExplorer from "../ui/FileExplorer/FileExplorer";

import { colors } from "../../utils/materialPalette";

import "./Module.css";

function Module(props) {
  const [modulePage, setModulePage] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [renameDialog, setRenameDialog] = useState(false);
  const [effects, setEffects] = useState(new Array(4).fill(false));

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
    props.setInstruments((prev) =>
      prev.map((e, i) => (i === props.index ? newInstrument : e))
    );
  };

  const setInstrumentLoaded = (loaded) => {
    props.setInstrumentsLoaded((prev) =>
      prev.map((e, i) => (i === props.index ? loaded : e))
    );
  };

  const removeModule = () => {
    //Tone.Transport.pause();
    props.setModules((prevModules) => {
      //prevModules.forEach(e=>clearEvents(e.id));
      clearEvents(props.module.id);
      let newModules = [...prevModules];
      newModules = newModules.filter((e, i) => i !== props.index);
      return newModules;
    });

    props.setInstruments((prevInstruments) => {
      //prevModules.forEach(e=>clearEvents(e.id));
      let newInstruments = [...prevInstruments];
      newInstruments = newInstruments.filter((e, i) => i !== props.index);
      return newInstruments;
    });
  };

  const handleModuleRename = (name) => {
    props.setModules((prevModules) => {
      let newModules = [...prevModules];
      newModules[props.index].name = name;
      return newModules;
    });
  };

  const openMenu = (e) => {
    setMenuAnchorEl(e.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };

  const onInstrumentMod = (url, name, isRemoving) => {
    //update instrument info in module object

    props.setModules((prev) => {
      let newModules = [...prev];
      if (props.module.type === 0) {
        newModules[props.index].instrument = {
          urls: { ...prev[props.index].instrument.urls, [name]: url },
        };
      } else if (props.module.type === 3) {
        newModules[props.index].instrument = { url };
      } else if (props.instrument.name === "Sampler") {
        let samplerPrms = props.instrument.get();
        delete samplerPrms.onerror;
        delete samplerPrms.onload;
        samplerPrms.urls = { ...props.instrument.get().urls, [name]: url };
        newModules[props.index].instrument = samplerPrms;
      } else {
        newModules[props.index].instrument = props.instrument.get();
      }
      return newModules;
    });
  };

  const handleFileClick = (fileUrl, audiobuffer) => {
    if (props.module.type === 3) {
      setInstrumentLoaded(false);
      props.instrument.dispose();
      let newPlayer = new Tone.GrainPlayer(
        audiobuffer ? audiobuffer : fileUrl,
        setInstrumentLoaded(true)
      ).toDestination();

      setInstrument(newPlayer);
      onInstrumentMod(fileUrl);
      setModulePage(null);
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
    console.log(effects);
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
          updateModules={props.setModules}
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
          updateModules={props.setModules}
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
          updateModules={props.setModules}
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
        />
      );
      break;
  }

  useEffect(() => {
    loadModuleEffects();
    return () => {
      clearEvents(props.module.id);
      effects.map((e) => !!e && e.dispose());
    };
  }, []);

  useEffect(() => {
    onEffectCreated();
  }, [effects]);

  useEffect(() => {
    !!props.instrument &&
      props.instrument.chain(
        ...effects.filter((e) => e !== false),
        Tone.Destination
      );
  }, [props.instrument, effects]);

  useEffect(() => {
    if (
      props.instrument !== null &&
      props.instrument !== undefined &&
      Tone.Transport.state !== "started"
    ) {
      props.instrument.name === "Players"
        ? props.instrument.stopAll()
        : props.instrument.name === "GrainPlayer" ||
          props.instrument.name === "Player"
        ? props.instrument.stop()
        : props.instrument.releaseAll();
    }
  }, [Tone.Transport.state]);

  return (
    <div
      style={{
        backgroundColor: colors[props.module.color][700],
        overflow:
          props.module.type === 2 || (props.module.type === 3 && "hidden"),
        pointerEvents: props.editMode ? "auto" : "none",
      }}
      className={
        "module " +
        //(props.module.type === 3 && " module-compact ") +
        (props.module.muted && " module-muted")
      }
    >
      <div className="module-header">
        {modulePage !== null && (
          <IconButton
            className="module-back-button"
            onClick={handleBackButtonClick}
          >
            <Icon style={{ fontSize: 20 }}>arrow_back_ios</Icon>
          </IconButton>
        )}
        <span className="module-title">{props.module.name}</span>
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
            onClose={() => setRenameDialog(false)}
          />
        )}
        <IconButton className="module-options-button" onClick={openMenu}>
          <Icon>more_vert</Icon>
        </IconButton>
        <Menu
          anchorEl={menuAnchorEl}
          keepMounted
          open={Boolean(menuAnchorEl)}
          onClose={closeMenu}
        >
          {props.module.type === 3 ? (
            <MenuItem
              onClick={handleFileExplorerButton}
              className="module-menu-option"
            >
              <Icon>graphic_eq</Icon>
              Load audio file
            </MenuItem>
          ) : (
            <MenuItem
              onClick={handleInstrumentButtonMode}
              className="module-menu-option"
            >
              <Icon>piano</Icon>
              Instrument
            </MenuItem>
          )}
          <MenuItem
            onClick={handleSettingsButtonMode}
            className="module-menu-option"
          >
            <Icon className="module-menu-option-icon">settings</Icon>
            Settings
          </MenuItem>
          <MenuItem
            onClick={handleEffectButtonMode}
            className="module-menu-option"
          >
            <Icon className="module-menu-option-icon">blur_on</Icon>
            Effects
          </MenuItem>
          <MenuItem className="module-menu-option" onClick={removeModule}>
            <Icon>delete</Icon>
            Remove
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
              setInstrumentsLoaded={props.setInstrumentsLoaded}
              updateModules={props.setModules}
              index={props.index}
            />
          )}
          {modulePage === "fileExplorer" && (
            <FileExplorer onFileClick={handleFileClick} compact />
          )}
          {modulePage === "settings" && (
            <ModuleSettings
              instrument={props.instrument}
              module={props.module}
              setModules={props.setModules}
              setSettingsMode={() => setModulePage(null)}
              index={props.index}
            />
          )}
          {modulePage === "effects" && (
            <ModuleEffects
              module={props.module}
              setModules={props.setModules}
              effects={effects}
              setEffects={setEffects}
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
  );
}

export default Module;
