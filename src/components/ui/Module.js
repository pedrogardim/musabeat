import React, { useState } from "react";

import { Card } from '@material-ui/core';

import Sequencer from "../modules/Sequencer";


import './Module.css';

function Module(props) {

  //const [number,setNumber] = useState(props.data.number);

  //const getValue = (event) => console.log(event.target.value);

  let innerModule = <p>Nothing Here</p>;

  switch(props.data.type){
    case 0:
      innerModule = <Sequencer data={props.data} kit="0"/>;
      break;
  }


  return (
   <Card className="module">
      <span className="module-title">{props.data.name}</span>
      <div className="module-innerwrapper">
        {innerModule}     
      </div>
    </Card>
  );
}

export default Module;
