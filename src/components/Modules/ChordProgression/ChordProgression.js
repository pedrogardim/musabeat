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

import { Divider, IconButton, Icon } from "@material-ui/core";

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

  const addMeasure = () => {
    let chordsLength = Math.ceil(
      chords[chords.length - 1].time + chords[chords.length - 1].duration
    );

    let newDuration =
      chordsLength >= 8
        ? 16
        : chordsLength >= 4
        ? 8
        : chordsLength >= 2
        ? 4
        : chordsLength >= 1
        ? 2
        : 1;

    let measuresToAdd = newDuration - chordsLength;

    console.log(chordsLength, newDuration, measuresToAdd);

    setChords((prev) => {
      let newChords = [...prev];
      for (let x = 0; x < measuresToAdd; x++) {
        newChords.push({
          notes: [],
          duration: 1,
          time: Math.ceil(newChords[newChords.length - 1].time)+1,
          rhythm: newChords[newChords.length - 1].rhythm,
        });
      }
      return newChords;
    });
  };

  const playChordPreview = (chordindex) => {
    instrument.releaseAll();
    instrument.triggerAttackRelease(
      chords[chordindex].notes,
      chords[chordindex].duration * Tone.Time("1m").toSeconds()
    );
  };

  const updateChords = () => {
    props.updateModules((previousModules) => {
      let newModules = [...previousModules];
      newModules[props.module.id].score = chords;
      return newModules;
    });
  };

  useEffect(() => {
    scheduleChords();
    updateChords();
  }, [chords]);

  useEffect(() => {
    scheduleChords();
  }, [instrument, props.sessionSize]);

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
        {chords.map(
          (chord, chordIndex) =>
            (chordIndex === 0 ||
              Math.floor(chord.time) !==
                Math.floor(chords[chordIndex-1].time)) && (
              <div className="measure">
                {chords.map(
                  (inChord, inChordIndex) =>
                    Math.floor(inChord.time) === chordIndex && (
                      <Chord
                        key={inChordIndex}
                        index={inChordIndex}
                        active={activeChord === inChordIndex}
                        name={chordNotestoName(inChord.notes)}
                        setChords={setChords}
                        onClick={() => handleClick(inChordIndex)}
                        color={props.module.color}
                        duration={inChord.duration}
                      />
                    )
                )}
              </div>
            )
        )}
        <div className="break" />
        <IconButton size="small" onClick={addMeasure}>
          <Icon>add</Icon>
        </IconButton>

        
      </div>
      <ChordRhythmSequence
          activeChord={activeChord}
          activeRhythm={activeRhythm}
          chords={chords}
          color={props.module.color}
          setChords={setChords}
        />
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
