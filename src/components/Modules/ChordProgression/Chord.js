import React, { Fragment } from "react";

import { Icon, IconButton } from "@material-ui/core";

import "./Chord.css";

function Chord(props) {
  const addChord = (e, direction) => {
    e.preventDefault();
    props.setChords((prev) => {
      let newChords = [...prev];
      let currentChordIndex = props.index;
      let newChordIndex = direction ? currentChordIndex + 1 : currentChordIndex;

      let currentChordDuration = newChords[currentChordIndex].duration / 2;
      let currentChordRhythm = newChords[currentChordIndex].rhythm;

      let newChord = {
        notes: [],
        duration: currentChordDuration,
        time: direction
          ? currentChordDuration + newChords[currentChordIndex].time
          : newChords[currentChordIndex].time,
        rhythm: direction
          ? currentChordRhythm.slice(0, (currentChordRhythm.length / 2)-1)
          : currentChordRhythm.slice(
              (currentChordRhythm.length / 2),
              currentChordRhythm.length
            ),
      };

      let currentChord = {
        notes: newChords[currentChordIndex].notes,
        duration: currentChordDuration,
        time: newChords[currentChordIndex].time +
        (1 - direction) * currentChordDuration,
        rhythm: !direction
        ? currentChordRhythm.slice(0, (currentChordRhythm.length / 2)-1)
        : currentChordRhythm.slice(
            (currentChordRhythm.length / 2),
            currentChordRhythm.length
          ),

      }

      newChords[currentChordIndex] = currentChord;
      newChords.splice(newChordIndex, 0, newChord);

      return newChords;
    });
  };

  const removeChord = (e) => {
    e.preventDefault();
    props.setChords((prev) => {
      let removedChordDuration = prev[props.index].duration;
      let newChords = prev.map((chord, index)=>{
        let newChord = {...chord};
        newChord.time = index > props.index ? chord.time - removedChordDuration : chord.time;
        return newChord;
      }).filter((e, i) => i !== props.index)
      console.log(newChords)
      return newChords;
    })
    };
  

  return (
    <div className="chord-wrapper">
      <div className="chord-button-wrapper">
        <IconButton
          className="chord-addchord-btn"
          onClick={(e) => addChord(e, 0)}
        >
          <Icon>add</Icon>
        </IconButton>
        <IconButton className="chord-removechord-btn" onClick={removeChord}>
          <Icon>delete</Icon>
        </IconButton>
        <IconButton
          className="chord-addchord-btn"
          onClick={(e) => addChord(e, 1)}
        >
          <Icon>add</Icon>
        </IconButton>
      </div>
      <div
        onClick={props.onClick}
        className={"chord " + (props.active && "selected-chord")}
        style={{ color: props.active && props.color[500] }}
      >
        {props.name}
      </div>
    </div>
  );
}

export default Chord;
