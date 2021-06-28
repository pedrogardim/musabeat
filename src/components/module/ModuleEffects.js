import React, { useState, Fragment } from "react";

import { Divider } from "@material-ui/core";

import "./ModuleEffects.css";

import { loadEffect } from "../../assets/musicutils";

import Effect from "./Effect";

function ModuleEffects(props) {
  const [currentEffect, setCurrentEffect] = useState(null);

  const createEffect = (type, index) => {
    props.setEffects((prev) =>
      prev.map((e, i) => (i === index ? loadEffect(type) : e))
    );
  };

  const removeEffect = (index) => {
    props.effects[index].dispose();
    props.setEffects((prev) => prev.map((e, i) => (i === index ? false : e)));
  };

  const handleParameterChange = (value, paramenter, effectIndex) => {
    props.setModules((prev) =>
      prev.map((e, i) => {
        if (i === props.index) {
          let newModule = { ...e };
          newModule.fx[effectIndex].options[paramenter] = value;
          return newModule;
        } else {
          return e;
        }
      })
    );
  };

  return (
    <div className="module-effects">
      {currentEffect === null ? (
        props.effects.map((e, i) => (
          <Fragment key={`fx2-${props.index}-${i}`}>
            <Effect
              removeEffect={removeEffect}
              createEffect={createEffect}
              setCurrentEffect={setCurrentEffect}
              currentEffect={currentEffect}
              handleParameterChange={handleParameterChange}
              effect={e}
              index={i}
            />
            <Divider orientation="vertical" />
          </Fragment>
        ))
      ) : (
        <Effect
          expanded
          createEffect={createEffect}
          removeEffect={removeEffect}
          setCurrentEffect={setCurrentEffect}
          currentEffect={currentEffect}
          handleParameterChange={handleParameterChange}
          effect={props.effects[currentEffect]}
          index={currentEffect}
        />
      )}
    </div>
  );
}

/* 
{props.effects.length > 1 && (
    <BottomNavigation
      style={{ color: colors[props.module.color][900] }}
      value={currentEffect}
      showLabels
      onChange={(event, newValue) => {
        setCurrentEffect(newValue);
      }}
      className="sequencer-bottomnav"
    >
      {props.effects.map((measure, index) => (
        <BottomNavigationAction
          style={{ minWidth: 0, maxWidth: "100%" }}
          key={index}
          label={`FX ${index + 1}`}
        />
      ))}
    </BottomNavigation>
  )}
 */

export default ModuleEffects;
