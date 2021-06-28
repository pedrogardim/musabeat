import "./ChordRhythmSequence.css";

function ChordRhythmTile(props) {
  const handleClick = () => {
    props.modifyRhythm(props.chordIndex, props.rhythmIndex, props.rhythm);
  };

  return (
    <div
      onClick={handleClick}
      className={
        "chord-rhythm-tile " + (props.cursor && "cursor-chord-rhythm-tile")
      }
      style={{
        outline: "solid 1px " + props.color[900],
        backgroundColor:
          props.rhythm === 1 ? props.color[600] : props.color[300],
      }}
    ></div>
  );
}

export default ChordRhythmTile;
