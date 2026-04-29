import { parseArgs } from "node:util";
import { resolve } from "node:path";

export interface Config {
  mapPath: string;
  bookingsPath: string;
  port: number;
}

export function parseConfig(argv: string[]): Config {
  const { values } = parseArgs({
    args: argv,
    options: {
      map: { type: "string", default: "map.ascii" },
      bookings: { type: "string", default: "bookings.json" },
      port: { type: "string", default: "8080" },
    },
    strict: true,
  });

  const port = Number(values.port);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid --port value: ${values.port}`);
  }

  return {
    mapPath: resolve(process.cwd(), values.map as string),
    bookingsPath: resolve(process.cwd(), values.bookings as string),
    port,
  };
}
