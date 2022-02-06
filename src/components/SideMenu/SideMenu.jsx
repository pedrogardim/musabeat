import React, { useContext } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Icon,
  Typography,
  Divider,
  IconButton,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import AppLogo from "../AppLogo";

import "./style.css";

function SideMenu(props) {
  const { t } = useTranslation();
  const handleClose = () => props.setSideMenu(false);

  const handleClick = (opt, e) => {
    opt === "newSession"
      ? props.setNewSessionDialog(true)
      : opt === "darkmode"
      ? props.setDarkMode((prev) => !prev)
      : props.handlePageNav(opt, "", e);

    props.setSideMenu(false);
  };

  return (
    <Drawer
      /*  ModalProps={{ disableScrollLock: true }} */
      PaperProps={{ className: "side-menu-cont" }}
      anchor={"left"}
      open={props.open}
      onClose={handleClose}
    >
      <div className="side-menu-logo-cont">
        {/* <IconButton onClick={handleClose}>
          <Icon>close</Icon>
        </IconButton> */}
        <AppLogo className="app-logo-blue" />
        <Typography variant="h5">MusaBeat</Typography>
      </div>
      <Divider />
      <List className="side-menu-list">
        {[
          "newSession",
          "explore",
          "instruments",
          "drumsets",
          "files",
          "darkmode",
        ].map((text, index) => (
          <>
            {text === "darkmode" && <Divider />}
            <ListItem
              button
              onClick={(e) => {
                handleClick(text, e);
              }}
              key={text}
            >
              <ListItemIcon>
                <Icon>
                  {index === 0
                    ? "add"
                    : index === 1
                    ? "explore"
                    : index === 2
                    ? "piano"
                    : index === 3
                    ? "grid_on"
                    : index === 4
                    ? "description"
                    : props.darkMode
                    ? "dark_mode"
                    : "light_mode"}
                </Icon>
              </ListItemIcon>
              <ListItemText primary={t(`sidemenu.${text}`)} />
            </ListItem>
          </>
        ))}
      </List>
    </Drawer>
  );
}

export default SideMenu;
