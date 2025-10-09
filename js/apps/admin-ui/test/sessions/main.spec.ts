import { expect, test } from "@playwright/test";
import { v4 as uuid } from "uuid";
import { toSessions } from "../../src/sessions/routes/Sessions.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { login } from "../utils/login.ts";
import {
  assertAxeViolations,
  assertNotificationMessage,
  selectActionToggleItem,
} from "../utils/masthead.ts";
import {
  assertNoResults,
  assertRowExists,
  clickRowKebabItem,
  clickTableRowItem,
  getTableData,
  searchItem,
} from "../utils/table.ts";
import {
  assertNotBeforeValue,
  assertRowHasSignOutKebab,
  clickNotBefore,
  clickPush,
  clickSetToNow,
} from "./main.ts";

const admin = "admin";
const client = "security-admin-console";
const tableName = "Sessions";
const placeHolder = "Search session";

test.describe("Sessions test", () => {
  test.describe("Sessions list view", () => {
    // Note: These tests check existing sessions in master realm (admin user, security-admin-console)
    test("check item values", async ({ page }) => {
      await login(page, { to: toSessions({ realm: "master" }) });

      await searchItem(page, placeHolder, client);
      const rows = await getTableData(page, tableName);
      expect(rows).not.toBeNull();

      await assertRowHasSignOutKebab(page, admin);
    });

    test("go to item accessed clients link", async ({ page }) => {
      await login(page, { to: toSessions({ realm: "master" }) });

      await searchItem(page, placeHolder, client);
      await clickTableRowItem(page, admin);
      expect(page.url()).toMatch(/users\/.*\/sessions/);
    });
  });
});

test.describe("Offline sessions", () => {
  test("check offline token", async ({ page }) => {
    const clientId = `offline-client-${uuid()}`;
    const username = `user-${uuid()}`;

    try {
      // Note: This test creates resources in master realm to test offline token functionality
      await Promise.all([
        adminClient.createClient({
          protocol: "openid-connect",
          clientId,
          publicClient: false,
          directAccessGrantsEnabled: true,
          clientAuthenticatorType: "client-secret",
          secret: "secret",
          standardFlowEnabled: true,
        }),
        adminClient.createUser({
          username,
          enabled: true,
          credentials: [{ type: "password", value: "password" }],
        }),
      ]);

      await adminClient.auth({
        username,
        password: "password",
        grantType: "password",
        clientId,
        clientSecret: "secret",
        scopes: ["openid", "offline_access"],
      });

      await login(page, { to: toSessions({ realm: "master" }) });

      await searchItem(page, placeHolder, clientId);
      await assertRowExists(page, username);
      await clickRowKebabItem(page, username, "Revoke");

      await searchItem(page, placeHolder, clientId);
      await assertRowExists(page, username, false);
    } finally {
      // Clean up created resources
      await adminClient.deleteClient(clientId);
      await adminClient.deleteUser(username);
    }
  });
});

test.describe("Search", () => {
  test("search non-existent session", async ({ page }) => {
    // Note: Testing search functionality, using master realm which has sessions
    await login(page, { to: toSessions({ realm: "master" }) });

    await searchItem(page, placeHolder, "non-existent-session");
    await assertNoResults(page);
  });
});

test.describe("revocation", () => {
  test("Clear revocation notBefore", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toSessions({ realm: testBed.realm }) });

    await selectActionToggleItem(page, "Revocation");
    await clickNotBefore(page);
    await assertNotificationMessage(
      page,
      'Success! "Not Before" cleared for realm.',
    );
  });

  test("Check if notBefore cleared", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toSessions({ realm: testBed.realm }) });

    await selectActionToggleItem(page, "Revocation");
    await assertNotBeforeValue(page, "None");
  });

  test("Set revocation notBefore", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toSessions({ realm: testBed.realm }) });

    await selectActionToggleItem(page, "Revocation");
    await clickSetToNow(page);
    await assertNotificationMessage(
      page,
      'Success! "Not before" set for realm',
    );
  });

  test("Push when URI not configured", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toSessions({ realm: testBed.realm }) });

    await selectActionToggleItem(page, "Revocation");
    await clickPush(page);
    await assertNotificationMessage(
      page,
      "No push sent. No admin URI configured or no registered cluster nodes available",
    );
  });
});

test.describe("Accessibility tests for sessions", () => {
  test("Check a11y violations on load/ sessions", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toSessions({ realm: testBed.realm }) });

    await assertAxeViolations(page);
  });

  test("Check a11y violations on revocation dialog", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toSessions({ realm: testBed.realm }) });

    await page.getByTestId("action-dropdown").click();
    await page.getByTestId("revocation").click();
    await assertAxeViolations(page);
  });

  test("Check a11y violations on sign out all active sessions dialog", async ({
    page,
  }) => {
    // Note: This test needs active sessions to enable the "Sign out all sessions" button
    await login(page, { to: toSessions({ realm: "master" }) });

    await page.getByTestId("action-dropdown").click();
    await page.getByTestId("logout-all").click();
    await assertAxeViolations(page);
  });
});
