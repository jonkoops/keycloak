import { test } from "@playwright/test";
import { toClient } from "../../src/clients/routes/Client.tsx";
import adminClient from "../utils/AdminClient.ts";
import { createTestBed } from "../support/testbed.ts";
import { switchOff, switchOn } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { assertModalTitle, cancelModal, confirmModal } from "../utils/modal.ts";
import { goToAdvancedTab, revertFineGrain, saveFineGrain } from "./advanced.ts";
import {
  assertCertificates,
  assertEncryptionAlgorithm,
  assertEncryptionKeyAlgorithm,
  assertEncryptionDigestMethod,
  assertEncryptionMaskGenerationFunction,
  assertEncryptionAlgorithmInputVisible,
  assertEncryptionKeyAlgorithmInputVisible,
  assertEncryptionDigestMethodInputVisible,
  assertEncryptionMaskGenerationFunctionInputVisible,
  assertNameIdFormatDropdown,
  assertSamlClientDetails,
  assertTermsOfServiceUrl,
  clickClientSignature,
  clickEncryptionAssertions,
  clickOffEncryptionAssertions,
  clickGenerate,
  clickPostBinding,
  goToClientSettingsTab,
  goToKeysTab,
  saveSamlSettings,
  selectEncryptionAlgorithmInput,
  selectEncryptionKeyAlgorithmInput,
  selectEncryptionDigestMethodInput,
  selectEncryptionMaskGenerationFunctionInput,
  setTermsOfServiceUrl,
} from "./saml.ts";

test.describe("Fine Grain SAML Endpoint Configuration", () => {
  test("sets Terms of service URL", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "saml",
      clientId: "saml-test-client",
      publicClient: false,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "advanced",
      }),
    });

    const termsOfServiceUrl = "http://some.url/terms-of-service.html";

    // Set and save URL
    await setTermsOfServiceUrl(page, termsOfServiceUrl);
    await saveFineGrain(page);
    await assertNotificationMessage(page, "Client successfully updated");

    // Try to set different URL but revert
    await setTermsOfServiceUrl(page, "http://not.saveing.this/");
    await revertFineGrain(page);

    // Verify original URL remains
    await assertTermsOfServiceUrl(page, termsOfServiceUrl);
  });

  test("shows error for invalid terms of service URL", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "saml",
      clientId: "saml-test-client",
      publicClient: false,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "advanced",
      }),
    });

    await setTermsOfServiceUrl(page, "not a url");
    await saveFineGrain(page);
    await assertNotificationMessage(
      page,
      "Client could not be updated: invalid_inputTerms of service URL is not a valid URL",
    );
  });
});

test.describe("Clients SAML tests", () => {
  test("displays the saml sections on details screen", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "saml",
      clientId: "saml-test-client",
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "settings" }),
    });

    await assertSamlClientDetails(page);
  });

  test("saves force name id format", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "saml",
      clientId: "saml-test-client",
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "settings" }),
    });

    await clickPostBinding(page);
    await saveSamlSettings(page);
    await assertNotificationMessage(page, "Client successfully updated");
  });

  test("does not disable signature when cancel", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "saml",
      clientId: "saml-test-client",
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "settings" }),
    });

    await goToKeysTab(page);
    await clickClientSignature(page);
    await assertModalTitle(page, 'Disable "Client signature required"');
    await cancelModal(page);
    await assertCertificates(page);
  });

  test("disables client signature", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "saml",
      clientId: "saml-test-client",
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "settings" }),
    });

    await goToKeysTab(page);
    await clickClientSignature(page);
    await assertModalTitle(page, 'Disable "Client signature required"');
    await confirmModal(page);
    await assertNotificationMessage(page, "Client successfully updated");
    await assertCertificates(page);
  });

  test("enables Encryption keys config", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "saml",
      clientId: "saml-test-client",
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "settings" }),
    });

    // enable encryption on keys tab
    await goToKeysTab(page);
    await clickEncryptionAssertions(page);
    await clickGenerate(page);
    await assertNotificationMessage(
      page,
      "New key pair and certificate generated successfully",
    );
    await confirmModal(page);
    await assertCertificates(page);

    // assert encryption algorithms can be modified
    await goToClientSettingsTab(page);
    await assertEncryptionAlgorithm(page, "Choose...");
    await assertEncryptionKeyAlgorithm(page, "Choose...");
    await assertEncryptionDigestMethodInputVisible(page, false);
    await assertEncryptionMaskGenerationFunctionInputVisible(page, false);
    await selectEncryptionAlgorithmInput(page, "AES_256_GCM");
    await selectEncryptionKeyAlgorithmInput(page, "RSA-OAEP-11");
    await assertEncryptionDigestMethod(page, "Choose...");
    await assertEncryptionMaskGenerationFunction(page, "Choose...");
    await selectEncryptionDigestMethodInput(page, "SHA-256");
    await selectEncryptionMaskGenerationFunctionInput(page, "mgf1sha256");
    await selectEncryptionKeyAlgorithmInput(page, "RSA1_5");
    await assertEncryptionDigestMethodInputVisible(page, false);
    await assertEncryptionMaskGenerationFunctionInputVisible(page, false);
    await selectEncryptionKeyAlgorithmInput(page, "RSA-OAEP-11");
    await assertEncryptionDigestMethod(page, "Choose...");
    await assertEncryptionMaskGenerationFunction(page, "Choose...");
    await selectEncryptionDigestMethodInput(page, "SHA-256");
    await selectEncryptionMaskGenerationFunctionInput(page, "mgf1sha256");

    // disable encryption and check encryption algorithms are hidden
    await goToKeysTab(page);
    await clickOffEncryptionAssertions(page);
    await confirmModal(page);
    await goToClientSettingsTab(page);
    await assertEncryptionAlgorithmInputVisible(page, false);
    await assertEncryptionKeyAlgorithmInputVisible(page, false);
    await assertEncryptionDigestMethodInputVisible(page, false);
    await assertEncryptionMaskGenerationFunctionInputVisible(page, false);

    // enable encryption again and check algorithms are empty/default
    await goToKeysTab(page);
    await clickEncryptionAssertions(page);
    await confirmModal(page);
    await goToClientSettingsTab(page);
    await assertEncryptionAlgorithm(page, "Choose...");
    await assertEncryptionKeyAlgorithm(page, "Choose...");
    await assertEncryptionDigestMethodInputVisible(page, false);
    await assertEncryptionMaskGenerationFunctionInputVisible(page, false);
  });

  test("checks SAML capabilities", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "saml",
      clientId: "saml-test-client",
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "settings" }),
    });

    // Assert SAML Capabilities switches exist
    const switches = [
      ['[data-testid="attributes.saml_force_name_id_format"]', "on"],
      ['[data-testid="attributes.saml.artifact.binding"]', "on"],
      ['[data-testid="attributes.saml.artifact.binding"]', "off"],
      ['[data-testid="attributes.saml.server.signature"]', "off"],
      ['[data-testid="attributes.saml.assertion.signature"]', "on"],
    ];

    for (const [name, value] of switches) {
      if (value === "off") {
        await switchOff(page, name);
      } else {
        await switchOn(page, name);
      }
    }

    // Assert Name ID Format dropdown exists
    await assertNameIdFormatDropdown(page);
  });

  test("checks access settings", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "saml",
      clientId: "saml-client",
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "settings" }),
    });

    const validUrl = `http://localhost:8180/realms/${testBed.realm}/protocol/saml-client/clients/`;
    const invalidUrlErrorRoot =
      "Client could not be updated: invalid_inputRoot URL is not a valid URL";
    const invalidUrlErrorBase =
      "Client could not be updated: invalid_inputBase URL is not a valid URL";

    await page.getByTestId("rootUrl").fill("Invalid URL");
    await saveSamlSettings(page);
    await assertNotificationMessage(page, invalidUrlErrorRoot);
    await page.getByTestId("rootUrl").clear();

    await page.getByTestId("baseUrl").fill("Invalid URL");
    await saveSamlSettings(page);

    await assertNotificationMessage(page, invalidUrlErrorBase);
    await page.getByTestId("baseUrl").clear();

    await page.getByTestId("rootUrl").fill(validUrl);
    await page.getByTestId("baseUrl").fill(validUrl);
    await saveSamlSettings(page);

    await assertNotificationMessage(page, "Client successfully updated");
  });
});
