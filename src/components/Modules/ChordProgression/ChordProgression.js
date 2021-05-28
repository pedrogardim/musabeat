import React, { useState, useEffect, Fragment } from "react";

import Chord from "./Chord";
import ChordPicker from "./ChordPicker";
import ChordRhythmSequence from "./ChordRhythmSequence";

import * as Tone from "tone";

import {
  getChordsFromScale,
  chordNotestoName,
  adaptSequencetoSubdiv,
} from "../../../assets/musicutils";

import { Divider } from "@material-ui/core";

import "./ChordProgression.css";

import { scheduleChordProgression } from "../../../utils/TransportSchedule";

function ChordProgression(props) {
  const [chords, setChords] = useState(props.module.score);
  const [activeChord, setActiveChord] = useState(null);
  const [activeRhythm, setActiveRhythm] = useState(null);
  const [selectedChord, setSelectedChord] = useState(null);
  const [instrument, setInstrument] = useState(props.module.instrument);

  const scheduleChords = () => {
    scheduleChordProgression(
      chords,
      instrument,
      Tone.Transport,
      setActiveChord,
      setActiveRhythm,
      props.module.id,
      props.sessionSize
    );
  };

  const handleClick = (chordindex) => {
    instrument.releaseAll();

    setSelectedChord((prevChord) => {
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
      let newmodules = [...previousModules];
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
    scheduleChords();
  }, [instrument,props.sessionSize]);

  useEffect(() => {
    setInstrument(props.module.instrument);
  }, [props.module.instrument]);


  useEffect(() => {
    selectedChord !== null &&
      Tone.Transport.state === "started" &&
      setSelectedChord(activeChord);
  }, [activeChord]);

  useEffect(() => {
    setActiveChord(selectedChord);
  }, [selectedChord]);

  return (
    <div className="module-innerwrapper" style={props.style}>
      <div className="chord-prog">
        <Divider className="measure-divider" orientation="vertical" />
        {chords.map((chord, i) => (
          <Fragment key={i}>
            {i > 0 &&
              Math.floor(chord.time) > Math.floor(chords[i - 1].time) && (
                <Divider
                  key={"divider" + i}
                  className="measure-divider"
                  orientation="vertical"
                />
              )}
            <Chord
              key={"chord" + i}
              active={activeChord === i}
              name={chordNotestoName(chord.notes)}
              onClick={() => handleClick(i)}
              color={props.module.color}
            />
          </Fragment>
        ))}
        <Divider className="measure-divider" orientation="vertical" />
        {
          <ChordRhythmSequence
            activeChord={activeChord}
            activeRhythm={activeRhythm}
            chords={chords}
            color={props.module.color}
            setChords={setChords}
          />
        }
      </div>
      {selectedChord !== null && (
        <ChordPicker
          selectedChord={selectedChord}
          scaleChords={getChordsFromScale(
            props.module.scale,
            props.module.root,
            props.module.complexity
          )}
          setChords={setChords}
          color={props.module.color}
          instrument={instrument}
        />
      )}
    </div>
  );
}

export default ChordProgression;
