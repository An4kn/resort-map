# Resort Map — instrukcje dla agenta

## Stack
- Node 20+, TypeScript, Express, Vite, Vitest
- Vanilla TS na froncie (BEZ Reacta, BEZ frameworków)
- Bez bazy danych, bez Dockera

## Zasady
- NIE modyfikuj plików map.ascii ani bookings.json na dysku
- Wszystkie rezerwacje trzymaj w pamięci (store.ts)
- Backend serwuje też pliki statyczne frontu (public/) na tym samym porcie
- Domyślny port 8080, override przez --port
- Argumenty CLI: --map <path>, --bookings <path>

## Struktura
[wklej drzewo z góry]

## API
[wklej kontrakty endpointów]

## Konwencje
- ID kabanki: "W-{x}-{y}"
- Testy w tests/, mirror struktury source'a
- Każdy nowy endpoint = test integracyjny w tests/backend/api.test.ts
- Komunikaty błędów po angielsku, krótkie

## Czego unikać
- Reduxa, MobX, Zustanda
- ORM, baz danych, plików migracji
- Dockera, docker-compose
- Mikroserwisów
- Auth (zadanie wprost mówi że nie trzeba)