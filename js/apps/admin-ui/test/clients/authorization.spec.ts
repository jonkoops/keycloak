import { test } from "@playwright/test";
import { toClient } from "../../src/clients/routes/Client.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { clickSaveButton } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import {
  assertAxeViolations,
  assertNotificationMessage,
} from "../utils/masthead.ts";
import { assertRowExists, clickTableRowItem } from "../utils/table.ts";
import {
  assertClipboardHasText,
  assertDefaultResource,
  assertDownload,
  clickAuthenticationSaveButton,
  clickCopyButton,
  createAuthorizationScope,
  createPermission,
  createPolicy,
  createResource,
  deletePolicy,
  fillForm,
  goToExportSubTab,
  goToPermissionsSubTab,
  goToPoliciesSubTab,
  goToResourcesSubTab,
  goToScopesSubTab,
  inputClient,
  selectResource,
  setPolicy,
} from "./authorization.ts";

test.describe("Client authentication subtab", () => {
  test("updates the resource server settings", async ({ page }) => {
    await using testBed = await createTestBed({
      clients: [
        {
          clientId: "test-client",
          authorizationServicesEnabled: true,
          serviceAccountsEnabled: true,
        },
      ],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "authorization",
      }),
    });

    await setPolicy(page, "DISABLED");
    await clickAuthenticationSaveButton(page);
    await assertNotificationMessage(page, "Resource successfully updated");
  });

  test("creates a resource", async ({ page }) => {
    await using testBed = await createTestBed();

    const { id: clientId } = await adminClient.createClient({
      clientId: "test-client",
      authorizationServicesEnabled: true,
      serviceAccountsEnabled: true,
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "authorization",
      }),
    });

    await goToResourcesSubTab(page);
    await assertDefaultResource(page);
    await createResource(page, {
      name: "Resource",
      displayName: "The display name",
      type: "type",
      uris: ["one", "two"],
    });

    await clickSaveButton(page);
    await assertNotificationMessage(page, "Resource created successfully");
  });

  test("edits a resource", async ({ page }) => {
    await using testBed = await createTestBed();

    const { id: clientId } = await adminClient.createClient({
      clientId: "test-client",
      authorizationServicesEnabled: true,
      serviceAccountsEnabled: true,
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "authorization",
      }),
    });

    await goToResourcesSubTab(page);
    await clickTableRowItem(page, "Default Resource");

    await fillForm(page, { displayName: "updated" });
    await clickSaveButton(page);

    await assertNotificationMessage(page, "Resource successfully updated");
  });

  test("creates a scope", async ({ page }) => {
    await using testBed = await createTestBed({
      clients: [
        {
          clientId: "test-client",
          authorizationServicesEnabled: true,
          serviceAccountsEnabled: true,
        },
      ],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "authorization",
      }),
    });

    await goToScopesSubTab(page);
    await createAuthorizationScope(page, {
      name: "The scope",
      displayName: "Display something",
      iconUri: "res://something",
    });
    await clickSaveButton(page);

    await assertNotificationMessage(
      page,
      "Authorization scope created successfully",
    );
    await goToScopesSubTab(page);
    await assertRowExists(page, "The scope");
  });

  test("creates a permission", async ({ page }) => {
    await using testBed = await createTestBed();

    const { id: clientId } = await adminClient.createClient({
      clientId: "test-client",
      authorizationServicesEnabled: true,
      serviceAccountsEnabled: true,
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "authorization",
      }),
    });

    await goToPermissionsSubTab(page);

    await createPermission(page, "resource", {
      name: "Permission name",
      description: "Something describing this permission",
    });
    await selectResource(page, "Default Resource");

    await clickSaveButton(page);
    await assertNotificationMessage(
      page,
      "Successfully created the permission",
    );
  });

  test("creates a policy", async ({ page }) => {
    await using testBed = await createTestBed();

    const { id: clientId } = await adminClient.createClient({
      clientId: "test-client",
      authorizationServicesEnabled: true,
      serviceAccountsEnabled: true,
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "authorization",
      }),
    });

    await goToPoliciesSubTab(page);
    await createPolicy(page, "Regex", {
      name: "Regex policy",
      description: "Policy for regex",
      targetClaim: "I don't know",
      pattern: ".*?",
    });
    await clickSaveButton(page);

    await assertNotificationMessage(page, "Successfully created the policy");
  });

  test("deletes a policy", async ({ page }) => {
    await using testBed = await createTestBed();

    const { id: clientId } = await adminClient.createClient({
      clientId: "test-client",
      authorizationServicesEnabled: true,
      serviceAccountsEnabled: true,
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "authorization",
      }),
    });

    await goToPoliciesSubTab(page);
    await deletePolicy(page, "Default Policy");

    await assertNotificationMessage(page, "The Policy successfully deleted");
  });

  test("creates a client policy", async ({ page }) => {
    await using testBed = await createTestBed();

    // Create a client to use in the policy
    await adminClient.createClient({
      protocol: "openid-connect",
      clientId: "policy-target-client",
      realm: testBed.realm,
    });

    const { id: clientId } = await adminClient.createClient({
      clientId: "test-client",
      authorizationServicesEnabled: true,
      serviceAccountsEnabled: true,
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "authorization",
      }),
    });

    await goToPoliciesSubTab(page);
    await createPolicy(page, "Client", {
      name: "Client policy",
      description: "Extra client field",
    });

    await inputClient(page, "policy-target-client");
    await clickSaveButton(page);
    await assertNotificationMessage(page, "Successfully created the policy");
  });

  test("copies auth details", async ({ page, context, browserName }) => {
    // Firefox doesn't support clipboard permissions in Playwright
    if (browserName !== "firefox") {
      await context.grantPermissions(["clipboard-write", "clipboard-read"]);
    }

    await using testBed = await createTestBed({
      clients: [
        {
          clientId: "test-client",
          authorizationServicesEnabled: true,
          serviceAccountsEnabled: true,
        },
      ],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "authorization",
      }),
    });

    await goToExportSubTab(page);
    await clickCopyButton(page);
    await assertNotificationMessage(page, "Authorization details copied.");
    await assertClipboardHasText(page);
  });

  test("exports auth details", async ({ page }) => {
    await using testBed = await createTestBed({
      clients: [
        {
          clientId: "test-client",
          authorizationServicesEnabled: true,
          serviceAccountsEnabled: true,
        },
      ],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "authorization",
      }),
    });

    await goToExportSubTab(page);

    await assertDownload(page);
  });
});

test.describe("Client authorization tab access for view-realm-authorization", () => {
  test("views authorization tab", async ({ page }) => {
    await using testBed = await createTestBed({
      enabled: true,
      users: [
        {
          username: "test-user",
          enabled: true,
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          credentials: [{ type: "password", value: "password" }],
        },
      ],
    });

    const testUser = await adminClient.findUserByUsername(
      testBed.realm,
      "test-user",
    );

    await adminClient.addClientRoleToUser(
      testUser.id!,
      "realm-management",
      ["view-realm", "view-users", "view-authorization", "view-clients"],
      testBed.realm,
    );

    const { id: clientId } = await adminClient.createClient({
      clientId: "test-client",
      authorizationServicesEnabled: true,
      serviceAccountsEnabled: true,
      realm: testBed.realm,
    });

    await login(page, {
      realm: testBed.realm,
      username: "test-user",
      password: "password",
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "authorization",
      }),
    });

    await goToResourcesSubTab(page);
    await clickTableRowItem(page, "Default Resource");
    await page.goBack();

    await goToScopesSubTab(page);
    await goToPoliciesSubTab(page);
    await goToPermissionsSubTab(page);
  });
});

test.describe("Accessibility tests for client authorization", () => {
  test("checks a11y violations on load", async ({ page }) => {
    await using testBed = await createTestBed({
      clients: [
        {
          clientId: "test-client",
          authorizationServicesEnabled: true,
          serviceAccountsEnabled: true,
        },
      ],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "authorization",
      }),
    });

    await assertAxeViolations(page);
  });
});
