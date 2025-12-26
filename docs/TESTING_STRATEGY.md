1.  Unit Tests
    What they do: Test a single function or class in complete isolation.
    Goal: Prove that the logic inside a specific function is correct.

- Location: **test**/services/, **test**/lib/
- Example: notification.service.test.ts
- The Flow:
  1.  Mock Dependencies: Fake the API client and LocalStorage so the test doesn't actually hit the network or save files.
  2.  Call Function: Run a specific function like syncFcmToken("web").
  3.  Assert Output: Check if it returned true or false.
  4.  Assert Behavior: Verify if the API client would have been called with the right arguments.

> Analogy: Checking if a single Lego brick is the right color and shape before trying to build anything with it.

---

2. Component Tests
   What they do: Test how a specific UI component renders and behaves.
   Goal: Ensure the user sees the correct interface based on the data.

- Location: **test**/components/
- Example: HomeNotificationBanner.test.tsx
- The Flow:
  1.  Mock Hooks: Fake the data coming from useAuth or useNotifications (e.g., pretend we have 2 unread messages).
  2.  Render: Draw the component in a virtual DOM (using @testing-library/react).
  3.  Query & Assert: Ask "Is the 'System Update' text visible?" or "Is the 'Welcome' message hidden?".

> Analogy: Checking if a specific dashboard gauge lights up correctly when you manually send it a "high speed" signal.

---

3. Integration Tests
   What they do: Test how multiple units (services, storage, logic) work together to complete a specific task or lifecycle.
   Goal: Catch bugs that happen between the parts, like data getting lost when moving from a service to LocalStorage.

- Location: **test**/integration/
- Example: fcm.integration.test.ts
- The Flow:
  1.  Scenario Setup: Simulate a user lifecycle (e.g., "User A logs in, then logs out, then User B logs in").
  2.  Execute Sequence: Call multiple service functions in order.
  3.  Verify State: Check if the final state (LocalStorage, API calls) is correct after the entire sequence.
  - Note: In your project, these still mock the backend API, but they use the real service logic and real LocalStorage.

> Analogy: Connecting the engine to the transmission and checking if the wheels turn when you press the gas pedal (still in the garage,
> not on the road).

---

4. End-to-End (E2E) Tests
   What they do: Test the fully running application in a real browser (using Playwright).
   Goal: Simulate a real user clicking through the app to ensure critical flows work from start to finish.

- Location: e2e/
- Example: auth.spec.ts
- The Flow:
  1.  Navigate: The test robot opens Chrome and goes to http://localhost:3000/login.
  2.  Interact: It types "test@example.com" into the actual input box and clicks the real "Login" button.
  3.  Assert: It waits for the URL to change to /dashboard or checks if an error message appears on the screen.

> Analogy: A test driver taking the finished car out onto the actual highway to see if it drives.

Summary Table

┌─────────────┬─────────────────────┬────────────────────┬────────────────────┬───────────┐
│ Test Type │ Scope │ Real parts │ Mocked parts │ Speed │
├─────────────┼─────────────────────┼────────────────────┼────────────────────┼───────────┤
│ Unit │ Smallest (Function) │ Logic │ API, Storage, DOM │ Fast ⚡ │
│ Component │ UI (Visual) │ Component │ Data, API, Context │ Fast ⚡ │
│ Integration │ Module (Workflow) │ Services + Storage │ Network / Backend │ Medium 🐢 │
│ E2E │ Full App │ Everything │ Nothing (usually) │ Slow 🐌 │
└─────────────┴─────────────────────┴────────────────────┴────────────────────┴───────────┘
