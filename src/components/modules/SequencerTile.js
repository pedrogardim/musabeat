import React, { useState } from "react";

//import { Paper, Icon, Card, Button } from '@material-ui/core';

import "./Sequencer.css";

function SequencerTile(props) {
  // it's active or not
  const { active } = props;
  const clickedTile = () => {
    props.inputNote(props.x, props.y);
  };

  const thisColor = props.color;


  return (
    <div
      className={
        "sequencer-tile"}
      onClick={clickedTile}
      style={{
        backgroundColor: active
          ? thisColor[900]
          : props.cursor
          ? thisColor[400]
          : thisColor[500],
        outline: "solid 1px "+ thisColor[800]
      }}
    ></div>
  );
}

export default SequencerTile;
