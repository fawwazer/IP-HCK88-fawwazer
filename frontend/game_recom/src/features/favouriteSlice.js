import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk for fetching favourites
export const fetchFavourites = createAsyncThunk(
  "favourite/fetchFavourites",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to view favourites");
      }
      const response = await axios.get(
        "https://game.fawwazerweb.site/user/favourites",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load favourites"
      );
    }
  }
);

// Async thunk for adding favourite
export const addFavourite = createAsyncThunk(
  "favourite/addFavourite",
  async (rawg_id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to save favourites");
      }
      const response = await axios.post(
        "https://game.fawwazerweb.site/user/favourites",
        { rawg_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to save favourite"
      );
    }
  }
);

// Async thunk for removing favourite
export const removeFavourite = createAsyncThunk(
  "favourite/removeFavourite",
  async (gameId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to remove favourites");
      }
      await axios.delete(
        `https://game.fawwazerweb.site/user/favourites/${gameId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return gameId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to remove favourite"
      );
    }
  }
);

export const favouriteSlice = createSlice({
  name: "favourite",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearFavourites: (state) => {
      state.list = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch favourites
      .addCase(fetchFavourites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavourites.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(fetchFavourites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add favourite
      .addCase(addFavourite.pending, (state) => {
        state.loading = true;
      })
      .addCase(addFavourite.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally add to list if response contains the new favourite
        if (action.payload) {
          state.list.push(action.payload);
        }
      })
      .addCase(addFavourite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove favourite
      .addCase(removeFavourite.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFavourite.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((fav) => fav.id !== action.payload);
      })
      .addCase(removeFavourite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFavourites } = favouriteSlice.actions;

export default favouriteSlice.reducer;
