import React, { useState, useEffect } from "react";

import Chord from "./Chord";
import ChordPicker from "./ChordPicker";

import * as Tone from "tone";

import * as MusicUtils from "../../assets/musicutils";

import { Divider } from "@material-ui/core";

import "./ChordProgression.css";

import { scheduleChordProgression } from "../../utils/TransportSchedule";

const defaultIntrument = MusicUtils.instrumentContructor(2);

function ChordProgression(props) {
  const [chords, setChords] = useState(props.data.chords);
  const [activeChord, setActiveChord] = useState(null);
  const [instrument, setInstrument] = useState(defaultIntrument);
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [selectedChord, setSelectedChord] = useState(null);

  const scheduleChords = () => {
    let scheduledChords = [];

    scheduledChords = scheduleChordProgression(
      chords,
      instrument,
      Tone.Transport,
      scheduledEvents,
      setActiveChord
    );

    setScheduledEvents(scheduledChords);
  };

  const handleClick = (chordindex) => {
    setActiveChord((prevChord) =>
      chordindex == prevChord ? null : chordindex
    );
    setSelectedChord((prevChord) =>
      chordindex == prevChord ? null : chordindex
    );
    instrument.releaseAll();
    instrument.triggerAttackRelease(chords[chordindex].notes, "4n");
  };

  const updateChords = () => {
    props.updateModule((previousModules) => {
      let newmodules = previousModules;
      newmodules[props.data.id].chords = chords;
      return newmodules;
    });
  };

  const updateInstrument = () => {
    props.updateModule((previousModules) => {
      let newmodules = [...previousModules];
      newmodules[props.data.id].instrument = instrument;
      return newmodules;
    });
  };

  useEffect(() => {
    scheduleChords();
    updateChords();
  }, [chords]);

  useEffect(() => {
    updateInstrument();
  }, [instrument]);

  return (
    <div className="chord-prog">
      <Divider className="measure-divider" orientation="vertical" />
      {chords.map((chord, i) => (
        <Chord
          key={i}
          active={activeChord === i}
          name={MusicUtils.chordNotestoName(chord.notes)}
          onClick={() => handleClick(i)}
        />
      ))}
      <Divider className="measure-divider" orientation="vertical" />
      <ChordPicker selectedChord={selectedChord} chords={chords} setChords={setChords}/>
    </div>
  );
}

export default ChordProgression;
