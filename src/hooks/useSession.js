import { useEffect, useState } from "react";

import firebase from "firebase";

import * as Tone from "tone";

import {
  scheduleSampler,
  scheduleMelody,
  scheduleAudioTrack,
  clearEvents,
} from "../services/Session/Schedule";

import { loadSession } from "../services/Session/Session";

function useSession(options) {
  const [tracks, setTracks] = useState(null);
  const [sessionData, setSessionData] = useState({});
  const [instruments, setInstruments] = useState([]);
  const [instrumentsLoaded, setInstrumentsLoaded] = useState([]);
  const [instrumentsInfo, setInstrumentsInfo] = useState({});

  const [isLoaded, setIsLoaded] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);

  const { id, hidden, sessionObject, paramSetter } = options;

  const user = firebase.auth().currentUser;

  const initSession = () => {
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.seconds = 0;
    instruments.forEach((e) => e.dispose());
    loadSession(
      setSessionData,
      setTracks,
      id,
      hidden,
      user,
      sessionObject,
      setIsLoaded,
      setInstruments,
      setInstrumentsLoaded,
      setInstrumentsInfo,
      paramSetter
    );
  };

  const action = (input) => {
    Tone.start();

    if (input === "play") play();
    if (input === "pause") pause();
    if (input === "toggle") isPlaying ? pause() : play();
  };

  const play = () => {
    if (Tone.Transport.state !== "started" && isLoaded) {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const pause = () => {
    Tone.Transport.pause();
    isLoaded &&
      instruments.forEach((e) =>
        e.name === "Players" ? e.stopAll() : e.releaseAll()
      );
    setIsPlaying(false);
  };

  const scheduleTrack = (index, tr) => {
    let track = tr ? tr : tracks[index];
    !track.muted
      ? track.type === 0
        ? scheduleSampler(
            track.score,
            instruments[index],
            Tone.Transport,
            track.id
          )
        : track.type === 1
        ? scheduleMelody(
            track.score,
            instruments[index],
            Tone.Transport,
            track.id
          )
        : scheduleAudioTrack(
            track.score,
            instruments[index],
            Tone.Transport,
            track.id
          )
      : clearEvents(track.id);
  };

  const scheduleAllTracks = () => {
    tracks.forEach((track, TrackIndex) => scheduleTrack(TrackIndex, track));
  };

  useEffect(() => {
    Tone.Transport.pause();
  }, [sessionData, instruments]);

  useEffect(() => {
    let progress =
      Object.values(instrumentsLoaded).filter((e) => e !== false).length /
      Object.values(instrumentsLoaded).length;
    setLoadingProgress(Math.floor(progress * 100));
    if (progress === 1) {
      hidden ? Tone.Transport.start() : Tone.Transport.pause();
      setIsLoaded(true);
      scheduleAllTracks();
    }
  }, [instrumentsLoaded]);

  useEffect(() => {
    console.log(instruments);
    instruments.forEach((e, i) => {
      if (tracks && tracks[i] && e) {
        e.volume.value = tracks[i].volume;
        e._volume.mute = tracks[i].muted;
      }
    });
  }, [instruments]);

  useEffect(() => {
    initSession();
    return () => {};
  }, []);

  return {
    tracks,
    setTracks,
    sessionData,
    setSessionData,
    instruments,
    setInstruments,
    instrumentsLoaded,
    setInstrumentsLoaded,
    isLoaded,
    action,
    isPlaying,
    scheduleTrack,
    instrumentsInfo,
    setInstrumentsInfo,
    scheduleAllTracks,
  };
}

export default useSession;