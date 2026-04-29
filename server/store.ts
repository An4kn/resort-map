import type {
  BookingResult,
  Cabana,
  CabanaView,
  Guest,
  ParsedMap,
  Tile,
} from "./types.js";

export interface Store {
  width: number;
  height: number;
  tiles: Tile[][];
  cabanas: Map<string, Cabana>;
  guests: Guest[];
  bookedCabanas: Map<string, { roomNumber: string; guestName: string }>;
}

export function createStore(map: ParsedMap, guests: Guest[]): Store {
  const cabanas = new Map<string, Cabana>();
  for (const c of map.cabanas) cabanas.set(c.id, c);
  return {
    width: map.width,
    height: map.height,
    tiles: map.tiles,
    cabanas,
    guests,
    bookedCabanas: new Map(),
  };
}

export function listCabanas(store: Store): CabanaView[] {
  const result: CabanaView[] = [];
  for (const c of store.cabanas.values()) {
    result.push({ ...c, available: !store.bookedCabanas.has(c.id) });
  }
  result.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
  return result;
}

export function bookCabana(
  store: Store,
  input: { cabanaId: string; roomNumber: string; guestName: string },
): BookingResult {
  const { cabanaId, roomNumber, guestName } = input;

  if (!store.cabanas.has(cabanaId)) {
    return { ok: false, error: { code: 404, message: "Cabana not found" } };
  }

  const guest = store.guests.find(
    (g) => g.room === roomNumber && g.guestName === guestName,
  );
  if (!guest) {
    return {
      ok: false,
      error: { code: 401, message: "Room number or guest name is incorrect" },
    };
  }

  if (store.bookedCabanas.has(cabanaId)) {
    return {
      ok: false,
      error: { code: 409, message: "Cabana is already booked" },
    };
  }

  store.bookedCabanas.set(cabanaId, { roomNumber, guestName });
  return { ok: true, cabanaId };
}
