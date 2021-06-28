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
    opt === "New Session"
      ? props.createNewSession(
          undefined,
          props.handlePageNav,
          props.setOpenedSession
        )
      : opt === "Explore"
      ? props.handlePageNav("explore")
      : props.setSideMenu(false);
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
        {["New Session", "Explore", "Sample Bank"].map((text, index) => (
          <ListItem
            button
            onClick={() => {
              handleClick(text);
            }}
            key={text}
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
