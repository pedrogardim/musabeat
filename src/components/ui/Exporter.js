import React, { useState } from "react";

import { Fab, Icon } from "@material-ui/core";

import { bounceSessionExport } from "../../utils/exportUtils";

function Exporter(props) {
  const [isReady, setIsReady] = useState(false);

  const modules = props.modules;
  const sessionData = props.sessionData;

  const handleButtonClick = () => {
    setIsReady(false);
    bounceSessionExport(modules, sessionData, setIsReady, props.sessionSize);
  };

  return (
    <div className="exporter">
      <Fab className="fixed-fab" style={{right:96}} color="primary" onClick={handleButtonClick}>
        <Icon>file_download</Icon>
      </Fab>
    </div>
  );
}

export default Exporter;
