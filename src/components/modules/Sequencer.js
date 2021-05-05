import React, { useState, useEffect } from "react";

import SequencerTile from "./SequencerTile";
import * as Tone from "tone";

import * as Drumdata from "../../assets/drumkits";

//import { Paper, Icon, Card, Button } from '@material-ui/core';

import "./Sequencer.css";

function Sequencer(props) {
  const loadeddata =
    props.data.score.length === props.data.subdiv
      ? props.data.score
      : Array(props.data.subdiv)
          .fill(0)
          .map((x) => Array(0));

  const [sequencerArray, changeSequence] = useState(loadeddata);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [loadedDrumSounds, setDrumSounds] = useState({});
  const [scheduledEvents, setScheduledEvents] = useState([]);

  //   setCurrentBeat(currentbeat + 1);

  //   setCurrentBeat((prevBeat) => {
  //     return prevBeat + 1;
  //   });

  let loadedpatch = props.data.patch;

  const inputNote = (x, y) => {
    changeSequence((previousSequence) => {
      let newsequence = [...previousSequence];
      let notesonstep = [...previousSequence[x]]

      notesonstep.indexOf(y) === -1
        ? notesonstep.push(y)
        : (notesonstep = [...notesonstep].filter((note) => note !== y));

      newsequence[x] = notesonstep;
      return newsequence;
    });
  };

  const scheduleNotes = () => {
    scheduledEvents.length > 0 &&
      scheduledEvents.forEach((event) => Tone.Transport.clear(event));
    //setScheduledEvents([]);

    let scheduledNotes = [];
    sequencerArray.forEach((beat, i) => {
      let beattimevalue = Tone.Time("1m").toSeconds() / sequencerArray.length;
      let beatscheduletime = beattimevalue * i;

      let thisevent = Tone.Transport.schedule((time) => {
        beat.forEach((note) => playDrumSound(note, time));
        setCurrentBeat(i);
      }, beatscheduletime);
      scheduledNotes.push(thisevent);
    });
    setScheduledEvents(scheduledNotes);
  };

  const loadDrumPatch = () => {
    //if(Drumdata.kits[loadedpatch].hasOwnProperty('sounds'))
    let soundsmap = Drumdata.labels.map((element, index) => {
      return (
        "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/" +
        Drumdata.kits[loadedpatch].baseUrl +
        "/" +
        index +
        ".wav"
      );
    });

    console.log("LOADED");

    setDrumSounds(new Tone.Players(soundsmap).toDestination());
  };

  const playDrumSound = (note, time) =>
    loadedDrumSounds.player(note).start(time !== undefined ? time : 0);

  //on startup
  useEffect(() => {
    loadDrumPatch();
  }, []); // <-- empty dependency array

  //after loading sounds

  useEffect(() => {
    loadedDrumSounds.hasOwnProperty("name") && scheduleNotes();
    console.log("changed");
  }, [loadedDrumSounds, sequencerArray]);

  //on changing sequence

  return (
    <div className="sequencer">
      {Drumdata.labels.map((drumsound, row) => (
        <div className="sequencer-row" key={row}>
          {sequencerArray.map((beat, column) => (
            <SequencerTile
              key={[column, row]}
              inputNote={inputNote}
              play={playDrumSound}
              active={beat.indexOf(row) !== -1}
              cursor={currentBeat == column}
              x={column}
              y={row}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Sequencer;
