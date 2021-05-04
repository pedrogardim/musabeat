import "./ModulePicker.css";

import {
  IconButton,
  Card,
  Icon,
} from "@material-ui/core";

import ModulePickerItem from "./ModulePickerItem";

const moduletypes = [
  {
    name: "Drum Sequencer",
    description:
      "Rhythm sequencer that controls a drum pack, with a custom subdivision",
    icon: "grid_on",
  },
  {
    name: "Melody Composer",
    description:
      "Make a melody with a typical piano roll, or with a pitch sequencer",
    icon: "music_note",
  },
  {
    name: "Chord Progression",
    description:
      "Create chord progressions, or generate random ones based on scales",
    icon: "piano",
  },
  {
    name: "Sampler",
    description: "Drag audio files and manipulate them on time and pitch",
    icon: "graphic_eq",
  },
];

function ModulePicker(props) {
  return (
    <Card className="module-picker">
      {moduletypes.map((data, index) => (
        <ModulePickerItem
          addNewModule={props.addNewModule}
          key={index}
          id={index}
          data={data}
        />
      ))}
      <IconButton
        onClick={() => props.toggleVisibility(false)}
        className="mp-closebtn"
        color="primary"
      >
        <Icon>close</Icon>
      </IconButton>
    </Card>
  );
}

export default ModulePicker;
