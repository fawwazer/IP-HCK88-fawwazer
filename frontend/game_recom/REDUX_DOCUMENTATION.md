# Redux Toolkit Implementation

## Overview

This project uses Redux Toolkit for global state management across the frontend application. All state logic is centralized in Redux slices located in the `features/` directory.

## Store Structure

```
src/
├── store/
│   └── store.js              # Redux store configuration
├── features/
│   ├── gameCount.jsx         # Game slice (games, search, pagination)
│   └── favouriteSlice.js     # Favourite slice (user favourites CRUD)
```

## Slices

### 1. Game Slice (`features/gameCount.jsx`)

Manages game listing, search, and pagination state.

**State:**

```javascript
{
  list: [],           // Array of games
  loading: false,     // Loading state
  error: null,        // Error message
  page: 1,            // Current page (1-10)
  searchQuery: "",    // Search query string
  pageSize: 40        // Results per page
}
```

**Actions:**

- `setList(games)` - Manually set game list
- `setPage(pageNumber)` - Set current page
- `setSearchQuery(query)` - Set search query and reset to page 1
- `clearSearch()` - Clear search and reset to page 1
- `incrementPage()` - Go to next page (max 10)
- `decrementPage()` - Go to previous page (min 1)

**Async Thunks:**

- `fetchGames({ page, searchQuery, pageSize })` - Fetch games from API
  - GET `https://game.fawwazerweb.site/games?page=X&search=Y&page_size=40`

**Usage Example:**

```javascript
import { useSelector, useDispatch } from "react-redux";
import {
  fetchGames,
  setSearchQuery,
  incrementPage,
} from "../features/gameCount";

function Component() {
  const dispatch = useDispatch();
  const { list, loading, error, page, searchQuery } = useSelector(
    (state) => state.game
  );

  // Fetch games
  useEffect(() => {
    dispatch(fetchGames({ page, searchQuery }));
  }, [dispatch, page, searchQuery]);

  // Search
  dispatch(setSearchQuery("witcher"));

  // Pagination
  dispatch(incrementPage());
}
```

---

### 2. Favourite Slice (`features/favouriteSlice.js`)

Manages user favourites (add, fetch, remove).

**State:**

```javascript
{
  list: [],          // Array of favourite games
  loading: false,    // Loading state
  error: null        // Error message
}
```

**Actions:**

- `clearFavourites()` - Clear all favourites from state

**Async Thunks:**

- `fetchFavourites()` - Fetch user's favourites

  - GET `https://game.fawwazerweb.site/user/favourites`
  - Requires: JWT token in localStorage

- `addFavourite(rawg_id)` - Add game to favourites

  - POST `https://game.fawwazerweb.site/user/favourites`
  - Body: `{ rawg_id }`
  - Requires: JWT token

- `removeFavourite(gameId)` - Remove game from favourites
  - DELETE `https://game.fawwazerweb.site/user/favourites/:gameId`
  - Requires: JWT token

**Usage Example:**

```javascript
import { useSelector, useDispatch } from "react-redux";
import {
  fetchFavourites,
  addFavourite,
  removeFavourite,
} from "../features/favouriteSlice";

function Component() {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.favourite);

  // Fetch favourites
  useEffect(() => {
    dispatch(fetchFavourites());
  }, [dispatch]);

  // Add favourite
  const handleAdd = async (rawgId) => {
    try {
      await dispatch(addFavourite(rawgId)).unwrap();
      alert("Added to favourites");
    } catch (err) {
      alert(err);
    }
  };

  // Remove favourite
  const handleRemove = async (gameId) => {
    try {
      await dispatch(removeFavourite(gameId)).unwrap();
      alert("Removed from favourites");
    } catch (err) {
      alert(err);
    }
  };
}
```

---

## Store Configuration

**File:** `src/store/store.js`

```javascript
import { configureStore } from "@reduxjs/toolkit";
import gameReducer from "../features/gameCount";
import favouriteReducer from "../features/favouriteSlice";

export const store = configureStore({
  reducer: {
    game: gameReducer,
    favourite: favouriteReducer,
  },
});
```

---

## Integration with React

**App.jsx** - Wrap application with Redux Provider:

```javascript
import { Provider } from "react-redux";
import { store } from "./store/store";

function App() {
  return <Provider store={store}>{/* Your app components */}</Provider>;
}
```

---

## Components Using Redux

### 1. **Nav Component** (`components/nav.jsx`)

- Uses: `dispatch(setSearchQuery(query))`
- Dispatches search query to Redux when user searches

### 2. **Home Page** (`pages/home.jsx`)

- Uses: `useSelector(state => state.game)`
- Dispatches: `fetchGames`, `incrementPage`, `decrementPage`, `clearSearch`
- Displays games with pagination and search

### 3. **Card Component** (`components/card.jsx`)

- Uses: `useSelector(state => state.favourite.loading)`
- Dispatches: `addFavourite`, `removeFavourite`
- Handles add/remove favourite actions

### 4. **Favourite Page** (`pages/favourite.jsx`)

- Uses: `useSelector(state => state.favourite)`
- Dispatches: `fetchFavourites`
- Displays user's favourite games

---

## Benefits of Redux Toolkit

1. **Centralized State** - All state in one place
2. **Predictable** - Actions and reducers make state changes traceable
3. **DevTools** - Redux DevTools for debugging
4. **Type-Safe** - Better TypeScript support (if migrated)
5. **Async Handling** - createAsyncThunk handles loading/error states
6. **Less Boilerplate** - Compared to vanilla Redux
7. **Immutable Updates** - Immer built-in for safe state mutations

---

## API Endpoints Used

| Endpoint               | Method | Description                          | Redux Action      |
| ---------------------- | ------ | ------------------------------------ | ----------------- |
| `/games`               | GET    | Fetch games with pagination & search | `fetchGames`      |
| `/user/favourites`     | GET    | Fetch user's favourites              | `fetchFavourites` |
| `/user/favourites`     | POST   | Add game to favourites               | `addFavourite`    |
| `/user/favourites/:id` | DELETE | Remove game from favourites          | `removeFavourite` |

---

## Migration Notes

**Removed:**

- ❌ `context/SearchContext.jsx` - Replaced with Redux
- ❌ Local state in components - Moved to Redux slices

**Added:**

- ✅ `store/store.js` - Redux store
- ✅ `features/gameCount.jsx` - Game slice
- ✅ `features/favouriteSlice.js` - Favourite slice
- ✅ Redux Provider in App.jsx

**Packages Installed:**

```bash
npm install @reduxjs/toolkit react-redux
```

---

## Future Enhancements

1. **User Slice** - Manage authentication state in Redux
2. **Genre Slice** - Cache genre list in Redux
3. **Persist State** - Use redux-persist for offline support
4. **Optimistic Updates** - Update UI before API confirms
5. **Selector Memoization** - Use createSelector for performance
6. **TypeScript Migration** - Add types to slices and actions

---

## Debugging

**Redux DevTools Extension:**

1. Install: [Redux DevTools](https://github.com/reduxjs/redux-devtools)
2. Open browser DevTools → Redux tab
3. View actions, state changes, time-travel debugging

**Console Logging:**

```javascript
// Log current state
console.log(store.getState());

// In component
const state = useSelector((state) => state);
console.log("Current Redux State:", state);
```

---

## Best Practices

1. ✅ Use `useSelector` to read state
2. ✅ Use `useDispatch` to dispatch actions
3. ✅ Use `.unwrap()` with async thunks for error handling
4. ✅ Keep slices focused (single responsibility)
5. ✅ Use createAsyncThunk for API calls
6. ✅ Handle loading/error states in UI
7. ✅ Avoid storing derived data (compute in selectors)
8. ✅ Keep Redux state serializable (no functions, Promises, etc.)

---

## Troubleshooting

**Problem:** "Cannot read property 'list' of undefined"
**Solution:** Check if reducer is added to store configuration

**Problem:** Actions not triggering re-renders
**Solution:** Ensure component uses `useSelector` to subscribe to state

**Problem:** Async thunk not updating state
**Solution:** Check extraReducers in slice definition

**Problem:** State not persisting after page reload
**Solution:** Redux state is in-memory only. Use localStorage or redux-persist

---

## Documentation

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
- [createAsyncThunk](https://redux-toolkit.js.org/api/createAsyncThunk)
- [createSlice](https://redux-toolkit.js.org/api/createSlice)
