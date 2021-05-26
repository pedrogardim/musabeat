import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import ChordRhythmTile from "./ChordRhythmTile";

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

    let newRhythm = currentRhythm === 1 ? 0 : 1

    props.updateRhythm(chordIndexOnScore,rhythmIndex,newRhythm)

  };

  useEffect(() => {
    var chordIndex = props.activeChord === null ? 0 : props.activeChord;
    setCurrentMeasure(Math.floor(props.chords[chordIndex].time));

    setMeasureChordIndex(
      props.chords
        .filter(
          (e) =>
            Math.floor(e.time) ===
            Math.floor(props.chords[chordIndex].time)
        )
        .indexOf(props.chords[chordIndex])
    );
  }, [props.activeChord]);

  useEffect(() => {
    getRhythmFromMeasure();
  }, [currentMeasure]);

  return (
    <div
      className="chord-rhythm-sequence"
      style={{ outline: "solid 1px " + props.color[900] }}
    >
      {measureRhythm.map((chords, chordIndex) => (
        <div
          className={
            "chord-rhythm-chord " +
            (measureChordIndex !== chordIndex &&
            Tone.Transport.state === "started"
              ? "inactive-chord-rhythm-chord"
              : "")
          }
        >
          {chords.map((rhythm, rhythmIndex) => (
            <ChordRhythmTile
              chordIndex={chordIndex}
              rhythmIndex={rhythmIndex}
              rhythm={rhythm}
              modifyRhythm={modifyRhythm}
              cursor={
                measureChordIndex === chordIndex &&
                props.activeRhythm === rhythmIndex
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
