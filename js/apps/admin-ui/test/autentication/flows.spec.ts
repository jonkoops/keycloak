import { expect, test } from "@playwright/test";
import { toAuthentication } from "../../src/authentication/routes/Authentication.tsx";
import { createTestBed } from "../support/testbed.ts";
import adminClient from "../utils/AdminClient.ts";
import { assertRequiredFieldError, clickSaveButton } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import {
  assertAxeViolations,
  assertNotificationMessage,
  selectActionToggleItem,
} from "../utils/masthead.ts";
import { confirmModal } from "../utils/modal.ts";
import {
  assertEmptyTable,
  clickRowKebabItem,
  clickTableRowItem,
  getRowByCellText,
  searchItem,
} from "../utils/table.ts";
import {
  addCondition,
  addExecution,
  addPolicy,
  addSubFlow,
  assertDefaultSwitchPolicyEnabled,
  assertRowExists,
  assertSwitchPolicyChecked,
  clickDefaultSwitchPolicy,
  clickDeleteRow,
  clickSwitchPolicy,
  fillBindFlowModal,
  fillCreateForm,
  fillDuplicateFlowModal,
  goToCIBAPolicyTab,
  goToCreateItem,
  goToOTPPolicyTab,
  goToPoliciesTab,
  goToRequiredActions,
  goToWebAuthnTab,
} from "./flow.ts";

test.describe("Authentication flows", () => {
  test("searches for a flow", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    const itemId = "browser";
    await searchItem(page, "Search for flow", itemId);
    await expect(getRowByCellText(page, itemId)).toBeVisible();
    await expect(getRowByCellText(page, "clients")).toBeHidden();
  });

  test("duplicates an existing flow", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await clickRowKebabItem(page, "browser", "Duplicate");
    await fillDuplicateFlowModal(page, "Copy of browser");

    await assertNotificationMessage(page, "Flow successfully duplicated");
    await expect(page.locator('text="Copy of browser"')).toBeVisible();
  });

  test("fails to duplicate with empty flow name", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await clickRowKebabItem(page, "Direct grant", "Duplicate");
    await fillDuplicateFlowModal(page, "");

    await assertRequiredFieldError(page, "alias");
  });

  test("fails to duplicate with duplicated name", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await clickRowKebabItem(page, "Direct grant", "Duplicate");
    await fillDuplicateFlowModal(page, "browser");

    await assertNotificationMessage(
      page,
      "Could not duplicate flow: New flow alias name already exists",
    );
  });

  test.describe.serial("Flow details", () => {
    const flowName = "Copy of browser test";

    test("adds an execution", async ({ page }) => {
      await using testBed = await createTestBed();
      await adminClient.copyFlow("browser", flowName, testBed.realm);
      await login(page, { to: toAuthentication({ realm: testBed.realm }) });

      await clickTableRowItem(page, flowName);
      await addExecution(
        page,
        flowName + " forms",
        "reset-credentials-choose-user",
      );

      await assertNotificationMessage(page, "Flow successfully updated");
      await assertRowExists(page, "Choose User");
    });

    test("adds a condition", async ({ page }) => {
      await using testBed = await createTestBed();
      await adminClient.copyFlow("browser", flowName, testBed.realm);
      await login(page, { to: toAuthentication({ realm: testBed.realm }) });

      await clickTableRowItem(page, flowName);

      await addCondition(
        page,
        flowName + " Browser - Conditional 2FA",
        "conditional-user-role",
      );

      await assertNotificationMessage(page, "Flow successfully updated");
    });

    test("adds a sub-flow", async ({ page }) => {
      await using testBed = await createTestBed();
      await adminClient.copyFlow("browser", flowName, testBed.realm);
      await login(page, { to: toAuthentication({ realm: testBed.realm }) });

      await clickTableRowItem(page, flowName);

      const name = "SubFlow";
      await addSubFlow(page, flowName + " Browser - Conditional 2FA", name);

      await assertNotificationMessage(page, "Flow successfully updated");
      await assertRowExists(page, name);
    });

    test("removes an execution", async ({ page }) => {
      await using testBed = await createTestBed();
      await adminClient.copyFlow("browser", flowName, testBed.realm);
      await login(page, { to: toAuthentication({ realm: testBed.realm }) });

      await clickTableRowItem(page, flowName);

      const name = "Cookie";
      await assertRowExists(page, name);

      await clickDeleteRow(page, name);
      await confirmModal(page);
      await assertRowExists(page, "Cookie", false);
    });

    test("sets flow as default via action menu", async ({ page }) => {
      await using testBed = await createTestBed();
      await adminClient.copyFlow("browser", flowName, testBed.realm);
      await login(page, { to: toAuthentication({ realm: testBed.realm }) });

      await clickTableRowItem(page, flowName);
      await selectActionToggleItem(page, "Bind flow");

      await fillBindFlowModal(page, "Direct grant flow");
      await clickSaveButton(page);
      await assertNotificationMessage(page, "Flow successfully updated");
      await expect(page.getByText("Default")).toBeVisible();
    });

    test("drags and drops execution", async ({ page }) => {
      await using testBed = await createTestBed();
      await adminClient.copyFlow("browser", flowName, testBed.realm);
      await login(page, { to: toAuthentication({ realm: testBed.realm }) });

      await clickTableRowItem(page, flowName);
      const source = page.getByText("Identity Provider Redirector");
      const target = page.getByText("Kerberos");

      // execute mouse movement twice to trigger dragover event
      await source.hover();
      await source.hover();

      await page.mouse.down();
      await target.hover();
      await target.hover();

      await page.mouse.up();

      await assertNotificationMessage(page, "Flow successfully updated");
    });

    test("edits flow details", async ({ page }) => {
      await using testBed = await createTestBed();
      await adminClient.copyFlow("browser", flowName, testBed.realm);
      await login(page, { to: toAuthentication({ realm: testBed.realm }) });

      await clickTableRowItem(page, flowName);

      await selectActionToggleItem(page, "Edit info");

      const newName = "New flow name";
      await fillDuplicateFlowModal(page, newName, "Other description");
      await assertNotificationMessage(page, "Flow successfully updated");
      await expect(page.locator(`text="${newName}"`)).toBeVisible();
    });
  });
});

test.describe("Required actions", () => {
  test("enables delete account action", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });
    await goToRequiredActions(page);

    const action = "Delete Account";
    await clickSwitchPolicy(page, action);
    await assertNotificationMessage(
      page,
      "Updated required action successfully",
    );
    await assertSwitchPolicyChecked(page, action);
  });

  test("registers an unregistered action", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });
    await goToRequiredActions(page);

    const action = "Verify Profile";
    await assertSwitchPolicyChecked(page, action);
    await assertDefaultSwitchPolicyEnabled(page, action);
    await clickSwitchPolicy(page, action);
    await assertNotificationMessage(
      page,
      "Updated required action successfully",
    );
    await clickSwitchPolicy(page, action);
    await assertNotificationMessage(
      page,
      "Updated required action successfully",
    );
    await assertSwitchPolicyChecked(page, action);
    await assertDefaultSwitchPolicyEnabled(page, action);
  });

  test("sets action as default", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });
    await goToRequiredActions(page);

    const action = "Configure OTP";
    await clickDefaultSwitchPolicy(page, action);
    await assertNotificationMessage(
      page,
      "Updated required action successfully",
    );
    await assertSwitchPolicyChecked(page, action);
  });
});

test.describe("Password policies", () => {
  test("adds password policy", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });
    await goToPoliciesTab(page);

    await assertEmptyTable(page);
    await addPolicy(page, "Not Recently Used");
    await clickSaveButton(page);
    await assertNotificationMessage(
      page,
      "Password policies successfully updated",
    );
  });
});

test.describe("Accessibility tests for authentication", () => {
  test("passes accessibility checks on main page", async ({ page }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await assertAxeViolations(page);
  });

  test("passes accessibility checks on creating flow form", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await goToCreateItem(page);
    await assertAxeViolations(page);
    await page.getByTestId("cancel").click();
  });

  test("passes accessibility checks on creating flow with values", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    const flowName = "Test Flow";
    await goToCreateItem(page);
    await fillCreateForm(
      page,
      flowName,
      "Some nice description about what this flow does",
      "Client flow",
    );
    await assertAxeViolations(page);
  });

  test("passes accessibility checks on flow details page", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await clickTableRowItem(page, "reset credentials");
    await assertAxeViolations(page);
  });

  test("passes accessibility checks on required actions sub tab", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await goToRequiredActions(page);
    await assertAxeViolations(page);
  });

  test("passes accessibility checks on password policy sub tab", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await goToPoliciesTab(page);
    await assertAxeViolations(page);
  });

  test("passes accessibility checks on adding password policy", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await goToPoliciesTab(page);
    await addPolicy(page, "Not Recently Used");
    await assertAxeViolations(page);
  });

  test("passes accessibility checks on OTP policy sub tab", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await goToOTPPolicyTab(page);
    await assertAxeViolations(page);
  });

  test("passes accessibility checks on WebAuthn policies sub tab", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await goToWebAuthnTab(page);
    await assertAxeViolations(page);
  });

  test("passes accessibility checks on CIBA policy sub tab", async ({
    page,
  }) => {
    await using testBed = await createTestBed();
    await login(page, { to: toAuthentication({ realm: testBed.realm }) });

    await goToCIBAPolicyTab(page);
    await assertAxeViolations(page);
  });
});
