import { expect, test } from "@playwright/test";
import { toClient } from "../../src/clients/routes/Client.tsx";
import { selectChangeType } from "../client-scope/main.ts";
import adminClient from "../utils/AdminClient.ts";
import { createTestBed } from "../support/testbed.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { assertModalTitle, confirmModal } from "../utils/modal.ts";
import {
  assertEmptyTable,
  assertRowExists,
  assertTableRowsLength,
  clickNextPageButton,
  clickRowKebabItem,
  clickSelectRow,
  clickTableToolbarItem,
  getTableData,
  searchItem,
} from "../utils/table.ts";
import {
  assertHasAccessTokenGenerated,
  assertHasIdTokenGenerated,
  assertHasUserInfoGenerated,
  assertNoAccessTokenGenerated,
  assertNoIdTokenGenerated,
  assertNoUserInfoGenerated,
  assertTableCellDropdownValue,
  clickAddClientScope,
  clickAddScope,
  goToClientScopeEvaluateTab,
  goToClientScopesTab,
  goToGenerateAccessTokenTab,
  selectUser,
} from "./scope.ts";

type ClientScope = {
  name: string;
  description: string;
  protocol: string;
  attributes: {
    "include.in.token.scope": string;
    "display.on.consent.screen": string;
    "gui.order": string;
    "consent.screen.text": string;
  };
};

test.describe("Client details - Client scopes subtab", () => {
  const msgScopeMappingRemoved = "Scope mapping successfully removed";
  const placeHolder = "Search by name";
  const tableName = "Client scopes";

  const clientScope: ClientScope = {
    name: "",
    description: "",
    protocol: "openid-connect",
    attributes: {
      "include.in.token.scope": "true",
      "display.on.consent.screen": "true",
      "gui.order": "1",
      "consent.screen.text": "",
    },
  };

  test("lists client scopes", async ({ page }) => {
    await using testBed = await createTestBed();
    const testClientId = "test-client";
    const { id } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: testClientId,
      protocol: "openid-connect",
      publicClient: false,
    });
    // Create and add client scopes
    for (let i = 0; i < 5; i++) {
      const scopeName = `client-scope-${i}`;
      await adminClient.createClientScope({
        ...clientScope,
        name: scopeName,
        realm: testBed.realm,
      });
      await adminClient.addDefaultClientScopeInClient(
        scopeName,
        testClientId,
        testBed.realm,
      );
    }

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: id!,
        tab: "clientScopes",
      }),
    });

    const rows = await getTableData(page, tableName);
    expect(rows.length).toBeGreaterThan(2);
    await assertRowExists(page, "client-scope-0");
  });

  test("searches existing client scope by name", async ({ page }) => {
    await using testBed = await createTestBed();
    const testClientId = "test-client";
    const { id } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: testClientId,
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientScope({
      ...clientScope,
      name: "searchable-scope",
      realm: testBed.realm,
    });
    await adminClient.addDefaultClientScopeInClient(
      "searchable-scope",
      testClientId,
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: id!,
        tab: "clientScopes",
      }),
    });

    await searchItem(page, placeHolder, "searchable-scope");
    await assertRowExists(page, "searchable-scope");
    await assertTableRowsLength(page, tableName, 1);
  });

  test("searches non-existent client scope by name", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: "test-client",
      protocol: "openid-connect",
      publicClient: false,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "clientScopes",
      }),
    });

    await searchItem(page, placeHolder, "non-existent-item");
    await assertEmptyTable(page);
  });

  test("adds client scope with optional assigned type", async ({ page }) => {
    await using testBed = await createTestBed();
    const testClientId = "test-client";
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: testClientId,
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientScope({
      ...clientScope,
      name: "optional-scope",
      realm: testBed.realm,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "clientScopes",
      }),
    });

    await clickAddClientScope(page);
    await assertModalTitle(page, `Add client scopes to ${testClientId}`);
    await clickSelectRow(page, "Choose a mapper type", "optional-scope");
    await clickAddScope(page, "Optional");
    await assertNotificationMessage(page, "Scope mapping updated");
    await searchItem(page, placeHolder, "optional-scope");
    await assertTableRowsLength(page, tableName, 1);
    await assertRowExists(page, "optional-scope");
    await assertTableCellDropdownValue(page, "Optional");
  });

  test("changes item AssignedType to default from search bar", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    const testClientId = "test-client";
    const { id } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: testClientId,
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientScope({
      ...clientScope,
      name: "changeable-scope",
      realm: testBed.realm,
    });
    await adminClient.addDefaultClientScopeInClient(
      "changeable-scope",
      testClientId,
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: id!,
        tab: "clientScopes",
      }),
    });

    await searchItem(page, placeHolder, "changeable-scope");
    await assertTableRowsLength(page, tableName, 1);
    await clickSelectRow(page, tableName, "changeable-scope");
    await selectChangeType(page, "Default");
    await assertNotificationMessage(page, "Scope mapping updated");
    await searchItem(page, placeHolder, "changeable-scope");
    await assertTableRowsLength(page, tableName, 1);
    await assertTableCellDropdownValue(page, "Default");
    await assertRowExists(page, "changeable-scope");
  });

  test("shows items on next page are more than 11", async ({ page }) => {
    await using testBed = await createTestBed();
    const testClientId = "test-client";
    const { id } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: testClientId,
      protocol: "openid-connect",
      publicClient: false,
    });
    // Create enough scopes to trigger pagination
    for (let i = 0; i < 15; i++) {
      await adminClient.createClientScope({
        ...clientScope,
        name: `pagination-scope-${i}`,
        realm: testBed.realm,
      });
      await adminClient.addDefaultClientScopeInClient(
        `pagination-scope-${i}`,
        testClientId,
        testBed.realm,
      );
    }

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: id!,
        tab: "clientScopes",
      }),
    });

    await clickNextPageButton(page);
    const rows = await getTableData(page, tableName);
    expect(rows.length).toBeGreaterThan(1);
  });

  test("removes client scope", async ({ page }) => {
    await using testBed = await createTestBed();
    const testClientId = "test-client";
    const { id } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: testClientId,
      protocol: "openid-connect",
      publicClient: false,
    });
    await adminClient.createClientScope({
      ...clientScope,
      name: "removable-scope",
      realm: testBed.realm,
    });
    await adminClient.addDefaultClientScopeInClient(
      "removable-scope",
      testClientId,
      testBed.realm,
    );

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: id!,
        tab: "clientScopes",
      }),
    });

    await searchItem(page, placeHolder, "removable-scope");
    await clickRowKebabItem(page, "removable-scope", "Remove");
    await confirmModal(page);
    await assertNotificationMessage(page, msgScopeMappingRemoved);
    await searchItem(page, placeHolder, "removable-scope");
    await assertEmptyTable(page);
  });

  test("removes multiple client scopes from search bar", async ({ page }) => {
    await using testBed = await createTestBed();
    const testClientId = "test-client";
    const { id } = await adminClient.createClient({
      realm: testBed.realm,
      clientId: testClientId,
      protocol: "openid-connect",
      publicClient: false,
    });
    // Create multiple scopes
    for (let i = 1; i <= 5; i++) {
      await adminClient.createClientScope({
        ...clientScope,
        name: `multi-scope-${i}`,
        realm: testBed.realm,
      });
      await adminClient.addDefaultClientScopeInClient(
        `multi-scope-${i}`,
        testClientId,
        testBed.realm,
      );
    }

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: id!,
        tab: "clientScopes",
      }),
    });

    await searchItem(page, placeHolder, "multi-scope");
    await assertTableRowsLength(page, tableName, 5);
    await clickSelectRow(page, tableName, "multi-scope-1");
    await clickSelectRow(page, tableName, "multi-scope-2");
    await clickTableToolbarItem(page, "Remove", true);
    await assertNotificationMessage(page, msgScopeMappingRemoved);
    await searchItem(page, placeHolder, "multi-scope");
    await assertTableRowsLength(page, tableName, 3);
    await assertRowExists(page, "multi-scope-1", false);
    await assertRowExists(page, "multi-scope-2", false);
  });
});

test.describe("Client scopes evaluate subtab", () => {
  test("checks effective protocol mappers list", async ({ page }) => {
    await using testBed = await createTestBed();
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "openid-connect",
      clientId: "test-client",
      publicClient: false,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "clientScopes",
      }),
    });

    await goToClientScopeEvaluateTab(page);

    const rows = await getTableData(page, "Effective protocol mappers");
    expect(rows.length).toBeGreaterThan(1);
  });

  test("checks generated id token and user info", async ({ page }) => {
    await using testBed = await createTestBed({
      users: [
        {
          username: "test-user",
          enabled: true,
        },
      ],
    });
    const { id: clientId } = await adminClient.createClient({
      realm: testBed.realm,
      protocol: "openid-connect",
      clientId: "test-client",
      publicClient: false,
    });

    await login(page, {
      to: toClient({
        realm: testBed.realm,
        clientId: clientId!,
        tab: "clientScopes",
      }),
    });

    await goToClientScopeEvaluateTab(page);

    await assertNoAccessTokenGenerated(page);
    await assertNoIdTokenGenerated(page);
    await assertNoUserInfoGenerated(page);

    await goToGenerateAccessTokenTab(page);
    await selectUser(page, "test-user");

    await assertHasUserInfoGenerated(page, "test-user");
    await assertHasAccessTokenGenerated(page, "test-user");
    await assertHasIdTokenGenerated(page, "test-user");
  });
});
