import { playersLoader, patchLoader } from "../../../services/Instruments";

import * as Tone from "tone";

import firebase from "firebase";

export const play = async (
  instrument,
  type,
  setIsPlaying,
  row,
  setInstrument,
  setIsLoading
) => {
  if (type === "files") {
    if (instrument !== null) {
      setIsPlaying(true);
      instrument.start();
    } else {
      setIsLoading(true);
      let player = new Tone.Player(row.url, () => {
        player.state !== "started" && player.start();
        setIsPlaying(true);
        setIsLoading(false);
      }).toDestination();
      player.onstop = () => {
        setIsPlaying(false);
      };
      setInstrument(player);
    }
  }

  if (type === "seq" || type === "instr") {
    if (instrument !== null) {
      playSequence(instrument, setIsPlaying);
    } else {
      setIsLoading(true);
      let player = await (type === "seq"
        ? playersLoader(row.data, row.id, () => {})
        : patchLoader(row.data, row.id, () => {}));

      player.onLoad = () => {
        playSequence(player, setIsPlaying);
        setIsLoading(false);
      };
      setInstrument(player);
    }
  }
};

export const playSequence = (instr, setIsPlaying) => {
  setIsPlaying(true);
  if (instr.name === "Players") {
    let keysArray = [];
    instr._buffers._buffers.forEach((v, key) => {
      keysArray.push(key);
    });

    keysArray.forEach((e, i) => {
      i < 7 && instr.player(e).start("+" + i * 0.2);
    });

    Tone.Draw.schedule(() => {
      setIsPlaying(false);
    }, "+1.2");
  } else {
    instr
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

export const stop = (instr, setIsPlaying) => {
  if (instr.name === "Player") instr.stop();
  else if (instr.name === "Players") instr.stopAll();
  else instr.releaseAll();
  setIsPlaying(false);
};

export const handleDownload = (row) => {
  const xhr = new XMLHttpRequest();
  xhr.responseType = "blob";
  xhr.onload = () => {
    var blob = xhr.response;
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = row.data.name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
  };
  xhr.open("GET", row.url);
  xhr.send();
};

export const deleteItem = (index, items, setItems, collection) => {
  let itemId = items[index].id;

  firebase.storage().ref(itemId).delete();

  firebase.firestore().collection(collection).doc(itemId).delete();

  firebase
    .firestore()
    .collection("users")
    .doc(items[index].data.user)
    .update({
      [collection]: firebase.firestore.FieldValue.arrayRemove(itemId),
      sp: firebase.firestore.FieldValue.increment(
        collection === "files" ? -items[index].data.size : 0
      ),
    });

  setItems((prev) => prev.filter((e, i) => i !== index));
};

export const renameItem = (index, newValue, items, setItems, collection) => {
  let itemId = items[index].id;

  firebase
    .firestore()
    .collection(collection)
    .doc(itemId)
    .update({ name: newValue });
  setItems((prev) => {
    let newItems = [...prev];
    newItems[index].data.name = newValue;
    return newItems;
  });
};

export const likeItem = (
  index,
  items,
  setItems,
  userLikes,
  setUserLikes,
  collection
) => {
  const user = firebase.auth().currentUser;

  if (user === null) return;

  let likedFileId = items[index].id;

  const dbUserRef = firebase.firestore().collection("users").doc(user.uid);
  const dbFileRef = firebase
    .firestore()
    .collection(collection)
    .doc(likedFileId);

  if (!userLikes.includes(likedFileId)) {
    dbUserRef.update({
      likedfiles: firebase.firestore.FieldValue.arrayUnion(likedFileId),
    });

    dbFileRef.update({ likes: firebase.firestore.FieldValue.increment(1) });
    setUserLikes((prev) => [...prev, likedFileId]);
    setItems((prev) => {
      let newItems = [...prev];
      newItems[index].data.likes++;
      return newItems;
    });
  } else {
    dbUserRef.update({
      likedfiles: firebase.firestore.FieldValue.arrayRemove(likedFileId),
    });

    dbFileRef.update({ likes: firebase.firestore.FieldValue.increment(-1) });
    setUserLikes((prev) => prev.filter((e) => e !== likedFileId));
    setItems((prev) => {
      let newItems = [...prev];
      newItems[index].data.likes--;
      return newItems;
    });
  }
};

export const selectTag = (
  tag,
  tagSelectionTarget,
  setTagSelectionTarget,
  items,
  setItems,
  collection
) => {
  let itemIndex = tagSelectionTarget[1];
  let tagIndex = tagSelectionTarget[2];

  let hasTag = items[itemIndex].data.categ[tagIndex] === tag;

  if (!hasTag) {
    let finalCateg;
    setItems((prev) => {
      let newUpTags = [...prev];
      newUpTags[itemIndex].data.categ[tagIndex] = tag;
      finalCateg = newUpTags[itemIndex].data.categ;
      return newUpTags;
    });
    firebase
      .firestore()
      .collection(collection)
      .doc(items[itemIndex].id)
      .update({ categ: finalCateg });
  }

  setTagSelectionTarget(null);
};
