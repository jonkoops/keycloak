import { expect, test } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";
import { toClients } from "../../src/clients/routes/Clients.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { login } from "../utils/login.ts";
import { assertEmptyTable, clickTableRowItem } from "../utils/table.ts";
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
  goToAdvancedTab,
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

test.describe("Advanced tab test", () => {
  test("Clustering", async ({ page }) => {
    await using testBed = await createTestBed();
    const clientId = `advanced-tab-${uuidv4()}`;
    await adminClient.createClient({
      clientId,
      publicClient: true,
      realm: testBed.realm,
    });

    await login(page, { to: toClients({ realm: testBed.realm }) });
    await clickTableRowItem(page, clientId);
    await goToAdvancedTab(page);

    const host = "localhost";
    await expandClusterNode(page);
    await assertEmptyTable(page);
    await registerNodeManually(page, host);
    await assertTestClusterAvailability(page, true);
    await deleteClusterNode(page, host);
    await assertEmptyTable(page);
  });

  test("Fine grain OpenID connect configuration", async ({ page }) => {
    await using testBed = await createTestBed();
    const clientId = `advanced-tab-${uuidv4()}`;
    await adminClient.createClient({
      clientId,
      publicClient: true,
      realm: testBed.realm,
    });

    await login(page, { to: toClients({ realm: testBed.realm }) });
    await clickTableRowItem(page, clientId);
    await goToAdvancedTab(page);

    const algorithm = "ES384";
    await selectAccessTokenSignatureAlgorithm(page, algorithm);
    await saveFineGrain(page);
    await selectAccessTokenSignatureAlgorithm(page, "HS384");
    await revertFineGrain(page);
    await assertAccessTokenSignatureAlgorithm(page, algorithm);
  });

  test("OIDC Compatibility Modes configuration", async ({ page }) => {
    await using testBed = await createTestBed();
    const clientId = `advanced-tab-${uuidv4()}`;
    await adminClient.createClient({
      clientId,
      publicClient: true,
      realm: testBed.realm,
    });

    await login(page, { to: toClients({ realm: testBed.realm }) });
    await clickTableRowItem(page, clientId);
    await goToAdvancedTab(page);

    await clickAllCompatibilitySwitch(page);
    await saveCompatibility(page);
    await switchOffExcludeSessionStateSwitch(page);
    await revertCompatibility(page);
    await assertOnExcludeSessionStateSwitch(page);
  });

  test("Client Offline Session Max", async ({ page }) => {
    await using testBed = await createTestBed();
    const clientId = `advanced-tab-${uuidv4()}`;
    await adminClient.createClient({
      clientId,
      publicClient: true,
      realm: testBed.realm,
    });

    await login(page, { to: toClients({ realm: testBed.realm }) });
    await clickTableRowItem(page, clientId);
    await goToAdvancedTab(page);

    await assertTokenLifespanClientOfflineSessionMaxVisible(page, false);
  });

  test("Advanced settings", async ({ page }) => {
    await using testBed = await createTestBed();
    const clientId = `advanced-tab-${uuidv4()}`;
    await adminClient.createClient({
      clientId,
      publicClient: true,
      realm: testBed.realm,
    });

    await login(page, { to: toClients({ realm: testBed.realm }) });
    await clickTableRowItem(page, clientId);
    await goToAdvancedTab(page);

    await clickAdvancedSwitches(page);
    await saveAdvanced(page);
    await assertAdvancedSwitchesOn(page);
    await clickAdvancedSwitches(page, false);
    await revertAdvanced(page);
    await assertAdvancedSwitchesOn(page);
  });

  test("Authentication flow override", async ({ page }) => {
    await using testBed = await createTestBed();
    const clientId = `advanced-tab-${uuidv4()}`;
    await adminClient.createClient({
      clientId,
      publicClient: true,
      realm: testBed.realm,
    });

    await login(page, { to: toClients({ realm: testBed.realm }) });
    await clickTableRowItem(page, clientId);
    await goToAdvancedTab(page);

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

test.describe("Client Offline Session Max", () => {
  test("Client Offline Session Max", async ({ page }) => {
    await using testBed = await createTestBed({
      offlineSessionMaxLifespanEnabled: true,
    });
    const clientId = `clientId-${uuidv4()}`;
    await adminClient.createClient({ clientId, realm: testBed.realm });

    await login(page, { to: toClients({ realm: testBed.realm }) });
    await clickTableRowItem(page, clientId);
    await goToAdvancedTab(page);

    await assertTokenLifespanClientOfflineSessionMaxVisible(page, true);
  });
});

test.describe("OpenID for Verifiable Credentials", () => {
  test.describe("with protocol openid-connect", () => {
    test("should handle OID4VC section visibility based on feature flag", async ({
      page,
    }) => {
      await using testBed = await createTestBed();
      const clientIdOpenIdConnect = `client-oidc-${uuidv4()}`;
      await adminClient.createClient({
        clientId: clientIdOpenIdConnect,
        realm: testBed.realm,
        protocol: "openid-connect",
      });

      await login(page, { to: toClients({ realm: testBed.realm }) });
      await clickTableRowItem(page, clientIdOpenIdConnect);

      await page.waitForSelector('[data-testid="advancedTab"]', {
        state: "visible",
        timeout: 10000,
      });
      await page.getByTestId("advancedTab").click();

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
});
