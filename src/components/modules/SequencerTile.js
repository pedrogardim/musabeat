import React, { useState } from "react";

//import { Paper, Icon, Card, Button } from '@material-ui/core';

import './Sequencer.css';

function SequencerTile(props) {

    // it's active or not
    const [state,changeState] = useState(false);

    const toggleTile = () => {
      (state)?(changeState(false)):(changeState(true));
      props.editNote(props.x,props.y);
      props.synth();
    }
   
    return (
     <div className={"sequencer-tile " + (state && "active-sequencer-tile")} onClick={toggleTile}></div>
    );
  }
  
  export default SequencerTile;
  