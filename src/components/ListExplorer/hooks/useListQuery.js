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
    const usersRef = firebase.firestore().collection("users");
    const storageRef = firebase.storage();

    setIsLoading(true);

    const itemIdList = user
      ? (await usersRef.doc(user.uid).get()).get(
          showingLiked ? "liked" + typeDBMapping[type] : typeDBMapping[type]
        )
      : [];

    const queryRules = () => {
      let rules = firebase.firestore().collection(typeDBMapping[type]);

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

      return userPage
        ? rules.limit(itemsPerPage).get()
        : Promise.all(
            itemIdList.map((e) =>
              firebase.firestore().collection(typeDBMapping[type]).doc(e).get()
            )
          );
    };

    const queryResult = await queryRules();

    const queryDocs = userPage ? queryResult.docs : queryResult;

    if (!userPage) {
      setLastItem(queryDocs[queryDocs.length - 1]);
      if (queryDocs.length < itemsPerPage) {
        setIsQueryEnd(true);
      }
    }

    const filesUrl =
      type === "files"
        ? await Promise.all(
            queryDocs.map(async (e, i) => {
              return await storageRef.ref(e.id).getDownloadURL();
            })
          )
        : [];

    const usersToFetch = [
      ...new Set(
        queryDocs
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

    const queryItems = queryDocs.map((e, i) => ({
      id: e.id,
      data: e.data(),
      url: type === "files" ? filesUrl[i] : undefined,
      user: userData[e.data()[type === "files" ? "user" : "creator"]],
    }));

    console.log(queryItems);

    setItems((prev) => (userPage ? [...queryItems] : [...prev, ...queryItems]));

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
