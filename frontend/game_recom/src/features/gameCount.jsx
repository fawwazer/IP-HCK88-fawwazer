import { createSlice } from "@reduxjs/toolkit";
export const gameSlice = createSlice({
  name: "game",
  initialState: {
    list: [],
  },
  reducers: {
    setList: (state, action) => {
      state.list = action.payload;
    },
  },
});

export const { setList } = gameSlice.actions;
