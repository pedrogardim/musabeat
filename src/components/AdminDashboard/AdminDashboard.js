import React, { useState } from "react";

import { Tab, Tabs, AppBar } from "@material-ui/core";

import PatchEditor from "./PatchEditor";

import "./AdminDashboard.css";

function AdminDashboard(props) {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div>
      <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="simple tabs example"
        >
          <Tab label="Item One" />
          <Tab label="Item Two" />
          <Tab label="Item Three" />
        </Tabs>
      </AppBar>
      <div className={"admin-panel-container"}>
        {value === 0 && <PatchEditor />}
      </div>
    </div>
  );
}

export default AdminDashboard;
