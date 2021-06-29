import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import firebase from "firebase";
import { Dialog, DialogTitle } from "@material-ui/core";

import { BrowserRouter } from "react-router-dom";

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

ReactDOM.render(
  //<React.StrictMode>
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onReset={() => {
      // reset the state of your app so the error doesn't happen again
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>,

  //</React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

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
