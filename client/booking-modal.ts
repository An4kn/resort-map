import { postBooking } from "./api.js";

export interface BookingModalOptions {
  cabanaId: string;
  displayNumber: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function openBookingModal(
  root: HTMLElement,
  opts: BookingModalOptions,
): void {
  root.replaceChildren();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "modal-title");

  const title = document.createElement("h2");
  title.id = "modal-title";
  title.textContent = `Book Cabana #${opts.displayNumber}`;

  const form = document.createElement("form");
  form.className = "modal-form";

  const roomLabel = document.createElement("label");
  roomLabel.textContent = "Room number";
  const roomInput = document.createElement("input");
  roomInput.type = "text";
  roomInput.name = "roomNumber";
  roomInput.required = true;
  roomInput.autocomplete = "off";
  roomLabel.appendChild(roomInput);

  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Guest name";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.name = "guestName";
  nameInput.required = true;
  nameInput.autocomplete = "off";
  nameLabel.appendChild(nameInput);

  const errorEl = document.createElement("p");
  errorEl.className = "modal-error";
  errorEl.hidden = true;

  const successEl = document.createElement("p");
  successEl.className = "modal-success";
  successEl.hidden = true;

  const buttons = document.createElement("div");
  buttons.className = "modal-buttons";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "btn btn-secondary";

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Book";
  submitBtn.className = "btn btn-primary";

  buttons.append(cancelBtn, submitBtn);
  form.append(roomLabel, nameLabel, errorEl, successEl, buttons);
  modal.append(title, form);
  overlay.appendChild(modal);
  root.appendChild(overlay);

  roomInput.focus();

  function close(): void {
    root.replaceChildren();
    document.removeEventListener("keydown", onEscape);
    opts.onClose();
  }

  function onEscape(e: KeyboardEvent): void {
    if (e.key === "Escape") close();
  }
  document.addEventListener("keydown", onEscape);

  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    submitBtn.disabled = true;
    cancelBtn.disabled = true;

    const result = await postBooking({
      cabanaId: opts.cabanaId,
      roomNumber: roomInput.value.trim(),
      guestName: nameInput.value.trim(),
    });

    if (result.success) {
      successEl.textContent = "✓ Cabana booked successfully!";
      successEl.hidden = false;
      form.querySelectorAll("input, button").forEach((el) => {
        (el as HTMLInputElement | HTMLButtonElement).disabled = true;
      });
      setTimeout(() => {
        root.replaceChildren();
        document.removeEventListener("keydown", onEscape);
        opts.onSuccess();
      }, 1500);
    } else {
      errorEl.textContent = result.error;
      errorEl.hidden = false;
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });
}
