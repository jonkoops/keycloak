import { test } from "@playwright/test";
import { toRealmSettings } from "../../src/realm-settings/routes/RealmSettings.tsx";
import { createTestBed } from "../support/testbed.ts";
import { switchOn } from "../utils/form.ts";
import { login } from "../utils/login.ts";
import { assertNotificationMessage } from "../utils/masthead.ts";
import { assertModalMessage, confirmModal } from "../utils/modal.ts";
import { goToRealm, goToRealmSettings } from "../utils/sidebar.ts";
import { assertRowExists, searchItem } from "../utils/table.ts";
import {
  addSavedEventTypes,
  clickClearEvents,
  clickRemoveListener,
  clickSaveEventsConfig,
  clickSaveEventsListener,
  fillEventListener,
  goToEventsTab,
  goToRealmEventsTab,
} from "./events.ts";

test.describe("Realm settings events tab tests", () => {
  test("Enable user events", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toRealmSettings({ realm: testBed.realm, tab: "events" }) });
    await goToRealmEventsTab(page);
    await goToEventsTab(page);

    await switchOn(page, "[data-testid='eventsEnabled']");
    await clickSaveEventsConfig(page);
    await assertNotificationMessage(page, "Successfully saved configuration");

    await clickClearEvents(page);
    await assertModalMessage(
      page,
      "If you clear all events of this realm, all records will be permanently cleared in the database",
    );
    await confirmModal(page);
    await assertNotificationMessage(page, "The user events have been cleared");

    const eventTypes = ["Identity provider response", "Client info error"];
    await addSavedEventTypes(page, eventTypes);

    await assertNotificationMessage(page, "Successfully saved configuration");

    for (const event of eventTypes) {
      await searchItem(page, "Search saved event type", event);
      await assertRowExists(page, event);
    }
  });

  test("Should revert saving event listener", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toRealmSettings({ realm: testBed.realm, tab: "events" }) });
    await goToRealmEventsTab(page);
    await fillEventListener(page, "email");
    await page.getByTestId("revertEventListenerBtn").click();
  });

  test("Should save event listener", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toRealmSettings({ realm: testBed.realm, tab: "events" }) });
    await goToRealmEventsTab(page);
    await fillEventListener(page, "email");
    await clickSaveEventsListener(page);
    await assertNotificationMessage(page, "Event listener has been updated.");
  });

  test("Should remove event from event listener", async ({ page }) => {
    await using testBed = await createTestBed();

    await login(page, { to: toRealmSettings({ realm: testBed.realm, tab: "events" }) });
    await goToRealmEventsTab(page);
    await clickRemoveListener(page, "jboss-logging");
    await clickSaveEventsListener(page);
    await assertNotificationMessage(page, "Event listener has been updated.");
  });
});
