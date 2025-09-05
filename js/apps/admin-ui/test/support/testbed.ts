import type RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation.js";
import adminClient from "../utils/AdminClient.ts";

export async function createTestBed(
  overrides?: RealmRepresentation,
): Promise<string> {
  const realm = crypto.randomUUID();
  await adminClient.createRealm(realm, overrides);
  return realm;
}
