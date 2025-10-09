import { test } from "@playwright/test";
import { toIdentityProviders } from "../../src/identity-providers/routes/IdentityProviders.tsx";
import { createTestBed } from "../support/testbed.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { goToIdentityProviders } from "../utils/sidebar.ts";
import { clickTableRowItem } from "../utils/table.ts";
import { clickSaveButton, createKubernetesProvider } from "./main.ts";

test.describe("Kubernetes identity provider test", () => {
  test("should create a Kubernetes provider", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toIdentityProviders({ realm: testBed.realm }) });
    await createKubernetesProvider(
      page,
      "kubernetes",
      "https://kubernetes.myorg.com/openid/v1/jwks",
    );

    await assertNotificationMessage(
      page,
      "Identity provider successfully created",
    );

    await goToIdentityProviders(page);
    await clickTableRowItem(page, "kubernetes");

    await page
      .getByTestId("config.jwksUrl")
      .fill("https://kubernetes.myorg2.com/openid/v1/jwks");

    await clickSaveButton(page);

    await assertNotificationMessage(page, "Provider successfully updated");
  });
});
