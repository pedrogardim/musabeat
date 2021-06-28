import { Icon, IconButton } from "@material-ui/core";

import { chordNotestoName } from "../../../assets/musicutils";

import { addChord, removeChord } from "../../../utils/chordUtils";

import "./Chord.css";

function Chord(props) {
  const handleAddChord = (e, direction) => {
    e.preventDefault();
    addChord(direction, props.setChords, props.index, props.chord.duration);
  };

  const handleRemoveChord = (e) => {
    e.preventDefault();
    removeChord(props.setChords, props.index);
    props.setActiveChord(0);
  };

  return (
    <div
      className="chord-wrapper"
      style={{ width: props.chord.duration * 100 + "%" }}
    >
      <div className="chord-button-wrapper">
        <IconButton
          className="chord-addchord-btn"
          onClick={(e) => handleAddChord(e, 0)}
        >
          <Icon>add</Icon>
        </IconButton>
        {!props.onlyChord && (
          <IconButton
            className="chord-removechord-btn"
            onClick={handleRemoveChord}
          >
            <Icon>delete</Icon>
          </IconButton>
        )}
        <IconButton
          className="chord-addchord-btn"
          onClick={(e) => handleAddChord(e, 1)}
        >
          <Icon>add</Icon>
        </IconButton>
      </div>
      <div
        onClick={props.onClick}
        className={"chord " + (props.active && "selected-chord")}
        style={{ color: props.active && props.color[500] }}
      >
        {chordNotestoName(props.chord.notes)}
      </div>
    </div>
  );
}

export default Chord;
