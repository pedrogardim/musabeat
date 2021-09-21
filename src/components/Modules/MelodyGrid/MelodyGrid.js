import React, { useState, useEffect, useRef } from "react";

import SequencerTile from "../DrumSequencer/SequencerTile";
import * as Tone from "tone";

import {
  scheduleMelodyGrid,
  clearEvents,
} from "../../../utils/TransportSchedule";

import { scales, musicalNotes } from "../../../assets/musicutils";

import {
  BottomNavigation,
  BottomNavigationAction,
  Typography,
} from "@material-ui/core";

import "./MelodyGrid.css";
import { colors } from "../../../utils/materialPalette";

function MelodyGrid(props) {
  const parentRef = useRef(null);
  const [cursorAnimator, setCursorAnimator] = useState(null);
  const [instrument, setInstrument] = useState(props.instrument);
  const [melodyArray, setMelodyArray] = useState(props.module.score);
  const [gridScale, setGridScale] = useState([
    "C3",
    "D3",
    "E3",
    "G3",
    "A3",
    "C4",
  ]);

  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [draggingSelect, setDraggingSelect] = useState(false);

  const inputNote = (x, y) => {
    let note = gridScale[y];
    /* setMelodyArray((previousSequence) =>
      previousSequence.map((measure, measureIndex) =>
        Object.assign(
          {},
          Object.values(measure).map((beat, beatIndex) =>
            measureIndex === currentMeasure && beatIndex === x
              ? beat === 0
                ? [note]
                : beat.includes(note) && beat.length > 1
                ? beat.filter((z) => z !== note)
                : beat.includes(note) && beat.length === 1
                ? 0
                : [...beat, note]
              : beat
          )
        )
      ) 
    );*/

    setMelodyArray((previousSequence) => {
      let newSequence = [...previousSequence];
      let beat = newSequence[currentMeasure][x];
      newSequence[currentMeasure][x] =
        beat === 0
          ? [note]
          : beat.includes(note) && beat.length > 1
          ? beat.filter((z) => z !== note)
          : beat.includes(note) && beat.length === 1
          ? 0
          : [...beat, note];
      return newSequence;
    });

    playNote(note);
  };

  const scheduleNotes = () => {
    !props.module.muted
      ? scheduleMelodyGrid(
          melodyArray,
          instrument,
          Tone.Transport,
          setCurrentBeat,
          setCurrentMeasure,
          props.module.id,
          props.sessionSize,
          props.timeline,
          props.timelineMode
        )
      : clearEvents(props.module.id);
  };

  /*  const getScaleFromSequenceNotes = () => {
    let notes = [];
    melodyArray.map((msre) =>
      msre.map((beat) =>
        beat.map((note) => !notes.includes(note) && notes.push(note))
      )
    );
    notes.sort(function (a, b) {
      if (Tone.Frequency(a).toFrequency() > Tone.Frequency(b).toFrequency()) {
        return 1;
      }
      if (Tone.Frequency(a).toFrequency() < Tone.Frequency(b).toFrequency()) {
        return -1;
      }
      return 0;
    });
    setGridScale(notes);
  }; */

  const playNote = (note, time) =>
    instrument.triggerAttackRelease(
      note,
      Tone.Time("1m").toSeconds() /
        Object.keys(melodyArray[currentMeasure]).length,
      time
    );

  const handleBottomNavClick = (value) => {
    setCurrentMeasure(value);
    Tone.Transport.seconds = value * Tone.Time("1m").toSeconds();
    setCurrentBeat(0);
  };

  const updateModuleSequence = () => {
    props.isSessionLoaded &&
      props.setModules((previousModules) => {
        let newModules = [...previousModules];
        newModules[props.index].score = melodyArray;
        return newModules;
      });
  };

  const updateGridRows = () => {
    let newNotes = [];
    for (
      let x = 0;
      x < props.module.range[1] - props.module.range[0] + 1;
      x++
    ) {
      let root =
        musicalNotes[props.module.root] + "" + (props.module.range[0] + x);
      //console.log(root,scales[props.module.scale][0])
      Tone.Frequency(root)
        .harmonize(scales[props.module.scale][0])
        .map((e) => newNotes.push(e.toNote()));
    }
    newNotes.push(
      Tone.Frequency(
        musicalNotes[props.module.root] + "" + (props.module.range[1] + 1)
      ).toNote()
    );
    setGridScale(newNotes);
    //TODO: Handle Hidden Notes
  };

  const handleMouseOver = (event) => {
    /* let hoverX =
      (event.nativeEvent.pageX -
        parentRef.current.getBoundingClientRect().left) /
      parentRef.current.offsetWidth; */
    setHovered(true);
  };

  const toggleCursor = () => {
    setCursorAnimator(
      setInterval(() => {
        let measure = parseInt(Tone.Transport.position.split(":")[0]);
        let beat = Math.floor(
          (Tone.Transport.seconds % Tone.Time("1m").toSeconds()) /
            (Tone.Time("1m").toSeconds() /
              Object.keys(props.module.score[0]).length)
        );
        //console.log("measure", measure);
        //currentMeasure !== measure &&
        if (measure < props.module.score.length) setCurrentMeasure(measure);
        //currentBeat !== beat &&
        setCurrentBeat(beat);
      }, 32)
    );
  };

  //===================
  /* 
  useEffect(() => {
    console.log("measure", currentMeasure);
  }, [currentMeasure]);

  useEffect(() => {
    console.log("beat", currentBeat);
  }, [currentBeat]); */

  useEffect(() => {
    toggleCursor();
    return () => {
      clearInterval(cursorAnimator);
    };
  }, []);

  useEffect(() => {
    setInstrument(props.instrument);
  }, [props.instrument]);

  /* 
  useEffect(() => {
    currentMeasure > props.module.score.length && setCurrentMeasure(0)
    setMelodyArray(props.module.score);
  }, [props.module.score]);

 */

  useEffect(() => {
    instrument && scheduleNotes();
    updateModuleSequence();
  }, [instrument, melodyArray]);

  useEffect(() => {
    setMelodyArray(props.module.score);
  }, [props.module]);

  useEffect(() => {
    instrument && scheduleNotes();
    //console.log(props.timeline);
  }, [props.sessionSize, props.timeline, props.module.muted]);

  useEffect(() => {
    updateGridRows();
    //console.log(gridScale);
  }, [props.module.root, props.module.scale, props.module.range]);

  return (
    <div
      className="module-innerwrapper"
      style={props.style}
      onMouseOver={handleMouseOver}
      onMouseLeave={() => {
        setHovered(false);
        setDraggingSelect(false);
      }}
      onMouseDown={() => setDraggingSelect(true)}
      onMouseUp={() => setDraggingSelect(false)}
    >
      <div className="melody-grid" ref={parentRef}>
        {gridScale.map((drumsound, row) => (
          <div className="melody-grid-row" key={row}>
            {hovered && (
              <div className="sequencer-row-label">
                <Typography
                  variant="overline"
                  style={{ color: colors[props.module.color][200] }}
                >
                  {drumsound}
                </Typography>
              </div>
            )}

            {Object.values(melodyArray[currentMeasure]).map((beat, column) => (
              <SequencerTile
                key={[column, row]}
                inputNote={inputNote}
                active={
                  typeof beat === "object" &&
                  beat.includes(
                    isNaN(drumsound) ? drumsound : parseInt(drumsound)
                  )
                }
                cursor={currentBeat === column}
                color={colors[props.module.color]}
                x={column}
                y={row}
                draggingSelect={draggingSelect}
              />
            ))}
          </div>
        ))}
      </div>

      {melodyArray.length > 1 && (
        <BottomNavigation
          value={currentMeasure}
          showLabels
          onChange={(event, newValue) => {
            handleBottomNavClick(newValue);
          }}
          className="melody-grid-bottomnav"
        >
          {melodyArray.length > 1 &&
            melodyArray.map((measure, index) => (
              <BottomNavigationAction
                style={{ minWidth: 0, maxWidth: "100%" }}
                key={index}
                label={index + 1}
              />
            ))}
        </BottomNavigation>
      )}
    </div>
  );
}

export default MelodyGrid;
