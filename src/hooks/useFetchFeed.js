import React, { useState, useEffect } from "react";

import firebase from "firebase";

function useFetchFeed(userId) {
  const [feedItems, setFeedItems] = useState([]);

  const fetchFeed = async () => {
    if (!userId) return;

    const idList = (
      await firebase.firestore().collection("users").doc(userId).get()
    ).data().feed;

    const feedData = await Promise.all(
      idList.map(
        async (e, i) =>
          await firebase.firestore().collection("sessions").doc(e.id).get()
      )
    );

    setFeedItems(feedData.map((e) => e.data()));
  };

  useEffect(() => {
    console.log(feedItems);
  }, [feedItems]);

  return { feedItems, fetchFeed };
}

export default useFetchFeed;
