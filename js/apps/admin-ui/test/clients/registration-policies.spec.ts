import { expect, test } from "@playwright/test";
import { toClients } from "../../src/clients/routes/Clients.tsx";
import { createTestBed } from "../support/testbed.ts";
import { clickCancelButton, clickSaveButton } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import {
  assertAxeViolations,
  assertNotificationMessage,
} from "../utils/masthead.ts";
import { confirmModal } from "../utils/modal.ts";
import {
  assertRowExists,
  clickRowKebabItem,
  clickTableRowItem,
  getTableData,
} from "../utils/table.ts";
import {
  clickCreateAnonymousPolicy,
  clickCreateAuthenticatedPolicy,
  createPolicy,
  fillPolicyForm,
  goToAuthenticatedSubTab,
  goToClientRegistrationTab,
} from "./registration-policies.ts";

test.describe("Client registration policies tab", () => {
  const tabName = "Client registration";

  test.describe("Anonymous client policies subtab", () => {
    const policyName = "newAnonymPolicy1";
    const policyNameUpdated = "policy2";

    test("check anonymous clients list is not empty", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toClients({ realm: testBed.realm }) });
      await goToClientRegistrationTab(page);

      const rows = await getTableData(page, tabName);
      expect(rows.length).toBeGreaterThan(1);
    });

    test("add anonymous client registration policy", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toClients({ realm: testBed.realm }) });
      await goToClientRegistrationTab(page);

      await clickCreateAnonymousPolicy(page);
      await createPolicy(page, "max-clients", { name: policyName });
      await clickSaveButton(page);

      await assertNotificationMessage(
        page,
        "New client policy created successfully",
      );
      await clickCancelButton(page);

      await assertRowExists(page, policyName);
    });

    test("edit anonymous client registration policy", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toClients({ realm: testBed.realm }) });
      await goToClientRegistrationTab(page);

      await clickTableRowItem(page, "Consent Required");
      await fillPolicyForm(page, { name: policyNameUpdated });
      await clickSaveButton(page);

      await assertNotificationMessage(
        page,
        "Client policy updated successfully",
      );
      await clickCancelButton(page);

      await assertRowExists(page, policyNameUpdated);
    });

    test("delete anonymous client registration policy", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toClients({ realm: testBed.realm }) });
      await goToClientRegistrationTab(page);

      await clickRowKebabItem(page, "Full Scope Disabled", "Delete");
      await confirmModal(page);

      await assertNotificationMessage(
        page,
        "Client registration policy deleted successfully",
      );
    });
  });

  test.describe("Authenticated client policies subtab", () => {
    const policyName = "newAuthPolicy1";
    const policyNameUpdated = "policy3";

    test("check authenticated clients list is not empty", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toClients({ realm: testBed.realm }) });
      await goToClientRegistrationTab(page);
      await goToAuthenticatedSubTab(page);

      const rows = await getTableData(page, tabName);
      expect(rows.length).toBeGreaterThan(1);
    });

    test("add authenticated client registration policy", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toClients({ realm: testBed.realm }) });
      await goToClientRegistrationTab(page);
      await goToAuthenticatedSubTab(page);

      await clickCreateAuthenticatedPolicy(page);
      await createPolicy(page, "scope", { name: policyName });
      await clickSaveButton(page);

      await assertNotificationMessage(
        page,
        "New client policy created successfully",
      );
      await clickCancelButton(page);

      await assertRowExists(page, policyName);
    });

    test("edit authenticated client registration policy", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toClients({ realm: testBed.realm }) });
      await goToClientRegistrationTab(page);
      await goToAuthenticatedSubTab(page);

      await clickTableRowItem(page, "Allowed Protocol Mapper Types");
      await fillPolicyForm(page, { name: policyNameUpdated });
      await clickSaveButton(page);

      await assertNotificationMessage(
        page,
        "Client policy updated successfully",
      );
      await clickCancelButton(page);
      await assertRowExists(page, policyNameUpdated);
    });

    test("delete authenticated client registration policy", async ({
      page,
    }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toClients({ realm: testBed.realm }) });
      await goToClientRegistrationTab(page);
      await goToAuthenticatedSubTab(page);

      await clickRowKebabItem(page, "Allowed Client Scopes", "Delete");
      await confirmModal(page);

      await assertNotificationMessage(
        page,
        "Client registration policy deleted successfully",
      );
    });
  });
});

test.describe("Accessibility tests for client registration policies", () => {
  test("Check accessibility violations", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toClients({ realm: testBed.realm }) });
    await goToClientRegistrationTab(page);

    await assertAxeViolations(page);
  });
});
