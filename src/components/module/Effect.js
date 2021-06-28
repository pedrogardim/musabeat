import React, { useEffect, useState, Fragment } from "react";

import {
  IconButton,
  Icon,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Slider,
} from "@material-ui/core";

//import { Knob, Pointer, Value, Arc } from "rc-knob";

//import { Donut, Basic } from "react-dial-knob";

import "./ModuleEffects.css";

//import { colors } from "../../utils/materialPalette";
import { effectTypes, fxParametersRange } from "../../assets/musicutils";

function Effect(props) {
  const [addEffectMenu, setAddEffectMenu] = useState(null);
  const [parameters, setParamenters] = useState([]);

  const openMenu = (e) => {
    setAddEffectMenu(e.currentTarget);
  };

  const closeMenu = () => {
    setAddEffectMenu(null);
  };

  const handleClick = (e) => {
    e.target.classList.contains("effect") && props.currentEffect !== props.index
      ? props.setCurrentEffect(props.index)
      : props.setCurrentEffect(null);
  };

  const handleKnobMove = (value, property, paramIndex) => {
    //console.log(value, property, paramIndex);
    props.effect.set({ [property]: value });
    setParamenters((prev) =>
      prev.map((e, i) => (i === paramIndex ? value : e))
    );
  };

  const handleKnobStop = (value, property) => {
    props.handleParameterChange(value, property, props.index);
  };

  useEffect(() => {
    props.effect && setParamenters(Object.values(props.effect.get()));
  }, [props.effect]);

  useEffect(() => {
    //console.log(parameters);
  }, [parameters]);

  return (
    <div
      className={`effect ${!props.effect && "empty-effect"}`}
      onClick={handleClick}
    >
      {props.effect && parameters.length ? (
        <Fragment>
          <Typography>{props.effect.name}</Typography>
          <div className="break" />
          {Object.keys(props.effect.get())
            .filter((e) => e !== "oversample" && e !== "type")
            .map((e, i) => (
              <Fragment key={`fx${props.index}-${i}`}>
                <Tooltip title={e} interactive placement="left">
                  <Slider
                    className={`effect-slider ${
                      props.expanded ? "es-v" : "es-h"
                    }`}
                    min={
                      fxParametersRange[effectTypes.indexOf(props.effect.name)][
                        e
                      ][0]
                    }
                    max={
                      fxParametersRange[effectTypes.indexOf(props.effect.name)][
                        e
                      ][1]
                    }
                    step={
                      fxParametersRange[effectTypes.indexOf(props.effect.name)][
                        e
                      ][2]
                    }
                    value={parameters[i]}
                    orientation={props.expanded ? "vertical" : "horizontal"}
                    valueLabelDisplay="auto"
                    onChange={(event, v) => handleKnobMove(v, e, i)}
                    onChangeCommitted={(event, v) => handleKnobStop(v, e, i)}
                  ></Slider>
                </Tooltip>
              </Fragment>
            ))}
          <div className="break" />
          <IconButton
            onClick={() => {
              props.removeEffect(props.index);
              closeMenu();
            }}
          >
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

/* 
<Knob
  size={64}
  angleOffset={220}
  angleRange={280}
  min={0}
  max={100}
  className="styledKnob"
  onChange={(value) => console.log(value)}
>
  <Arc arcWidth={1.5} />
  <circle r="32" cx="32" cy="32" />
  <Pointer width={2} height={35} radius={10} type="rect" color="#fff" />
</Knob>;




<Slider
                    min={parametersRange[e][0]}
                    max={parametersRange[e][1]}
                    step={parametersRange[e][2]}
                    value={parameters[i]}
                    orientation={props.expanded ? "vertical" : "horizontal"}
                    valueLabelDisplay="auto"
                    onChange={(e, v) => handleKnobMove(v, i)}
                  ></Slider>




<Donut
        diameter={48}
        min={parametersRange[e][0]}
        max={parametersRange[e][1]}
        step={parametersRange[e][2]}
        value={value}
        theme={{
            donutColor: 'blue',
                donutThickness: 16

        }}
        onValueChange={(v) => handleKnobMove(v, i)}
        ariaLabelledBy={'my-label'}
    >
        <label id={'my-label'}>Some label</label>
    </Donut>
 */
