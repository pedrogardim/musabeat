import React, { useState, useEffect } from "react";

import SequencerTile from "./SequencerTile";
import * as Tone from "tone";

import * as Drumdata from "../../assets/drumkits";

import {
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
} from "@material-ui/core";

import "./Sequencer.css";
import "../ui/Module.css";

function Sequencer(props) {
  const loadeddata = props.data.score;

  const [isBufferLoaded, setIsBufferLoaded] = useState(false);
  const [loadedDrumSounds, setDrumSounds] = useState({});
  const [sequencerArray, changeSequence] = useState(loadeddata);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [scheduledEvents, setScheduledEvents] = useState([]);

  let loadedpatch = props.data.patch;

  const inputNote = (x, y) => {
    changeSequence((previousSequence) => {
      let newsequence = [...previousSequence];
      let notesonstep = newsequence[currentMeasure][x];

      notesonstep.indexOf(y) === -1
        ? notesonstep.push(y)
        : notesonstep.filter((note) => note !== y);

      return newsequence;
    });
  };

  const scheduleNotes = () => {
    scheduledEvents.length > 0 &&
      scheduledEvents.forEach((event) => Tone.Transport.clear(event));
    //setScheduledEvents([]);

    let scheduledNotes = [];

    sequencerArray.forEach((measure, measureIndex) => {
      measure.forEach((beat, i) => {
        let beattimevalue = Tone.Time("1m").toSeconds() / measure.length;
        let beatscheduletime =
          beattimevalue * i + Tone.Time("1m").toSeconds() * measureIndex;

        let thisevent = Tone.Transport.schedule((time) => {
          beat.forEach((note) => playDrumSound(note, time));
          setCurrentBeat(i);
          setCurrentMeasure(measureIndex);
        }, beatscheduletime);
        scheduledNotes.push(thisevent);
      });
    });

    setScheduledEvents(scheduledNotes);
  };

  const loadDrumPatch = () => {
    //if(Drumdata.kits[loadedpatch].hasOwnProperty('sounds'))
    let soundsmap = Drumdata.labels.map((element, index) => {
      return (
        "https://raw.githubusercontent.com/pedrogardim/musa_loops_old/master/assets/samples/drums/" +
        Drumdata.kits[loadedpatch].baseUrl +
        "/" +
        index +
        ".wav"
      );
    });

    setDrumSounds(
      new Tone.Players(soundsmap, () => setIsBufferLoaded(true)).toDestination()
    );
  };

  const playDrumSound = (note, time) =>
    loadedDrumSounds.player(note).start(time !== undefined ? time : 0);

  //on startup
  useEffect(() => {
    loadDrumPatch();
  }, []); // <-- empty dependency array

  //after loading sounds

  useEffect(() => {
    loadedDrumSounds.hasOwnProperty("name") && scheduleNotes();

    console.log(sequencerArray);
  }, [loadedDrumSounds, sequencerArray]);

  //on changing sequence

  return (
    <div className="module-innerwrapper">
      {isBufferLoaded ? (
        <div className="sequencer">
          {Drumdata.labels.map((drumsound, row) => (
            <div className="sequencer-row" key={row}>
              {sequencerArray[currentMeasure].map((beat, column) => (
                <SequencerTile
                  key={[column, row]}
                  inputNote={inputNote}
                  play={playDrumSound}
                  active={beat.indexOf(row) !== -1}
                  cursor={currentBeat == column}
                  x={column}
                  y={row}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <CircularProgress />
      )}
      <BottomNavigation
        value={currentMeasure}
        showLabels
        onChange={(event, newValue) => {
          setCurrentMeasure(newValue);
        }}
        className="sequencer-bottomnav"
      >
        {sequencerArray.map((measure, index) => (
          <BottomNavigationAction key={index} label={index + 1} />
        ))}
      </BottomNavigation>
    </div>
  );
}

export default Sequencer;
