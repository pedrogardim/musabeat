import React from "react";
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

import { useTranslation } from "react-i18next";

import "./SideMenu.css";

function SideMenu(props) {
  const { t } = useTranslation();
  const handleClose = () => props.setSideMenu(false);

  const handleClick = (opt) => {
    opt === "newSession"
      ? props.createNewSession(
          undefined,
          props.handlePageNav,
          props.setOpenedSession
        )
      : props.handlePageNav(opt);

    props.setSideMenu(false);
  };

  return (
    <Drawer anchor={"left"} open={props.open} onClose={handleClose}>
      <Typography
        style={{ textAlign: "center", height: 64, lineHeight: "64px" }}
        variant="h6"
      >
        --Musa Logo--
      </Typography>
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
