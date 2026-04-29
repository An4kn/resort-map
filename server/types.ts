export type Tile = "W" | "p" | "#" | "c" | ".";

export interface Cabana {
  id: string;
  x: number;
  y: number;
}

export interface CabanaView extends Cabana {
  available: boolean;
}

export interface Guest {
  room: string;
  guestName: string;
}

export interface Booking {
  cabanaId: string;
  roomNumber: string;
  guestName: string;
}

export interface ParsedMap {
  width: number;
  height: number;
  tiles: Tile[][];
  cabanas: Cabana[];
}

export type BookingError =
  | { code: 400; message: string }
  | { code: 401; message: string }
  | { code: 404; message: string }
  | { code: 409; message: string };

export type BookingResult =
  | { ok: true; cabanaId: string }
  | { ok: false; error: BookingError };
