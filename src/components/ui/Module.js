import React, { useState } from "react";

import { Paper, Icon, Card, Button } from '@material-ui/core';


import './Module.css';

function Module(props) {

  const [number,setNumber] = useState(props.data.number);
  
  const clickHandler = () => {
    
    setNumber(Math.random());

  }

  const getValue = (event) => console.log(event.target.value);

  
  return (
   <Card className="module">
      <span className="module-title">{props.data.name}</span>
      <br/>
      <span className="module-title">{number}</span>
      <br/>
      <input onChange={getValue}/>
      <br/>
      <Button onClick={clickHandler}>Random Number</Button>
    </Card>
  );
}

export default Module;
