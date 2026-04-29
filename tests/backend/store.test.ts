import { describe, it, expect, beforeEach } from "vitest";
import { parseMap } from "../../server/loaders.js";
import { bookCabana, createStore, listCabanas, type Store } from "../../server/store.js";

const SAMPLE_MAP = [
  ".....",
  ".WWW.",
  ".WpW.",
  ".WWW.",
  ".....",
].join("\n");

const GUESTS = [
  { room: "101", guestName: "Alice Smith" },
  { room: "102", guestName: "Bob Jones" },
];

describe("store", () => {
  let store: Store;

  beforeEach(() => {
    store = createStore(parseMap(SAMPLE_MAP), GUESTS);
  });

  it("lists all cabanas as initially available", () => {
    const cabanas = listCabanas(store);
    expect(cabanas).toHaveLength(8);
    expect(cabanas.every((c) => c.available)).toBe(true);
    expect(cabanas[0]).toMatchObject({ id: "W-1-1", x: 1, y: 1 });
  });

  it("books an available cabana for a valid guest", () => {
    const result = bookCabana(store, {
      cabanaId: "W-1-1",
      roomNumber: "101",
      guestName: "Alice Smith",
    });
    expect(result).toEqual({ ok: true, cabanaId: "W-1-1" });
    const cabana = listCabanas(store).find((c) => c.id === "W-1-1")!;
    expect(cabana.available).toBe(false);
  });

  it("rejects booking for non-existent cabana with 404", () => {
    const result = bookCabana(store, {
      cabanaId: "W-99-99",
      roomNumber: "101",
      guestName: "Alice Smith",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(404);
  });

  it("rejects booking when guest name does not match room with 401", () => {
    const result = bookCabana(store, {
      cabanaId: "W-1-1",
      roomNumber: "101",
      guestName: "Wrong Name",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(401);
  });

  it("name match is case-sensitive", () => {
    const result = bookCabana(store, {
      cabanaId: "W-1-1",
      roomNumber: "101",
      guestName: "alice smith",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(401);
  });

  it("rejects double booking with 409", () => {
    bookCabana(store, {
      cabanaId: "W-1-1",
      roomNumber: "101",
      guestName: "Alice Smith",
    });
    const second = bookCabana(store, {
      cabanaId: "W-1-1",
      roomNumber: "102",
      guestName: "Bob Jones",
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe(409);
  });

  it("allows the same room to book multiple cabanas (no per-room limit)", () => {
    const first = bookCabana(store, {
      cabanaId: "W-1-1",
      roomNumber: "101",
      guestName: "Alice Smith",
    });
    const second = bookCabana(store, {
      cabanaId: "W-2-1",
      roomNumber: "101",
      guestName: "Alice Smith",
    });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });
});
