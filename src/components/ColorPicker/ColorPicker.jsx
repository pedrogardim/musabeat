import React, { useState, useRef } from "react";

import { colors } from "../../utils/Pallete";

import { ButtonBase, Popover, Grid } from "@mui/material";

function ColorPicker(props) {
  const [anchorEl, setAnchorEl] = useState(false);

  const { onSelect, color } = props;

  const handleSelect = (i) => {
    onSelect(i);
    setAnchorEl(false);
  };

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchorEl(e.target)}
        sx={{
          height: 24,
          width: 24,
          m: 2,
          borderRadius: 2,
          bgcolor: colors[color][500],
        }}
      />
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(false)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Grid sx={{ height: 128, width: 128 }} container wrap="wrap">
          {colors.map((e, i) => (
            <Grid
              item
              xs={3}
              sx={{ bgcolor: e[500] }}
              onClick={() => handleSelect(i)}
            />
          ))}
        </Grid>
      </Popover>
    </>
  );
}

export default ColorPicker;
