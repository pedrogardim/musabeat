import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import firebase from "firebase";

import { BrowserRouter } from "react-router-dom";

const firebaseConfig = {
  apiKey: "AIzaSyD5Tg5t1YD72Q3weL5rYTlxroSH4QwEV-k",
  authDomain: "musamusicapp-c5d73.firebaseapp.com",
  projectId: "musamusicapp-c5d73",
  storageBucket: "musamusicapp-c5d73.appspot.com",
  messagingSenderId: "851928058346",
  appId: "1:851928058346:web:95d91a745251985bab8a93",
  measurementId: "G-4ZRP9FY1VG",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

ReactDOM.render(
  //<React.StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  //</React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
