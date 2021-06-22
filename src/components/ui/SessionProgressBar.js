import React, { useState, useEffect, Fragment, useRef } from "react";
import * as Tone from "tone";

import "./SessionProgressBar.css";

function SessionProgressBar(props) {
  const [progress, setProgress] = useState(0);
  const [animation, setAnimation] = useState(null);

  const startAnimation = () =>
    setAnimation(setInterval(() => setProgress(Tone.Transport.progress), 16));

  useEffect(() => {
    startAnimation();
    return () => {
      clearInterval(animation);
    };
  }, []);

  /**/

  return (
    <div
      className="session-progress-bar"
      style={{ width: `${progress * 100}%` }}
    />
  );
}

export default SessionProgressBar;
