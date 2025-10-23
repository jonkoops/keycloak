import { expect, test } from "@playwright/test";
import { toClient } from "../../src/clients/routes/Client.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { login } from "../utils/login.ts";
import { assertEmptyTable } from "../utils/table.ts";
import {
  assertAccessTokenSignatureAlgorithm,
  assertAdvancedSwitchesOn,
  assertBrowserFlowInput,
  assertOnExcludeSessionStateSwitch,
  assertTestClusterAvailability,
  assertTokenLifespanClientOfflineSessionMaxVisible,
  assertDirectGrantInput,
  clickAdvancedSwitches,
  clickAllCompatibilitySwitch,
  deleteClusterNode,
  expandClusterNode,
  registerNodeManually,
  revertAdvanced,
  revertCompatibility,
  revertFineGrain,
  saveAdvanced,
  saveCompatibility,
  saveFineGrain,
  selectAccessTokenSignatureAlgorithm,
  selectBrowserFlowInput,
  selectDirectGrantInput,
  switchOffExcludeSessionStateSwitch,
  saveAuthFlowOverride,
  revertAuthFlowOverride,
  saveOid4vci,
  revertOid4vci,
  assertOid4vciEnabled,
  switchOid4vciEnabled,
} from "./advanced.ts";

test.describe("Advanced tab", () => {
  test("manages clustering", async ({ page }) => {
    await using testBed = await createTestBed({
      clients: [{ clientId: "test-client", publicClient: true }],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "advanced",
      }),
    });

    const host = "localhost";
    await expandClusterNode(page);
    await assertEmptyTable(page);
    await registerNodeManually(page, host);
    await assertTestClusterAvailability(page, true);
    await deleteClusterNode(page, host);
    await assertEmptyTable(page);
  });

  test("configures fine grain OpenID connect", async ({ page }) => {
    await using testBed = await createTestBed({
      clients: [{ clientId: "test-client" }],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "advanced",
      }),
    });

    const algorithm = "ES384";
    await selectAccessTokenSignatureAlgorithm(page, algorithm);
    await saveFineGrain(page);
    await selectAccessTokenSignatureAlgorithm(page, "HS384");
    await revertFineGrain(page);
    await assertAccessTokenSignatureAlgorithm(page, algorithm);
  });

  test("configures OIDC compatibility modes", async ({ page }) => {
    await using testBed = await createTestBed({
      clients: [{ clientId: "test-client" }],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "advanced",
      }),
    });

    await clickAllCompatibilitySwitch(page);
    await saveCompatibility(page);
    await switchOffExcludeSessionStateSwitch(page);
    await revertCompatibility(page);
    await assertOnExcludeSessionStateSwitch(page);
  });

  test("shows client offline session max as not visible by default", async ({
    page,
  }) => {
    await using testBed = await createTestBed({
      clients: [{ clientId: "test-client" }],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "advanced",
      }),
    });

    await assertTokenLifespanClientOfflineSessionMaxVisible(page, false);
  });

  test("configures advanced settings", async ({ page }) => {
    await using testBed = await createTestBed({
      clients: [{ clientId: "test-client" }],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "advanced",
      }),
    });

    await clickAdvancedSwitches(page);
    await saveAdvanced(page);
    await assertAdvancedSwitchesOn(page);
    await clickAdvancedSwitches(page, false);
    await revertAdvanced(page);
    await assertAdvancedSwitchesOn(page);
  });

  test("overrides authentication flow", async ({ page }) => {
    await using testBed = await createTestBed({
      clients: [{ clientId: "test-client" }],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "advanced",
      }),
    });

    await selectBrowserFlowInput(page, "browser");
    await selectDirectGrantInput(page, "docker auth");
    await assertBrowserFlowInput(page, "browser");
    await assertDirectGrantInput(page, "docker auth");
    await revertAuthFlowOverride(page);
    await assertBrowserFlowInput(page, "Choose...");
    await assertDirectGrantInput(page, "Choose...");
    await selectBrowserFlowInput(page, "browser");
    await selectDirectGrantInput(page, "docker auth");
    await saveAuthFlowOverride(page);
    await selectBrowserFlowInput(page, "first broker login");
    await selectDirectGrantInput(page, "first broker login");
    await revertAuthFlowOverride(page);
  });
});

test.describe("Client offline session max", () => {
  test("shows client offline session max when enabled in realm", async ({
    page,
  }) => {
    await using testBed = await createTestBed({
      offlineSessionMaxLifespanEnabled: true,
      clients: [{ clientId: "test-client" }],
    });

    const client = await adminClient.findClientByClientId(
      "test-client",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "advanced",
      }),
    });

    await assertTokenLifespanClientOfflineSessionMaxVisible(page, true);
  });
});

test.describe("OpenID for Verifiable Credentials", () => {
  test("handles OID4VC section visibility based on feature flag", async ({
    page,
  }) => {
    await using testBed = await createTestBed({
      clients: [{ clientId: "test-client-oidc", protocol: "openid-connect" }],
    });

    const client = await adminClient.findClientByClientId(
      "test-client-oidc",
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: client.id!,
        tab: "advanced",
      }),
    });

    const toggleSwitch = page.locator("#attributes\\.oid4vci🍺enabled");

    const isVisible = await toggleSwitch.isVisible();

    if (isVisible) {
      await toggleSwitch.scrollIntoViewIfNeeded();
      await assertOid4vciEnabled(page, false);
      await switchOid4vciEnabled(page, true);
      await saveOid4vci(page);
      await assertOid4vciEnabled(page, true);
      await switchOid4vciEnabled(page, false);
      await assertOid4vciEnabled(page, false);
      await revertOid4vci(page);
      await assertOid4vciEnabled(page, true);
    } else {
      await expect(toggleSwitch).toBeHidden();
    }
  });
});
