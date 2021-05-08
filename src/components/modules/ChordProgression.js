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
  const [selectedChord, setSelectedChord] = useState(null);
  const [instrument, setInstrument] = useState(defaultIntrument);
  const [scheduledEvents, setScheduledEvents] = useState([]);

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
    setSelectedChord((prevChord) => {
      instrument.releaseAll();

      if (chordindex === prevChord) {
        return null;
      } else {
        playChordPreview(chordindex);

        return chordindex;
      }
    });
    Tone.Transport.seconds =
      chords[chordindex].time * Tone.Time("1m").toSeconds();
  };

  const updateChords = () => {
    props.updateModule((previousModules) => {
      let newmodules = previousModules;
      newmodules[props.data.id].chords = chords;
      return newmodules;
    });
  };

  const playChordPreview = (chordindex) =>
    instrument.triggerAttackRelease(
      chords[chordindex].notes,
      chords[chordindex].duration * Tone.Time("1m").toSeconds()
    );

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

  useEffect(() => {
    (selectedChord !== null &&
      Tone.Transport.state !== "started") &&
      setSelectedChord(activeChord);
  }, [activeChord]);

  useEffect(() => {
    setActiveChord(selectedChord);
    props.setDrawer(() =>
      selectedChord === null ? null : (
        <ChordPicker
          selectedChord={selectedChord}
          chords={chords}
          setChords={setChords}
          instrument={instrument}
        />
      )
    );
  }, [selectedChord]);

  return (
    <div
      className="chord-prog"
      onBlur={() => console.log("chord prog unfocused")}
    >
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
    </div>
  );
}

export default ChordProgression;
