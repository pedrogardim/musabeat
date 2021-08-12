import React, { useState, useEffect, Fragment, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import Draggable from "react-draggable";

import { useParams } from "react-router-dom";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Icon,
  IconButton,
  Avatar,
  Tooltip,
  Divider,
  List,
  ListItem,
  Typography,
} from "@material-ui/core";

import "./FilePage.css";

import { fileExtentions } from "../../../assets/musicutils";

import { colors } from "../../../utils/materialPalette";
import { get } from "jquery";
const waveColor = colors[2];

function FilePage(props) {
  const waveformWrapper = useRef(null);

  const [player, setPlayer] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const [downloadUrl, setDownloadUrl] = useState(null);

  const [clipHeight, setClipHeight] = useState(0);
  const [clipWidth, setClipWidth] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);

  const [loadingPlay, setLoadingPlay] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);

  const fileKey = useParams().key;

  const updateClipPosition = () => {
    //if (!fileInfo || waveformWrapper.current === null) return;
    setClipWidth(waveformWrapper.current.offsetWidth);
    setClipHeight(waveformWrapper.current.offsetHeight);
  };

  const toggleCursor = (state) => {
    clearInterval(cursorAnimator);
    fileInfo &&
      setCursorAnimator(
        setInterval(() => {
          //console.log(fileInfo, waveformWrapper.current);
          //temp fix
          fileInfo &&
            waveformWrapper.current !== null &&
            setCursorPosition(
              (Tone.Transport.seconds / fileInfo.dur) *
                waveformWrapper.current.offsetWidth
            );
        }, 32)
      );
  };

  const scheduleEvents = (atRestart) => {
    Tone.Transport.cancel(0);
    !!player &&
      player.loaded &&
      Tone.Transport.schedule((time) => {
        player.start(Tone.Transport.seconds, Tone.Transport.seconds);
      }, Tone.Transport.seconds);
    Tone.Transport.schedule((time) => {
      Tone.Transport.pause(time);
      Tone.Transport.seconds = 0;
    }, fileInfo.dur);
  };

  const handleCursorDrag = (event, element) => {
    Tone.Transport.seconds =
      (element.x / waveformWrapper.current.offsetWidth) * fileInfo.dur;

    setCursorPosition(element.x);
  };

  const handleCursorDragStart = (event, element) => {
    Tone.Transport.pause();
    player.stop(0);
  };

  const handleCursorDragStop = (event, element) => {
    scheduleEvents();
  };

  const togglePlaying = () => {
    console.log(Tone.Transport.state);

    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
    } else {
      Tone.Transport.pause();
      player.stop(0);
    }
  };

  const getFileInfo = () => {
    const usersRef = firebase.firestore().collection("users");
    const fileInfoRef = firebase.firestore().collection("files").doc(fileKey);

    fileInfoRef.get().then((r) => {
      setFileInfo(r.data());
      Tone.Transport.loop = false;
      Tone.Transport.setLoopPoints(0, r.data().dur);
      //console.log(0, r.data().dur);

      fileInfoRef.update({
        loaded: firebase.firestore.FieldValue.increment(1),
      });

      usersRef
        .doc(r.get("user"))
        .get()
        .then((user) => {
          setUserInfo(user.data());
        });
    });

    firebase
      .storage()
      .ref(fileKey)
      .getDownloadURL()
      .then((r) => {
        setDownloadUrl(r);
        let newPlayer = new Tone.Player(r, () =>
          setIsLoaded(true)
        ).toDestination();
        /* newPlayer.onload = () =>
          drawFileWave(player.buffer, clipHeight, clipWidth); */
        setPlayer(newPlayer);
      });
  };

  const handleDownload = () => {
    /* var link = document.createElement("a");
    link.download = "test";

    link.href = downloadUrl;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); */

    //console.log(downloadUrl);

    var xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = function (event) {
      var blob = xhr.response;
      var a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = fileInfo.name;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
    };
    xhr.open("GET", downloadUrl);
    xhr.send();

    /* var xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = function (event) {
      var blob = xhr.response;
    };
    xhr.open("GET", downloadUrl);
    xhr.send(); */
  };

  useEffect(() => {
    //console.log(player);
    if (isLoaded) drawFileWave(player.buffer, clipHeight, clipWidth);
  }, [clipHeight, clipWidth, isLoaded]);

  useEffect(() => {
    fileInfo && player && scheduleEvents();
  }, [fileInfo, player, Tone.Transport.state]);

  useEffect(() => {
    toggleCursor();
  }, [fileInfo]);

  useEffect(() => {
    updateClipPosition();
    getFileInfo();
    toggleCursor();
    window.addEventListener("resize", updateClipPosition);

    return () => {
      //console.log("cleared");
      window.removeEventListener("resize", updateClipPosition);
      clearInterval(cursorAnimator);
      Tone.Transport.cancel(0);
      player && player.dispose();
    };
  }, []);

  return (
    <div className="file-page">
      <Typography variant="h4">
        {fileInfo ? `${fileInfo.name}.${fileExtentions[fileInfo.type]}` : "..."}
      </Typography>
      <div className="break" />
      {userInfo && (
        <Tooltip title={userInfo.profile.displayName}>
          <Avatar
            alt={userInfo.profile.displayName}
            src={userInfo.profile.photoURL}
          />
        </Tooltip>
      )}
      <div className="break" />

      <Paper elevation={3} className="file-page-waveform" ref={waveformWrapper}>
        <canvas
          className="sampler-audio-clip-wave"
          id="file-page-canvas"
          height={clipHeight}
          width={clipWidth}
          style={{ height: clipHeight, width: clipWidth }}
        />

        <Draggable
          axis="x"
          onDrag={handleCursorDrag}
          onStart={handleCursorDragStart}
          onStop={handleCursorDragStop}
          position={{ x: cursorPosition, y: 0 }}
          bounds=".file-page-waveform"
        >
          <div
            className="sampler-cursor"
            style={{ backgroundColor: waveColor[400] }}
          />
        </Draggable>
      </Paper>

      <div className="break" />

      <div className="player-controls">
        <IconButton onClick={togglePlaying}>
          <Icon>
            {Tone.Transport.state === "started" ? "pause" : "play_arrow"}
          </Icon>
        </IconButton>

        <IconButton onClick={handleDownload}>
          <Icon>download</Icon>
        </IconButton>
      </div>
      <div className="file-info"></div>
    </div>
  );
}

const drawFileWave = (buffer, h, w) => {
  //TODO: FIX UNWANTED CLEARING
  //console.log("draw");
  let clipHeight = h;
  let clipWidth = w;

  const canvas = document.getElementById("file-page-canvas");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  let waveArray = buffer.toArray(0);
  let scale = waveArray.length / clipWidth;

  ctx.fillStyle = waveColor[900];

  for (let x = 0; x < clipWidth / 2; x++) {
    let rectHeight = Math.abs(
      Math.floor(waveArray[Math.floor(x * 2 * scale)] * clipHeight)
    );
    //console.log("rect");
    ctx.fillRect(x * 2, clipHeight / 2 - rectHeight / 2, 1, rectHeight);
  }
};

export default FilePage;
