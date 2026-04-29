import type { CabanaView, MapResponse } from "./api.js";
import { tileImage, type TileChar } from "./tile-mapping.js";

const TILE_SIZE = 40;

export interface RenderOptions {
  onCabanaClick: (cabana: CabanaView, displayNumber: number) => void;
  onUnavailableClick: (cabana: CabanaView, displayNumber: number) => void;
}

export function renderMap(
  container: HTMLElement,
  data: MapResponse,
  options: RenderOptions,
): void {
  container.replaceChildren();
  container.style.gridTemplateColumns = `repeat(${data.width}, ${TILE_SIZE}px)`;
  container.style.gridTemplateRows = `repeat(${data.height}, ${TILE_SIZE}px)`;

  const cabanaByKey = new Map<string, { cabana: CabanaView; displayNumber: number }>();
  // Cabanas come pre-sorted top-to-bottom, left-to-right from the API.
  data.cabanas.forEach((cabana, i) => {
    cabanaByKey.set(`${cabana.x},${cabana.y}`, { cabana, displayNumber: i + 1 });
  });

  for (let y = 0; y < data.height; y++) {
    for (let x = 0; x < data.width; x++) {
      const ch = data.tiles[y][x] as TileChar;
      const cell = document.createElement("div");
      cell.className = "tile";

      const img = document.createElement("img");
      img.src = tileImage(ch);
      img.alt = "";
      img.width = TILE_SIZE;
      img.height = TILE_SIZE;
      img.draggable = false;
      cell.appendChild(img);

      if (ch === "W") {
        const entry = cabanaByKey.get(`${x},${y}`);
        if (entry) {
          attachCabana(cell, entry.cabana, entry.displayNumber, options);
        }
      }

      container.appendChild(cell);
    }
  }
}

function attachCabana(
  cell: HTMLElement,
  cabana: CabanaView,
  displayNumber: number,
  options: RenderOptions,
): void {
  cell.classList.add("cabana");
  cell.dataset.cabanaId = cabana.id;
  cell.dataset.displayNumber = String(displayNumber);

  if (cabana.available) {
    cell.classList.add("available");
    cell.title = `Cabana #${displayNumber} — click to book`;
    cell.setAttribute("role", "button");
    cell.setAttribute("tabindex", "0");
    cell.addEventListener("click", () => options.onCabanaClick(cabana, displayNumber));
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        options.onCabanaClick(cabana, displayNumber);
      }
    });
  } else {
    cell.classList.add("booked");
    cell.title = `Cabana #${displayNumber} — not available`;
    cell.addEventListener("click", () =>
      options.onUnavailableClick(cabana, displayNumber),
    );
  }
}
