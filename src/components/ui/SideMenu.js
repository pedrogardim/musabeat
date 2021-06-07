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

import "./SideMenu.css";

function SideMenu(props) {
  const handleClose = () => props.setSideMenu(false);

  const handleClick = (opt) => {
    props.setOpenedSession(null)
    opt === "New Session" ? props.createNewSession() : opt === "Explore" ? props.setCurrentPage("exploreSessions") : props.setSideMenu(false);
    props.setSideMenu(false)
  };

  return (
    <Drawer anchor={"left"} open={props.open} onClose={handleClose}>
      <Typography style={{ textAlign: "center" }} variant="h6">
        --Musa Logo--
      </Typography>
      <Divider />
      <List className="side-menu-list">
        {["New Session", "Explore", "Sample Bank"].map((text, index) => (
          <ListItem
            button
            onClick={() => {
              handleClick(text);
            }}
          >
            <ListItemIcon>
              <Icon>
                {index === 0 ? "add" : index === 1 ? "explore" : "equalizer"}
              </Icon>
            </ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default SideMenu;
