import { expect, test } from "@playwright/test";
import { toRealmRoles } from "../../src/realm-roles/routes/RealmRoles.tsx";
import { fillRoleData } from "../clients/role.ts";
import adminClient from "../utils/AdminClient.ts";
import {
  assertAttribute,
  assertAttributeLength,
  clickAttributeSaveButton,
  deleteAttribute,
  fillAttributeData,
  goToAttributesTab,
} from "../utils/attributes.ts";
import { assertRequiredFieldError, clickSaveButton } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { confirmModal } from "../utils/modal.ts";
import {
  pickRoleType,
  clickUnassign,
  confirmModalAssign,
  pickRole,
} from "../utils/roles.ts";
import {
  assertEmptyTable,
  assertNoResults,
  assertRowExists,
  clickRowKebabItem,
  clickTableRowItem,
  searchItem,
} from "../utils/table.ts";
import { createTestBed } from "../support/testbed.ts";
import {
  assertUnassignDisabled,
  clickCreateRoleButton,
  goToAssociatedRolesTab,
} from "./main.ts";

test.describe("Realm roles", () => {
  const searchPlaceHolder = "Search role by name";

  test("fails to create realm role with empty name", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    await clickCreateRoleButton(page);
    await clickSaveButton(page);
    await assertRequiredFieldError(page, "name");

    await fillRoleData(page, "admin");
    await clickSaveButton(page);
    await page
      .getByLabel("Breadcrumb")
      .getByRole("link", { name: "Realm roles" })
      .click();

    await clickCreateRoleButton(page);
    await fillRoleData(page, "admin");
    await clickSaveButton(page);
    await assertNotificationMessage(
      page,
      "Could not create role: Role with name admin already exists",
    );
  });

  test("doesn't create a realm role with only whitespace name", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    await clickCreateRoleButton(page);
    await fillRoleData(page, " ");
    await assertRequiredFieldError(page, "name");
  });

  test("creates and deletes a realm role", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const itemId = "test-role";

    await assertRowExists(page, itemId, false);
    await clickCreateRoleButton(page);
    await fillRoleData(page, itemId);
    await clickSaveButton(page);
    await assertNotificationMessage(page, "Role created");
    await page
      .getByLabel("Breadcrumb")
      .getByRole("link", { name: "Realm roles" })
      .click();

    await searchItem(page, searchPlaceHolder, itemId);
    await clickRowKebabItem(page, itemId, "Delete");
    await confirmModal(page);
    await assertNotificationMessage(page, "The role has been deleted");

    await assertRowExists(page, itemId, false);
  });

  test("deletes role from details action", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const itemId = "test-role-delete";

    await clickCreateRoleButton(page);
    await fillRoleData(page, itemId);
    await clickSaveButton(page);
    await assertNotificationMessage(page, "Role created");
    await page
      .getByLabel("Breadcrumb")
      .getByRole("link", { name: "Realm roles" })
      .click();
    await clickRowKebabItem(page, itemId, "Delete");
    await confirmModal(page);
    await assertNotificationMessage(page, "The role has been deleted");
  });

  test("cannot delete default role", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const defaultRole = `default-roles-${testBed.realm}`;
    await searchItem(page, searchPlaceHolder, defaultRole);
    await clickRowKebabItem(page, defaultRole, "Delete");
    await assertNotificationMessage(page, "You cannot delete a default role.");
  });

  test("adds associated roles", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const itemId = "test-role-associated";

    await assertRowExists(page, itemId, false);
    await clickCreateRoleButton(page);
    await fillRoleData(page, itemId);
    await clickSaveButton(page);
    await assertNotificationMessage(page, "Role created");
    await goToAssociatedRolesTab(page);

    // Add associated realm role from search bar
    await pickRoleType(page, "roles");
    await pickRole(page, "offline_access", true);
    await confirmModalAssign(page);
    await assertNotificationMessage(page, "Associated roles have been added");

    // Add associated client role from search bar
    await pickRoleType(page, "client");
    await pickRole(page, "manage-account", true);
    await confirmModalAssign(page);
    await assertNotificationMessage(page, "Associated roles have been added");

    // Add associated client role
    await pickRoleType(page, "client");
    await pickRole(page, "manage-consent", true);
    await confirmModalAssign(page);
    await assertNotificationMessage(page, "Associated roles have been added");
  });

  test("searches existing associated role by name and navigates to it", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const realmRole = "offline_access";
    await searchItem(page, searchPlaceHolder, "offline_access");
    await assertRowExists(page, realmRole);
    await clickTableRowItem(page, realmRole);
    await expect(
      page.getByTestId("view-header").locator("text=" + realmRole),
    ).toBeVisible();
    await page.click("text=Cancel");
  });

  test("navigates to default role and checks assign roles table", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const defaultRole = `default-roles-${testBed.realm}`;
    await clickTableRowItem(page, defaultRole);

    await page.click("text=Default groups");
    await assertEmptyTable(page);

    await page.click("text=Default roles");
    await expect(page.getByTestId("assigned-roles")).toBeVisible();
  });

  test("searches for non-existent associated role", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const itemName = "non-existent-associated-role";
    await searchItem(page, searchPlaceHolder, itemName);
    await assertNoResults(page);
  });

  test("hides inherited roles", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const itemId = "test-role-inherited";
    await adminClient.createRealmRole({ name: itemId, realm: testBed.realm });

    await searchItem(page, searchPlaceHolder, itemId);
    await clickTableRowItem(page, itemId);
    await goToAssociatedRolesTab(page);
    await page.getByTestId("show-inherited-roles-empty-action").click();
  });

  test("fails to remove role when all unchecked", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const itemId = "test-role-unassign-fail";
    await adminClient.createRealmRole({ name: itemId, realm: testBed.realm });

    await searchItem(page, searchPlaceHolder, itemId);
    await clickTableRowItem(page, itemId);
    await goToAssociatedRolesTab(page);

    await pickRoleType(page, "client");
    await pickRole(page, "view-profile", true);
    await confirmModalAssign(page);

    await assertUnassignDisabled(page);
  });

  test("deletes single non-inherited role item", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const itemId = "test-role-delete-single";
    await adminClient.createRealmRole({ name: itemId, realm: testBed.realm });

    await searchItem(page, searchPlaceHolder, itemId);
    await clickTableRowItem(page, itemId);
    await goToAssociatedRolesTab(page);

    await pickRoleType(page, "client");
    await pickRole(page, "view-profile", true);
    await confirmModalAssign(page);

    await clickRowKebabItem(page, "account view-profile", "Unassign");
    await confirmModal(page);
    await assertNotificationMessage(page, "Role mapping updated");
  });

  test("deletes all roles from search bar", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

    const itemId = "test-role-delete-all";
    await adminClient.createRealmRole({ name: itemId, realm: testBed.realm });

    await searchItem(page, searchPlaceHolder, itemId);
    await clickTableRowItem(page, itemId);
    await goToAssociatedRolesTab(page);

    await pickRoleType(page, "client");
    await pickRole(page, "view-profile", true);
    await confirmModalAssign(page);

    await page.locator('input[name="check-all"]').check();
    await clickUnassign(page);
    await confirmModal(page);
    await assertNotificationMessage(page, "Role mapping updated");
  });

  test.describe("edit role details", () => {
    const editRoleName = "role-to-edit";
    const description = "some description";
    const updateDescription = "updated description";

    test("edits realm role details", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

      await adminClient.createRealmRole({
        realm: testBed.realm,
        name: editRoleName,
        description,
      });

      await searchItem(page, searchPlaceHolder, editRoleName);
      await clickTableRowItem(page, editRoleName);
      await expect(page.locator("input[name='name']")).toBeDisabled();
      await expect(page.locator("textarea[name='description']")).toHaveValue(
        description,
      );
      await page.fill("textarea[name='description']", updateDescription);
      await clickSaveButton(page);
      await assertNotificationMessage(page, "The role has been saved");
      await expect(page.locator("textarea[name='description']")).toHaveValue(
        updateDescription,
      );
    });

    test("adds single attribute", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

      await adminClient.createRealmRole({
        realm: testBed.realm,
        name: editRoleName,
        description,
      });

      await searchItem(page, searchPlaceHolder, editRoleName);
      await clickTableRowItem(page, editRoleName);

      await goToAttributesTab(page);
      await fillAttributeData(page, "one", "1");
      await clickAttributeSaveButton(page);
      await assertNotificationMessage(page, "The role has been saved");
      await assertAttributeLength(page, 1);
    });

    test("adds multiple attributes", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

      await adminClient.createRealmRole({
        realm: testBed.realm,
        name: editRoleName,
        description,
      });

      await searchItem(page, searchPlaceHolder, editRoleName);
      await clickTableRowItem(page, editRoleName);

      await goToAttributesTab(page);
      await fillAttributeData(page, "one", "1");
      await fillAttributeData(page, "two", "2", undefined, 1);
      await fillAttributeData(page, "three", "3", undefined, 2);

      await clickAttributeSaveButton(page);
      await assertNotificationMessage(page, "The role has been saved");
      await assertAttributeLength(page, 3);
      await assertAttribute(page, "one", "1");
      await assertAttribute(page, "two", "2", 1);
    });

    test("deletes attribute", async ({ page }) => {
      await using testBed = await createTestBed();
      await login(page, { to: toRealmRoles({ realm: testBed.realm }) });

      await adminClient.createRealmRole({
        realm: testBed.realm,
        name: editRoleName,
        description,
      });

      await searchItem(page, searchPlaceHolder, editRoleName);
      await clickTableRowItem(page, editRoleName);
      await goToAttributesTab(page);
      await fillAttributeData(page, "one", "1");
      await fillAttributeData(page, "two", "2", undefined, 1);
      await clickAttributeSaveButton(page);

      await deleteAttribute(page, 1);
      await clickAttributeSaveButton(page);

      await assertNotificationMessage(page, "The role has been saved");
      await assertAttributeLength(page, 1);
    });
  });
});
