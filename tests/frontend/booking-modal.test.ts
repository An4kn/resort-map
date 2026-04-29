// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { openBookingModal } from "../../client/booking-modal";
import * as api from "../../client/api";

vi.mock("../../client/api", () => ({
  postBooking: vi.fn(),
}));

describe("booking-modal", () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement("div");
    document.body.appendChild(root);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should open modal and display correct cabana number", () => {
    openBookingModal(root, { cabanaId: "W-1-1", displayNumber: 42, onSuccess: vi.fn(), onClose: vi.fn() });
    
    const title = root.querySelector("#modal-title");
    expect(title?.textContent).toBe("Book Cabana #42");
    expect(root.querySelector("input[name='roomNumber']")).not.toBeNull();
    expect(root.querySelector("input[name='guestName']")).not.toBeNull();
  });

  it("should show success message and call onSuccess when booking succeeds", async () => {
    const onSuccess = vi.fn();
    vi.mocked(api.postBooking).mockResolvedValueOnce({ success: true, cabanaId: "W-1-1" });
    
    openBookingModal(root, { cabanaId: "W-1-1", displayNumber: 42, onSuccess, onClose: vi.fn() });
    
    const roomInput = root.querySelector('input[name="roomNumber"]') as HTMLInputElement;
    const nameInput = root.querySelector('input[name="guestName"]') as HTMLInputElement;
    const form = root.querySelector("form") as HTMLFormElement;
    
    roomInput.value = "101";
    nameInput.value = "John Doe";
    
    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    
    await Promise.resolve();
    await Promise.resolve();

    expect(api.postBooking).toHaveBeenCalledWith({
      cabanaId: "W-1-1",
      roomNumber: "101",
      guestName: "John Doe"
    });

    const successEl = root.querySelector(".modal-success") as HTMLElement;
    expect(successEl.hidden).toBe(false);
    expect(successEl.textContent).toBe("✓ Cabana booked successfully!");

    vi.advanceTimersByTime(1500);
    expect(onSuccess).toHaveBeenCalled();
    expect(root.innerHTML).toBe(""); // Modal powinien zostać usunięty z drzewa DOM
  });

  it("should close modal when Cancel button is clicked", () => {
    const onClose = vi.fn();
    openBookingModal(root, { cabanaId: "W-1-1", displayNumber: 42, onSuccess: vi.fn(), onClose });
    
    const cancelBtn = root.querySelector(".btn-secondary") as HTMLButtonElement;
    cancelBtn.click();
    
    expect(onClose).toHaveBeenCalled();
    expect(root.innerHTML).toBe(""); // Modal usunięty z DOM
  });
});