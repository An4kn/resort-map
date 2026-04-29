import { parseConfig } from "./config.js";
import { loadGuests, loadMap } from "./loaders.js";
import { createStore } from "./store.js";
import { createApp } from "./app.js";

async function main(): Promise<void> {
  const config = parseConfig(process.argv.slice(2));

  const [map, guests] = await Promise.all([
    loadMap(config.mapPath),
    loadGuests(config.bookingsPath),
  ]);

  const store = createStore(map, guests);
  const app = createApp(store);

  app.listen(config.port, () => {
    console.log(
      `Resort map server listening on http://localhost:${config.port}`,
    );
    console.log(`  Map: ${config.mapPath} (${map.width}x${map.height}, ${map.cabanas.length} cabanas)`);
    console.log(`  Guests: ${config.bookingsPath} (${guests.length} entries)`);
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
