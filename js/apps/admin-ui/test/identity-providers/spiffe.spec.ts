import { test } from "@playwright/test";
import { toIdentityProviders } from "../../src/identity-providers/routes/IdentityProviders.tsx";
import { createTestBed } from "../support/testbed.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { goToIdentityProviders } from "../utils/sidebar.ts";
import { clickTableRowItem } from "../utils/table.ts";
import { clickSaveButton, createSPIFFEProvider } from "./main.ts";

test.describe("SPIFFE identity provider test", () => {
  test("should create a SPIFFE provider", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toIdentityProviders({ realm: testBed.realm }) });
    await createSPIFFEProvider(
      page,
      "spiffe",
      "spiffe://mytrust2",
      "https://mytrust",
    );

    await assertNotificationMessage(
      page,
      "Identity provider successfully created",
    );

    await goToIdentityProviders(page);
    await clickTableRowItem(page, "Spiffe");

    await page.getByTestId("config.issuer").fill("spiffe://mytrust2");
    await page.getByTestId("config.bundleEndpoint").fill("https://mytrust2");

    await clickSaveButton(page);

    await assertNotificationMessage(page, "Provider successfully updated");
  });
});
