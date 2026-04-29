export type TileChar = "W" | "p" | "#" | "c" | ".";

const ASSETS: Record<TileChar, string> = {
  W: "/assets/cabana.png",
  p: "/assets/pool.png",
  "#": "/assets/arrowStraight.png",
  c: "/assets/houseChimney.png",
  ".": "/assets/parchmentBasic.png",
};

export function tileImage(ch: TileChar): string {
  return ASSETS[ch];
}
