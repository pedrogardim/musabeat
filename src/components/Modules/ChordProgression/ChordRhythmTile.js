import React from "react";

import "./ChordRhythmSequence.css";

function ChordRhythmTile(props) {
  const handleClick = () => {
    typeof props.rhythm === "number"
      ? props.openArpSeq()
      : props.modifyRhythm(props.chordIndex, props.rhythmIndex, props.rhythm);
  };

  return (
    <div
      onClick={handleClick}
      className={
        "chord-rhythm-tile " + (props.cursor && "cursor-chord-rhythm-tile")
      }
      style={{
        outline: !props.arpeggiatorState && "solid 1px " + props.color[900],
        backgroundColor:
          props.rhythm === true ? props.color[600] : props.color[300],
      }}
    >
      {props.arpeggiatorState &&
        (props.chordNotes ? props.chordNotes : [...Array(5).keys()]).map(
          (e, i) => (
            <div
              key={e + i}
              style={{
                flex: "1 1 1px",
                backgroundColor:
                  i ===
                  props.rhythm %
                    (props.chordNotes ? props.chordNotes.length : 5)
                    ? props.color[600]
                    : props.color[300],
              }}
            />
          )
        )}
    </div>
  );
}

export default ChordRhythmTile;
