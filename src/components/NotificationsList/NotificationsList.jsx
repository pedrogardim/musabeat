import React, { useState, useRef, useEffect } from "react";

import {
  Popover,
  Icon,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";

import { fileExtentions } from "../../services/Audio";

import { useTranslation } from "react-i18next";

const notificationsIcons = {
  patchNotFound: "piano_off",
  fileNotFound: "find_in_page",
  fileInfoError: "help_outline",
  upload: {
    100: "task",
    uploadError: "error",
    duplicatedFound: "done_all",
    importSmallerFile: "warning",
    decodingError: "warning",
    importedLocally: "offline_pin",
    noSpace: "inventory_2",
    patchSizeLimit: "piano_off",
  },
};

function NotificationsList(props) {
  const { t } = useTranslation();

  const { notifications, setNotifications, sx } = props;

  const anchorRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [areNew, setAreNew] = useState(false);

  const progressIndex = notifications.findIndex(
    (e) => e.state && typeof e.state === "number" && e.state !== 100
  );

  useEffect(() => {
    if (notifications.length > 0 && !open) setAreNew(true);
  }, [notifications]);

  useEffect(() => {
    if (open) setAreNew(false);
  }, [open]);
  return (
    <>
      <IconButton
        onClick={() => setOpen((prev) => !prev)}
        ref={anchorRef}
        sx={{ ...sx }}
      >
        {progressIndex === -1 ? (
          <Badge color="secondary" variant="dot" invisible={!areNew}>
            <Icon>notifications</Icon>
          </Badge>
        ) : (
          <CircularProgress
            variant="determinate"
            value={notifications[progressIndex].state}
            size={24}
          />
        )}
      </IconButton>

      {open && (
        <Menu
          open={open}
          onClose={() => setOpen(false)}
          anchorEl={anchorRef.current}
          sx={{ width: 300 }}
        >
          {notifications.map((not, notI) => (
            <MenuItem>
              <ListItemIcon>
                {progressIndex === notI ? (
                  <CircularProgress
                    variant="determinate"
                    value={notifications[progressIndex].state}
                    size={24}
                  />
                ) : (
                  <Icon>
                    {not.type !== "upload"
                      ? notificationsIcons[not.type]
                      : notificationsIcons.upload[not.state]}
                  </Icon>
                )}
              </ListItemIcon>
              <ListItemText
                primary={t(
                  "notifications.title." +
                    (not.type !== "upload"
                      ? not.type
                      : progressIndex === notI
                      ? "upload.uploading"
                      : `upload.${not.state}`)
                )}
                primaryTypographyProps={{ type: "body1" }}
                secondary={
                  not.type === "upload"
                    ? not.info.name + "." + fileExtentions[not.info.type]
                    : `On ${
                        not.track.name
                          ? not.track.name
                          : t(`trackPicker.types.${not.track.type}.name`)
                      }`
                }
              />

              <IconButton
                onClick={() =>
                  setNotifications((prev) => prev.filter((e, i) => i !== notI))
                }
              >
                <Icon>close</Icon>
              </IconButton>
            </MenuItem>
          ))}
          {notifications.length === 0 && (
            <MenuItem disabled>
              <Typography type="body1">No Notifications</Typography>
            </MenuItem>
          )}
        </Menu>
      )}
    </>
  );
}

export default NotificationsList;
