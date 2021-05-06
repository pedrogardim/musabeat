import React, { useState, useEffect } from "react";

import Chord from "./Chord";
import * as Tone from "tone";

import * as MusicUtils from "../../assets/musicutils";

import { Divider } from "@material-ui/core";

import "./ChordProgression.css";

const defaultIntrument = MusicUtils.instrumentContructor(2);

function ChordProgression(props) {
  const [chords, setChords] = useState(props.data.chords);
  const [activeChord, setActiveChord] = useState(null);
  const [instrument, setInstrument] = useState(defaultIntrument);
  const [scheduledEvents, setScheduledEvents] = useState([]);

  const scheduleChords = () => {
    console.log("scheduled");
    scheduledEvents.length > 0 &&
      scheduledEvents.forEach((event) => Tone.Transport.clear(event));
    //setScheduledEvents([]);

    let scheduledChords = [];
    chords.forEach((chord, chordIndex) => {
      let chordduration = Tone.Time("1m").toSeconds() * chord.duration;
      let chordtimetostart = Tone.Time("1m").toSeconds() * chord.time;
      let rhythmduration = chordduration / chord.rhythm.length;

      chord.rhythm.forEach((rhythm, rhythmIndex) => {
        let rhythmscheduletime =
          rhythmduration * rhythmIndex + chordtimetostart;
        let thisevent = Tone.Transport.schedule((time) => {

          switch(rhythm){
            case 0:
          instrument.triggerRelease(time);
          break;
            case 1:
          instrument.triggerAttackRelease(chord.notes, rhythmduration, time);
          break;

        }

          //console.log(chord.notes);
          setActiveChord(chordIndex);
        }, rhythmscheduletime);
        scheduledChords.push(thisevent);
      });
    });
    setScheduledEvents(scheduledChords);
  };

  const handleClick = (chordindex) => {
    setActiveChord((prevChord) => (chordindex == prevChord ? null : chordindex));
    instrument.releaseAll()

    instrument.triggerAttackRelease(chords[chordindex].notes,"4n")
  };

  useEffect(() => {
    scheduleChords();
  }, [chords]);

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
    </div>
  );
}

export default ChordProgression;
