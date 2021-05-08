import React, { useState, useEffect } from "react";

import "./Drawer.css";

function Drawer(props) {
  return (
    <div
      className={
        "adjustments-drawer " +
        (props.children !== null && "adjustments-drawer-active")
      }
    >
      {props.children}
    </div>
  );
}

export default Drawer;
