import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Icon,
  Typography,
  Divider,
} from "@material-ui/core";

function SideMenu(props) {
  const handleClose = () => props.setSideMenu(false);

  return (
    <Drawer className="sidemenu" anchor={"left"} open={props.open} onClose={handleClose}>
      <Typography style={{textAlign:"center"}} variant="h4">MUSA</Typography>
      <Divider />
      <List>
        {["Explore", "Sample Bank"].map((text, index) => (
          <ListItem button onClick={()=>{}}>
            <ListItemIcon>
              <Icon>{index !== 1 ? text.toLowerCase() : index}</Icon>
            </ListItemIcon>
            <ListItemText primary={text} />

          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default SideMenu;
