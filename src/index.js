import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import firebase from "firebase";

const firebaseConfig = {
  apiKey: "AIzaSyDMnEQYcIN4dcwFW_ls3d23C1tOQCxsYGo",
  authDomain: "musa-fc149.firebaseapp.com",
  databaseURL: "https://musa-fc149-default-rtdb.firebaseio.com",
  projectId: "musa-fc149",
  storageBucket: "musa-fc149.appspot.com",
  messagingSenderId: "782550093685",
  appId: "1:782550093685:web:ece5438a5eb4db2d448d3c",
  measurementId: "G-SH0QZXLRXW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
