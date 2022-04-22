import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import firebase from "firebase";
import { useTranslation } from "react-i18next";

import { useParams } from "react-router-dom";

import {
  Avatar,
  CircularProgress,
  Skeleton,
  Tooltip,
  Divider,
  Typography,
} from "@mui/material";

import AppLogo from "../../../components/AppLogo";

import "./style.css";

import { colors } from "../../../utils/Pallete";

const color = colors[2];

function AvatarRow(props) {
  const { t } = useTranslation();

  const { user, setItems, userInfo } = props;

  const [users, setUsers] = useState(null);

  const getFollowingUsers = async () => {
    if (!userInfo) return;

    const fllwingUsersInfo = await Promise.all(
      userInfo.fllwing.map(async (e) =>
        (await firebase.firestore().collection("users").doc(e).get()).data()
      )
    );
    setUsers(fllwingUsersInfo);
  };

  useEffect(() => {
    getFollowingUsers();
  }, [userInfo]);

  return (
    <div
      className="avatar-row"
      style={{ overflowX: users ? "overlay" : "hidden" }}
    >
      {userInfo ? (
        <Avatar
          alt={userInfo.profile.username}
          src={userInfo.profile.photoURL}
          className="avatar-row-pic"
          sx={{
            bgcolor: colors.map((e) => Object.values(e)).flat()[
              userInfo.profile.username.toUpperCase().charCodeAt(0) - 48
            ],
          }}
        />
      ) : (
        <Skeleton className="avatar-row-pic" variant="circular" />
      )}
      <Divider orientation="vertical" sx={{ mr: 2 }} />
      {users ? (
        users.length === 0 ? (
          <Typography>Users you follow will appear here</Typography>
        ) : (
          users.map((e) => (
            <Tooltip title={e.profile.username}>
              <Avatar
                alt={e.profile.username}
                src={e.profile.photoURL}
                className="avatar-row-pic"
                sx={{
                  bgcolor: colors.map((e) => Object.values(e)).flat()[
                    e.profile.username.toUpperCase().charCodeAt(0) - 48
                  ],
                }}
              />
            </Tooltip>
          ))
        )
      ) : (
        Array(20)
          .fill(0)
          .map((_) => (
            <Skeleton className="avatar-row-pic" variant="circular" />
          ))
      )}
    </div>
  );
}

export default AvatarRow;
