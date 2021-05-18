import React, { useState, useEffect, Fragment } from "react";

import Chord from "./Chord";
import ChordPicker from "./ChordPicker";

import * as Tone from "tone";

import * as MusicUtils from "../../assets/musicutils";

import {
  getChordsFromScale,
  chordNotestoName,
  scales,
  musicalNotes,
} from "../../assets/musicutils";

import { Divider } from "@material-ui/core";

import "./ChordProgression.css";

import { scheduleChordProgression } from "../../utils/TransportSchedule";

const defaultIntrument = MusicUtils.instrumentContructor(2);

function ChordProgression(props) {
  const [chords, setChords] = useState(props.module.score);
  const [activeChord, setActiveChord] = useState(null);
  const [selectedChord, setSelectedChord] = useState(null);
  const [instrument, setInstrument] = useState(props.module.instrument);

  const scheduleChords = () => {
    scheduleChordProgression(
      chords,
      instrument,
      Tone.Transport,
      setActiveChord,
      props.module.id,
      props.sessionSize
    );
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
    props.updateModules((previousModules) => {
      let newmodules = previousModules;
      newmodules[props.module.id].chords = chords;
      return newmodules;
    });
  };

  const playChordPreview = (chordindex) => {
    instrument.releaseAll();
    instrument.triggerAttackRelease(
      chords[chordindex].notes,
      chords[chordindex].duration * Tone.Time("1m").toSeconds()
    );
  };

  useEffect(() => {
    scheduleChords();
    updateChords();
  }, [chords]);

  useEffect(() => {
    setInstrument(props.module.instrument);
  }, [props.module.instrument]);

  useEffect(() => {
    scheduleChords();
  }, [instrument]);

  useEffect(() => {
    selectedChord !== null &&
      Tone.Transport.state === "started" &&
      setSelectedChord(activeChord);
  }, [activeChord]);

  useEffect(() => {
    setActiveChord(selectedChord);
  }, [selectedChord]);

  useEffect(() => {
    scheduleChords();
  }, [props.sessionSize]);

  return (
    <div className="chord-prog" style={props.style}>
      <Divider className="measure-divider" orientation="vertical" />
      {chords.map((chord, i) => (
        <Fragment key={i}>
          {i > 0 && Math.floor(chord.time) > Math.floor(chords[i - 1].time) && (
            <Divider
              key={"divider" + i}
              className="measure-divider"
              orientation="vertical"
            />
          )}
          <Chord
            key={"chord" + i}
            active={activeChord === i}
            name={MusicUtils.chordNotestoName(chord.notes)}
            onClick={() => handleClick(i)}
          />
        </Fragment>
      ))}
      <Divider className="measure-divider" orientation="vertical" />
      <div style={{ height: 0, width: "100%" }} />
      {selectedChord !== null && (
        <ChordPicker
          selectedChord={selectedChord}
          scaleChords={getChordsFromScale(
            props.module.scale,
            props.module.root,
            props.module.complexity
          )}
          setChords={setChords}
        />
      )}
    </div>
  );
}

export default ChordProgression;
