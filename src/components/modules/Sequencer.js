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

  let loadedpatch = props.data.patch;

  const inputNote = (x, y) => {
    changeSequence((prevSequence) => {
      let [newsequence, notesonstep] = [prevSequence, prevSequence[x]];

      notesonstep.indexOf(y) === -1
        ? notesonstep.push(y)
        : (notesonstep = [...notesonstep].filter((note) => note !== y));

      newsequence[x] = notesonstep;
      return newsequence;
    });
  };

  const scheduleNotes = () => {

    scheduledEvents.length > 0 && scheduledEvents.forEach((note) => Tone.Transport.clear(note));

    let scheduledNotes = [];
    sequencerArray.forEach((beat, i) => {
      let beattimevalue = Tone.Time("1m").toSeconds() / sequencerArray.length;
      let beatscheduletime = beattimevalue * i;
      scheduledNotes.push(
        Tone.Transport.schedule((time) => {
          beat.forEach((note) => playDrumSound(note, time));
          setCurrentBeat(i);
        }, beatscheduletime)
      );
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

    setDrumSounds(new Tone.Players(soundsmap).toDestination());
  };

  const playDrumSound = (note, time) => {
    console.log(loadedDrumSounds, note);
    loadedDrumSounds.player(note).start(time !== undefined ? time : 0);
  };

  useEffect(() => {
    loadDrumPatch();
  }, []); // <-- empty dependency array

  useEffect(() => {
    scheduleNotes();
    console.log(loadedDrumSounds, "SET");
  }, [loadedDrumSounds]);

  return (
    <div className="sequencer" onClick={() => console.log(loadedDrumSounds)}>
      {Drumdata.labels.map((drumsound, row) => (
        <div className="sequencer-row" key={row}>
          {sequencerArray.map((beat, column) => (
            <SequencerTile
              key={[column, row]}
              editNote={inputNote}
              play={playDrumSound}
              state={sequencerArray[column].indexOf(row) !== -1}
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
