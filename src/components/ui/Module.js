import React, { useState } from "react";

import { Card } from '@material-ui/core';

import Sequencer from "../modules/Sequencer";
import ChordProgression from "../modules/ChordProgression";

import './Module.css';

function Module(props) {

  //const [number,setNumber] = useState(props.data.number);

  //const getValue = (event) => console.log(event.target.value);

  let innerModule = <span>Nothing Here</span>;

  switch(props.data.type){
    case 0:
      innerModule = <Sequencer data={props.data} kit="0" updateModule={props.updateModule}/>;
      break;
      case 2:
      innerModule = <ChordProgression data={props.data} updateModule={props.updateModule} setDrawer={props.setDrawer}/>;
      break;
  }


  return (
   <Card className="module">
      <span className="module-title">{props.data.name}</span>
        {innerModule}     

    </Card>
  );
}

export default Module;
