[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=20767293&assignment_repo_type=AssignmentRepo)

# Game Recommender API Documentation

This document describes the server-side API for the Game Recommender project. It lists endpoints, required parameters, example requests/responses and common error cases.

## Endpoints :

List of available endpoints:

- `GET /` (health)
- `POST /register`
- `POST /login`
- `GET /games` (proxy to RAWG)
- `GET /genres`
- `GET /genres/:genreId/games`
- `POST /games/recommendations/:genreId`
- `POST /user/favourites` [AUTH]
- `GET /user/favourites` [AUTH]
- `DELETE /user/favourites/:gameId` [AUTH]

&nbsp;

## 1. GET /

Health endpoint — returns a simple message.

Response (200 - OK)

```
hello world
```

&nbsp;

## 2. POST /register

Create a new user account.

Request body:

```json
{
  "email": "string",
  "password": "string"
}
```

Response (201 - Created)

```json
{
  "id": 1,
  "email": "user@example.com"
}
```

Response (400 - Bad Request)

```json
{ "message": "Email is required" }
```

&nbsp;

## 3. POST /login

Authenticate and receive a JWT. Use the returned token in Authorization header for protected endpoints.

Request body:

```json
{
  "email": "user@example.com",
  "password": "plainpassword"
}
```

Response (200 - OK)

```json
{
  "Authorization": "Bearer <jwt-token>"
}
```

Response (400 - Bad Request)

```json
{ "message": "User not found" }
```

or

```json
{ "message": "Password wrong" }
```

&nbsp;

## 4. GET /games

Proxy to RAWG API. Returns RAWG response object. Supported query parameters:

- `page` (integer) — RAWG page, default 1
- `search` (string) — search term

Request example:

```
GET /games?page=1&search=witcher
```

Response (200 - OK)

```json
{
  "count": 1000,
  "results": [ { "id": 1, "name": "Game 1", ... }, ... ]
}
```

Note: this endpoint requires the `RAWG_API_KEY` environment variable to be set on the server.

&nbsp;

## 5. GET /genres

Return the list of genres stored in the database.

Response (200 - OK)

```json
[
  { "id": 1, "name": "Action", "rawg_genre_id": "action" },
  { "id": 2, "name": "RPG", "rawg_genre_id": "role-playing-games-rpg" }
]
```

&nbsp;

## 6. GET /genres/:genreId/games

Return RAWG games for a given local genre id. The controller looks up the local genre to obtain `rawg_genre_id` and then queries RAWG.

Request example:

```
GET /genres/1/games
```

Response (200 - OK)

```json
{ "count": 100, "results": [ { "id": 100, "name": "Game X", ... } ] }
```

Response (404 - Not Found)

```json
{ "message": "Genre not found" }
```

&nbsp;

## 7. POST /games/recommendations/:genreId

Generate recommendations for a genre. The endpoint fetches candidate games from RAWG and then — if `GEMINI_API_KEY` is configured — queries Google Gemini to rank and pick the top results.

Request body (optional):

```json
{
  "preferences": "string (user text preferences)",
  "top": 5
}
```

Response (200 - OK) when Gemini returns valid JSON:

```json
{
  "recommendations": [
    { "name": "Game A", "rawg_id": 123, "reason": "Short reason" },
    ...
  ]
}
```

If `GEMINI_API_KEY` is not configured the endpoint responds with RAWG data and a note:

```json
{
  "note": "GEMINI_API_KEY not set, returning RAWG results",
  "data": {
    /* RAWG response */
  }
}
```

&nbsp;

## 8. POST /user/favourites [AUTH]

Add a favourite for the authenticated user. This endpoint requires authentication. You may provide either an existing `game_id` (local DB id) or a `rawg_id` (RAWG id). When `rawg_id` is given the server fetches details from RAWG and inserts a minimal `Game` record (fields: `rawg_id`, `name`, `imageUrl`, `released`) before creating the favourite.

Request headers:

```
Authorization: Bearer <token>
```

Request body (either):

```json
{ "game_id": 42 }
```

or

```json
{ "rawg_id": 3498 }
```

Response (201 - Created)

```json
{
  "id": 7,
  "user_id": 1,
  "game_id": 42,
  "game": {
    "id": 42,
    "rawg_id": 3498,
    "name": "The Witcher 3",
    "imageUrl": "https://...",
    "released": "2015-05-18"
  }
}
```

Errors

- 400 — Missing parameters (e.g. no user_id/rawg_id/game_id)
- 401 — Unauthorized (invalid or missing token)
- 404 — User not found or RAWG game not found (when using rawg_id)

&nbsp;

## 9. GET /user/favourites [AUTH]

List a user's favourites. When authenticated the server prefers the authenticated user. You may supply `user_id` as a query parameter (guard rules apply).

Request example:

```
GET /user/favourites
Authorization: Bearer <token>
```

Response (200 - OK)

```json
[
  {
    "id": 7,
    "user_id": 1,
    "game_id": 42,
    "game": {
      "id": 42,
      "name": "Mock Game",
      "released": "2015-05-18",
      "background_image": "https://...",
      "rating": 4.5
    }
  }
]
```

Errors

- 400 — Missing user id
- 401 — Unauthorized

&nbsp;

## 10. DELETE /user/favourites/:gameId [AUTH]

Delete a favourite for the authenticated user. The route param `:gameId` is the local `Game.id`. Only the owner (or an Admin) may delete.

Request:

```
DELETE /user/favourites/42
Authorization: Bearer <token>
```

Response (200 - OK)

```json
{ "id": 7, "user_id": 1, "game_id": 42 }
```

Errors

- 400 — Missing user id (if not authenticated)
- 401 — Unauthorized
- 403 — Forbidden (not owner nor admin)
- 404 — Favourite not found

&nbsp;

## Global Error mapping (middleware)

The central error handler in `backend/middleware/error-handler.js` maps error names to status codes as follows:

- `SequelizeValidationError` / `SequelizeUniqueConstraintError` -> 400
- `BadRequest` -> 400
- `Unauthorized` / `JsonWebTokenError` -> 401
- `forbidden` -> 403
- `NotFound` -> 404
- default -> 500

Example responses:

401 Unauthorized

```json
{ "message": "Invalid token" }
```

404 Not Found

```json
{ "message": "Genre not found" }
```

500 Internal Server Error

```json
{ "message": "Internal server error" }
```

---

## Environment notes

- `RAWG_API_KEY` (required for RAWG calls)
- `GEMINI_API_KEY` (optional — used by the recommendations endpoint)

If you'd like, I can also provide curl examples or a Postman collection for these endpoints.
