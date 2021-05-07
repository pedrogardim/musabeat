import React, { useState } from "react";
import * as Tone from "tone";

import "./Workspace.css";

import { Button } from "@material-ui/core";

import {bounceSessionExport } from "../../utils/exportUtils";


function Exporter(props) {
  const [isReady,setIsReady] = useState(false);

  const modules = props.modules;
  const sessionData = props.sessionData

  const handleButtonClick = () => {
    bounceSessionExport(modules, sessionData);
  };

  return (
    <div className="exporter">
    <Button color="primary" onClick={handleButtonClick}>Export</Button>
    </div>
  );
}

export default Exporter;
