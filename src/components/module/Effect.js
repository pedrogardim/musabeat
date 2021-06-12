import React, { useEffect, useState, Fragment } from "react";
import * as Tone from "tone";

import {
  Select,
  InputLabel,
  IconButton,
  Icon,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
} from "@material-ui/core";

import "./ModuleEffects.css";

import { colors } from "../../utils/materialPalette";
import { effectTypes } from "../../assets/musicutils";

function Effect(props) {
  const [addEffectMenu, setAddEffectMenu] = useState(null);

  const openMenu = (e) => {
    setAddEffectMenu(e.currentTarget);
  };

  const closeMenu = () => {
    setAddEffectMenu(null);
  };

  const handleClick = (e) => {
    props.setCurrentEffect(props.index);
  };

  return (
    <div
      className={`effect ${!props.effect && "empty-effect"}`}
      onClick={handleClick}
    >
      {props.effect ? (
        <Fragment>
          <Typography>{props.effect.name}</Typography>
          <div className="break" />
          {Object.keys(props.effect.get()).map((e, i) => (
            <span>
              {e},{JSON.stringify(props.effect.get()[e])}
            </span>
          ))}
          <div className="break" />
          <IconButton onClick={() => props.removeEffect(props.index)}>
            <Icon>delete</Icon>
          </IconButton>
        </Fragment>
      ) : (
        <Fragment>
          <Tooltip title="Add Effect">
            <IconButton onClick={openMenu}>
              <Icon>add</Icon>
            </IconButton>
          </Tooltip>
          <Menu
            onClose={closeMenu}
            anchorEl={addEffectMenu}
            keepMounted
            open={Boolean(addEffectMenu)}
          >
            {effectTypes.map((e, i) => (
              <MenuItem onClick={() => props.createEffect(i, props.index)}>
                {e}
              </MenuItem>
            ))}
          </Menu>
        </Fragment>
      )}
    </div>
  );
}

export default Effect;
