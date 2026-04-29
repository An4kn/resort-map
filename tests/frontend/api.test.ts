import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchMap, postBooking } from "../../client/api";

describe("Frontend API", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchMap", () => {
    it("should fetch and return map data", async () => {
      const mockMapResponse = { width: 10, height: 10, tiles: [], cabanas: [] };
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMapResponse,
      } as Response);

      const data = await fetchMap();
      
      expect(fetch).toHaveBeenCalledWith("/api/map");
      expect(data).toEqual(mockMapResponse);
    });

    it("should throw an error if response is not ok", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(fetchMap()).rejects.toThrow("Failed to load map: 500");
    });
  });

  describe("postBooking", () => {
    it("should return success response when booking succeeds", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, cabanaId: "W-3-11" }),
      } as Response);

      const result = await postBooking({ 
        cabanaId: "W-3-11", 
        roomNumber: "101", 
        guestName: "Alice Smith" 
      });
      
      expect(fetch).toHaveBeenCalledWith("/api/bookings", expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cabanaId: "W-3-11", roomNumber: "101", guestName: "Alice Smith" })
      }));
      expect(result).toEqual({ success: true, cabanaId: "W-3-11" });
    });

    it("should return failure response when booking fails", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ success: false, error: "Cabana already booked" }),
      } as Response);

      const result = await postBooking({ 
        cabanaId: "W-3-11", 
        roomNumber: "101", 
        guestName: "Alice Smith" 
      });
      
      expect(result).toEqual({ success: false, error: "Cabana already booked", status: 409 });
    });
  });
});