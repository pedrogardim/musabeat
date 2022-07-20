import { useEffect, useState } from "react";

import * as Tone from "tone";
import firebase from "firebase";

import { fileTypes, encodeAudioFile } from "../services/Audio";

function useFileUpload(opt) {
  const { notifications, setNotifications, uploadingFiles, setUploadingFiles } =
    opt;

  const [filesUploadState, setFilesUploadState] = useState([]);
  const [notificationIndexes, setNotificationIndexes] = useState([]);
  const [filesInfo, setFilesInfo] = useState([]);
  const [filesId, setFilesId] = useState([]);

  const user = firebase.auth().currentUser;
  const userRef =
    user && firebase.firestore().collection("users").doc(user.uid);
  const filesRef = firebase.firestore().collection("files");

  const storageLim = { normal: 536870912, pr: 10737418240 };

  const setFileUploadState = (state, index) => {
    setFilesUploadState((prev) => {
      let newState = [...prev];
      newState[index] = state;
      return newState;
    });
  };

  const uploadFile = async (file, buffer, onIdGet, onUpload, index = 0) => {
    setNotificationIndexes((prev) =>
      notifications ? [...prev, notifications.length + index] : prev
    );
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

      setFilesInfo((prev) => [...prev, fileInfo]);

      const checkQuery = await filesRef
        .where("dur", "==", fileInfo.dur)
        .where("name", "==", fileInfo.name)
        .where("user", "==", user.uid)
        .where("size", "==", file.size)
        .get();

      if (!checkQuery.empty) {
        const fileId = checkQuery.docs[0].id;

        setFileUploadState("duplicatedFound", index);
        onIdGet && onIdGet(fileId, fileInfo, audioBuffer);
        onUpload && onUpload(fileId, fileInfo, audioBuffer);

        setFilesId((prev) => {
          let newIds = [...prev];
          newIds[index] = fileId;
          return newIds;
        });

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
        const checkPremium =
          userData.pr && userData.pr.seconds > ~~(+new Date() / 1000);

        onIdGet && onIdGet(fileDBRef.id, fileInfo, audioBuffer);

        const finalFile =
          file.type !== "audio/mpeg" && !checkPremium
            ? encodeAudioFile(audioBuffer, "mp3")
            : file;
        if (
          userData.sp + finalFile.size >
          (checkPremium ? storageLim.pr : storageLim.normal)
        ) {
          setFileUploadState("noSpace", index);
          return;
        }
        const uploadTask = storageRef.put(finalFile);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            setFileUploadState(
              (snapshot.bytesTransferred * 100) / snapshot.totalBytes,
              index
            );
          },
          (e) => {
            console.log(e);
            filesRef.doc(fileDBRef.id).remove();
            setFileUploadState("uploadError", index);
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

        return uploadTask.then(() => fileDBRef.id);
      }
    } catch (e) {
      console.log(e);
      setFileUploadState("decodingError", index);
    }
  };

  const uploadFiles = async (files, callback) => {
    //console.log("files", files);
    Promise.all(files.map((e) => uploadFile(e.file))).then((ids) => {
      callback && callback(ids);
      setUploadingFiles([]);
    });
  };

  useEffect(() => {
    if (uploadingFiles && uploadingFiles.length > 0)
      uploadFiles(uploadingFiles);
  }, [uploadingFiles]);

  useEffect(() => {
    if (setNotifications && filesUploadState.length > 0 && filesInfo !== null)
      setNotifications((prev) => {
        let newNotifications = [...prev];
        notificationIndexes.forEach((e, i) => {
          newNotifications[e] = {
            type: "upload",
            info: filesInfo[i],
            state: filesUploadState[i],
          };
        });
        return newNotifications;
      });
  }, [filesUploadState, filesInfo]);

  return {
    uploadFile,
    uploadFiles,
  };
}

export default useFileUpload;
