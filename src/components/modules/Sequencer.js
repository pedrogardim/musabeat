import React, { useState } from "react";

import SequencerTile from "./SequencerTile";
import * as Tone from "tone";



//import { Paper, Icon, Card, Button } from '@material-ui/core';

import './Sequencer.css';

function Sequencer(props) {

    const [sequencerArray, changeSequence] = useState(Array(props.data.subdiv).fill(0).map(x => Array(0)));

    const synth = new Tone.Synth().toDestination();

    const inputNote = (x,y) => {

        console.log(x,y);
        changeSequence((prevSequence)=>{
            let currentstepnotes = [...prevSequence[x]];
            (currentstepnotes.indexOf(y) !== -1)?(currentstepnotes.filter(z => z != y)):(currentstepnotes.push(y));
            let newarray = [...prevSequence];
            newarray[x] = currentstepnotes;
            console.log(newarray[0]);
            return newarray;
        })

    }

    const playSynth = () => {
        synth.triggerAttackRelease("C4", "8n");
    }

    let sequencerrows = [];
   
    for(let seqrow = 0; seqrow < props.data.sounds; seqrow++){

        let tilesonrow = [];
        
        for(let seqcolumn = 0;seqcolumn < props.data.subdiv;seqcolumn++){
            tilesonrow.push(<SequencerTile key={[seqcolumn,seqrow]} editNote={inputNote} synth={playSynth} x={seqcolumn} y={seqrow}/>)
        }

        sequencerrows.push(<div className="sequencer-row" key={seqrow}>{tilesonrow}</div>);
    }

    return (
     <div className="sequencer">
           {sequencerrows}
      </div>
    );
  }
  
  export default Sequencer;
  