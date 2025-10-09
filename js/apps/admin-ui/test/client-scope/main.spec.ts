import { expect, test } from "@playwright/test";
import { toClientScopes } from "../../src/client-scopes/routes/ClientScopes.tsx";
import { createTestBed } from "../support/testbed.ts";
import { assertSaveButtonIsDisabled, clickSaveButton } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { confirmModal } from "../utils/modal.ts";
import {
  assertRowExists,
  assertTableRowsLength,
  clickNextPageButton,
  clickRowKebabItem,
  clickSelectRow,
  getTableData,
  searchItem,
} from "../utils/table.ts";
import {
  assertConsentInputIsVisible,
  assertSwitchDisplayOnConsentScreenIsChecked,
  fillClientScopeData,
  getTableAssignedTypeColumn,
  getTableProtocolColumn,
  goToCreateItem,
  selectChangeType,
  selectClientScopeFilter,
  selectSecondaryFilterAssignedType,
  selectSecondaryFilterProtocol,
  switchOffDisplayOnConsentScreen,
} from "./main.ts";

const FilterAssignedType = {
  AllTypes: "All types",
  Default: "Default",
  Optional: "Optional",
  None: "None",
};

const FilterProtocol = {
  All: "All",
  SAML: "SAML",
  OpenID: "OpenID Connect",
};

test.describe("Client scope filtering", () => {
  const placeHolder = "Search for client scope";
  const tableName = "Client scopes";
  const clientScopeName = "client-scope-test";

  test("filters client scope by name", async ({ page }) => {
    const clientScopes = [];
    for (let i = 0; i < 5; i++) {
      clientScopes.push({
        name: `${clientScopeName}${i}`,
        protocol: "openid-connect",
      });
    }

    await using testBed = await createTestBed({
      clientScopes,
    });

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    const itemName = `${clientScopeName}0`;
    await searchItem(page, placeHolder, itemName);
    await assertRowExists(page, itemName);
    await assertTableRowsLength(page, tableName, 1);
  });

  test("filters items by assigned type Default", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    await selectClientScopeFilter(page, "Assigned type");
    await selectSecondaryFilterAssignedType(page, FilterAssignedType.Default);

    const assignedTypes = await getTableAssignedTypeColumn(page, tableName);

    expect(assignedTypes).toContain(FilterAssignedType.Default);
    expect(assignedTypes).not.toContain(FilterAssignedType.Optional);
    expect(assignedTypes).not.toContain(FilterAssignedType.None);
  });

  test("filters items by assigned type Optional", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    await selectClientScopeFilter(page, "Assigned type");
    await selectSecondaryFilterAssignedType(page, FilterAssignedType.Optional);

    const assignedTypes = await getTableAssignedTypeColumn(page, tableName);

    expect(assignedTypes).not.toContain(FilterAssignedType.Default);
    expect(assignedTypes).not.toContain(FilterAssignedType.None);
    expect(assignedTypes).toContain(FilterAssignedType.Optional);
  });

  test("filters items by assigned type All", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    await selectClientScopeFilter(page, "Assigned type");
    await selectSecondaryFilterAssignedType(page, FilterAssignedType.AllTypes);

    const assignedTypes = await getTableAssignedTypeColumn(page, tableName);

    expect(assignedTypes).toContain(FilterAssignedType.Default);
    expect(assignedTypes).toContain(FilterAssignedType.Optional);
    // Note: Default realm may not have client scopes with "None" type
  });

  test("filters items by protocol OpenID", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    await selectClientScopeFilter(page, "Protocol");
    await selectSecondaryFilterProtocol(page, FilterProtocol.OpenID);

    const protocols = await getTableProtocolColumn(page, tableName);

    expect(protocols).not.toContain(FilterProtocol.SAML);
    expect(protocols).toContain(FilterProtocol.OpenID);
  });

  test("filters items by protocol SAML", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    await selectClientScopeFilter(page, "Protocol");
    await selectSecondaryFilterProtocol(page, FilterProtocol.SAML);

    const protocols = await getTableProtocolColumn(page, tableName);

    expect(protocols).toContain(FilterProtocol.SAML);
    expect(protocols).not.toContain(FilterProtocol.OpenID);
  });

  test("shows items on next page", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    await clickNextPageButton(page);
    const rows = await getTableData(page, tableName);
    expect(rows.length).toBeGreaterThan(1);
  });
});

test.describe("Client scope operations", () => {
  const tableName = "Client scopes";
  const clientScopeName = "client-scope-test";

  test("modifies selected item type to Default", async ({ page }) => {
    const clientScopes = [];
    for (let i = 0; i < 5; i++) {
      clientScopes.push({
        name: `${clientScopeName}${i}`,
        protocol: "openid-connect",
      });
    }

    await using testBed = await createTestBed({
      clientScopes,
    });

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    const itemName = `${clientScopeName}0`;
    await clickSelectRow(page, tableName, itemName);
    await selectChangeType(page, FilterAssignedType.Default);
    await assertNotificationMessage(page, "Scope mapping updated");

    const rows = await getTableData(page, tableName);
    const itemRow = rows.find((r) => r.includes(itemName));
    expect(itemRow).toContain(FilterAssignedType.Default);
  });
});

test.describe("Client scope creation", () => {
  const placeHolder = "Search for client scope";

  test("fails to create client scope with existing name", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    await goToCreateItem(page);
    await assertSaveButtonIsDisabled(page);

    await fillClientScopeData(page, "address");
    await page.getByTestId("save").click();

    await assertNotificationMessage(
      page,
      "Could not create client scope: 'Client Scope address already exists'",
    );

    await fillClientScopeData(page, "");
    await expect(page.getByTestId("save")).toBeDisabled();
  });

  test("hides consent text field when display consent switch is disabled", async ({
    page,
  }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    await goToCreateItem(page);

    await assertSwitchDisplayOnConsentScreenIsChecked(page);
    await assertConsentInputIsVisible(page);

    await switchOffDisplayOnConsentScreen(page);

    await assertConsentInputIsVisible(page, true);
  });

  test("creates and deletes a client scope", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toClientScopes({ realm: testBed.realm }) });

    const itemId = "test-client-scope";
    await assertRowExists(page, itemId, false);
    await goToCreateItem(page);

    await fillClientScopeData(page, itemId);
    await clickSaveButton(page);

    await assertNotificationMessage(page, "Client scope created");

    await page
      .getByLabel("Breadcrumb")
      .getByRole("link", { name: "Client scopes" })
      .click();

    await searchItem(page, placeHolder, itemId);
    await assertRowExists(page, itemId);
    await clickRowKebabItem(page, itemId, "Delete");

    await confirmModal(page);
    await assertNotificationMessage(page, "The client scope has been deleted");
    await assertRowExists(page, itemId, false);
  });
});
