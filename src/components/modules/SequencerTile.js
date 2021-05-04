import React, { useState } from "react";

//import { Paper, Icon, Card, Button } from '@material-ui/core';

import "./Sequencer.css";

function SequencerTile(props) {
  // it's active or not
  const [state, changeState] = useState(props.state);

  const clickedTile = () => {
    state ? changeState(false) : changeState(true);
    props.editNote(props.x, props.y);
    props.play(props.y);
  };

  return (
    <div
      className={
        "sequencer-tile " +
        (state && "active-sequencer-tile") +
        " " +
        (props.cursor && "cursor-sequencer-tile")
      }
      onClick={clickedTile}
    ></div>
  );
}

export default SequencerTile;
