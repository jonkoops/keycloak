import { test } from "@playwright/test";
import { toGroups } from "../../src/groups/routes/Groups.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { confirmModal } from "../utils/modal.ts";
import {
  pickRoleType,
  clickHideInheritedRoles,
  clickUnassign,
  confirmModalAssign,
  pickRole,
} from "../utils/roles.ts";
import {
  assertEmptyTable,
  assertRowExists,
  clickTableRowItem,
} from "../utils/table.ts";
import { goToRoleMappingTab } from "./role.ts";

test.describe("Role mappings", () => {
  test("shows an empty table when no roles are mapped", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: [{ name: "group1" }],
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });
    await clickTableRowItem(page, "group1");
    await goToRoleMappingTab(page);

    await assertEmptyTable(page);
  });

  test("creates a role mapping", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: [{ name: "group1" }],
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });
    await clickTableRowItem(page, "group1");
    await goToRoleMappingTab(page);

    await pickRoleType(page, "roles");
    await pickRole(page, `default-roles-${testBed.realm}`, true);
    await confirmModalAssign(page);

    await assertNotificationMessage(page, "Role mapping updated");
    await assertRowExists(page, `default-roles-${testBed.realm}`);
  });

  test("hides inherited roles", async ({ page }) => {
    const roleName = 'test-role';
    await using testBed = await createTestBed({
      roles: { realm: [{ name: roleName }] },
    });

    const { id } = await adminClient.createGroup("group2", testBed.realm);
    await adminClient.addRealmRoleToGroup(id!, roleName, testBed.realm);

    await login(page, { to: toGroups({ realm: testBed.realm }) });
    await clickTableRowItem(page, "group2");
    await goToRoleMappingTab(page);

    await clickHideInheritedRoles(page);
  });

  test("removes a role mapping", async ({ page }) => {
    const roleName = 'remove-role';
    await using testBed = await createTestBed({
      roles: { realm: [{ name: roleName }] },
    });

    const { id } = await adminClient.createGroup("group2", testBed.realm);
    await adminClient.addRealmRoleToGroup(id, roleName, testBed.realm);

    await login(page, { to: toGroups({ realm: testBed.realm }) });
    await clickTableRowItem(page, "group2");
    await goToRoleMappingTab(page);

    await pickRole(page, roleName);
    await clickUnassign(page);
    await confirmModal(page);
    await assertNotificationMessage(page, "Role mapping updated");
    await assertEmptyTable(page);
  });
});
