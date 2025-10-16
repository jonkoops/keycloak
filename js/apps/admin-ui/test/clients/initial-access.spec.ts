import { expect, test } from "@playwright/test";
import { toClients } from "../../src/clients/routes/Clients.tsx";
import { createTestBed } from "../support/testbed.ts";
import { clickSaveButton } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { assertModalTitle, confirmModal } from "../utils/modal.ts";
import {
  assertNoResults,
  clearAllFilters,
  clickRowKebabItem,
  clickTableToolbarItem,
  getTableData,
  searchItem,
} from "../utils/table.ts";
import {
  assertClipboardContent,
  assertCountValue,
  assertExpirationGreaterThanZeroError,
  assertInitialAccessTokensIsEmpty,
  assertInitialAccessTokensIsNotEmpty,
  checkSaveButtonIsDisabled as assertSaveButtonIsDisabled,
  closeModal,
  fillNewTokenData,
  goToCreateFromEmptyList,
  goToInitialAccessTokenTab,
} from "./initial-access.ts";

test.describe("Client initial access tokens", () => {
  const tableName = "Initial access token";
  const placeHolder = "Search token";
  const countCellNumber = 3;
  const remainingCountCellNumber = 4;

  test("can't be created with 0 days and count", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, {
      to: toClients({ realm: testBed.realm, tab: "initial-access-token" }),
    });

    await assertInitialAccessTokensIsEmpty(page);
    await goToCreateFromEmptyList(page);
    await fillNewTokenData(page, 0, 0);
    await assertExpirationGreaterThanZeroError(page);
    await assertCountValue(page, 1);
    await assertSaveButtonIsDisabled(page);
  });

  test("creates and deletes initial access tokens", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName === "firefox", "Still working on it");
    await context.grantPermissions(["clipboard-write", "clipboard-read"]);

    await using testBed = await createTestBed();

    await login(page, {
      to: toClients({ realm: testBed.realm, tab: "initial-access-token" }),
    });

    await assertInitialAccessTokensIsEmpty(page);
    await goToCreateFromEmptyList(page);
    await fillNewTokenData(page, 1, 3);
    await clickSaveButton(page);

    await assertModalTitle(page, "Initial access token details");
    await assertClipboardContent(page);
    await closeModal(page);

    await assertNotificationMessage(
      page,
      "New initial access token has been created",
    );

    await assertInitialAccessTokensIsNotEmpty(page);

    await searchItem(page, placeHolder, "John Doe");
    await assertNoResults(page);
    await clearAllFilters(page);

    let data = (await getTableData(page, tableName))[0];
    expect(data[countCellNumber]).toBe("4");
    expect(data[remainingCountCellNumber]).toBe("4");

    await clickTableToolbarItem(page, "Create");
    await fillNewTokenData(page, 1, 3);
    await clickSaveButton(page);
    await assertClipboardContent(page);
    await closeModal(page);

    await clickRowKebabItem(page, data[0], "Delete");
    await assertModalTitle(page, "Delete initial access token?");
    await confirmModal(page);

    await assertNotificationMessage(
      page,
      "Initial access token deleted successfully",
    );
    await assertInitialAccessTokensIsNotEmpty(page);
    data = (await getTableData(page, tableName))[0];

    await clickRowKebabItem(page, data[0], "Delete");
    await confirmModal(page);

    await assertInitialAccessTokensIsEmpty(page);
  });
});
