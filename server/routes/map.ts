import { Router } from "express";
import { listCabanas, type Store } from "../store.js";

export function mapRouter(store: Store): Router {
  const router = Router();

  router.get("/map", (_req, res) => {
    res.json({
      width: store.width,
      height: store.height,
      tiles: store.tiles,
      cabanas: listCabanas(store),
    });
  });

  return router;
}
