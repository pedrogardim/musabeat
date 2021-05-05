import React, { useState } from "react";

//import { Paper, Icon, Card, Button } from '@material-ui/core';

import "./ChordProgression.css";

function Chord(props) {

  return <div className={
    "chord " +
    (props.active && "active-chord")
  }>{props.name}</div>;
}

export default Chord;
