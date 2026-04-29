import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../server/app.js";
import { parseMap } from "../../server/loaders.js";
import { createStore, type Store } from "../../server/store.js";

const SAMPLE_MAP = [
  ".....",
  ".WWW.",
  ".WpW.",
  ".WWW.",
  ".....",
].join("\n");

const GUESTS = [
  { room: "101", guestName: "Alice Smith" },
  { room: "102", guestName: "Bob Jones" },
];

describe("API integration", () => {
  let store: Store;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = createStore(parseMap(SAMPLE_MAP), GUESTS);
    app = createApp(store);
  });

  describe("GET /api/map", () => {
    it("returns map dimensions, tiles, and cabana availability", async () => {
      const res = await request(app).get("/api/map");
      expect(res.status).toBe(200);
      expect(res.body.width).toBe(5);
      expect(res.body.height).toBe(5);
      expect(res.body.tiles).toHaveLength(5);
      expect(res.body.cabanas).toHaveLength(8);
      expect(res.body.cabanas[0]).toMatchObject({
        id: "W-1-1",
        x: 1,
        y: 1,
        available: true,
      });
    });

    it("reflects bookings in availability", async () => {
      await request(app).post("/api/bookings").send({
        cabanaId: "W-1-1",
        roomNumber: "101",
        guestName: "Alice Smith",
      });
      const res = await request(app).get("/api/map");
      const cabana = res.body.cabanas.find(
        (c: { id: string }) => c.id === "W-1-1",
      );
      expect(cabana.available).toBe(false);
    });
  });

  describe("POST /api/bookings", () => {
    it("returns 200 and success on valid booking", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .send({
          cabanaId: "W-1-1",
          roomNumber: "101",
          guestName: "Alice Smith",
        });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, cabanaId: "W-1-1" });
    });

    it("returns 400 when fields are missing", async () => {
      const res = await request(app).post("/api/bookings").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 when fields have wrong types", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .send({ cabanaId: 5, roomNumber: "101", guestName: "Alice Smith" });
      expect(res.status).toBe(400);
    });

    it("returns 401 when room/name pair does not match any guest", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .send({
          cabanaId: "W-1-1",
          roomNumber: "999",
          guestName: "Nobody",
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 when cabana does not exist", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .send({
          cabanaId: "W-99-99",
          roomNumber: "101",
          guestName: "Alice Smith",
        });
      expect(res.status).toBe(404);
    });

    it("returns 409 when cabana is already booked", async () => {
      await request(app).post("/api/bookings").send({
        cabanaId: "W-1-1",
        roomNumber: "101",
        guestName: "Alice Smith",
      });
      const res = await request(app)
        .post("/api/bookings")
        .send({
          cabanaId: "W-1-1",
          roomNumber: "102",
          guestName: "Bob Jones",
        });
      expect(res.status).toBe(409);
    });
  });
});
