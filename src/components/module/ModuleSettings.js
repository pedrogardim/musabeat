import * as Tone from "tone";

import React, { Fragment } from "react";
import {
  Select,
  InputLabel,
  FormControl,
  Slider,
  Button,
} from "@material-ui/core";

import {
  adaptSequencetoSubdiv,
  scales,
  musicalNotes,
} from "../../assets/musicutils";

import "./ModuleSettings.css";

import { colors } from "../../utils/materialPalette";
import { useTranslation } from "react-i18next";

const subdivisionValues = [4, 8, 12, 16, 24, 32];
const lengthValues = [1, 2, 4, 8, 16];

function ModuleSettings(props) {
  const { t } = useTranslation();

  let mainContent = "No Settings";

  const handleColorSelect = (event) => {
    let color = event.target.value;
    //console.log(newValue);
    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          newModule.color = color;
          return newModule;
        } else {
          return module;
        }
      })
    );
    //props.setSettingsMode(false);
  };

  const handleStepsSelect = (event) => {
    Tone.Transport.pause();
    let newValue = parseInt(event.target.value);
    //console.log(newValue);
    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          newModule.score = newModule.score.map((array) =>
            Object.assign(
              {},
              adaptSequencetoSubdiv(Object.values(array), newValue)
            )
          );

          return newModule;
        } else {
          return module;
        }
      })
    );
    props.setSettingsMode(false);
  };

  const handleLengthSelect = (event) => {
    Tone.Transport.pause();
    let newLength = parseInt(event.target.value);

    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          if (props.module.type === 3 || props.module.type === 4) {
            newModule.size = newLength;
          } else {
            let oldLength = module.score.length;
            let newScore = [];
            for (let x = 0; x < newLength; x++) {
              newScore[x] = { ...module.score[x % oldLength] };
            }

            newModule.score = newScore;
          }

          return newModule;
        } else {
          return module;
        }
      })
    );

    let newTimeline = { ...props.timeline };
    newTimeline[props.module.id] = newTimeline[props.module.id].filter(
      (e) => e % newLength === 0
    );

    props.setTimeline(newTimeline);

    props.setSettingsMode(false);
  };

  const handleRootChange = (event) => {
    let newValue = parseInt(event.target.value);
    props.setModules((prev) => {
      let newMod = [...prev];
      newMod[props.index].root = newValue;
      return newMod;
    });
    props.setSettingsMode(false);
  };

  const handleScaleChange = (event) => {
    let newValue = parseInt(event.target.value);
    props.setModules((prev) => {
      let newMod = [...prev];
      newMod[props.index].scale = newValue;
      return newMod;
    });
    props.setSettingsMode(false);
  };

  const handleComplexityChange = (event) => {
    let newValue = parseInt(event.target.value);
    props.setModules((prev) => {
      let newMod = [...prev];
      newMod[props.index].complexity = newValue;
      return newMod;
    });
    props.setSettingsMode(false);
  };

  const handleOctaveRangeSelect = (e, v) => {
    let newValue = v;
    props.setModules((prev) => {
      let newMod = [...prev];
      newMod[props.index].range = newValue;
      return newMod;
    });
  };

  const toggleModuleScaleRoot = () => {
    //console.log(props.module.root);
    if (props.module.root === undefined) {
      props.setModules((prev) => {
        let newMod = [...prev];
        newMod[props.index].root = 0;
        newMod[props.index].scale = 0;
        return newMod;
      });
    } else {
      props.setModules((prev) => {
        let newMod = [...prev];
        delete newMod[props.index].root;
        delete newMod[props.index].scale;
        return newMod;
      });
    }
  };

  mainContent = (
    <Fragment>
      {(props.module.type === 0 || props.module.type === 1) && (
        <FormControl>
          <InputLabel id="subdivision-select-label">
            {t("module.settings.steps")}
          </InputLabel>
          <Select
            native
            labelId="subdivision"
            value={Object.values(props.module.score[0]).length}
            onChange={handleStepsSelect}
          >
            {subdivisionValues.map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {(props.module.type === 0 ||
        props.module.type === 1 ||
        props.module.type === 4 ||
        props.module.type === 3) && (
        <FormControl>
          <InputLabel id="length-select-label">
            {t("module.settings.length")}
          </InputLabel>
          <Select
            native
            labelId="length-select-label"
            value={
              props.module.type === 3 || props.module.type === 4
                ? props.module.size
                : props.module.score.length
            }
            onChange={handleLengthSelect}
          >
            {lengthValues.map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormControl>
      )}

      <div className="break" />

      {(props.module.type === 1 || props.module.type === 2) && (
        <Button
          color={props.module.root !== undefined ? "inherit" : "primary"}
          variant="outlined"
          onClick={toggleModuleScaleRoot}
        >
          {t("module.settings.sessionScale")}
        </Button>
      )}

      {(props.module.type === 1 || props.module.type === 2) && (
        <FormControl>
          <Select
            native
            disabled={props.module.root === undefined}
            label={t("music.root")}
            value={
              props.module.root ? props.module.root : props.sessionData.root
            }
            onChange={handleRootChange}
          >
            {musicalNotes.map((note, noteIndex) => (
              <option key={noteIndex} value={noteIndex}>
                {note}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      {(props.module.type === 1 || props.module.type === 2) && (
        <FormControl>
          <Select
            native
            disabled={props.module.root === undefined}
            label={t("music.scale")}
            value={
              props.module.scale ? props.module.scale : props.sessionData.scale
            }
            onChange={handleScaleChange}
          >
            {scales.map((scale, scaleIndex) => (
              <option key={scaleIndex} value={scaleIndex}>
                {t(`music.scales.${scaleIndex}`)}
              </option>
            ))}
          </Select>
        </FormControl>
      )}
      <div className="break" />

      {props.module.type === 1 && (
        <Fragment>
          <div style={{ width: "100%", height: "16px" }} />
          <Slider
            style={{ width: "50%" }}
            value={props.module.range}
            onChangeCommitted={handleOctaveRangeSelect}
            valueLabelDisplay="auto"
            min={1}
            max={7}
          />
        </Fragment>
      )}
      {props.module.type === 2 && (
        <FormControl>
          <InputLabel id="complexity-select-label">
            {t("music.complexity")}
          </InputLabel>
          <Select
            native
            labelId="complexity-select-label"
            value={props.module.complexity}
            onChange={handleComplexityChange}
          >
            <option value={3}>{t("misc.none")}</option>
            <option value={4}>7ths</option>
            <option value={5}>7ths + 9ths</option>
          </Select>
        </FormControl>
      )}
    </Fragment>
  );

  return (
    <div className="module-settings">
      {mainContent}
      <FormControl>
        <InputLabel id="color-select-label"></InputLabel>
        <Select
          labelId="color-select-label"
          value={props.module.color}
          onChange={handleColorSelect}
          style={{ backgroundColor: colors[props.module.color][500] }}
        >
          {colors.map((value, index) => (
            <option
              key={`color${index}`}
              value={index}
              style={{ backgroundColor: colors[index][500] }}
            ></option>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}

export default ModuleSettings;
