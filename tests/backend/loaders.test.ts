import { describe, it, expect } from "vitest";
import { parseMap, parseGuests } from "../../server/loaders.js";

describe("parseMap", () => {
  it("parses dimensions and cabana positions", () => {
    const raw = ["...", ".W.", "..W"].join("\n");
    const map = parseMap(raw);
    expect(map.width).toBe(3);
    expect(map.height).toBe(3);
    expect(map.cabanas).toEqual([
      { id: "W-1-1", x: 1, y: 1 },
      { id: "W-2-2", x: 2, y: 2 },
    ]);
  });

  it("rejects rows with inconsistent width", () => {
    expect(() => parseMap("...\n..\n...")).toThrow(/width/);
  });

  it("rejects unknown tile characters", () => {
    expect(() => parseMap("...\n.X.\n...")).toThrow(/Invalid tile/);
  });

  it("ignores trailing empty lines", () => {
    const map = parseMap("..\n..\n\n");
    expect(map.height).toBe(2);
  });
});

describe("parseGuests", () => {
  it("parses a valid guest list", () => {
    const guests = parseGuests('[{"room":"101","guestName":"Alice"}]');
    expect(guests).toEqual([{ room: "101", guestName: "Alice" }]);
  });

  it("rejects non-array input", () => {
    expect(() => parseGuests('{"room":"101"}')).toThrow();
  });

  it("rejects malformed entries", () => {
    expect(() => parseGuests('[{"room":101,"guestName":"Alice"}]')).toThrow();
  });
});
