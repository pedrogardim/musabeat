import React, { useState, useEffect } from "react";

import firebase from "firebase";

function useFetchFeed() {
  const [feedItems, setFeedItems] = useState([]);

  const fetchFeed = (idList) => {
    Promise.all(
      idList.map(
        async (e, i) =>
          await firebase.firestore().collection("sessions").doc(e.id).get()
      )
    ).then((values) => {
      setFeedItems(values.map((e) => e.data()));
    });
  };

  useEffect(() => {
    //console.log(feedItems);
  }, [feedItems]);

  return { feedItems, fetchFeed };
}

export default useFetchFeed;
