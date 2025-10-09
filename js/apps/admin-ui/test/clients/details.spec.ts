import { expect, test } from "@playwright/test";
import { v4 as uuid } from "uuid";
import { toClients } from "../../src/clients/routes/Clients.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { assertRequiredFieldError } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { clickTableRowItem, searchItem } from "../utils/table.ts";
import { continueNext, createClient, save } from "./utils.ts";
import {
  assertKeyForCodeExchangeInput,
  selectKeyForCodeExchangeInput,
} from "./details.ts";

test.describe("Clients details test", () => {
  test("Should test clientId required", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toClients({ realm: testBed.realm }) });
    await createClient(page);
    await assertRequiredFieldError(page, "clientId");
  });

  test("Cancel create should return to clients", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toClients({ realm: testBed.realm }) });
    await createClient(
      page,
      { clientId: "test-client" },
      async () => await page.getByRole("button", { name: "Cancel" }).click(),
    );

    await expect(page).not.toHaveURL("add-client");
  });

  test("Should be able to create a client", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toClients({ realm: testBed.realm }) });
    await createClient(page, {
      clientId: `created-client-${uuid()}`,
      name: "ClientName",
      description: "ClientDescription",
    });

    await continueNext(page);
    await save(page);

    await assertNotificationMessage(page, "Client created successfully");
  });

  test("Should be able to update a client", async ({ page }) => {
    await using testBed = await createTestBed();
    const clientId = `client-details-${uuid()}`;
    await adminClient.createClient({
      clientId,
      protocol: "openid-connect",
      publicClient: false,
      realm: testBed.realm,
    });

    await login(page, { to: toClients({ realm: testBed.realm }) });
    await searchItem(page, "Search for client", clientId);
    await clickTableRowItem(page, clientId);
    await selectKeyForCodeExchangeInput(page, "S256");
    await save(page);
    await assertNotificationMessage(page, "Client successfully updated");
    await assertKeyForCodeExchangeInput(page, "S256");
  });
});
