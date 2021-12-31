import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import Draggable from "react-draggable";

import { useParams } from "react-router-dom";

import {
  Paper,
  Chip,
  Grid,
  CircularProgress,
  Icon,
  IconButton,
  Avatar,
  Tooltip,
  Divider,
  List,
  ListItem,
  Typography,
  Button,
} from "@mui/material";

import "./style.css";

import { fileTags } from "../../services/MiscData";

import { soundChannels, fileExtentions } from "../../services/Audio";

import { colors } from "../../utils/Pallete";

import LoadingScreen from "../../components/LoadingScreen";
import NotFoundPage from "../NotFoundPage";

const waveColor = colors[2];

function FilePage(props) {
  const { t } = useTranslation();

  const waveformWrapper = useRef(null);

  const [player, setPlayer] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [isFileLiked, setIsFileLiked] = useState(null);
  const [uploadDateString, setUploadDateString] = useState(null);

  const [downloadUrl, setDownloadUrl] = useState(null);

  const [clipHeight, setClipHeight] = useState(0);
  const [clipWidth, setClipWidth] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorAnimator, setCursorAnimator] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);

  const [loadingPlay, setLoadingPlay] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);

  const fileKey = useParams().key;

  const usersRef = firebase.firestore().collection("users");
  const fileInfoRef = firebase.firestore().collection("files").doc(fileKey);
  const user = firebase.auth().currentUser;

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
    //console.log(Tone.Transport.state);

    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
    } else {
      Tone.Transport.pause();
      player.stop(0);
    }
  };

  const getFileInfo = () => {
    fileInfoRef.get().then((r) => {
      if (!r.exists) {
        setFileInfo(undefined);
        return;
      }
      setFileInfo(r.data());
      let date = new Date(r.data().upOn.seconds * 1000);
      let creationDate = `${t("misc.uploadedOn")} ${date.getDate()}/${
        date.getMonth() + 1
      }/${date.getFullYear()}`;
      setUploadDateString(creationDate);
      Tone.Transport.loop = false;
      Tone.Transport.setLoopPoints(0, r.data().dur);
      //console.log(0, r.data().dur);

      /* fileInfoRef.update({
        ld: firebase.firestore.FieldValue.increment(1),
      }); */

      usersRef
        .doc(r.get("user"))
        .get()
        .then((user) => {
          setCreatorInfo(user.data());
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

    //liked by user
    if (user) {
      usersRef
        .doc(user.uid)
        .get()
        .then((r) => setIsFileLiked(r.data().likedFiles.includes(fileKey)));
    }
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
    fileInfoRef.update({
      dl: firebase.firestore.FieldValue.increment(1),
    });

    /* var xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = function (event) {
      var blob = xhr.response;
    };
    xhr.open("GET", downloadUrl);
    xhr.send(); */
  };

  const handleUserLike = () => {
    if (!isFileLiked) {
      //file is not liked
      setIsFileLiked(true);
      setFileInfo((prev) => {
        let newFileInfo = { ...prev };
        newFileInfo.likes++;
        return newFileInfo;
      });
      fileInfoRef.update({
        likes: firebase.firestore.FieldValue.increment(1),
      });
      usersRef.doc(user.uid).update({
        likedFiles: firebase.firestore.FieldValue.arrayUnion(fileKey),
      });
    } else {
      setIsFileLiked(false);
      setFileInfo((prev) => {
        let newFileInfo = { ...prev };
        newFileInfo.likes--;
        return newFileInfo;
      });
      fileInfoRef.update({
        likes: firebase.firestore.FieldValue.increment(-1),
      });
      usersRef.doc(user.uid).update({
        likedFiles: firebase.firestore.FieldValue.arrayRemove(fileKey),
      });
    }
  };

  const handleClipClick = (e) => {
    console.log(e);

    Tone.Transport.seconds =
      ((e.clientX - waveformWrapper.current.getBoundingClientRect().left) /
        waveformWrapper.current.offsetWidth) *
      fileInfo.dur;

    setCursorPosition(
      e.clientX - waveformWrapper.current.getBoundingClientRect().left
    );
  };

  useEffect(() => {
    console.log(player);
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
      {fileInfo !== undefined ? (
        <>
          <Typography variant="h4">
            {fileInfo
              ? `${fileInfo.name}.${fileExtentions[fileInfo.type]}`
              : "..."}
          </Typography>
          <div className="break" />
          {creatorInfo && (
            <Tooltip title={creatorInfo.profile.username}>
              <Avatar
                alt={creatorInfo.profile.username}
                src={creatorInfo.profile.photoURL}
                onClick={(ev) =>
                  props.handlePageNav("user", creatorInfo.profile.username, ev)
                }
              />
            </Tooltip>
          )}
          <div className="break" />

          <Paper
            elevation={3}
            className="file-page-waveform"
            onClick={handleClipClick}
            ref={waveformWrapper}
          >
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

          {fileInfo &&
            fileInfo.categ.map((e, i) => (
              <Chip
                style={{ margin: "0px 4px" }}
                key={`pfcc${i}`}
                label={fileTags[e]}
                variant="outlined"
              />
            ))}
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

            <Tooltip title={fileInfo && fileInfo.likes}>
              <IconButton onClick={handleUserLike}>
                <Icon color={isFileLiked ? "secondary" : "inherit"}>
                  favorite
                </Icon>
                <Typography className="like-btn-label" variant="overline">
                  {fileInfo && fileInfo.likes}
                </Typography>
              </IconButton>
            </Tooltip>

            {/* <IconButton onClick={huehue}>
          <Icon>manage_accounts</Icon>
        </IconButton> */}
          </div>
          <div className="break" />

          {fileInfo && (
            <Grid
              container
              spacing={1}
              direction="row"
              wrap="nowrap"
              className="file-info"
              component={Paper}
            >
              <div className="file-info-card">
                <Typography variant="body1">
                  {soundChannels[player._buffer.numberOfChannels] ||
                    player._buffer.numbesrOfChannels ||
                    "Multichannel"}
                  <br />
                  {player._buffer.sampleRate + " Hz"}
                </Typography>
              </div>
              <Divider orientation="vertical" flexItem />

              <div className="file-info-card">
                <Typography variant="body1">
                  {formatBytes(fileInfo.size)}
                </Typography>
              </div>
              <Divider orientation="vertical" flexItem />

              <div className="file-info-card">
                <Typography variant="body1">{fileInfo.dur + " s"}</Typography>
              </div>
              <Divider orientation="vertical" flexItem />

              <div className="file-info-card">
                <Typography variant="body1">{uploadDateString}</Typography>
              </div>
            </Grid>
          )}
          <LoadingScreen open={fileInfo === null} />
        </>
      ) : (
        <NotFoundPage
          type="filePage"
          handlePageNav={() => props.handlePageNav("files")}
        />
      )}
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

function formatBytes(a, b = 2) {
  if (0 === a) return "0 Bytes";
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024));
  return (
    parseFloat((a / Math.pow(1024, d)).toFixed(c)) +
    " " +
    ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
  );
}
