import { seedFixtures } from "./helpers/seed";

export default async function globalSetup() {
  await seedFixtures();
}
