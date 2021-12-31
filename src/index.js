import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./translations/i18n";

import App from "./App";
//import reportWebVitals from "./reportWebVitals";

import firebase from "firebase";

import { Dialog, DialogTitle } from "@mui/material";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

const firebaseConfig = {
  apiKey: "AIzaSyD5Tg5t1YD72Q3weL5rYTlxroSH4QwEV-k",
  authDomain: "musamusicapp-c5d73.firebaseapp.com",
  databaseURL: "https://musamusicapp-c5d73-default-rtdb.firebaseio.com",
  projectId: "musamusicapp-c5d73",
  storageBucket: "musamusicapp-c5d73.appspot.com",
  messagingSenderId: "851928058346",
  appId: "1:851928058346:web:95d91a745251985bab8a93",
  measurementId: "G-4ZRP9FY1VG",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const startApp = () => {
  //console.log(device.cordova);
  ReactDOM.render(
    <>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // reset the state of your app so the error doesn't happen again
        }}
      >
        <HashRouter>
          <App />
        </HashRouter>
      </ErrorBoundary>
    </>,
    document.getElementById("root")
  );
};

if (window.cordova) {
  document.addEventListener(
    "deviceready",
    () => {
      startApp();
    },
    false
  );
} else {
  startApp();
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Dialog open={true}>
      <DialogTitle>Ooops.. Something went wrong</DialogTitle>
      <pre>{error.message}</pre>
      {/* <button onClick={resetErrorBoundary}>Try again</button> */}
      <p>Please, refresh the page</p>
    </Dialog>
  );
}
