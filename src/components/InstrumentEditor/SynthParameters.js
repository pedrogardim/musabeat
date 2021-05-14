import React, { useState } from "react";
import { Fragment } from "react";

import {
  Select,
  Typography,
  Slider,
  FormControl,
  InputLabel,
} from "@material-ui/core";
import { waveTypes, filterTypes } from "../../assets/musicutils";

import "./InstrumentEditor.css";

function SynthParameters(props) {
  const [selectedPatch, setSelectedPatch] = useState(0);
  //const [selectedFile, setSelectedFile] = useState(null);
  const [instrumentParamenters, setInstrumentParamenters] = useState(
    props.instrument.get()
  );

  console.log(instrumentParamenters)

  //console.log(instrument.get());

  let mainContent = "Nothing Here";

  const handleChange = (paramenter, value) => {
    setInstrumentParamenters((prev) => {
      return { ...prev, [paramenter]: value };
    });
    props.instrument.set({ [paramenter]: value });
  };

  const handleWaveTypeSelect = (paramenter, event) => {
    let value = event.target.value;
    setInstrumentParamenters((prev) => {
      return { ...prev, [paramenter]: { type: value } };
    });
    props.instrument.set({ [paramenter]: { type: value } });
  };

  const handleFilterChange = (paramenter, value) => {
    setInstrumentParamenters((prev) => {
      return { ...prev, filter: { ...prev.filter,[paramenter]: value } };
    });
    props.instrument.set({filter: { [paramenter]: value } });
  };
//TODO
  mainContent = (
    <Fragment>
      {Object.keys(props.instrument.get()).map(
        (element, index) =>
          element === "filter" && (
            <Fragment>
              <Typography variant="overline">Frequency</Typography>
              <Slider
                key={0}
                value={instrumentParamenters.filter.frequency}
                min={20}
                step={1}
                max={20000}
                onChange={(e, v) => handleFilterChange("frequency", v)}
                valueLabelDisplay="auto"
              />
              <Typography variant="overline">Q</Typography>
              <Slider
                key={0}
                value={instrumentParamenters.filter.Q}
                min={1}
                step={1}
                max={50}
                onChange={(e, v) => handleFilterChange("Q", v)}
                valueLabelDisplay="auto"
              />
              <FormControl>
                <InputLabel id="fm-wave-selector-label">Roll Off</InputLabel>
                <Select
                  key={1}
                  native
                  labelId="fm-wave-selector-label"
                  value={instrumentParamenters.filter.rolloff}
                  onChange={(event) => handleWaveTypeSelect("rolloff", event)}
                >
                  <option key={-12} value={-12}>
                    -12
                  </option>
                  <option key={-24} value={-24}>
                    -24
                  </option>
                  <option key={-48} value={-48}>
                    -48
                  </option>
                  <option key={-96} value={-96}>
                    -96
                  </option>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel id="fm-wave-selector-label">Type</InputLabel>
                <Select
                  key={2}
                  native
                  labelId="fm-wave-selector-label"
                  value={instrumentParamenters.filter.type}
                  onChange={(event) =>
                    handleWaveTypeSelect("rollofftype", event)
                  }
                >
                  {filterTypes.map((e, i) => (
                    <option key={i} value={e}>
                      {e}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Fragment>
          )
      )}
      {Object.keys(props.instrument.get()).map(
        (element, index) =>
          (element === "harmonicity" || element === "modulationIndex") && (
            <Fragment>
              <Typography variant="overline">{element}</Typography>
              <Slider
                key={0}
                value={instrumentParamenters[element]}
                min={1}
                step={1}
                max={50}
                onChange={(e, v) => handleChange(element, v)}
                valueLabelDisplay="auto"
              />
            </Fragment>
          )
      )}
      {Object.keys(props.instrument.get()).map(
        (element, index) =>
          element === "modulation" && (
            <FormControl>
              <InputLabel id="fm-wave-selector-label">{element}</InputLabel>
              <Select
                key={2}
                native
                labelId="fm-wave-selector-label"
                value={instrumentParamenters.modulation.type}
                onChange={(event) => handleWaveTypeSelect(element, event)}
              >
                {waveTypes.map((e, i) => (
                  <option key={i} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            </FormControl>
          )
      )}
    </Fragment>
  );

  return mainContent;
}

export default SynthParameters;
