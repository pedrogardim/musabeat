import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./translations/i18n";

import App from "./App";

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

firebase.initializeApp(firebaseConfig);

const startApp = () => {
  ReactDOM.render(
    <>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </>,
    document.getElementById("root")
  );
};

startApp();

function ErrorFallback({ error }) {
  return (
    <Dialog open={true}>
      <DialogTitle>Ooops.. Something went wrong</DialogTitle>
      <pre>{error.message}</pre>
      <p>Please, refresh the page</p>
    </Dialog>
  );
}
