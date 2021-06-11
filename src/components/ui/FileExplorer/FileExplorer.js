import React, { useState, useEffect, Fragment } from "react";
import * as Tone from "tone";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Typography,
  Icon,
  IconButton,
  Divider,
  List,
  ListItem,
} from "@material-ui/core";

import "./FileExplorer.css";

import firebase from "firebase";

function FileExplorer(props) {
  const [filedata, setFiledata] = useState([]);
  const [refList, setRefList] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loadingPlay, setLoadingPlay] = useState(null);
  const [currentPlaying, setCurrentPlaying] = useState(null);

  const [userOption, setUserOption] = useState(false);
  const [sideMenu, setSideMenu] = useState(false);

  const handleFileSelect = (e, index) => {
    props.compact &&
      !e.target.classList.contains("MuiIcon-root") &&
      refList[index]
        .getDownloadURL()
        .then((url) =>
          props.onFileClick(
            url,
            players[index] !== undefined && players[index].buffer
          )
        );
  };

  const getUserFilesList = async () => {
    const user = firebase.auth().currentUser;
    const dbRef = firebase.storage().ref().child(user.uid);
    const refList = (await dbRef.list()).items;
    setRefList(refList);

    const filesMetadata = await Promise.all(
      refList.map((e, i) => e.getMetadata())
    );
    setFiledata(filesMetadata);
  };

  const handleDownload = (index) => {
    refList[index]
      .getDownloadURL()
      .then(function (url) {
        console.log(url);

        var xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.onload = function (event) {
          var blob = xhr.response;
        };
        xhr.open("GET", url);
        xhr.send();
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const playSound = (index) => {
    if (players[index] !== undefined) {
      players[index].start();
      setCurrentPlaying(index);
    } else {
      setLoadingPlay(index);
      refList[index].getDownloadURL().then((url) => {
        let player = new Tone.Player(url, () => {
          player.state !== "started" && player.start();
          setCurrentPlaying(index);
          setLoadingPlay(null);
        }).toDestination();
        player.onstop = () => {
          setCurrentPlaying(null);
        };
        setPlayers((prev) => {
          let newPlayers = [...prev];

          newPlayers[index] = player;
          return newPlayers;
        });
      });
    }
  };

  const stopSound = (index) => {
    players[index].stop();
    setCurrentPlaying(null);
  };

  useEffect(() => {
    getUserFilesList();
  }, []);

  useEffect(() => {
    return () => {
      players.forEach((player) => !!player && player.dispose());
    };
  }, []);

  useEffect(() => {
    //console.log(players);
  }, [players]);

  return (
    <div className="file-explorer">
      {props.compact && (
        <Fragment>
          <div className="file-explorer-column">
            <List className="fet-list">
              <ListItem divider button>
                User Files
              </ListItem>
            </List>
          </div>
          <Divider orientation="vertical" />
        </Fragment>
      )}
      <div className="file-explorer-column">
        {!!filedata.length ? (
          <TableContainer className="file-explorer-table">
            <Table
              component={!props.compact ? Paper : "div"}
              size="small"
              className={props.compact ? "fet-compact" : "fet-normal"}
            >
              {!props.compact && (
                <TableHead>
                  <TableRow>
                    <TableCell style={{ width: 50 }}></TableCell>
                    <TableCell>Name</TableCell>
                    <Fragment>
                      <TableCell align="right">Size</TableCell>
                      <TableCell align="right">Type</TableCell>
                      <TableCell style={{ width: 50 }} align="right">
                        Download
                      </TableCell>
                    </Fragment>
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {filedata.map((row, index) => (
                  <TableRow
                    key={row.name}
                    onClick={(e) => handleFileSelect(e, index)}
                  >
                    <TableCell style={{ width: props.compact ? 20 : 50 }}>
                      {loadingPlay === index ? (
                        <CircularProgress size={27} />
                      ) : currentPlaying === index ? (
                        <IconButton onClick={() => stopSound(index)}>
                          <Icon>stop</Icon>
                        </IconButton>
                      ) : (
                        <IconButton onClick={() => playSound(index)}>
                          <Icon>play_arrow</Icon>
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    {!props.compact && (
                      <Fragment>
                        <TableCell align="right">
                          {formatBytes(row.size)}
                        </TableCell>
                        <TableCell align="right">
                          {row.contentType.replace("audio/", "")}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleDownload(index)}>
                            <Icon>file_download</Icon>
                          </IconButton>
                        </TableCell>
                      </Fragment>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <CircularProgress />
        )}
      </div>
    </div>
  );
}

export default FileExplorer;

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
