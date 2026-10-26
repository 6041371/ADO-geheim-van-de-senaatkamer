import "server-only";

import { createNeonStore } from "./neon-store";
import { serviceFromEnv } from "./service";
import type { EventStore } from "./store";

let store: EventStore | null = null;

export function getService() {
  store ??= createNeonStore();
  return serviceFromEnv(store);
}
