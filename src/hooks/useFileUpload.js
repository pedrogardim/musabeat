import { useEffect, useState } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import { fileTypes, encodeAudioFile } from "../services/Audio";

function useFileUpload(opt) {
  const { notifications, setNotifications } = opt;

  const [uploadState, setUploadState] = useState(null);
  const [notificationIndex, setNotificationIndex] = useState(
    notifications && notifications.length
  );
  const [info, setInfo] = useState(null);

  const user = firebase.auth().currentUser;
  const userRef =
    user && firebase.firestore().collection("users").doc(user.uid);
  const filesRef = firebase.firestore().collection("files");

  const storageLim = { normal: 536870912, pr: 10737418240 };

  const uploadFile = async (file, buffer, onIdGet, onUpload) => {
    setNotificationIndex(notifications && notifications.length);
    try {
      const arrayBuffer = await file.arrayBuffer();

      const audioBuffer = buffer
        ? buffer
        : await Tone.getContext().rawContext.decodeAudioData(arrayBuffer);

      const fileInfo = {
        name: file.name ? file.name.split(".")[0] : "AudioFile",
        size: file.size,
        dur: parseFloat(audioBuffer.duration.toFixed(3)),
        ld: 1,
        in: 0,
        likes: 0,
        dl: 0,
        user: user.uid,
        categ: [],
        type: fileTypes.indexOf(file.type),
        upOn: firebase.firestore.FieldValue.serverTimestamp(),
      };

      setInfo(fileInfo);

      const checkQuery = await filesRef
        .where("dur", "==", fileInfo.dur)
        .where("name", "==", fileInfo.name)
        .where("user", "==", user.uid)
        .where("size", "==", file.size)
        .get();

      if (!checkQuery.empty) {
        const fileId = checkQuery.docs[0].id;

        setUploadState("duplicatedFound");
        onIdGet && onIdGet(fileId, fileInfo, audioBuffer);
        onUpload && onUpload(fileId, fileInfo, audioBuffer);

        firebase
          .firestore()
          .collection("files")
          .doc(fileId)
          .update({
            ld: firebase.firestore.FieldValue.increment(1),
          });
      } else {
        const fileDBRef = await filesRef.add(fileInfo);
        const storageRef = firebase.storage().ref(fileDBRef.id);
        const userData = (await userRef.get()).data();
        const checkPremium = userData.pr.seconds > ~~(+new Date() / 1000);

        onIdGet && onIdGet(fileDBRef.id, fileInfo, audioBuffer);

        const finalFile =
          file.type !== "audio/mpeg" && !checkPremium
            ? encodeAudioFile(audioBuffer, "mp3")
            : file;
        if (
          userData.sp + finalFile.size >
          (checkPremium ? storageLim.pr : storageLim.normal)
        ) {
          setUploadState("noSpace");
          return;
        }
        const uploadTask = storageRef.put(finalFile);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            setUploadState(
              (snapshot.bytesTransferred * 100) / snapshot.totalBytes
            );
          },
          (e) => {
            console.log(e);
            filesRef.doc(fileDBRef.id).remove();
            setUploadState("uploadError");
            return;
          },
          () => {
            onUpload && onUpload(fileDBRef.id, fileInfo, audioBuffer);
            userRef.update({
              files: firebase.firestore.FieldValue.arrayUnion(fileDBRef.id),
              sp: firebase.firestore.FieldValue.increment(finalFile.size),
            });
          }
        );
      }
    } catch (e) {
      console.log(e);
      setUploadState("decodingError");
    }
  };

  useEffect(() => {
    if (setNotifications && uploadState !== null && info !== null)
      setNotifications((prev) => {
        let newNotifications = [...prev];
        newNotifications[notificationIndex] = {
          type: "upload",
          info: info,
          state: uploadState,
        };
        return newNotifications;
      });
  }, [uploadState, info]);

  return {
    uploadFile,
  };
}

export default useFileUpload;
