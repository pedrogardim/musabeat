import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import { useParams } from "react-router-dom";

import {
  Paper,
  Chip,
  Grid,
  Icon,
  IconButton,
  Avatar,
  Tooltip,
  Typography,
  Fab,
  CircularProgress,
  Button,
} from "@mui/material";

import "./style.css";

import { detectPitch } from "../../services/Audio";

import {
  playSequence,
  stop,
} from "../../components/ListExplorer/services/Actions";

import { playersLoader, patchLoader } from "../../services/Instruments";

import { drumCategories, instrumentsCategories } from "../../services/MiscData";

import InstrumentEditor from "../../components/InstrumentEditor";
import LoadingScreen from "../../components/LoadingScreen";
import PlayInterface from "../SessionWorkspace/PlayInterface";

import NotFoundPage from "../NotFoundPage";

let isSustainPedal = false;

function PatchPage(props) {
  const { t } = useTranslation();

  const playFn = useRef(null);

  const { isDrum } = props;

  const [instrument, setInstrument] = useState(null);
  const [patchInfo, setPatchInfo] = useState(null);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [isPatchLiked, setIsPatchLiked] = useState(null);
  const [uploadDateString, setUploadDateString] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [drumLabels, setDrumLabels] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const patchKey = useParams().key;

  const categories = isDrum ? drumCategories : instrumentsCategories;

  const usersRef = firebase.firestore().collection("users");
  const patchInfoRef = firebase
    .firestore()
    .collection(isDrum ? "drumpatches" : "patches")
    .doc(patchKey);
  const user = firebase.auth().currentUser;

  const loadInstrument = async (data) => {
    const instrument = await (isDrum
      ? playersLoader(data, 0, () => setIsLoaded(true))
      : patchLoader(data, 0, () => setIsLoaded(true)));
    setInstrument(instrument);
  };

  const getPatchInfo = () => {
    patchInfoRef.get().then((r) => {
      if (!r.exists) {
        setPatchInfo(undefined);
        return;
      }
      setPatchInfo(r.data());
      loadInstrument(r.data());

      /* let date = new Date(r.data().upOn.seconds * 1000);
      let creationDate = `${t("misc.uploadedOn")} ${date.getDate()}/${
        date.getMonth() + 1
      }/${date.getFullYear()}`;
      setUploadDateString(creationDate); */

      //console.log(0, r.data().dur);

      /* patchInfoRef.update({
        ld: firebase.firestore.FieldValue.increment(1),
      }); */

      r.data().creator &&
        usersRef
          .doc(r.data().creator)
          .get()
          .then((user) => {
            setCreatorInfo(user.data());
          });
    });

    //liked by user
    if (user) {
      usersRef
        .doc(user.uid)
        .get()
        .then((r) =>
          setIsPatchLiked(
            isDrum
              ? r.data().likeddrumpatches.includes(patchKey)
              : r.data().likedpatches.includes(patchKey)
          )
        );
    }
  };

  const handleUserLike = () => {
    if (!isPatchLiked) {
      //file is not liked
      setIsPatchLiked(true);
      setPatchInfo((prev) => {
        let newPatchInfo = { ...prev };
        newPatchInfo.likes++;
        return newPatchInfo;
      });
      patchInfoRef.update({
        likes: firebase.firestore.FieldValue.increment(1),
      });
      usersRef.doc(user.uid).update(
        isDrum
          ? {
              likeddrumpatches:
                firebase.firestore.FieldValue.arrayUnion(patchKey),
            }
          : {
              likedpatches: firebase.firestore.FieldValue.arrayUnion(patchKey),
            }
      );
    } else {
      setIsPatchLiked(false);
      setPatchInfo((prev) => {
        let newPatchInfo = { ...prev };
        newPatchInfo.likes--;
        return newPatchInfo;
      });
      patchInfoRef.update({
        likes: firebase.firestore.FieldValue.increment(-1),
      });
      usersRef.doc(user.uid).update(
        isDrum
          ? {
              likeddrumpatches:
                firebase.firestore.FieldValue.arrayRemove(patchKey),
            }
          : {
              likedpatches: firebase.firestore.FieldValue.arrayRemove(patchKey),
            }
      );
    }
  };

  const handleFileClick = (fileId, fileUrl, audiobuffer, name) => {
    //setInstrumentLoaded(false);

    let labelOnInstrument = Tone.Frequency(
      detectPitch(audiobuffer)[0]
    ).toNote();

    let slotToInsetFile = 0;

    while (
      isDrum &&
      Object.keys(patchInfo.urls).indexOf(JSON.stringify(slotToInsetFile)) !==
        -1
    ) {
      slotToInsetFile++;
    }
    console.log(slotToInsetFile);

    onInstrumentMod(fileId, labelOnInstrument, slotToInsetFile);

    instrument.add(
      isDrum ? slotToInsetFile : labelOnInstrument,
      audiobuffer ? audiobuffer : fileUrl
      //() => setInstrumentLoaded(true)
    );
  };

  const onInstrumentMod = (url, name, soundindex, isRemoving) => {
    if (isDrum || instrument.name === "Sampler") {
      setPatchInfo((prev) => {
        let newPatchInfo = { ...prev };

        if (isDrum) {
          !isRemoving
            ? (newPatchInfo.urls[soundindex] = url)
            : delete newPatchInfo.urls[soundindex];
          !isRemoving
            ? (newPatchInfo.lbls[soundindex] = name)
            : delete newPatchInfo.lbls[soundindex];
        } else {
          !isRemoving
            ? (newPatchInfo.urls[name] = url)
            : delete newPatchInfo.urls[name];
        }

        return newPatchInfo;
      });
    } else {
      setPatchInfo((prev) => {
        let newPatchInfo = { ...prev };
        newPatchInfo.options = instrument.get();
        return newPatchInfo;
      });
    }
  };

  const savePatchChanges = () => {
    // alert confirmation
    isDrum || instrument.name === "Sampler"
      ? patchInfoRef.update({
          base:
            instrument.name === "Sampler"
              ? "Sampler"
              : firebase.firestore.FieldValue.delete(),
          urls: patchInfo.urls,
          options: firebase.firestore.FieldValue.delete(),
        })
      : patchInfoRef.update({
          base: patchInfo.base,
          options: patchInfo.options,
          urls: firebase.firestore.FieldValue.delete(),
        });
  };

  const handleKeyDown = (e) => playFn.current[0](e);

  const handleKeyUp = (e) => playFn.current[1](e);

  const onMIDIMessage = (event) => {
    if (event.data[0] === 176) {
      event.data[2] === 0 && instrument.releaseAll();
      isSustainPedal = event.data[2] === 127;
    }

    event.data[0] === 144 &&
      instrument.triggerAttack(
        Tone.Frequency(event.data[1], "midi"),
        Tone.immediate(),
        event.data[2] / 128
      );
    event.data[0] === 128 &&
      !isSustainPedal &&
      instrument.triggerRelease(
        Tone.Frequency(event.data[1], "midi", Tone.immediate())
      );
  };

  const initializeMidi = () => {
    !!navigator.requestMIDIAccess &&
      navigator.requestMIDIAccess().then(
        (midiAccess) => {
          midiAccess.inputs.forEach((entry) => {
            //console.log("mididdddd", instrument);
            if (instrument)
              entry.onmidimessage = (e) => {
                instrument && onMIDIMessage(e);
              };
            var input = entry;
            console.log(
              "Input port [type:'" +
                input.type +
                "'] id:'" +
                input.id +
                "' manufacturer:'" +
                input.manufacturer +
                "' name:'" +
                input.name +
                "' version:'" +
                input.version +
                "'"
            );
          });
        },
        (err) => console.log(err)
      );
  };

  /*  useEffect(() => {
    if (isLoaded) console.log(isLoaded);
  }, [isLoaded]); */

  useEffect(() => {
    //console.log(patchInfo);
  }, [patchInfo]);

  useEffect(() => {
    !isDrum && initializeMidi();
    console.log(instrument);
  }, [instrument]);

  /* useEffect(() => {
    console.log(isSustainPedal);
  }, [isSustainPedal]); */

  /*   useEffect(() => {
    console.log(activeNotes);
  }, [activeNotes]); */

  useEffect(() => {
    getPatchInfo();

    return () => {
      //console.log("cleared");
      instrument && instrument.dispose();
    };
  }, []);

  return (
    <div
      className="file-page"
      tabIndex="0"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {instrument && patchInfo !== undefined ? (
        <>
          <Typography variant="h4" color="textPrimary">
            {patchInfo ? patchInfo.name : "..."}
          </Typography>
          {patchInfo && patchInfo.base === "Sampler" && (
            <Tooltip arrow placement="top" title="Sampler">
              <Icon style={{ marginLeft: 4 }}>graphic_eq</Icon>
            </Tooltip>
          )}
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
            className="ie-cont"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* TODO */}
            {/* isLoaded ? (
              <InstrumentEditor
                patchPage
                track={{
                  type: isDrum ? 0 : 1,
                  instrument: { urls: patchInfo.urls, ...patchInfo.options },
                  lbls: patchInfo.lbls,
                }}
                instrument={instrument}
                setInstruments={props.setInstruments}
                setInstrument={setInstrument}
                setInstrumentLoaded={setIsLoaded}
                onInstrumentMod={onInstrumentMod}
                setLabels={setLabels}
                handleFileClick={handleFileClick}
                setPatchInfo={setPatchInfo}
                handlePageNav={props.handlePageNav}
              />
            ) : (
              <CircularProgress />
            ) */}
          </Paper>

          <div className="break" />

          {patchInfo && (
            <Chip
              style={{ margin: "0px 4px" }}
              label={categories[patchInfo.categ]}
              variant="outlined"
            />
          )}
          <div className="break" />

          <div className="player-controls">
            <IconButton
              onClick={() =>
                isPlaying
                  ? stop(instrument, setIsPlaying)
                  : playSequence(instrument, setIsPlaying)
              }
            >
              <Icon>{isPlaying ? "pause" : "play_arrow"}</Icon>
            </IconButton>

            <Tooltip title={patchInfo && patchInfo.likes}>
              <IconButton onClick={handleUserLike}>
                <Icon color={isPatchLiked ? "secondary" : "inherit"}>
                  favorite
                </Icon>
                <Typography className="like-btn-label" variant="overline">
                  {patchInfo && patchInfo.likes}
                </Typography>
              </IconButton>
            </Tooltip>

            {/* <IconButton onClick={huehue}>
          <Icon>manage_accounts</Icon>
        </IconButton> */}
          </div>
          <div className="break" />

          {patchInfo && user && user.uid === patchInfo.creator && (
            <div style={{ position: "absolute", right: 16, bottom: 16 }}>
              <Tooltip title="Save Changes">
                <Fab
                  color="primary"
                  onClick={() => savePatchChanges()}
                  style={{ marginRight: 16, zIndex: 99 }}
                >
                  <Icon>save</Icon>
                </Fab>
              </Tooltip>
              <Tooltip title="Save as new">
                <Fab
                  color="primary"
                  onClick={() => savePatchChanges()}
                  style={{ zIndex: 99 }}
                >
                  <Icon>add</Icon>
                </Fab>
              </Tooltip>
            </div>
          )}
          <div style={{ maxWidth: 1200, width: "100%" }}>
            {patchInfo && (
              <PlayInterface
                playFn={playFn}
                track={{
                  type: isDrum ? 0 : 1,
                  instrument: { urls: patchInfo.urls, ...patchInfo.options },
                }}
                instrument={instrument}
                trackRows={
                  isDrum
                    ? Object.keys(patchInfo.urls).map((e) => ({
                        note: e,
                      }))
                    : ["a"]
                }
              />
            )}
          </div>
        </>
      ) : !instrument ? (
        <LoadingScreen open={true} />
      ) : (
        <NotFoundPage
          type="patchPage"
          handlePageNav={() =>
            props.handlePageNav(isDrum ? "drumsets" : "instruments")
          }
        />
      )}
    </div>
  );
}

export default PatchPage;
