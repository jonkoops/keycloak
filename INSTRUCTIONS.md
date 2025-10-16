## Test rewrite guidelines

## Refactor test one file at a time

Do not refactor all the test files at once, refactor one file, then run the tests until they are fully functional before moving on to the next file.

## Running the tests

You can run the the tests from a specific file using the following command:

```sh
pnpm --filter @keycloak/keycloak-admin-ui test:integration -- clients/initial-access.spec.ts
```

Change `clients/initial-access.spec.ts` to whatever spec file you want to run. You must be in the `js/` directory from the project root for this command to work.

## Use `createTestBed()` for each test

Use `createTestBed()` to set up the data for each test, most tests will not need any additional data, but any realm data that needs to be set up for the test can be passed in as the first parameter, e.g.:

```ts
await using testBed = await createTestBed({
  groups: [{ name: "test-group" }],
});
```

There should be no shared global calls (e.g. in `beforeAll()`) to set up `createTestBed()`, each test must do so individually. If a lot of data is shared between tests.

If needed, use the admin client to make REST API calls, but only do so if it is not possible to provide the data to `createTestBed()`. In fact, if you see existing tests using the admin client, and it is possible to use `createTestBed()` with some data instead, then refactor that as well.

Note that often this data will be set up using UUIDs in their name to prevent collisions in existing tests, because `createTestBed()` already isolates everything on a realm level this UUID logic can be removed, using simple names that are unique to the test case instead.

## Navigate using `login()` or `navigateTo()`

After setting up a test's data using `createTestBed()`, it is common to call `login()` to log in, and navigate to the page you want to land on:

```ts
await login(page, { to: toClients({ realm: testBed.realm }) });
```

If you ever find the need to navigate somewhere else that is not immediately obvious from the UI, and is not the initial landing page after logging in, you can call `navigateTo()` (used by `login()` under the hood):

```ts
await login(page, { to: toClient({ realm: testBed.realm, id: "my-client-id" }) });
```

## Make all tests fully parallel (no `test.describe.serial()`!)

A key benefit of `createTestBed()` is that it allows each test to operate on an isolated realm. This ensures that the tests do not run into each others data. This is by design, to allow us to make use of full parallelization. Therefore, do not use `test.describe.serial()` in the final result, under no circumstances (unless you are debugging for whatever reason during development).

## Conventional test naming

Make sure the names of the tests are conventional (no 'should', or 'test'), write them as if you use a verb:

```ts
test.describe("Groups overview", () => {
  test("removes an item from the list", () => {});
});
```

## Use adminClient when createTestBed() data isn't sufficient

When you need to create entities like clients and get their IDs for navigation, or when you need complex setup that can't be expressed through `createTestBed()`, use the `adminClient` directly in the test:

```ts
await using testBed = await createTestBed();

const { id: clientId } = await adminClient.createClient({
  clientId: "test-client",
  publicClient: true,
  realm: testBed.realm,
});

await login(page, {
  to: toClient({
    realm: testBed.realm,
    clientId: clientId!,
    tab: "advanced",
  }),
});
```

Note that navigation routes often require the internal ID (UUID), not the clientId string.

## Use existing tests as a reference

If you are ever in doubt on how to approach something, you can use existing tests that use `createTestBed()` as a reference.

## Update instructions when needed

Feel free to supplement this instructions file with findings you might deem relevant to rewriting tests, or if I provide feedback that might be generally applicable.

