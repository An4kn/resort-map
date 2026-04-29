# AI-assisted workflow

This document is a placeholder for the AI workflow notes the brief asks for.
It will be filled in with:

- which AI tools were used (Claude Code, etc.)
- the key prompts that drove the implementation
- a rough step count and what was iterated on


### Workflow & Step Count
I used a deliberate, heavy-upfront-planning approach rather than conversational trial-and-error:

1. **Phase 1: Prompt Engineering (Iterative).** I spent my time interacting with Claude to outline the project requirements and iteratively develop a comprehensive "master prompt". 
2. **Phase 2: Execution (1 Step).** Once the instructions were highly specific and optimized, I fed this master prompt into the Claude coding agent. Because the prompt defined the exact architecture, constraints, and business rules, the agent generated the entire working application in essentially **one massive zero-shot step**.

### Iterations & Bug Fixing
While the master prompt successfully generated the core application and architecture in one go, a few follow-up prompts were necessary to resolve minor frontend bugs. Specifically, there was an issue with displaying multiple pieces of information simultaneously in the UI, such as the notification behavior when a user clicked on a cabana that was already booked (unavailable). I provided direct feedback to the agent about these display issues, and it patched the frontend logic accordingly.

# The Master Prompt

### Project Context

I'm building a web application for booking poolside cabanas at a luxury resort. This is a recruitment task. The full task description is included in `README.md` at the project root — read it first for complete context. Anything in this prompt that conflicts with `README.md` should be flagged to me; treat `README.md` as the source of truth for requirements.

You are already inside the project directory. The following already exist in the working directory:
*   `assets/` folder with PNG tiles (cabana, pool, paths, chalet, water, parchment)
*   `map.ascii` — sample resort map
*   `bookings.json` — list of authorized guests
*   `README.md` — the full task brief

**Do not modify** `map.ascii`, `bookings.json`, or any file in `assets/`. Treat them as read-only inputs.

---

### Code Quality Philosophy: Keep It Simple

This is the most important rule. The task brief explicitly says "keep it simple; avoid over-engineering" — twice. Honor that:
*   No abstractions until they're needed twice
*   No design patterns for their own sake (no factories, no dependency injection containers, no service locators)
*   No premature generalization (don't make the map renderer "support arbitrary tile types" — support the 5 we have)
*   Plain functions over classes when classes don't pull weight
*   Module-level state over state-management libraries
*   Direct DOM manipulation over abstraction layers
*   One way to do each thing, not three configurable ways

If you find yourself adding a layer "in case we need it later" — don't. The reviewer will read every file. Less code = less surface area to defend.

---

### Tech Stack

*   **Language:** TypeScript (both backend and frontend)
*   **Backend:** Node.js 20+ with Express
*   **Frontend:** Vanilla TypeScript (NO React, Vue, Angular, Svelte)
*   **Frontend build:** Vite
*   **CLI parsing:** built-in `node:util` `parseArgs` (no external dependency)
*   **Infrastructure:** No database, no Docker, no auth

---

### Directory Structure to Create

    .
    ├── CLAUDE.md                     ← agent instructions for future sessions
    ├── README.md                     ← already exists with task brief; you'll APPEND to it
    ├── AI.md                         ← empty stub for now
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.server.json          ← separate config for backend build
    ├── vite.config.ts                ← config for frontend build
    ├── run.sh                        ← single entrypoint, executable
    ├── .gitignore
    │
    ├── map.ascii                     ← already exists, do not modify
    ├── bookings.json                 ← already exists, do not modify
    │
    ├── assets/                       ← already exists, do not modify
    │
    ├── server/                       ← BACKEND
    │   ├── index.ts                  ← entrypoint, parse CLI, start express
    │   ├── config.ts                 ← parse --map, --bookings, --port arguments
    │   ├── store.ts                  ← in-memory state (mapTiles, guests, bookedCabanas)
    │   ├── loaders.ts                ← read and parse map.ascii and bookings.json
    │   ├── routes/
    │   │   ├── map.ts                ← GET /api/map
    │   │   └── bookings.ts           ← POST /api/bookings
    │   └── types.ts                  ← shared types (Cabana, Guest, Booking)
    │
    ├── client/                       ← FRONTEND (TypeScript sources)
    │   ├── index.html
    │   ├── main.ts                   ← bootstrap, fetch map, render
    │   ├── api.ts                    ← typed fetch wrappers
    │   ├── map-renderer.ts           ← grid rendering
    │   ├── booking-modal.ts          ← booking modal UI
    │   ├── tile-mapping.ts           ← ASCII char → PNG path
    │   └── styles.css
    │
    ├── public/                       ← FRONTEND build output (Vite generates this)
    │   └── (empty until build)
    │
    └── tests/                       
        ├── backend/
        └── frontend/

---

### Input Data Format

#### `map.ascii`
Plain text file, one character per tile. Legend:
*   `W` — cabana
*   `p` — pool
*   `#` — path
*   `c` — chalet
*   `.` — empty space / grass

All rows have equal width. The map is a rectangular grid.

#### `bookings.json`
List of authorized guests — who is ALLOWED to book a cabana:

    [
      { "room": "101", "guestName": "Alice Smith" },
      { "room": "102", "guestName": "Bob Jones" }
    ]

**Important:** this is NOT a list of existing bookings. It's a guest whitelist. The filename is misleading per task requirements. Read it once at startup, never write to it.

---

### Business Rules

*   **Cabana identification:** each cabana has an ID in the format `W-{x}-{y}`, where `x` is the column and `y` is the row in the ASCII map (both 0-indexed).
*   **A booking is valid if:**
    1.  The `cabanaId` exists on the map (there's a `W` at that position)
    2.  The cabana is not already booked
    3.  The (`roomNumber`, `guestName`) pair matches an entry in `bookings.json` exactly (case-sensitive on the name)
    4.  The room does not already have another active cabana booking (limit: 1 cabana per room)
*   **Validation errors return appropriate HTTP codes:**
    *   `400` — missing or malformed body fields
    *   `401` — (room, name) pair doesn't match any guest
    *   `404` — cabana ID doesn't exist on the map
    *   `409` — cabana already booked OR room already has a booking
    *   `200` — success
*   **Concurrency:** Node is single-threaded, so check-and-set inside the POST handler is atomic. No ETags, no locks. This is a deliberate choice — document it in the design decisions section of `README`.
*   **No persistence:** server restart wipes all bookings. Matches task requirements.

---

### REST API Contracts

#### `GET /api/map`
Returns the current map state plus a list of cabanas with their availability.
**Response 200:**

    {
      "width": 20,
      "height": 18,
      "tiles": [
        [".", ".", "c", ".", "..."],
        [".", "#", "#", "#", "..."]
      ],
      "cabanas": [
        { "id": "W-3-10", "x": 3, "y": 10, "available": true },
        { "id": "W-4-10", "x": 4, "y": 10, "available": false }
      ]
    }

`tiles` is a 2D array indexed `[y][x]`. `cabanas` is a flat list of every cabana on the map with current availability.

#### `POST /api/bookings`
**Request body:**

    {
      "cabanaId": "W-3-10",
      "roomNumber": "101",
      "guestName": "Alice Smith"
    }

**Response 200 (success):**

    { "success": true, "cabanaId": "W-3-10" }

**Response 4xx (error):**

    { "success": false, "error": "Room number or guest name is incorrect" }

*Error messages in English, short, human-readable (not technical stack traces).*

---

### CLI — How the Server Starts

The startup command must accept these arguments:

    ./run.sh --map <path-to-map> --bookings <path-to-bookings> [--port <number>]

*   `--map` — path to ASCII map file (defaults to `./map.ascii`)
*   `--bookings` — path to guests JSON file (defaults to `./bookings.json`)
*   `--port` — HTTP port (defaults to `8080`)

`run.sh` must:
1.  Be executable (`chmod +x`)
2.  Build the project (Vite + tsc) if `dist/` doesn't exist
3.  Start the Node server, forwarding arguments via `"$@"`

The backend serves the frontend's static files (Vite output in `public/`) on the same port as the API. One process, one port — the reviewer opens `http://localhost:8080` and sees the app.

---

### Frontend Behavior

#### Map Rendering
*   Render the map as a CSS Grid: `grid-template-columns: repeat(width, 32px)` (or 48×48 if it looks better — your call)
*   Each cell is an `<img>` with the matching PNG from `assets/`
*   Char-to-tile mapping in `tile-mapping.ts`:
    *   `W` → `cabana.png`
    *   `p` → `pool.png`
    *   `#` → for now use `arrowStraight.png` for all paths (MVP simplification — don't analyze neighbors)
    *   `c` → `houseChimney.png`
    *   `.` → `parchmentBasic.png` (or just an empty div with a background color)
*   Booked cabanas: same `cabana.png` but with CSS `filter: grayscale(100%) opacity(0.5)` and `cursor: not-allowed`

#### Cabana Interaction
*   Hover on available cabana: subtle highlight (e.g. `transform: scale(1.05)`), tooltip "Cabana #N — click to book"
*   Click on available: opens the booking modal
*   Click on booked: shows a toast/inline message "Cabana #N is not available" — no modal
*   UI numbering: number cabanas top-to-bottom, left-to-right starting from #1, just for display ("Cabana #5"). The technical ID stays "W-x-y".

#### Booking Modal
*   Overlay over the map with a dimmed background
*   Title: "Book Cabana #N"
*   Two fields: "Room number" and "Guest name"
*   Two buttons: "Cancel" (closes modal) and "Book" (sends POST)
*   On success: modal shows "✓ Cabana booked successfully!", auto-closes after 1.5s, frontend re-fetches `/api/map` and re-renders
*   On error: modal stays open, a red error message appears below the fields, fields keep their values so the user can fix and retry

#### No Framework
Vanilla TypeScript. Direct DOM manipulation (`document.createElement`, `addEventListener`). State held in simple modules (module-level variables). No React, no Redux, no state libraries.

---

### Quality Requirements
*   **TypeScript strict mode:** `"strict": true` in tsconfig
*   **Comments:** minimal, only when the logic isn't self-evident. Code should document itself through naming.
*   **Everything in English:** code, comments, README, error messages, identifiers
*   **Naming:** camelCase for variables/functions, PascalCase for types
*   **No any:** use concrete types, fall back to `unknown` if you must

---

### What to Create in This Iteration
*   Full directory structure as above
*   All config files (`package.json`, `tsconfig.json`, `tsconfig.server.json`, `vite.config.ts`, `.gitignore`, `run.sh`)
*   Working backend with all endpoints and business logic
*   Working frontend with map rendering, booking modal, full booking flow
*   `CLAUDE.md` with instructions for future agent sessions (stack, structure, rules, what not to do)
*   Append a "Design decisions" section to the existing `README.md`. Do NOT overwrite the task brief that's already there — keep it as context. Add: how to run, design decisions (1-cabana-per-room limit, no ETags, in-memory state, single tile for paths, vanilla TS choice)

---

### What NOT to Do
*   **Do NOT** add auth, JWT, sessions
*   **Do NOT** add a database or persistence
*   **Do NOT** add Docker or docker-compose
*   **Do NOT** use React, Vue, Svelte, or any frontend framework
*   **Do NOT** analyze neighbors for `#` paths — one tile for all
*   **Do NOT** modify `map.ascii`, `bookings.json`, or anything in `assets/`
*   **Do NOT** overwrite `README.md` — append to it
*   **Do NOT** add ETags or If-Match — atomic in-memory check is enough
*   **Do NOT** add validation libraries (Zod, Joi) — manual field checks are enough
*   **Do NOT** add abstractions, factories, or DI containers — keep it simple
*   **Do NOT** write god files (one massive `server.ts` with everything) — split by responsibility per the directory structure
*   **Do NOT** couple business logic to Express/IO — keep validation and booking logic as pure functions callable from anywhere

---

### Communication
If anything is unclear, ambiguous, or you have a better idea than what I described — **stop and ask me before implementing**. Do not make silent assumptions. I'd rather answer three questions than untangle three guesses. This rule is more important than moving fast. 

---

### Code Quality Philosophy (Reiterated)
These principles come directly from the recruiter and matter MORE than any feature in this prompt. If a feature and a principle conflict, the principle wins:

1.  **Simplicity:** clear, easy-to-understand solutions over clever but complex code. If you wrote something and need a comment to explain why it's clever — rewrite it plainly.
2.  **Conciseness:** directly solve the problem without unnecessary layers or abstractions. No abstractions until they're needed twice. No design patterns for their own sake (no factories, no DI containers, no service locators, no repository pattern over a single Map). No premature generalization.
3.  **Adherence to standards:** write idiomatic TypeScript, idiomatic Express, idiomatic Vite. Follow language and framework conventions — don't invent your own. If there's a standard way to do something in Node, use it.
4.  **Practicality:** make reasonable trade-offs; prioritize readability and maintainability over micro-optimizations or theoretical correctness. A 5-line clear function beats a 2-line clever one.
5.  **Right-sized design:** choose an architecture that suits the problem. Avoid BOTH extremes:
    *   *No god files:* don't put the entire backend in one `server.ts`. Split by responsibility (config, loaders, store, routes) — the structure in this prompt already reflects that.
    *   *No unnecessary abstraction layers:* don't wrap Express in a "framework", don't write a `MapRepository` class that just calls one `Map`. If a layer doesn't pull weight, it's noise.