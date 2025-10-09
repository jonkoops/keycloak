import { test } from "@playwright/test";
import { v4 as uuid } from "uuid";
import { toIdentityProviders } from "../../src/identity-providers/routes/IdentityProviders.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { goToIdentityProviders } from "../utils/sidebar.ts";
import { clickTableRowItem } from "../utils/table.ts";
import {
  addAuthConstraints,
  addMapper,
  clickCancelMapper,
  clickSaveMapper,
  createSAMLProvider,
  goToMappersTab,
} from "./main.ts";
import { editSAMLSettings } from "./saml.ts";

test.describe("SAML identity provider test", () => {
  test("should create a SAML provider using entity descriptor", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    const samlProviderName = "saml";
    const samlDisplayName = "saml";

    await login(page, { to: toIdentityProviders({ realm: testBed.realm }) });
    await createSAMLProvider(page, samlProviderName, samlDisplayName);
    await assertNotificationMessage(
      page,
      "Identity provider successfully created",
    );
  });
});

test.describe("SAML identity provider edit tests", () => {
  const samlProviderName = "SAML v2.0";
  const classRefName = "acClassRef-1";
  const declRefName = "acDeclRef-1";

  test("should add auth constraints to existing SAML provider", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    const alias = `edit-saml-${uuid()}`;
    
    await adminClient.createIdentityProvider(
      samlProviderName,
      alias,
      testBed.realm,
    );
    await login(page, { to: toIdentityProviders({ realm: testBed.realm }) });
    await clickTableRowItem(page, samlProviderName);

    await addAuthConstraints(page, classRefName, declRefName);
    await assertNotificationMessage(page, "Provider successfully updated");
  });

  const mapperTests = [
    { type: "saml-advanced-role", name: "SAML mapper" },
    {
      type: "saml-username",
      name: "SAML Username Template Importer Mapper",
    },
    {
      type: "hardcoded-user-session-attribute",
      name: "Hardcoded User Session Attribute",
    },
    { type: "saml-user-attribute", name: "Attribute Importer" },
    { type: "oidc-hardcoded-role", name: "Hardcoded Role" },
    { type: "saml-role", name: "SAML Attribute To Role" },
  ];

  for (const { type, name } of mapperTests) {
    test(`should add SAML mapper of type ${name}`, async ({ page }) => {
      await using testBed = await createTestBed();
      const alias = `edit-saml-${uuid()}`;

      await adminClient.createIdentityProvider(
        samlProviderName,
        alias,
        testBed.realm,
      );
      await login(page, { to: toIdentityProviders({ realm: testBed.realm }) });
      await clickTableRowItem(page, samlProviderName);

      await goToMappersTab(page);
      await addMapper(page, type, name);
      await clickSaveMapper(page);
      await assertNotificationMessage(page, "Mapper created successfully.");
      await clickCancelMapper(page);
    });
  }

  test("should edit SAML settings", async ({ page }) => {
    await using testBed = await createTestBed();
    const alias = `edit-saml-${uuid()}`;

    await adminClient.createIdentityProvider(
      samlProviderName,
      alias,
      testBed.realm,
    );
    await login(page, { to: toIdentityProviders({ realm: testBed.realm }) });
    await clickTableRowItem(page, samlProviderName);

    await editSAMLSettings(page, samlProviderName);
    await assertNotificationMessage(page, "Provider successfully updated");
  });
});
