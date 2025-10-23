import { expect, test } from "@playwright/test";
import { toClient } from "../../src/clients/routes/Client.tsx";
import { toClients } from "../../src/clients/routes/Clients.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { assertRequiredFieldError } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { continueNext, createClient, save } from "./utils.ts";
import {
  assertKeyForCodeExchangeInput,
  selectKeyForCodeExchangeInput,
} from "./details.ts";

test.describe("Clients details", () => {
  test("tests clientId required", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClients({ realm: testBed.realm }) });

    await createClient(page);
    await assertRequiredFieldError(page, "clientId");
  });

  test("cancels create and returns to clients", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClients({ realm: testBed.realm }) });

    await createClient(
      page,
      { clientId: "test-client" },
      async () => await page.getByRole("button", { name: "Cancel" }).click(),
    );

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

  test("updates a client", async ({ page }) => {
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
        tab: "settings",
      }),
    });

    await selectKeyForCodeExchangeInput(page, "S256");
    await save(page);
    await assertNotificationMessage(page, "Client successfully updated");
    await assertKeyForCodeExchangeInput(page, "S256");
  });
});
