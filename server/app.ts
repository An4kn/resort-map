import express, { type Express } from "express";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mapRouter } from "./routes/map.js";
import { bookingsRouter } from "./routes/bookings.js";
import type { Store } from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(store: Store): Express {
  const app = express();
  app.use(express.json());

  app.use("/api", mapRouter(store));
  app.use("/api", bookingsRouter(store));

  // Static frontend (Vite build output) and assets, served from the same port.
  // dist/server/app.js -> ../../public and ../../assets
  const projectRoot = resolve(__dirname, "..", "..");
  app.use(express.static(resolve(projectRoot, "public")));
  app.use("/assets", express.static(resolve(projectRoot, "assets")));

  return app;
}
