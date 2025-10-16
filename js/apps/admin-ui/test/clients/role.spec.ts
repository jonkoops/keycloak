import { test } from "@playwright/test";
import { toClient } from "../../src/clients/routes/Client.tsx";
import adminClient from "../utils/AdminClient.ts";
import { createTestBed } from "../support/testbed.ts";
import {
  assertAttributeLength,
  clickAttributeSaveButton,
  deleteAttribute,
  fillAttributeData,
  goToAttributesTab,
} from "../utils/attributes.ts";
import { assertRequiredFieldError, clickSaveButton } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import {
  assertNotificationMessage,
  selectActionToggleItem,
} from "../utils/masthead.ts";
import { assertModalTitle, confirmModal } from "../utils/modal.ts";
import { clickUnassign } from "../utils/roles.ts";
import {
  assertNoResults,
  assertRowExists,
  clearAllFilters,
  clickRowKebabItem,
  clickSelectRow,
  clickTableRowItem,
  searchItem,
} from "../utils/table.ts";
import {
  addAssociatedRoles,
  assertDescriptionValue,
  fillRoleData,
  goToAssociatedRolesTab,
  goToCreateRole,
  goToCreateRoleFromEmptyState,
  goToRolesTab,
} from "./role.ts";

test.describe("Roles tab test", () => {
  const placeHolder = "Search role by name";

  test("fails to create client role with empty name", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "roles" }),
    });

    await goToCreateRoleFromEmptyState(page);
    await fillRoleData(page, "");
    await clickSaveButton(page);
    await assertRequiredFieldError(page, "name");
  });

  test("creates client role", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "roles" }),
    });

    await goToCreateRoleFromEmptyState(page);
    await fillRoleData(page, "new-role");
    await clickSaveButton(page);
    await assertNotificationMessage(page, "Role created");
  });

  test("updates client role description", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientRole(clientId!, {
      name: "updatable-role",
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "roles" }),
    });

    const updateDescription = "updated description";
    await clickTableRowItem(page, "updatable-role");
    await fillRoleData(page, "updatable-role", updateDescription);
    await clickSaveButton(page);
    await assertNotificationMessage(page, "The role has been saved");
    await assertDescriptionValue(page, updateDescription);
  });

  test("adds and deletes attribute to client role", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientRole(clientId!, {
      name: "role-with-attributes",
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "roles" }),
    });

    await clickTableRowItem(page, "role-with-attributes");
    await goToAttributesTab(page);

    // Add attribute
    await fillAttributeData(page, "crud_attribute_key", "crud_attribute_value");
    await clickAttributeSaveButton(page);
    await assertAttributeLength(page, 1);
    await assertNotificationMessage(page, "The role has been saved");

    // Delete attribute
    await deleteAttribute(page, 0);
    await clickAttributeSaveButton(page);
    await assertNotificationMessage(page, "The role has been saved");
    await assertAttributeLength(page, 0);
  });

  test("fails to create duplicate client role", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientRole(clientId!, {
      name: "existing-role",
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "roles" }),
    });

    await goToCreateRole(page);
    await fillRoleData(page, "existing-role");
    await clickSaveButton(page);
    await assertNotificationMessage(
      page,
      `Could not create role: Role with name existing-role already exists`,
    );
  });

  test("searches existing and non-existing client role", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientRole(clientId!, {
      name: "searchable-role",
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "roles" }),
    });

    // Search non-existing
    await searchItem(page, placeHolder, "role_DNE");
    await assertNoResults(page);

    // Search existing
    await clearAllFilters(page);
    await searchItem(page, placeHolder, "searchable-role");
    await assertRowExists(page, "searchable-role");

    // Empty search
    await searchItem(page, placeHolder, "");
    await assertRowExists(page, "searchable-role");
  });

  test("handles associated realm roles", async ({ page }) => {
    await using testBed = await createTestBed();
    await adminClient.createRealmRole({
      name: "test-realm-role",
      realm: testBed.realm,
    });
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientRole(clientId!, {
      name: "role-for-association",
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "roles" }),
    });

    await clickTableRowItem(page, "role-for-association");
    await goToAssociatedRolesTab(page);

    // Add associated realm role
    await addAssociatedRoles(page, "test-realm-role");
    await assertNotificationMessage(page, "Associated roles have been added");

    // Remove associated roles
    await clickSelectRow(page, "Role list", "test-realm-role");
    await clickUnassign(page);
    await confirmModal(page);
    await assertNotificationMessage(page, "Role mapping updated");
  });

  test("handles associated client roles", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientRole(clientId!, {
      name: "role-for-client-association",
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "roles" }),
    });

    await clickTableRowItem(page, "role-for-client-association");
    await goToAssociatedRolesTab(page);

    // Add associated client roles
    await addAssociatedRoles(page, "manage-account", "client");
    await assertNotificationMessage(page, "Associated roles have been added");
  });

  test("deletes client role", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientRole(clientId!, {
      name: "role-to-delete",
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "roles" }),
    });

    await clickRowKebabItem(page, "role-to-delete", "Delete");
    await assertModalTitle(page, "Delete role?");
    await confirmModal(page);
  });

  test.skip("deletes client role from role details test", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientRole(clientId!, {
      name: "role-to-delete-from-details",
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({ realm: testBed.realm, clientId: clientId!, tab: "roles" }),
    });

    await clickTableRowItem(page, "role-to-delete-from-details");

    await selectActionToggleItem(page, "Delete this role");
    await confirmModal(page);
    await assertNotificationMessage(page, "The role has been deleted");
  });
});
