import { test, expect, type Page } from "@playwright/test";
import {
  PASSWORD,
  USER_A,
  USER_B,
  PARTICIPANT_SHARED,
  PARTICIPANT_PRIVATE,
  SECRET_NOTE,
  participantIdByName,
} from "./helpers/seed";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Username or email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

test("owner sees their own participants", async ({ page }) => {
  await login(page, USER_A);
  await page.goto("/participants");
  await expect(
    page.getByRole("heading", { name: PARTICIPANT_SHARED }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: PARTICIPANT_PRIVATE }),
  ).toBeVisible();
});

test("shared viewer: read-only, notes gated server-side", async ({ page }) => {
  await login(page, USER_B);
  await page.goto("/recordings");

  // The shared participant is the viewer's active participant.
  await expect(
    page.getByRole("heading", { name: new RegExp(PARTICIPANT_SHARED) }),
  ).toBeVisible();
  // Core data is present...
  await expect(page.locator("body")).toContainText("90 kg");
  // ...but the un-shared "notes" field never reaches the client.
  await expect(page.locator("body")).not.toContainText(SECRET_NOTE);

  // Read-only: no add / edit / delete controls.
  await expect(
    page.getByRole("button", { name: /Add recording/ }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Edit" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
});

test("viewer cannot see a participant not shared with them", async ({
  page,
}) => {
  await login(page, USER_B);
  // Not in the owned-management list...
  await page.goto("/participants");
  await expect(page.locator("body")).not.toContainText(PARTICIPANT_PRIVATE);
  // ...and not anywhere on the read-only views.
  await page.goto("/recordings");
  await expect(page.locator("body")).not.toContainText(PARTICIPANT_PRIVATE);
});

test("viewer is blocked from editing a private participant by id", async ({
  page,
}) => {
  await login(page, USER_B);
  const secretId = await participantIdByName(PARTICIPANT_PRIVATE);
  const resp = await page.goto(`/participants/${secretId}`);
  expect(resp?.status()).toBe(404);
});
