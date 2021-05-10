import { Select,InputLabel,FormControl } from "@material-ui/core";

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
              newModule.score = newModule.score.map((array)=>adaptSequencetoSubdiv(array,newValue))

              return newModule;
            } else {
              return module;
            }
          })
        );


  }

  switch (props.module.type) {
    case 0:
      mainContent = [
        <FormControl>
        <InputLabel id="subdivision-select-label">Steps</InputLabel>
        <Select native labelId="subdivision" onChange={handleStepsSelect}
>
          {subdivisionValues.map((value, index) => (
            <option key={index} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </FormControl>
       ,
      ];
      break;
      case 1:
      mainContent = [
        <FormControl>
        <InputLabel id="subdivision-select-label">Steps</InputLabel>
        <Select native labelId="subdivision" onChange={handleStepsSelect}
>
          {subdivisionValues.map((value, index) => (
            <option key={index} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </FormControl>
       ,
      ];
      break;
    case 2:
      break;
  }

  return <div className="module-settings">{mainContent}</div>;
}

export default ModuleSettings;
