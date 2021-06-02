
import React, { useState, useEffect, Fragment } from "react";

import { Fab, Icon, IconButton,Dialog, Button } from "@material-ui/core";

import firebase from "firebase";

import "./AuthDialog.css";

function AuthDialog(props) {

  const handleGoogleLogin = () => {
    const provider = new firebase.auth.GoogleAuthProvider()
    firebase.auth().signInWithPopup(provider)
        .then(result=>{
          console.log(result.user.email)
          props.setAuthDialog(false)
        })
        .catch(error=>console.log(error.message));

  }


  
  

  return (
    <Dialog className="auth-dialog" open={props.authDialog} onClose={()=>props.setAuthDialog(false)}>
      <Button onClick={handleGoogleLogin}>Log In with Google</Button>

    </Dialog>

  );
}

export default AuthDialog;
