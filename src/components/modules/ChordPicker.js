import React, { useState, useEffect, Fragment } from "react";

import Chord from "./Chord";
import * as Tone from "tone";

import { chordNotestoName } from "../../assets/musicutils";

import { Fab, Icon } from "@material-ui/core";

import "./ChordPicker.css";

function ChordPicker(props) {
  //{props.selectedChord !== null}

  const [open, setOpen] = useState(false);

  const setChords = props.setChords;
  let instrument = props.instrument;
  let scaleChords = props.scaleChords;

  const clickHandler = (index) => {
    setChords((previousChords) => {
      let newChords = [...previousChords];
      newChords[props.selectedChord].notes =
        index === null ? [] : scaleChords[index];
      /* instrument.releaseAll();
      Tone.Transport.state !== "started" &&
        instrument.triggerAttackRelease(
          scaleChords[index],
          newChords[props.selectedChord].duration * Tone.Time("1m").toSeconds()
        ); */
      return newChords;
    });
  };

  return (
    <div onFocusOut={()=>setOpen(false)} className={open ? "chord-picker" : "chord-picker-compact"}>
      {!open && (
        <Fab
        style={{backgroundColor:props.color[600],color:"white"}}
        onClick={() => setOpen(true)}
          className="chord-picker-button"
          boxShadow={1}
        >
          <Icon>edit</Icon>
        </Fab>
      )}
      {open && (
        <Fragment>
          {scaleChords.map((chord, i) => (
            <Fab
              style={{backgroundColor:props.color[600],color:"white"}}
              onClick={() => clickHandler(i)}
              className="chord-picker-button"
              key={i}
              boxShadow={1}
            >
              {chordNotestoName(chord)}
            </Fab>
          ))}
          <Fab
            color="secondary"
            onClick={() => clickHandler(null)}
            className="chord-picker-button"
            boxShadow={1}
          >
            <Icon>highlight_off</Icon>
          </Fab>
        </Fragment>
      )}
    </div>
  );
}

export default ChordPicker;
