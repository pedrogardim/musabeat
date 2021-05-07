import React, { useState } from "react";

//import { Paper, Icon, Card, Button } from '@material-ui/core';

import "./Sequencer.css";

function SequencerTile(props) {
  // it's active or not
  const {active} = props;
  const clickedTile = () => {
    props.inputNote(props.x, props.y);
  };

  return (
    <div
      className={
        "sequencer-tile " +
        (active && "active-sequencer-tile") +
        " " +
        (props.cursor && "cursor-sequencer-tile")
      }
      onClick={clickedTile}
    ></div>
  );
}

export default SequencerTile;
