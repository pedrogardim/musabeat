import React, { useState } from "react";

import { Button } from "@material-ui/core";

import {bounceSessionExport } from "../../utils/exportUtils";

function Exporter(props) {
  const [isReady,setIsReady] = useState(false);

  const modules = props.modules;
  const sessionData = props.sessionData

  const handleButtonClick = () => {
    setIsReady(false);
    bounceSessionExport(modules, sessionData, setIsReady,props.sessionSize);
  };

  return (
    <div className="exporter">
    <Button color="primary" onClick={handleButtonClick}>Export</Button>
    </div>
  );
}

export default Exporter;
