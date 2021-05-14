import { Select, InputLabel, FormControl } from "@material-ui/core";

import { adaptSequencetoSubdiv } from "../../assets/musicutils";

import "./ModuleSettings.css";

const subdivisionValues = [4, 8, 12, 16, 24, 32];

function ModuleSettings(props) {
  let mainContent = "No Settings";

  const handleStepsSelect = (event) => {
    let newValue = parseInt(event.target.value);
    props.updateModules((previous) =>
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
    let newLength = parseInt(event.target.value);
    props.updateModules((previous) =>
      previous.map((module, i) => {
        if (i === props.index) {
          let newModule = { ...module };
          let oldLength = module.score.length;
          let newScore = [];
          for (let x = 0; x < newLength; x++) {
            newScore[x] = module.score[x%oldLength]
          }

          newModule.score = newScore;

          return newModule;
        } else {
          return module;
        }
      })
    );
    props.setSettingsMode(false);
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
          {[1, 2, 4, 8].map((value, index) => (
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
            {[1, 2, 4, 8, 16].map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormControl>,
      ];
      break;
    case 2:
      break;
  }

  return <div className="module-settings">{mainContent}</div>;
}

export default ModuleSettings;
