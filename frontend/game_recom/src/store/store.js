import { configureStore } from "@reduxjs/toolkit";
import gameReducer from "../features/gameCount";
import favouriteReducer from "../features/favouriteSlice";

export const store = configureStore({
  reducer: {
    game: gameReducer,
    favourite: favouriteReducer,
  },
});

export default store;
