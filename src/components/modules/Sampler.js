import React, { useState, useEffect } from "react";

import * as Tone from "tone";

import AudioClip from "./AudioClip";

import { CircularProgress, Typography } from "@material-ui/core";

import "./Sampler.css";

//TODO

function Sampler(props) {
  const [loadedAudios, setLoadedAudios] = useState(props.module.players);
  const [players, setPlayers] = useState(props.module.audios);
  const [cursorPosition, setCursorPosition] = useState(0);

  const startCursor = () => {
    setInterval(() => {
      //console.log((Tone.Transport.seconds/Tone.Time(Tone.Transport.loopEnd).toSeconds())*100+"%")
      setCursorPosition(
        (Tone.Transport.seconds /
          Tone.Time(Tone.Transport.loopEnd).toSeconds()) *
          100 +
          "%"
      );
    }, 100);
  };

  return (
    <div
      className="module-innerwrapper"
      style={(props.style, { backgroundColor: props.module.color["400"] })}
    >
      {loadedAudios.map((e, i) => (
        <AudioClip key={i} index={i} color={props.module.color} buffer={e.buffer} />
      ))}
    </div>
  );
}

export default Sampler;
