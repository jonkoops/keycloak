import { expect, test } from "@playwright/test";
import { v4 as uuid } from "uuid";
import { toOrganizations } from "../../src/organizations/routes/Organizations.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { assertSaveButtonIsDisabled, clickSaveButton } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import {
  assertNotificationMessage,
  selectActionToggleItem,
} from "../utils/masthead.ts";
import { confirmModal } from "../utils/modal.ts";
import { goToOrganizations, goToRealm } from "../utils/sidebar.ts";
import {
  assertRowExists,
  clickRowKebabItem,
  clickTableRowItem,
} from "../utils/table.ts";
import {
  fillCreatePage,
  fillNameField,
  getNameField,
  goToCreate,
} from "./main.ts";

test.describe("Organization CRUD", () => {
  test("should create new organization", async ({ page }) => {
    await using testBed = await createTestBed({ organizationsEnabled: true });

    await login(page, { to: toOrganizations({ realm: testBed.realm }) });
    await goToCreate(page);
    await assertSaveButtonIsDisabled(page);
    await fillCreatePage(page, { name: "orgName" });
    await fillCreatePage(page, {
      name: "orgName",
      domain: ["ame.org", "test.nl"],
      description: "some description",
    });
    await clickSaveButton(page);
    await assertNotificationMessage(page, "Organization successfully saved.");
  });

  test("should modify existing organization", async ({ page }) => {
    await using testBed = await createTestBed({ organizationsEnabled: true });
    const orgName = `org-edit-${uuid()}`;

    await adminClient.createOrganization({
      realm: testBed.realm,
      name: orgName,
      domains: [{ name: orgName, verified: false }],
    });

    await login(page, { to: toOrganizations({ realm: testBed.realm }) });
    await clickTableRowItem(page, orgName);

    // This waits for the field to be filled before we clear and fill it with a new value
    await expect(getNameField(page)).toHaveValue(orgName);

    const newValue = "newName";
    await fillNameField(page, newValue);
    await expect(getNameField(page)).toHaveValue(newValue);
    await clickSaveButton(page);
    await assertNotificationMessage(page, "Organization successfully saved.");
    await goToOrganizations(page);
    await assertRowExists(page, newValue);
  });

  test("should delete from list", async ({ page }) => {
    await using testBed = await createTestBed({ organizationsEnabled: true });
    const delOrgName = `org-del-${uuid()}`;

    await adminClient.createOrganization({
      realm: testBed.realm,
      name: delOrgName,
      domains: [{ name: delOrgName, verified: false }],
    });

    await login(page, { to: toOrganizations({ realm: testBed.realm }) });
    await clickRowKebabItem(page, delOrgName, "Delete");
    await confirmModal(page);
    await assertNotificationMessage(
      page,
      "The organization has been deleted",
    );
  });

  test("should delete from details page", async ({ page }) => {
    await using testBed = await createTestBed({ organizationsEnabled: true });
    const delOrgName2 = `org-del-${uuid()}`;

    await adminClient.createOrganization({
      realm: testBed.realm,
      name: delOrgName2,
      domains: [{ name: delOrgName2, verified: false }],
    });

    await login(page, { to: toOrganizations({ realm: testBed.realm }) });
    await clickTableRowItem(page, delOrgName2);
    await selectActionToggleItem(page, "Delete");
    await confirmModal(page);
    await assertNotificationMessage(
      page,
      "The organization has been deleted",
    );
  });
});
