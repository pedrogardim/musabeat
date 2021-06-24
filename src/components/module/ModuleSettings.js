import * as Tone from "tone";

import {
  Select,
  InputLabel,
  FormControl,
  Typography,
  Slider,
  Tooltip,
  IconButton,
  Icon,
} from "@material-ui/core";

import {
  adaptSequencetoSubdiv,
  scales,
  musicalNotes,
} from "../../assets/musicutils";

import "./ModuleSettings.css";

import { colors } from "../../utils/materialPalette";

const subdivisionValues = [4, 8, 12, 16, 24, 32];
const lengthValues = [1, 2, 4, 8, 16];

function ModuleSettings(props) {
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
          newModule.subdiv = parseInt(newValue);
          newModule.score = newModule.score.map((array) =>
            adaptSequencetoSubdiv(array, newValue)
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
          if (props.module.type === 4) {
            newModule.size = newLength;
          } else {
            let oldLength = module.score.length;
            let newScore = [];
            for (let x = 0; x < newLength; x++) {
              newScore[x] = module.score[x % oldLength];
            }

            newModule.score = newScore;
          }

          return newModule;
        } else {
          return module;
        }
      })
    );
    props.setSettingsMode(false);
  };

  const handleRootChange = (event) => {
    let newValue = parseInt(event.target.value);
    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module, root: newValue };

          return newModule;
        } else {
          return module;
        }
      })
    );
    props.setSettingsMode(false);
  };

  const handleScaleChange = (event) => {
    let newValue = parseInt(event.target.value);
    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module, scale: newValue };

          return newModule;
        } else {
          return module;
        }
      })
    );
    props.setSettingsMode(false);
  };

  const handleComplexityChange = (event) => {
    let newValue = parseInt(event.target.value);
    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module, complexity: newValue };

          return newModule;
        } else {
          return module;
        }
      })
    );
    props.setSettingsMode(false);
  };

  const handleOctaveRangeSelect = (e, v) => {
    let newValue = v;
    props.setModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module, range: newValue };

          return newModule;
        } else {
          return module;
        }
      })
    );
  };

  switch (props.module.type) {
    case 0:
      mainContent = [
        <FormControl>
          <InputLabel id="subdivision-select-label">Steps</InputLabel>
          <Select
            native
            labelId="subdivision"
            value={props.module.score[0].length}
            onChange={handleStepsSelect}
          >
            {subdivisionValues.map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormControl>,
        <FormControl>
          <InputLabel id="length-select-label">Length (measures)</InputLabel>
          <Select
            native
            labelId="length-select-label"
            value={props.module.score.length}
            onChange={handleLengthSelect}
          >
            {lengthValues.map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormControl>,
      ];
      break;
    case 1:
      mainContent = [
        <FormControl>
          <InputLabel id="subdivision-select-label">Steps</InputLabel>
          <Select
            native
            labelId="subdivision-select-label"
            value={props.module.score[0].length}
            onChange={handleStepsSelect}
          >
            {subdivisionValues.map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormControl>,
        <FormControl>
          <InputLabel id="length-select-label">Length (In measures)</InputLabel>
          <Select
            native
            labelId="length-select-label"
            value={props.module.score.length}
            onChange={handleLengthSelect}
          >
            {lengthValues.map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormControl>,
        <div style={{ width: "100%", height: "16px" }} />,

        <FormControl>
          <InputLabel id="root-select-label">Root</InputLabel>
          <Select
            native
            labelId="root-select-label"
            value={props.module.root}
            onChange={handleRootChange}
          >
            {musicalNotes.map((note, noteIndex) => (
              <option key={noteIndex} value={noteIndex}>
                {note}
              </option>
            ))}
          </Select>
        </FormControl>,
        <FormControl>
          <InputLabel id="scale-select-label">Scales</InputLabel>
          <Select
            native
            labelId="scale-select-label"
            value={props.module.scale}
            onChange={handleScaleChange}
          >
            {scales.map((scale, scaleIndex) => (
              <option key={scaleIndex} value={scaleIndex}>
                {scale[1]}
              </option>
            ))}
          </Select>
        </FormControl>,
        <div style={{ width: "100%", height: "16px" }} />,

        <Slider
          style={{ width: "50%" }}
          value={props.module.range}
          onChangeCommitted={handleOctaveRangeSelect}
          valueLabelDisplay="auto"
          min={1}
          max={7}
        />,
      ];
      break;
    case 2:
      mainContent = [
        <FormControl>
          <InputLabel id="root-select-label">Root</InputLabel>
          <Select
            native
            labelId="root-select-label"
            value={props.module.root}
            onChange={handleRootChange}
          >
            {musicalNotes.map((note, noteIndex) => (
              <option key={noteIndex} value={noteIndex}>
                {note}
              </option>
            ))}
          </Select>
        </FormControl>,
        <FormControl>
          <InputLabel id="scale-select-label">Scales</InputLabel>
          <Select
            native
            labelId="scale-select-label"
            value={props.module.scale}
            onChange={handleScaleChange}
          >
            {scales.map((scale, scaleIndex) => (
              <option key={scaleIndex} value={scaleIndex}>
                {scale[1]}
              </option>
            ))}
          </Select>
        </FormControl>,
        <FormControl>
          <InputLabel id="complexity-select-label">Extentions</InputLabel>
          <Select
            native
            labelId="complexity-select-label"
            value={props.module.complexity}
            onChange={handleComplexityChange}
          >
            <option value={3}>None</option>
            <option value={4}>7ths</option>
            <option value={5}>7ths + 9ths</option>
          </Select>
        </FormControl>,
      ];

      break;
    case 4:
      mainContent = (
        <FormControl>
          <InputLabel id="length-select-label">Length (In measures)</InputLabel>
          <Select
            native
            labelId="length-select-label"
            value={props.module.size}
            onChange={handleLengthSelect}
          >
            {lengthValues.map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormControl>
      );
      break;
  }

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
