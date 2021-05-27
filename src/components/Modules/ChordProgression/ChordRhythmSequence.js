import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import ChordRhythmTile from "./ChordRhythmTile";

import { adaptSequencetoSubdiv } from "../../../assets/musicutils";

import { Icon, IconButton } from "@material-ui/core";

import "./ChordRhythmSequence.css";

const subdivisionValues = [4, 8, 12, 16, 24, 32];

function ChordRhythmSequence(props) {
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [measureRhythm, setMeasureRhythm] = useState([]);
  const [measureChordIndex, setMeasureChordIndex] = useState(0);

  const getRhythmFromMeasure = () => {
    let measureRhythm = props.chords
      .filter((e) => Math.floor(e.time) === currentMeasure)
      .map((e) => e.rhythm);
    setMeasureRhythm(measureRhythm);
  };

  const modifyRhythm = (chordIndex, rhythmIndex, currentRhythm) => {
    let chordIndexOnScore = props.chords.indexOf(
      props.chords.filter((e) => Math.floor(e.time) === currentMeasure)[
        chordIndex
      ]
    );

    let newRhythm = currentRhythm === 1 ? 0 : 1;

    props.setChords((previousChords) => {
      let newChords = [...previousChords];
      newChords[chordIndexOnScore].rhythm[rhythmIndex] = newRhythm;
      return newChords;
    });
  };

  const updateRhythmSteps = (chordIndex, addRemove) => {
    let chordIndexOnScore = props.chords.indexOf(
      props.chords.filter((e) => Math.floor(e.time) === currentMeasure)[
        chordIndex
      ]
    );
    props.setChords((previousChords) => {
      let newChords = [...previousChords];
      let rhythmArray = newChords[chordIndexOnScore].rhythm;
      let newSteps = addRemove
        ? rhythmArray.length * 2
        : rhythmArray.length / 2;
      if (newSteps <= 16 && newSteps >= 1)
        newChords[chordIndexOnScore].rhythm = adaptSequencetoSubdiv(
          rhythmArray,
          newSteps
        );

      return newChords;
    });
  };

  useEffect(() => {

    if(props.activeChord === null) return;

    var chordIndex = props.activeChord === null ? 0 : props.activeChord;
    setCurrentMeasure(Math.floor(props.chords[chordIndex].time));

    setMeasureChordIndex(
      props.chords
        .filter(
          (e) =>
            Math.floor(e.time) === Math.floor(props.chords[chordIndex].time)
        )
        .indexOf(props.chords[chordIndex])
    );
  }, [props.activeChord]);

  useEffect(() => {
    getRhythmFromMeasure();
  }, [currentMeasure,props.chords]);


  return (
    <div
      className="chord-rhythm-sequence"
    >
      {measureRhythm.map((chords, chordIndex) => (
        <div
          className={
            "chord-rhythm-chord " +
            (measureChordIndex === chordIndex && "active-chord-rhythm-chord")
          }
        >
          <IconButton
            onClick={() => updateRhythmSteps(chordIndex,true)}
            className="add-step-chord-rhythm-button"
          >
            <Icon>add</Icon>
          </IconButton>
          <IconButton
            onClick={() => updateRhythmSteps(chordIndex,false)}
            className="remove-step-chord-rhythm-button"
          >
            <Icon>remove</Icon>
          </IconButton>
          {chords.map((rhythm, rhythmIndex) => (
            <ChordRhythmTile
              chordIndex={chordIndex}
              rhythmIndex={rhythmIndex}
              rhythm={rhythm}
              modifyRhythm={modifyRhythm}
              cursor={
                measureChordIndex === chordIndex &&
                props.activeRhythm === rhythmIndex &&
                Tone.Transport.state === "started"
              }
              color={props.color}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default ChordRhythmSequence;