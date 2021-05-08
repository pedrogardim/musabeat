//import React, { useState } from "react";

//import { Paper, Icon, Card, Button } from '@material-ui/core';

import { Typography } from "@material-ui/core";
import "./Chord.css";

function Chord(props) {
  return (
    <div
      onClick={props.onClick}
      className={"chord " + (props.active && "selected-chord")}
    >
      {props.name}
    </div>
  );
}

export default Chord;
