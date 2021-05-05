import React, { useState, useEffect } from "react";

import Chord from "./Chord";
import * as Tone from "tone";

import * as MusicUtils from "../../assets/musicutils";

//import { Paper, Icon, Card, Button } from '@material-ui/core';

import "./ChordProgression.css";

function ChordProgression(props) {
  const [chords, setChords] = useState(props.data.chords);
  //const [selectedChord, setSelectedChord] = useState("");
  const [currentChord, setCurrentChord] = useState(0);
  const [instrument, setInstrument] = useState(
    MusicUtils.instrumentContructor(0)
  );
  const [scheduledEvents, setScheduledEvents] = useState([]);

  const scheduleChords = () => {
    scheduledEvents.length > 0 &&
      scheduledEvents.forEach((event) => Tone.Transport.clear(event));
    //setScheduledEvents([]);

    let scheduledChords = [];
    chords.forEach((chord, chordIndex) => {
      let chordduration = Tone.Time("1m").toSeconds() * chord.duration;
      let rhythmduration = chordduration / chord.rhythm.length;

      chord.rhythm.forEach((rhyhtm, rhythmIndex) => {
        let rhythmscheduletime = (rhythmduration * rhythmIndex) + (Tone.Time("1m").toSeconds() * chord.time);
        let thisevent = Tone.Transport.schedule((time) => {
          instrument.triggerAttackRelease(chord.notes, rhythmduration, time);
          setCurrentChord(chordIndex);
        }, rhythmscheduletime);
        scheduledChords.push(thisevent);
      });
    });
    setScheduledEvents(scheduledChords);
  };

  useEffect(() => {
    //loadInstrument();
  }, []); // <-- empty dependency array

  //after loading sounds

  useEffect(() => {
    scheduleChords();
    //loadedDrumSounds.hasOwnProperty("name") && scheduleNotes();
  }, [chords]);

  return (
    <div className="chord-prog">
      {chords.map((chord, i) => (
        <Chord key={i} active={currentChord == i} name={MusicUtils.chordNotestoName(chord.notes)} />
      ))}
    </div>
  );
}

export default ChordProgression;
