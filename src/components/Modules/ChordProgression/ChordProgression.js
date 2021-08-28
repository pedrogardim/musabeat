import React, { useState, useEffect } from "react";

import Chord from "./Chord";
import ChordEditor from "./ChordEditor";
import ChordRhythmSequence from "./ChordRhythmSequence";

import * as Tone from "tone";

import { IconButton, Icon, Fab } from "@material-ui/core";

import "./ChordProgression.css";

import {
  clearEvents,
  scheduleChordProgression,
} from "../../../utils/TransportSchedule";
import { colors } from "../../../utils/materialPalette";

function ChordProgression(props) {
  const [chords, setChords] = useState(props.module.score);
  const [activeChord, setActiveChord] = useState(0);
  const [activeRhythm, setActiveRhythm] = useState(null);
  const [selectedChord, setSelectedChord] = useState(null);
  const [instrument, setInstrument] = useState(props.instrument);
  const [editorOpen, setEditorOpen] = useState(false);

  const scheduleChords = () => {
    !props.module.muted
      ? scheduleChordProgression(
          chords,
          instrument,
          Tone.Transport,
          setActiveChord,
          setActiveRhythm,
          props.module.id,
          props.sessionSize,
          props.timeline,
          props.timelineMode
        )
      : clearEvents(props.module.id);
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
          notes: 0,
          duration: 1,
          time: Math.floor(newChords[newChords.length - 1].time) + 1,
          rhythm: [...newChords[newChords.length - 1].rhythm],
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
    props.isSessionLoaded &&
      props.updateModules((previousModules) => {
        let newModules = [...previousModules];
        newModules[props.index].score = chords;
        return newModules;
      });
    //update timeline on module size modified

    let newSize = Math.ceil(
      chords[chords.length - 1].time + chords[chords.length - 1].duration
    );

    let newTimeline = { ...props.timeline };
    newTimeline[props.module.id] = newTimeline[props.module.id].filter(
      (e) => e % newSize === 0
    );

    props.setTimeline(newTimeline);
  };

  useEffect(() => {
    instrument && scheduleChords();
    updateChords();
  }, [chords]);

  useEffect(() => {
    instrument && scheduleChords();
  }, [instrument, props.sessionSize, props.timeline]);

  useEffect(() => {
    setInstrument(props.instrument);
  }, [props.instrument]);

  useEffect(() => {
    selectedChord !== null &&
      Tone.Transport.state === "started" &&
      setSelectedChord(activeChord);
  }, [activeChord]);

  useEffect(() => {
    scheduleChords();
  }, [props.sessionSize]);

  useEffect(() => {
    setActiveChord(selectedChord);
    props.setSelection(selectedChord);
  }, [selectedChord]);

  //temp fix for unwanted unscheduling

  useEffect(() => {
    scheduleChords();
  }, [props.index, props.module.muted]);

  useEffect(() => {
    props.module.score !== chords && setChords(props.module.score);
  }, [props.module]);

  //

  return (
    <div className="module-innerwrapper" style={props.style}>
      <div className="chord-prog">
        {chords &&
          Array(Math.floor(Math.max(...chords.map((e) => e.time)) + 1))
            .fill(0)
            .map((chord, chordIndex) => (
              <div className="measure">
                {chords
                  .filter((e) => Math.floor(e.time) === chordIndex)
                  .map((inChord, inChordIndex) => (
                    <Chord
                      key={`chord${inChordIndex + chordIndex}`}
                      index={chords
                        .map((e) => JSON.stringify(e))
                        .indexOf(JSON.stringify(inChord))}
                      active={
                        activeChord ===
                        chords
                          .map((e) => JSON.stringify(e))
                          .indexOf(JSON.stringify(inChord))
                      }
                      setActiveChord={setActiveChord}
                      setChords={setChords}
                      onClick={() =>
                        handleClick(
                          chords
                            .map((e) => JSON.stringify(e))
                            .indexOf(JSON.stringify(inChord))
                        )
                      }
                      chord={inChord}
                      onlyChord={chords.length === 1}
                      color={colors[props.module.color]}
                    />
                  ))}
              </div>
            ))}
        <div className="break" />
        <IconButton size="small" onClick={addMeasure}>
          <Icon>add</Icon>
        </IconButton>
        {selectedChord !== null && (
          <Fab
            style={{
              backgroundColor: colors[props.module.color][600],
            }}
            onClick={() => setEditorOpen(true)}
            className="edit-chord-button"
            boxShadow={1}
          >
            <Icon>edit</Icon>
          </Fab>
        )}
      </div>
      {editorOpen && (
        <ChordEditor
          index={props.index}
          chords={chords}
          selectedChord={selectedChord}
          playChordPreview={() => playChordPreview(activeChord)}
          module={props.module}
          setChords={setChords}
          onClose={() => setEditorOpen(false)}
        />
      )}
      <ChordRhythmSequence
        activeChord={activeChord}
        activeRhythm={activeRhythm}
        chords={chords}
        color={colors[props.module.color]}
        setChords={setChords}
      />
    </div>
  );
}

export default ChordProgression;
