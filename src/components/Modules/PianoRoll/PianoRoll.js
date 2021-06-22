import React, { useState, useEffect } from "react";

import PianoRollNote from "./PianoRollNote";
import * as Tone from "tone";

import { labels } from "../../../assets/drumkits";

import {
  scheduleDrumSequence,
  clearEvents,
} from "../../../utils/TransportSchedule";
import { loadDrumPatch } from "../../../assets/musicutils";

import {
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
  Typography,
} from "@material-ui/core";

import "./PianoRoll.css";
import { colors } from "../../../utils/materialPalette";

function PianoRoll(props) {
  const [sequencerArray, setSequence] = useState(props.module.score);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [soundsMap, setSoundsMap] = useState([]);

  return (
    <div className="module-innerwrapper" style={props.style}>
      <div className="piano-roll"></div>
    </div>
  );
}

export default PianoRoll;
