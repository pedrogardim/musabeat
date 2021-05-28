import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import { Fab, Icon, IconButton } from "@material-ui/core";

import { loadDrumPatch } from "../../assets/musicutils";

import { starterSession } from "../../assets/starterSession";

import "./Workspace.css";

import Module from "../Module/Module";
import ModulePicker from "./ModulePicker";
import Exporter from "./Exporter";
import Mixer from "./mixer/Mixer";

import * as MUIcolors from "@material-ui/core/colors";

const colors = [
  MUIcolors.red,
  MUIcolors.deepPurple,
  MUIcolors.indigo,
  MUIcolors.blue,
  MUIcolors.cyan,
  MUIcolors.teal,
  MUIcolors.lightGreen,
  MUIcolors.lime,
  MUIcolors.amber,
  MUIcolors.orange,
];

Tone.Transport.bpm.value = starterSession.bpm;
Tone.Transport.loop = true;
Tone.Transport.loopStart = 0;

function Workspace(props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [modules, setModules] = useState(starterSession.modules);
  //to undo and redo
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sessionSize, setSessionSize] = useState(4);
  const [modulePickerVisibility, chooseNewModule] = useState(false);
  const [mixerOpened, setMixerOpened] = useState(false);
  //temp: muted modules array as workspace state
  const [mutedModules, setMutedModules] = useState([]);

  const togglePlaying = () => {
    Tone.start();
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
      setIsPlaying(true);
    } else {
      Tone.Transport.pause();
      modules.forEach((e) =>
        e.instrument.name === "Players"
          ? e.instrument.stopAll()
          : e.instrument.name === "GrainPlayer" ||
            e.instrument.name === "Player"
          ? e.instrument.stop()
          : e.instrument.releaseAll()
      );
      setIsPlaying(false);
    }
  };

  const addModule = (moduletype) => {
    let module = {
      id: Math.max(...modules.map((e) => e.id)) + 1,
      name: "New Module",
      type: moduletype,
      subdiv: 16,
      patch: 0,
      score: [],
      instrument: {},
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setModules((prevModules) => [...prevModules, module]);
    chooseNewModule(false);
  };

  const adaptSessionSize = () => {
    let lengths = modules.map((module) =>
      module.type === 2
        ? Math.ceil(module.score[module.score.length - 1].time)
        : module.type === 3
        ? Math.ceil((module.score[0].duration + module.score[0].time) / Tone.Time("1m").toSeconds())
        : module.score.length
    );
    let longestModule = Math.max(...lengths);
    let newSessionSize = longestModule > 8 ? 16 : longestModule > 4 ? 8 : longestModule > 2 ? 4 : longestModule > 1 ? 2 : 1


    if (newSessionSize !== sessionSize) {
      setSessionSize(newSessionSize);
      Tone.Transport.loopEnd = Tone.Time("1m").toSeconds() * newSessionSize;
      console.log("Session size updated: " + newSessionSize);
    }
  };

  ////TODO: UNDO

  const undoSession = () => {
    setModules(sessionHistory[sessionHistory.length - 2]);
    setSessionHistory((prev) => {
      let newArray = [...prev];
      newArray.pop();
      newArray.pop();
      return newArray;
    });
    console.log(sessionHistory.map((e) => e[0].score[0][0]));
  };

  const registerSession = () => {
    setSessionHistory((prev) => {
      let newInput = [...prev];
      newInput.push([...modules]);
      return newInput;
    });
    console.log("change registered");
  };

  //KEY EVENTS

  const handleKeyPress = (event) => {
    Tone.start();
    switch (event.code) {
      case "Space":
        event.preventDefault();
        togglePlaying();
        break;
      /* case "KeyZ":
        event.preventDefault();
        if (event.metaKey || event.ctrlKey) {
          sessionHistory.length > 1
            ? undoSession()
            : alert("Nothing to be undone");
        }
        break; */
      case "KeyX":
        event.preventDefault();
        console.log(sessionHistory);

        break;
    }
  };

  useEffect(() => {
    adaptSessionSize();
    //registerSession();
    console.log(modules);
  }, [modules]);

  return (
    <div className="workspace" tabIndex="0" onKeyDown={handleKeyPress}>
      {modules.map((module, moduleIndex) => (
        <Fragment>
          <Module
            key={module.id}
            index={module.id}
            module={module}
            sessionSize={sessionSize}
            setModules={setModules}
            muted={mutedModules.includes(moduleIndex)}
          />
          {moduleIndex % 3 == 1 && <div className="break" />}
        </Fragment>
      ))}
      <div className="break" />
      <IconButton
        color="primary"
        style={{ marginTop: 48 }}
        onClick={() => chooseNewModule(true)}
      >
        <Icon>add</Icon>
      </IconButton>

      {modulePickerVisibility && (
        <ModulePicker
          toggleVisibility={chooseNewModule}
          addNewModule={addModule}
        />
      )}
      <Exporter
        sessionSize={sessionSize}
        sessionData={starterSession}
        modules={modules}
      />
      {/*<Drawer>{drawerCont}</Drawer>*/}

      {mixerOpened && (
        <Mixer setMutedModules={setMutedModules} modules={modules} />
      )}

      <Fab
        color="primary"
        className="fixed-fab"
        style={{ right: "calc(50% - 12px)" }}
        onClick={togglePlaying}
      >
        <Icon>{isPlaying ? "pause" : "play_arrow"}</Icon>
      </Fab>
      <Fab
        className="fixed-fab"
        color="primary"
        onClick={() => setMixerOpened((prev) => (prev ? false : true))}
      >
        <Icon style={{ transform: "rotate(90deg)" }}>tune</Icon>
      </Fab>
    </div>
  );
}

export default Workspace;
