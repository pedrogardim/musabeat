import React, { useState, useEffect, Fragment, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import InstrumentEditor from "../../InstrumentEditor/InstrumentEditor";

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
} from "@material-ui/core";

import "./PatchPage.css";

import {
  drumCategories,
  instrumentsCategories,
  loadSynthFromGetObject,
  loadSamplerFromObject,
  loadDrumPatch,
  detectPitch,
} from "../../../assets/musicutils";

import { colors } from "../../../utils/materialPalette";

const waveColor = colors[2];

let isSustainPedal = false;

function PatchPage(props) {
  const { t } = useTranslation();

  const waveformWrapper = useRef(null);

  const [instrument, setInstrument] = useState(null);
  const [patchInfo, setPatchInfo] = useState(null);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [isPatchLiked, setIsPatchLiked] = useState(null);
  const [uploadDateString, setUploadDateString] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [drumLabels, setDrumLabels] = useState(false);

  const patchKey = useParams().key;

  const categories = props.isDrum ? drumCategories : instrumentsCategories;

  const usersRef = firebase.firestore().collection("users");
  const patchInfoRef = firebase
    .firestore()
    .collection(props.isDrum ? "drumpatches" : "patches")
    .doc(patchKey);
  const user = firebase.auth().currentUser;

  const getPatchInfo = () => {
    patchInfoRef.get().then((r) => {
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
            props.isDrum
              ? r.data().likedDrumPatches.includes(patchKey)
              : r.data().likedPatches.includes(patchKey)
          )
        );
    }
  };

  const loadInstrument = (patchdata) => {
    if (props.isDrum) {
      loadDrumPatch(
        patchdata,
        () => {},
        0,
        () => {
          setIsLoaded(true);
        },
        "",
        setDrumLabels
      ).then((instr) => {
        setInstrument(instr);
      });
    } else if (patchdata.base === "Sampler") {
      loadSamplerFromObject(
        patchdata,
        () => {},
        0,
        () => {
          setIsLoaded(true);
        }
      ).then((instr) => {
        setInstrument(instr);
      });
    } else {
      let instr = loadSynthFromGetObject(patchdata);

      setInstrument(instr);
      setIsLoaded(true);
    }
  };

  const playSequence = () => {
    setIsPlaying(true);
    if (props.isDrum) {
      let playerIndex = 0;
      let keysArray = [];
      instrument._buffers._buffers.forEach((v, key) => {
        keysArray.push(key);
      });

      keysArray.forEach((e, i) => {
        i < 7 && instrument.player(e).start("+" + i * 0.2);
      });

      Tone.Draw.schedule(() => {
        setIsPlaying(false);
      }, "+1.2");
    } else {
      instrument
        .triggerAttackRelease("C3", "8n", "+0:0:2")
        .triggerAttackRelease("E3", "8n", "+0:1:0")
        .triggerAttackRelease("G3", "8n", "+0:1:2")
        .triggerAttackRelease("B3", "8n", "+0:2")
        .triggerAttackRelease("C4", "8n", "+0:2:2")
        .triggerAttackRelease("E4", "8n", "+0:3:0")
        .triggerAttackRelease("G4", "8n", "+0:3:2")
        .triggerAttackRelease("B4", "8n", "+1:0:0");

      Tone.Draw.schedule(() => {
        setIsPlaying(false);
      }, "+1:0:2");
    }
  };

  const stopSequence = () => {
    !props.isDrum ? instrument.releaseAll() : instrument.stopAll();
    setIsPlaying(false);
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
        props.isDrum
          ? {
              likedDrumPatches:
                firebase.firestore.FieldValue.arrayUnion(patchKey),
            }
          : {
              likedPatches: firebase.firestore.FieldValue.arrayUnion(patchKey),
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
        props.isDrum
          ? {
              likedDrumPatches:
                firebase.firestore.FieldValue.arrayRemove(patchKey),
            }
          : {
              likedPatches: firebase.firestore.FieldValue.arrayRemove(patchKey),
            }
      );
    }
  };

  const setLabels = (index, newName) => {
    setPatchInfo((prev) => {
      let newPatch = { ...prev };
      newPatch.lbls[index] = newName;
      return newPatch;
    });
  };

  /*   const huehue = () => {
    firebase
      .firestore()
      .collection("files")
      .get()
      .then((r) =>
        r.forEach((e) => {
          firebase
            .firestore()
            .collection("files")
            .doc(e.id)
            .update({
              upOn: firebase.firestore.FieldValue.serverTimestamp(),
            })
            .then(console.log("done on file " + e.id));
        })
      );
  }; */

  const handleFileClick = (fileId, fileUrl, audiobuffer, name) => {
    //setInstrumentLoaded(false);

    let labelOnInstrument = Tone.Frequency(
      detectPitch(audiobuffer)[0]
    ).toNote();

    let slotToInsetFile = 0;

    while (
      props.isDrum &&
      Object.keys(patchInfo.urls).indexOf(JSON.stringify(slotToInsetFile)) !==
        -1
    ) {
      slotToInsetFile++;
    }
    console.log(slotToInsetFile);

    onInstrumentMod(fileId, labelOnInstrument, slotToInsetFile);

    instrument.add(
      props.isDrum ? slotToInsetFile : labelOnInstrument,
      audiobuffer ? audiobuffer : fileUrl
      //() => setInstrumentLoaded(true)
    );
  };

  const onInstrumentMod = (url, name, soundindex, isRemoving) => {
    if (props.isDrum || instrument.name === "Sampler") {
      setPatchInfo((prev) => {
        let newPatchInfo = { ...prev };

        if (props.isDrum) {
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

    patchInfoRef.update(
      props.isDrum || instrument.name === "Sampler"
        ? { urls: patchInfo.urls }
        : { options: patchInfo.options }
    );
  };

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
            console.log("mididdddd", instrument);
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

  useEffect(() => {
    if (isLoaded) console.log(isLoaded);
  }, [isLoaded]);

  useEffect(() => {
    console.log(patchInfo);
  }, [patchInfo]);

  useEffect(() => {
    !props.isDrum && initializeMidi();
  }, [instrument]);

  useEffect(() => {
    console.log(isSustainPedal);
  }, [isSustainPedal]);

  useEffect(() => {
    getPatchInfo();

    return () => {
      //console.log("cleared");
      instrument && instrument.dispose();
    };
  }, []);

  return (
    <div className="file-page">
      <Typography variant="h4">{patchInfo ? patchInfo.name : "..."}</Typography>
      {patchInfo && patchInfo.base === "Sampler" && (
        <Tooltip arrow placement="top" title="Sampler">
          <Icon style={{ marginLeft: 4 }}>graphic_eq</Icon>
        </Tooltip>
      )}
      <div className="break" />
      {creatorInfo && (
        <Tooltip title={creatorInfo.profile.displayName}>
          <Avatar
            alt={creatorInfo.profile.displayName}
            src={creatorInfo.profile.photoURL}
            onClick={() => props.handlePageNav("user", patchInfo.creator, true)}
          />
        </Tooltip>
      )}
      <div className="break" />

      <Paper elevation={3} className="ie-cont">
        {isLoaded ? (
          <InstrumentEditor
            patchPage
            module={{
              type: props.isDrum ? 0 : 1,
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
        )}
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
        <IconButton onClick={isPlaying ? stopSequence : playSequence}>
          <Icon>{isPlaying ? "pause" : "play_arrow"}</Icon>
        </IconButton>

        <Tooltip title={patchInfo && patchInfo.likes}>
          <IconButton onClick={handleUserLike}>
            <Icon color={isPatchLiked ? "secondary" : "inherit"}>favorite</Icon>
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

      {/* {patchInfo && (
        <Grid
          container
          spacing={1}
          style={{ width: "40%" }}
          className="file-info"
        >
          <Grid item xs={6} sm={3}>
            <Paper className="file-info-card">
              <Typography variant="overline">Grid item 1</Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper className="file-info-card">
              <Typography variant="overline">Grid item 2</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper className="file-info-card">
              <Typography variant="overline"> Grid item 3</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper className="file-info-card">
              <Typography variant="overline"> Grid item 4</Typography>
            </Paper>
          </Grid>
        </Grid>
      )} */}
      {patchInfo && user && user.uid === patchInfo.creator && (
        <div style={{ position: "absolute", right: 16, bottom: 16 }}>
          <Tooltip title="Save Changes">
            <Fab
              color="primary"
              onClick={savePatchChanges}
              style={{ marginRight: 16 }}
            >
              <Icon>save</Icon>
            </Fab>
          </Tooltip>
          <Tooltip title="Save as new">
            <Fab color="primary" onClick={savePatchChanges}>
              <Icon>add</Icon>
            </Fab>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

export default PatchPage;
