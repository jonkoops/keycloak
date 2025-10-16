import { expect, test } from "@playwright/test";
import { toClients } from "../../src/clients/routes/Clients.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { assertRequiredFieldError } from "../utils/form.ts";
import { chooseFile } from "../utils/file-chooser.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { assertModalTitle, confirmModal } from "../utils/modal.ts";
import {
  clearAllFilters,
  clickRowKebabItem,
  getRowByCellText,
  searchItem,
} from "../utils/table.ts";
import {
  cancel,
  clientCapabilityConfig,
  continueNext,
  createClient,
  save,
} from "./utils.ts";

test.describe("Clients", () => {
  const clientId = `clientId`;
  const placeHolder = "Search for client";

  test("tests clientId required", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClients({ realm: testBed.realm }) });

    await createClient(page);
    await assertRequiredFieldError(page, "clientId");
  });

  test("cancels create and returns to clients", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClients({ realm: testBed.realm }) });

    await createClient(page, { clientId }, () => cancel(page));

    await expect(page).not.toHaveURL("add-client");
  });

  test("creates a client", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClients({ realm: testBed.realm }) });

    await createClient(page, {
      clientId: "created-client",
      name: "ClientName",
      description: "ClientDescription",
    });

    await continueNext(page);
    await save(page);

    await assertNotificationMessage(page, "Client created successfully");
  });

  test("fails creating client that already exists", async ({ page }) => {
    await using testBed = await createTestBed();

    // Create a client first through admin client
    await adminClient.createClient({
      clientId: "existing-client",
      realm: testBed.realm,
    });

    await login(page, { to: toClients({ realm: testBed.realm }) });

    await createClient(page, {
      clientId: "existing-client",
      name: "Existing",
    });

    await continueNext(page);
    await save(page);

    await assertNotificationMessage(
      page,
      "Could not create client: 'Client existing-client already exists'",
    );
  });

  test("creates and deletes client", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClients({ realm: testBed.realm }) });

    const client = {
      clientId,
      name: "ClientName",
      description: "ClientDescription",
      alwaysDisplayInConsole: true,
      publicClient: true,
      directAccessGrantsEnabled: true,
      implicitFlowEnabled: true,
      serviceAccountsEnabled: true,
      standardFlowEnabled: true,
      attributes: {
        "oauth2.device.authorization.grant.enabled": "true",
        "oidc.ciba.grant.enabled": "true",
      },
    };
    await createClient(page, client);
    await clientCapabilityConfig(page, client);
    await continueNext(page);
    await save(page);

    await assertNotificationMessage(page, "Client created successfully");

    // Navigate back to clients list
    await page.goto(page.url().replace(/\/clients\/.+/, "/clients"));

    await clickRowKebabItem(page, clientId, "Delete");
    await assertModalTitle(page, `Delete ${clientId} ?`);
    await confirmModal(page);
    await assertNotificationMessage(page, "The client has been deleted");
  });

  test("searches for clients", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClients({ realm: testBed.realm }) });

    await searchItem(page, placeHolder, "John Doe");
    await expect(
      page.getByRole("heading", { name: "No search results" }),
    ).toBeVisible();

    await clearAllFilters(page);
    // The default clients should be visible
  });

  test("imports client", async ({ page }) => {
    await using testBed = await createTestBed();

    await adminClient.createClient({
      clientId: "identical",
      protocol: "openid-connect",
      realm: testBed.realm,
    });

    await login(page, { to: toClients({ realm: testBed.realm }) });

    await page.getByTestId("importClient").click();
    await chooseFile(page, "../utils/files/import-identical-client.json");
    await save(page);
    await assertNotificationMessage(
      page,
      "Could not import client: Client identical already exists",
    );
  });
});
