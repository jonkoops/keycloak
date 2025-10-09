import { expect, test } from "@playwright/test";
import { toGroups } from "../../src/groups/routes/Groups.tsx";
import { createTestBed } from "../support/testbed.ts";
import { login } from "../utils/login.ts";
import {
  assertAxeViolations,
  assertNotificationMessage,
  selectActionToggleItem,
} from "../utils/masthead.ts";
import { cancelModal, confirmModal } from "../utils/modal.ts";
import {
  assertNoResults,
  assertRowExists,
  clickRowKebabItem,
  clickSelectRow,
  clickTableRowItem,
  clickTableToolbarItem,
  searchItem,
} from "../utils/table.ts";
import { createGroup, editGroup, searchGroup } from "./list.ts";
import { goToGroupDetails } from "./util.ts";

test.describe("Group creation", () => {
  test("creates a group from empty state and from search bar", async ({
    page,
  }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    const groupName = "test-group";
    await createGroup(page, groupName, "", true);
    await assertNotificationMessage(page, "Group created");
    await searchGroup(page, groupName);
    await assertRowExists(page, groupName, true);

    // create group from search bar
    const secondGroupName = "group-second";
    await createGroup(page, secondGroupName, "some sort of description", false);
    await assertNotificationMessage(page, "Group created");
    await clickTableRowItem(page, secondGroupName);
    await expect(page.getByText("some sort of description")).toBeVisible();
    await page.goBack();

    await searchGroup(page, secondGroupName);
    await assertRowExists(page, secondGroupName, true);
  });

  test("fails to create group with empty name", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    await createGroup(page, " ", "", true);
    await assertNotificationMessage(
      page,
      "Could not create group Group name is missing",
    );
  });

  test("fails to create group with duplicated name", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: [{ name: "duplicate-group" }],
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    await createGroup(page, "duplicate-group", "", false);
    await assertNotificationMessage(
      page,
      "Could not create group Top level group named 'duplicate-group' already exists.",
    );
    await cancelModal(page);
  });
});

test.describe("Group operations", () => {
  const predefinedGroups = ["level", "level1", "level2", "level3"];
  const placeholder = "Filter groups";
  const tableName = "Groups";

  test("searches for an existing group", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: predefinedGroups.map((name) => ({ name })),
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    await searchItem(page, placeholder, predefinedGroups[1]);
    await assertRowExists(page, predefinedGroups[1]);
  });

  test("searches for a non-existent group", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: predefinedGroups.map((name) => ({ name })),
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    await searchItem(page, placeholder, "not-existent-group");
    await assertNoResults(page);
  });

  test("duplicates a group from item bar", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: predefinedGroups.map((name) => ({ name })),
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    await clickRowKebabItem(page, predefinedGroups[1], "Duplicate");
    await page.getByTestId("duplicateGroup").click();
    await assertNotificationMessage(page, "Group duplicated");
    await assertRowExists(page, `Copy of ${predefinedGroups[1]}`, true);
  });

  test("deletes a group from item bar", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: predefinedGroups.map((name) => ({ name })),
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    await clickRowKebabItem(page, predefinedGroups[1], "Delete");
    await confirmModal(page);
    await assertNotificationMessage(page, "Group deleted");
    await assertRowExists(page, predefinedGroups[1], false);
  });

  test("deletes a group from search bar", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: predefinedGroups.map((name) => ({ name })),
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    await clickSelectRow(page, tableName, predefinedGroups[2]);
    await clickTableToolbarItem(page, "Delete", true);
    await confirmModal(page);
    await assertNotificationMessage(page, "Group deleted");
    await assertRowExists(page, predefinedGroups[2], false);
  });

  test("edits a group", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: predefinedGroups.map((name) => ({ name })),
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    const newGroupName = "new_group_name";
    const description = "new description";
    await clickRowKebabItem(page, predefinedGroups[3], "Edit");
    await editGroup(page, newGroupName, description);
    await assertNotificationMessage(page, "Group updated");
    await assertRowExists(page, newGroupName);
    await assertRowExists(page, predefinedGroups[3], false);
  });

  test("deletes a group from group details", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: predefinedGroups.map((name) => ({ name })),
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    await goToGroupDetails(page, predefinedGroups[2]);
    await selectActionToggleItem(page, "Delete group");
    await confirmModal(page);
    await assertNotificationMessage(page, "Group deleted");
    await assertRowExists(page, predefinedGroups[2], false);
  });

  test("has no a11y violations", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: predefinedGroups.map((name) => ({ name })),
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });

    await assertAxeViolations(page);
  });
});
