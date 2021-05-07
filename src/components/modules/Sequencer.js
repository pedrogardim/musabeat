import React, { useState, useEffect } from "react";

import SequencerTile from "./SequencerTile";
import * as Tone from "tone";

import * as Drumdata from "../../assets/drumkits";

import { scheduleDrumSequence } from "../../utils/TransportSchedule";


import {
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
} from "@material-ui/core";

import "./Sequencer.css";
import "../ui/Module.css";

function Sequencer(props) {
  const loadeddata = props.data.score;

  const [isBufferLoaded, setIsBufferLoaded] = useState(false);
  const [loadedDrumSounds, setDrumSounds] = useState({});
  const [sequencerArray, changeSequence] = useState(loadeddata);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [scheduledEvents, setScheduledEvents] = useState([]);

  let loadedpatch = props.data.patch;

  const inputNote = (x, y) => {
    changeSequence((previousSequence) => {
      let newSequence = [...previousSequence];
      let notesOnStep = newSequence[currentMeasure][x];

      let noteIndex = notesOnStep.indexOf(y);

      notesOnStep.includes(y)
        ? notesOnStep.splice(noteIndex, 1)
        : notesOnStep.push(y);

      return newSequence;
    });
    playDrumSound(y);
  };

  const scheduleNotes = () => {

    //setScheduledEvents([]);

    let scheduledNotes = [];

    scheduledNotes = scheduleDrumSequence(sequencerArray,loadedDrumSounds,Tone.Transport,scheduledEvents,setCurrentBeat,setCurrentMeasure)

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

    setDrumSounds(
      new Tone.Players(soundsmap, () => setIsBufferLoaded(true)).toDestination()
    );
  };

  const playDrumSound = (note, time) =>
    loadedDrumSounds.player(note).start(time !== undefined ? time : 0);

    const handleBottomNavClick = (value) => {
      setCurrentMeasure(value);
      Tone.Transport.seconds = value * Tone.Time("1m").toSeconds();
      setCurrentBeat(0);

    }
  //on startup
  useEffect(() => {
    loadDrumPatch();
  }, []); // <-- empty dependency array

   //on startup
   useEffect(() => {
    
  }, [currentMeasure]); // <-- empty dependency array

  //after loading sounds

  useEffect(() => {
    loadedDrumSounds.hasOwnProperty("name") && scheduleNotes();
  }, [loadedDrumSounds, sequencerArray]);

  //on changing sequence

  return (
    <div className="module-innerwrapper">
      {isBufferLoaded ? (
        <div className="sequencer">
          {Drumdata.labels.map((drumsound, row) => (
            <div className="sequencer-row" key={row}>
              {sequencerArray[currentMeasure].map((beat, column) => (
                <SequencerTile
                  key={[column, row]}
                  inputNote={inputNote}
                  active={beat.includes(row)}
                  cursor={currentBeat == column}
                  x={column}
                  y={row}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <CircularProgress />
      )}
      <BottomNavigation
        value={currentMeasure}
        showLabels
        onChange={(event, newValue) => {
          handleBottomNavClick(newValue);
        }}
        className="sequencer-bottomnav"
      >
        {sequencerArray.map((measure, index) => (
          <BottomNavigationAction key={index} label={index + 1} />
        ))}
      </BottomNavigation>
    </div>
  );
}

export default Sequencer;
