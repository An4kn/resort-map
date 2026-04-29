# Resort Map — instrukcje dla agenta

## Stack
- Node 20+, TypeScript, Express, Vite, Vitest
- Vanilla TS na froncie (BEZ Reacta, BEZ frameworków)
- Bez bazy danych, bez Dockera

## Zasady
- NIE modyfikuj plików `map.ascii`, `bookings.json` ani niczego w `assets/` na dysku
- Wszystkie rezerwacje trzymaj w pamięci (server/store.ts)
- Backend serwuje też pliki statyczne frontu (`public/`) i `assets/` na tym samym porcie
- Domyślny port 8080, override przez --port
- Argumenty CLI: --map <path>, --bookings <path>, --port <number>

## Struktura
```
.
├── README.md             ← dokumentacja rozwiązania
├── task.md               ← brief od rekrutera (read-only)
├── AI.md                 ← AI workflow notes
├── claude.md             ← ten plik
├── package.json
├── tsconfig.json         ← konfiguracja dla frontu i testów
├── tsconfig.server.json  ← osobna konfiguracja kompilacji backendu
├── vite.config.ts
├── vitest.config.ts
├── run.sh                ← jeden punkt wejścia (build + start)
│
├── map.ascii             ← read-only input
├── bookings.json         ← read-only guest whitelist
├── assets/               ← read-only PNG tiles
│
├── server/
│   ├── index.ts          ← entrypoint, parse CLI, start express
│   ├── app.ts            ← createApp(store): konfiguracja Express
│   ├── config.ts         ← parseConfig(argv): --map, --bookings, --port
│   ├── store.ts          ← in-memory state + pure bookCabana / listCabanas
│   ├── loaders.ts        ← parseMap, parseGuests + IO wrappers
│   ├── routes/
│   │   ├── map.ts        ← GET /api/map
│   │   └── bookings.ts   ← POST /api/bookings
│   └── types.ts
│
├── client/               ← vanilla TS, bundled by Vite into public/
│   ├── index.html
│   ├── main.ts
│   ├── api.ts
│   ├── map-renderer.ts
│   ├── booking-modal.ts
│   ├── tile-mapping.ts
│   └── styles.css
│
├── public/               ← Vite output (gitignored)
└── tests/
    ├── README.md
    ├── backend/
    │   ├── api.test.ts
    │   ├── loaders.test.ts
    │   └── store.test.ts
    └── frontend/.gitkeep
```

## API
### `GET /api/map`
```json
{
  "width": 20,
  "height": 19,
  "tiles": [[".", ".", "..."], ...],
  "cabanas": [
    { "id": "W-3-11", "x": 3, "y": 11, "available": true }
  ]
}
```
`tiles` is `[y][x]`. `cabanas` jest spłaszczony, posortowany top-to-bottom, left-to-right.

### `POST /api/bookings`
Request: `{ "cabanaId": "W-3-11", "roomNumber": "101", "guestName": "Alice Smith" }`
- 200 → `{ "success": true, "cabanaId": "W-3-11" }`
- 400 → brak/zły typ pól
- 401 → para (room, guestName) nie pasuje do whitelisty
- 404 → cabanaId nie istnieje na mapie
- 409 → kabanka już zarezerwowana
- Format błędu: `{ "success": false, "error": "<short message>" }`

## Konwencje
- ID kabanki: `W-{x}-{y}` (oba 0-indexed)
- Numer wyświetlany na UI: index w posortowanej liście (top-to-bottom, left-to-right) + 1
- Logikę biznesową (bookCabana, parseMap, parseGuests) trzymaj jako czyste funkcje — bez Express/IO
- Każdy nowy endpoint = test integracyjny w `tests/backend/api.test.ts`
- Komunikaty błędów po angielsku, krótkie, human-readable
- Strict TS, bez `any`, bez bibliotek walidacyjnych (Zod itp.) — ręczne checki na granicy HTTP

## Czego unikać
- React/Vue/Svelte/Angular — vanilla TS na froncie
- Reduxa, MobX, Zustanda, jakichkolwiek state libraries
- ORM, baz danych, plików migracji
- Dockera, docker-compose, mikroserwisów
- Auth (JWT, sesje) — task wprost mówi że nie trzeba
- ETag/If-Match — atomowy check-and-set w handlerze wystarcza
- Analizy sąsiadów dla path tiles `#` — jeden asset na wszystkie

## Komendy
- `./run.sh [--map ...] [--bookings ...] [--port ...]` — build (jeśli trzeba) i start
- `npm run dev:server` — backend w watch mode (tsx)
- `npm run dev:client` — Vite dev server (proxy /api i /assets na :8080)
- `npm test` — testy backendu (Vitest + Supertest)
- `npm run build` — build frontu (Vite) i backendu (tsc)
