import React, { useState } from "react";

//import { Paper, Icon, Card, Button } from '@material-ui/core';

import "./ChordProgression.css";

function ChordProgression(props) {
  // it's active or not
  const clickedTile = () => {
    props.inputNote(props.x, props.y);
    props.play(props.y);
  };

  return (
    <div className="chord-prog">
      
    </div>
  );
}

export default ChordProgression;