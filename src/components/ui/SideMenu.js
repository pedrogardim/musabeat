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
} from "@material-ui/core";

import { useTranslation } from "react-i18next";

import AppLogo from "./AppLogo";

import "./SideMenu.css";

function SideMenu(props) {
  const { t } = useTranslation();
  const handleClose = () => props.setSideMenu(false);

  const handleClick = (opt) => {
    opt === "newSession"
      ? props.setNewSessionDialog(true)
      : props.handlePageNav(opt);

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
        {["newSession", "explore", "instruments", "drumsets", "files"].map(
          (text, index) => (
            <ListItem
              button
              onClick={() => {
                handleClick(text);
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
                    : "description"}
                </Icon>
              </ListItemIcon>
              <ListItemText primary={t(`sidemenu.${text}`)} />
            </ListItem>
          )
        )}
      </List>
    </Drawer>
  );
}

export default SideMenu;
