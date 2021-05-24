import React, { useState,useEffect,Fragment } from "react";

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
  //const [selectedFile, setSelectedFile] = useState(null);
  const [instrumentParamenters, setInstrumentParamenters] = useState(
    props.instrument.get()
  );

  console.log(instrumentParamenters);

  //console.log(instrument.get());

  let mainContent = "Nothing Here";

  const handleChange = (parameter, value) => {
    setInstrumentParamenters((prev) => {
      return { ...prev, [parameter]: value };
    });
    props.instrument.set({ [parameter]: value });
  };

  const handleWaveTypeSelect = (parameter, event) => {
    let value = event.target.value;
    setInstrumentParamenters((prev) => {
      return { ...prev, [parameter]: { type: value } };
    });
    props.instrument.set({ [parameter]: { type: value } });
  };

  const handleFilterChange = (parameter, value) => {
    setInstrumentParamenters((prev) => {
      return { ...prev, filter: { ...prev.filter,[parameter]: value } };
    });
    props.instrument.set({filter: { [parameter]: value } });
  };
//TODO

  console.log(props.instrument);

  mainContent = (
    <Fragment>
      {Object.keys(instrumentParamenters).map(
        (parameter, index) =>
          parameter === "filter" ? (
            <Fragment>
              <Typography variant="overline">Frequency</Typography>
              <Slider
                value={instrumentParamenters.filter.frequency}
                min={20}
                step={1}
                max={20000}
                onChange={(e, v) => handleFilterChange("frequency", v)}
                valueLabelDisplay="auto"
              />
              <Typography variant="overline">Q</Typography>
              <Slider
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
          ):
          (parameter === "harmonicity" || parameter === "modulationIndex") ? (
            <Fragment>
              <Typography variant="overline">{parameter}</Typography>
              <Slider
                value={instrumentParamenters[parameter]}
                min={1}
                step={1}
                max={50}
                onChange={(e, v) => handleChange(parameter, v)}
                valueLabelDisplay="auto"
              />
            </Fragment>
          ):
          parameter === "modulation" ? (
            <FormControl>
              <InputLabel id="fm-wave-selector-label">{parameter}</InputLabel>
              <Select
                native
                labelId="fm-wave-selector-label"
                value={instrumentParamenters.modulation.type}
                onChange={(event) => handleWaveTypeSelect(parameter, event)}
              >
                {waveTypes.map((e, i) => (
                  <option key={i} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            </FormControl>
          ):"")}
      
    </Fragment>
  );

  useEffect(()=>{setInstrumentParamenters(props.instrument.get())},[props.instrument])

  return mainContent;
}

export default SynthParameters;
