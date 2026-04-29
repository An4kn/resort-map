import { describe, it, expect } from "vitest";
import { tileImage } from "../../client/tile-mapping";

describe("tile-mapping", () => {
  it("should return correct asset path for each tile character", () => {
    expect(tileImage("W")).toBe("/assets/cabana.png");
    expect(tileImage("p")).toBe("/assets/pool.png");
    expect(tileImage("#")).toBe("/assets/arrowStraight.png");
    expect(tileImage("c")).toBe("/assets/houseChimney.png");
    expect(tileImage(".")).toBe("/assets/parchmentBasic.png");
  });

  it("should return undefined for unknown characters", () => {
    // @ts-expect-error Sprawdzamy zachowanie w przypadku podania błędnych danych
    expect(tileImage("X")).toBeUndefined();
  });
});