import { test } from "@playwright/test";
import { v4 as uuid } from "uuid";
import { toIdentityProviders } from "../../src/identity-providers/routes/IdentityProviders.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { switchOn } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { goToIdentityProviders } from "../utils/sidebar.ts";
import { clickTableRowItem } from "../utils/table.ts";
import {
  addMapper,
  assertAuthorizationUrl,
  assertInvalidUrlNotification,
  assertJwksUrlExists,
  assertOnMappingPage,
  assertPkceMethodExists,
  clickCancelMapper,
  clickRevertButton,
  clickSaveButton,
  clickSaveMapper,
  createOIDCProvider,
  goToMappersTab,
  setUrl,
} from "./main.ts";

test.describe("OIDC identity provider test", () => {
  test("should create an OIDC provider using discovery url", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    const oidcProviderName = "oidc";
    const secret = "123";

    await login(page, { to: toIdentityProviders({ realm: testBed.realm }) });
    await createOIDCProvider(page, oidcProviderName, secret);
    await assertNotificationMessage(
      page,
      "Identity provider successfully created",
    );
    await assertAuthorizationUrl(page);

    await setUrl(page, "authorization", "invalid");
    await clickSaveButton(page);
    await assertInvalidUrlNotification(page, "authorization");
    await clickRevertButton(page);

    await setUrl(page, "token", "invalid");
    await clickSaveButton(page);
    await assertInvalidUrlNotification(page, "token");
    await clickRevertButton(page);

    await setUrl(page, "tokenIntrospection", "invalid");
    await clickSaveButton(page);
    await assertInvalidUrlNotification(page, "tokenIntrospection");
    await clickRevertButton(page);

    await assertJwksUrlExists(page);
    await page.getByText("Use JWKS URL").click();
    await assertJwksUrlExists(page, false);

    await assertPkceMethodExists(page, false);
    await switchOn(page, "#config\\.pkceEnabled");
    await assertPkceMethodExists(page);

    await clickSaveButton(page);
    await assertNotificationMessage(page, "Provider successfully updated");
  });
});

test.describe("Edit OIDC Provider", () => {
  const oidcProviderName = "OpenID Connect v1.0";

  test("should add OIDC mapper of type Attribute Importer", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    const alias = `edit-oidc-${uuid()}`;

    await adminClient.createIdentityProvider(
      oidcProviderName,
      alias,
      testBed.realm,
    );
    await login(page, { to: toIdentityProviders({ realm: testBed.realm }) });
    await clickTableRowItem(page, oidcProviderName);

    await goToMappersTab(page);
    await addMapper(page, "oidc-user-attribute", "OIDC Attribute Importer");
    await clickSaveMapper(page);
    await assertNotificationMessage(page, "Mapper created successfully.");
  });

  test("should add OIDC mapper of type Claim To Role", async ({ page }) => {
    await using testBed = await createTestBed();
    const alias = `edit-oidc-${uuid()}`;

    await adminClient.createIdentityProvider(
      oidcProviderName,
      alias,
      testBed.realm,
    );
    await login(page, { to: toIdentityProviders({ realm: testBed.realm }) });
    await clickTableRowItem(page, oidcProviderName);

    await goToMappersTab(page);
    await addMapper(page, "oidc-role", "OIDC Claim to Role");
    await clickSaveMapper(page);
    await assertNotificationMessage(page, "Mapper created successfully.");
  });

  test("should cancel the addition of the OIDC mapper", async ({ page }) => {
    await using testBed = await createTestBed();
    const alias = `edit-oidc-${uuid()}`;

    await adminClient.createIdentityProvider(
      oidcProviderName,
      alias,
      testBed.realm,
    );
    await login(page, { to: toIdentityProviders({ realm: testBed.realm }) });
    await clickTableRowItem(page, oidcProviderName);

    await goToMappersTab(page);
    await addMapper(page, "oidc-role", "OIDC Claim to Role");
    await clickCancelMapper(page);
    await assertOnMappingPage(page);
  });
});
