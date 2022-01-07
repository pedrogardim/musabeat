import React, { useState, useEffect } from "react";

import firebase from "firebase";

const typeDBMapping = {
  files: "files",
  seq: "drumpatches",
  instr: "patches",
};

export const useListQuery = (props) => {
  const {
    searchValue,
    searchTags,
    showingLiked,
    showingUser,
    items,
    setItems,
    type,
    userPage,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [isFirstQuery, setIsFirstQuery] = useState(true);
  const [isQueryEnd, setIsQueryEnd] = useState(false);
  const [lastItem, setLastItem] = useState(null);

  const itemsPerPage = 15;
  const user = firebase.auth().currentUser;

  const queryItems = async (clear) => {
    //TODO: Scroll load in /files/
    const usersRef = firebase.firestore().collection("users");
    const storageRef = firebase.storage();

    setIsLoading(true);

    const fileIdList = user
      ? (await usersRef.doc(user.uid).get()).get(
          showingLiked ? "liked" + typeDBMapping[type] : typeDBMapping[type]
        )
      : [];

    let queryRules = () => {
      let rules = firebase.firestore().collection(typeDBMapping[type]);

      if (user && (userPage || showingLiked || showingUser)) {
        rules = rules.where(
          firebase.firestore.FieldPath.documentId(),
          "in",
          fileIdList
        );
      }

      if (searchValue) {
        rules = rules
          .where("name", ">=", searchValue)
          .where("name", "<=", searchValue + "\uf8ff");
      }
      if (searchTags.length > 0) {
        let tagsIds = searchTags;
        rules = rules.where("categ", "array-contains-any", tagsIds);
      }
      if (!clear && !isFirstQuery && lastItem) {
        rules = rules.startAfter(lastItem);
      }

      return rules;
    };

    const fileQuery = await queryRules().limit(itemsPerPage).get();

    setLastItem(fileQuery.docs[fileQuery.docs.length - 1]);

    if (fileQuery.docs.length < itemsPerPage) {
      setIsQueryEnd(true);
    }

    const filesUrl =
      type === "files"
        ? await Promise.all(
            fileQuery.docs.map(async (e, i) => {
              return await storageRef.ref(e.id).getDownloadURL();
            })
          )
        : [];

    const usersToFetch = [
      ...new Set(
        fileQuery.docs
          .map((e) => e.data()[type === "files" ? "user" : "creator"])
          .filter((e) => e)
        //.filter((e) => items.findIndex((x) => x.data.user === e) === -1)
      ),
    ];

    const userData =
      usersToFetch.length > 0
        ? Object.fromEntries(
            await Promise.all(
              usersToFetch.map(async (e, i) => [
                e,
                (await usersRef.doc(e).get()).get("profile"),
              ])
            )
          )
        : [];

    const queryItems = fileQuery.docs.map((e, i) => ({
      id: e.id,
      data: e.data(),
      url: type === "files" ? filesUrl[i] : undefined,
      user: userData[e.data()[type === "files" ? "user" : "creator"]],
    }));

    console.log(queryItems);

    setItems((prev) => [...prev, ...queryItems]);

    setIsFirstQuery(queryItems === false);
  };

  const clearItems = () => {
    setLastItem(null);
    setIsFirstQuery(true);
    setItems([]);
  };

  useEffect(() => {
    clearItems();
    queryItems();
  }, []);

  useEffect(() => {
    if (items === null || (items && items.length > 0)) setIsLoading(false);
    if (items && items.length === 0) setIsLoading(true);
  }, [items]);

  useEffect(() => {
    if (userPage && user) {
      clearItems();
      queryItems(showingLiked);
    }
  }, [userPage, user, showingLiked]);

  useEffect(() => {
    clearItems();
    if (!isLoading) {
      queryItems("clear");
    }
    console.log(searchTags, searchValue);
  }, [searchTags, searchValue]);

  return { isLoading, isQueryEnd, queryItems };
};

export default useListQuery;
