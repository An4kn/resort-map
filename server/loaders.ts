import { readFile } from "node:fs/promises";
import type { Cabana, Guest, ParsedMap, Tile } from "./types.js";

const VALID_TILES = new Set<Tile>(["W", "p", "#", "c", "."]);

export function parseMap(raw: string): ParsedMap {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  if (lines.length === 0) {
    throw new Error("Map is empty");
  }

  const width = lines[0].length;
  if (width === 0) {
    throw new Error("Map has zero width");
  }

  const tiles: Tile[][] = [];
  const cabanas: Cabana[] = [];

  for (let y = 0; y < lines.length; y++) {
    const line = lines[y];
    if (line.length !== width) {
      throw new Error(
        `Map row ${y} has width ${line.length}, expected ${width}`,
      );
    }
    const row: Tile[] = [];
    for (let x = 0; x < width; x++) {
      const ch = line[x] as Tile;
      if (!VALID_TILES.has(ch)) {
        throw new Error(`Invalid tile '${line[x]}' at (${x}, ${y})`);
      }
      row.push(ch);
      if (ch === "W") {
        cabanas.push({ id: `W-${x}-${y}`, x, y });
      }
    }
    tiles.push(row);
  }

  return { width, height: lines.length, tiles, cabanas };
}

export function parseGuests(raw: string): Guest[] {
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("Guests file must be a JSON array");
  }
  return data.map((entry, i) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as { room?: unknown }).room !== "string" ||
      typeof (entry as { guestName?: unknown }).guestName !== "string"
    ) {
      throw new Error(`Guest entry ${i} is malformed`);
    }
    const e = entry as { room: string; guestName: string };
    return { room: e.room, guestName: e.guestName };
  });
}

export async function loadMap(path: string): Promise<ParsedMap> {
  const raw = await readFile(path, "utf8");
  return parseMap(raw);
}

export async function loadGuests(path: string): Promise<Guest[]> {
  const raw = await readFile(path, "utf8");
  return parseGuests(raw);
}
