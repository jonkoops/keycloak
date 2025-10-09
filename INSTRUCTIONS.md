Actually, let's be a bit more strategic. I want to to make sure all tests in js/apps/admin-ui/test/autentication are converted to the new practices. Again, no shared global calls to createTestBed(), each test should have its own call. Also, make sure the names of the tests are conventional (no 'should', or 'test'), write them as if you use a verb:

E.g.

test.describe("Groups overview", () => {
test("removes an item from the list")
})

Also instead of using breadcrumbs to navigate, try to maybe put some of the logic from the login function into a re-usable utility to navigate to certain pages.