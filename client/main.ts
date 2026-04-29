import { fetchMap } from "./api.js";
import { renderMap } from "./map-renderer.js";
import { openBookingModal } from "./booking-modal.js";

const mapEl = document.getElementById("map");
const modalRoot = document.getElementById("modal-root");
const toastRoot = document.getElementById("toast-root");

if (!mapEl || !modalRoot || !toastRoot) {
  throw new Error("Required DOM nodes not found");
}

async function refresh(): Promise<void> {
  const data = await fetchMap();
  renderMap(mapEl!, data, {
    onCabanaClick: (cabana, displayNumber) => {
      openBookingModal(modalRoot!, {
        cabanaId: cabana.id,
        displayNumber,
        onSuccess: () => {
          void refresh();
        },
        onClose: () => {},
      });
    },
    onUnavailableClick: (_cabana, displayNumber) => {
      showToast(`Cabana #${displayNumber} is not available`);
    },
  });
}

let currentToast: HTMLElement | null = null;

function showToast(message: string): void {
  if (currentToast) {
    currentToast.remove();
    currentToast = null;
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRoot!.appendChild(toast);
  currentToast = toast;
  setTimeout(() => toast.classList.add("toast-visible"), 10);
  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => {
      toast.remove();
      if (currentToast === toast) currentToast = null;
    }, 300);
  }, 2500);
}

refresh().catch((err) => {
  mapEl.textContent = `Failed to load map: ${err instanceof Error ? err.message : String(err)}`;
});
