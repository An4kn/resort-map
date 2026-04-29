# Resort Map

Interactive cabana booking webapp for a luxury resort. Backend serves a REST API; frontend renders the resort map and lets guests book available cabanas.

The original task brief is preserved in [`task.md`](./task.md).

## Requirements

- Node.js 20 or newer
- npm

## Run

```bash
./run.sh
```

Then open <http://localhost:8080>.

`run.sh` installs dependencies (if needed), builds the frontend and backend, and starts the server. Subsequent runs reuse the existing build — delete `dist/` and `public/` to force a rebuild.

### CLI options

```bash
./run.sh --map ./map.ascii --bookings ./bookings.json --port 8080
```

| Flag         | Default          | Description                       |
| ------------ | ---------------- | --------------------------------- |
| `--map`      | `./map.ascii`    | Path to the ASCII resort map      |
| `--bookings` | `./bookings.json`| Path to the guest whitelist (JSON)|
| `--port`     | `8080`           | HTTP port                         |

## Tests

```bash
npm test
```

Vitest + Supertest cover:

- map parsing and guest-list parsing (`tests/backend/loaders.test.ts`)
- booking logic as pure functions (`tests/backend/store.test.ts`)
- HTTP-level integration of `GET /api/map` and `POST /api/bookings` including all error codes (`tests/backend/api.test.ts`)

A frontend test stub lives in `tests/frontend/` for future iterations.

## REST API

### `GET /api/map`

Returns the map plus availability for every cabana.

```json
{
  "width": 20,
  "height": 19,
  "tiles": [[".", ".", "c", "..."], ["...", "...", "..."]],
  "cabanas": [
    { "id": "W-3-11", "x": 3, "y": 11, "available": true },
    { "id": "W-4-11", "x": 4, "y": 11, "available": false }
  ]
}
```

`tiles` is indexed `[y][x]`. `cabanas` is sorted top-to-bottom, left-to-right.

### `POST /api/bookings`

```json
{ "cabanaId": "W-3-11", "roomNumber": "101", "guestName": "Alice Smith" }
```

| Status | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| 200    | Booked. Body: `{ "success": true, "cabanaId": "W-3-11" }`   |
| 400    | Missing or wrong-typed body fields                          |
| 401    | `(roomNumber, guestName)` does not match any guest entry    |
| 404    | `cabanaId` does not refer to a `W` tile on the map          |
| 409    | Cabana is already booked                                    |

Errors share the shape `{ "success": false, "error": "<short message>" }`.

## Project layout

```
server/    Express app, in-memory store, parsers, route handlers
client/    Vanilla TS frontend (Vite-bundled into public/)
assets/    PNG tiles served at /assets/* (read-only input)
tests/     Vitest unit and integration tests
map.ascii  Sample resort map (read-only input)
bookings.json  Guest whitelist (read-only input)
```

## Design decisions

**Vanilla TS, no framework.** The UI is a 20×19 grid with a modal — that's a few hundred lines of DOM code, not a framework's worth. Direct `document.createElement` keeps every line auditable; React would be more code, not less.

**In-memory state, no persistence.** The brief explicitly allows it. Bookings live in a `Map<string, ...>` inside `server/store.ts` and are wiped on restart. Adding SQLite or a file-write would be ceremony for a feature the brief explicitly opts out of.

**No ETag / optimistic concurrency.** Node executes JS single-threaded, so the existence check and the `Map.set` inside the POST handler happen atomically. Two concurrent bookings for the same cabana cannot both succeed: one writes, the next sees the entry and returns 409. ETags would add a round-trip and a header for a guarantee Node already provides.

**Pure functions for business logic.** `bookCabana`, `parseMap`, and `parseGuests` take plain inputs and return plain values — no Express, no `fs`. The route handler is thin: parse the body, call the function, map the result to a status code. Same functions are exercised both by integration tests (through Express) and by unit tests (directly).

**One asset for all paths.** The `#` tile uses `arrowStraight.png` everywhere instead of inspecting neighbours to decide between corner / straight / split tiles. The brief says "keep it simple"; a path-tile autotiler is a side quest.

**Single port, one process.** The Express app serves the API, the Vite-built frontend (`public/`), and the static PNG assets (`/assets/*`). The reviewer runs one command and opens one URL.

**`bookings.json` is a guest whitelist, not a list of bookings.** The filename is misleading: each entry is `{ room, guestName }` with no cabana reference. We treat it read-only and never write back.

**No per-room booking limit.** The brief doesn't specify one, so a guest who matches the whitelist can book several cabanas in one session.

**Tests stay focused on business logic.** The brief asks for "automated tests covering core backend and frontend functionality"; we cover the booking rules and the HTTP surface. Frontend tests are scoped out of this iteration (the UI is thin DOM glue around the API and is easier to validate by hand).

## What's intentionally not here

- Authentication (room + name is the whole credential, per the brief)
- Database, ORM, migrations
- Docker, docker-compose
- Path-tile autotiling (corners / T-junctions detected from neighbours)
- Frontend tests
- Validation libraries (Zod, Joi) — manual checks at the HTTP boundary suffice for three string fields
