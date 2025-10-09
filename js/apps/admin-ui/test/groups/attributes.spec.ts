import { test } from "@playwright/test";
import { toGroups } from "../../src/groups/routes/Groups.tsx";
import { createTestBed } from "../support/testbed.ts";
import {
  assertAttributeLength,
  clickAttributeSaveButton,
  deleteAttribute,
  fillAttributeData,
  goToAttributesTab,
} from "../utils/attributes.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { clickTableRowItem } from "../utils/table.ts";

test.describe("Attributes", () => {
  test("adds and removes an attribute", async ({ page }) => {
    await using testBed = await createTestBed({
      groups: [{ name: "test-group" }],
    });

    await login(page, { to: toGroups({ realm: testBed.realm }) });
    await clickTableRowItem(page, "test-group");
    await goToAttributesTab(page);

    // add attribute
    await fillAttributeData(page, "key", "value");
    await clickAttributeSaveButton(page);
    await assertNotificationMessage(page, "Group updated");
    await assertAttributeLength(page, 1);

    // remove attribute
    await deleteAttribute(page, 0);
    await clickAttributeSaveButton(page);
    await assertNotificationMessage(page, "Group updated");
    await assertAttributeLength(page, 0);
  });
});
