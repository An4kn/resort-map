import { Router } from "express";
import { bookCabana, type Store } from "../store.js";

export function bookingsRouter(store: Store): Router {
  const router = Router();

  router.post("/bookings", (req, res) => {
    const body = req.body as Record<string, unknown> | undefined;
    const cabanaId = body?.cabanaId;
    const roomNumber = body?.roomNumber;
    const guestName = body?.guestName;

    if (
      typeof cabanaId !== "string" ||
      typeof roomNumber !== "string" ||
      typeof guestName !== "string" ||
      cabanaId.length === 0 ||
      roomNumber.length === 0 ||
      guestName.length === 0
    ) {
      res.status(400).json({
        success: false,
        error: "Missing or invalid fields: cabanaId, roomNumber, guestName",
      });
      return;
    }

    const result = bookCabana(store, { cabanaId, roomNumber, guestName });
    if (result.ok) {
      res.status(200).json({ success: true, cabanaId: result.cabanaId });
    } else {
      res
        .status(result.error.code)
        .json({ success: false, error: result.error.message });
    }
  });

  return router;
}
