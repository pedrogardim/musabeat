import React, { useState } from "react";

import { Typography } from "@material-ui/core";
import { labels } from "../../assets/drumkits";

import * as Tone from "tone";

import "./ModuleLabels.css";

function ModuleLabels(props) {
  //const getValue = (event) => console.log(event.target.value);

  let innerContent;

  switch (props.module.type) {
    case 0:
      innerContent = labels.map((drumsound, row) => (
        <span className="module-labels-item">{drumsound}</span>
      ));

      break;

    case 1:
      let uniqueNotesOnScore = props.module.score
        .flat(2)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => {
            if (Tone.Frequency(a).toMidi() > Tone.Frequency(b).toMidi()) {
              return -1;
            }
            if (Tone.Frequency(a).toMidi() < Tone.Frequency(b).toMidi()) {
              return 1;
            }
            // a must be equal to b
            return 0;
          });
      innerContent = uniqueNotesOnScore.map((drumsound, row) => (
        <span className="module-labels-item">{drumsound}</span>
      ));

      break;
  }

  return <div className="module-labels">{innerContent}</div>;
}

export default ModuleLabels;
