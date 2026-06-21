import { cleanup } from "./helpers/seed";

export default async function globalTeardown() {
  await cleanup();
}
