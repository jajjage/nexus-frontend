# FCM Testing Quick Reference

## Quick Test Commands

### Run All FCM Tests

```bash
pnpm test -- --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)"
```

### Run Specific Test Files

```bash
# Notification Service Tests
pnpm test -- __test__/services/notification.service.test.ts

# Auth Hook FCM Tests
pnpm test -- __test__/hooks/useAuth.fcm.test.ts

# Mount Sync Tests
pnpm test -- __test__/hooks/useSyncFcmOnMount.test.ts

# Integration Tests
pnpm test -- __test__/integration/fcm.integration.test.ts
```

### Run Specific Test Scenario

```bash
# Registration with FCM
pnpm test -- --testNamePattern="Registration with FCM"

# Logout with unlink
pnpm test -- --testNamePattern="Logout"

# Shared device scenario
pnpm test -- --testNamePattern="Shared Device"
```

### Run with Coverage Report

```bash
pnpm test -- --coverage --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)"
```

### Run in Watch Mode

```bash
pnpm test -- --watch --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)"
```

---

## Test Matrix

### Unit Tests (Service Layer)

| Test         | File                           | Scenarios                                                |
| ------------ | ------------------------------ | -------------------------------------------------------- |
| Sync Token   | `notification.service.test.ts` | First time, unchanged, changed, no token, API error, SSR |
| Unlink Token | `notification.service.test.ts` | Success, no token, API error, safety cleanup             |
| Permission   | `notification.service.test.ts` | Request, grant, deny, unsupported                        |
| Status Check | `notification.service.test.ts` | Enabled, denied, unsupported                             |

### Hook Tests (Business Logic)

| Test        | File                  | Scenarios                                     |
| ----------- | --------------------- | --------------------------------------------- |
| useLogin    | `useAuth.fcm.test.ts` | Sync, cache, redirect, error, phone, email    |
| useRegister | `useAuth.fcm.test.ts` | Sync, cache, first link, error                |
| useLogout   | `useAuth.fcm.test.ts` | Unlink, clear, redirect, error, shared device |

### Mount Tests (App Initialization)

| Test          | File                        | Scenarios                                 |
| ------------- | --------------------------- | ----------------------------------------- |
| Sync on Mount | `useSyncFcmOnMount.test.ts` | Auth state, loading, error, once, refresh |
| Token Refresh | `useSyncFcmOnMount.test.ts` | Firebase refresh, invalidation, timeout   |
| Session State | `useSyncFcmOnMount.test.ts` | Auth change, suspension, loading states   |

### Integration Tests (Complete Flows)

| Test              | File                      | Scenarios                                |
| ----------------- | ------------------------- | ---------------------------------------- |
| Registration      | `fcm.integration.test.ts` | First device-user link                   |
| Login             | `fcm.integration.test.ts` | Device link, unchanged token, skip sync  |
| App Refresh       | `fcm.integration.test.ts` | New token, cleared storage, expiration   |
| Token Refresh     | `fcm.integration.test.ts` | Firebase refresh, multiple refreshes     |
| Logout            | `fcm.integration.test.ts` | Unlink, no token, clear storage          |
| **Shared Device** | `fcm.integration.test.ts` | **Security: User A→B, different tokens** |
| Network Errors    | `fcm.integration.test.ts` | Retry, partial failures, recovery        |

---

## Expected Test Counts

```
notification.service.test.ts:
  ├── syncFcmToken (8 tests)
  ├── unlinkFcmToken (7 tests)
  ├── registerFcmToken (1 test)
  ├── requestNotificationPermission (4 tests)
  └── areNotificationsEnabled (3 tests)
  TOTAL: 23 tests

useAuth.fcm.test.ts:
  ├── useLogin (7 tests)
  ├── useRegister (3 tests)
  └── useLogout (7 tests)
  TOTAL: 17 tests

useSyncFcmOnMount.test.ts:
  ├── App initialization (6 tests)
  ├── Token refresh (3 tests)
  ├── Session state (3 tests)
  └── Error recovery (3 tests)
  TOTAL: 15 tests

fcm.integration.test.ts:
  ├── Scenario 1: Registration (1 test)
  ├── Scenario 2: Login (3 tests)
  ├── Scenario 3: App Refresh (3 tests)
  ├── Scenario 4: Token Refresh (2 tests)
  ├── Scenario 5: Logout (2 tests)
  ├── Scenario 6: Shared Device (2 tests)
  └── Scenario 7: Network Errors (3 tests)
  TOTAL: 16 tests

GRAND TOTAL: ~71 tests
```

---

## Test Checklist (Before Deployment)

### Pre-Deployment Verification

- [ ] All tests passing

  ```bash
  pnpm test -- --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)"
  ```

- [ ] Coverage above 85%

  ```bash
  pnpm test -- --coverage --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)"
  ```

- [ ] No console errors/warnings

  ```bash
  pnpm test -- --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)" 2>&1 | grep -i warn
  ```

- [ ] Specific scenarios pass

  ```bash
  # Registration
  pnpm test -- --testNamePattern="Registration with FCM"

  # Critical security test
  pnpm test -- --testNamePattern="prevent User A notifications from reaching User B"

  # Logout
  pnpm test -- --testNamePattern="should unlink FCM token on logout"
  ```

---

## Common Issues and Solutions

### Issue: Tests Timeout

```bash
# Solution: Increase timeout
pnpm test -- --testTimeout=10000 fcm.integration.test.ts
```

### Issue: Mock Not Working

```bash
# Ensure jest.mock() is called before imports
// At top of test file:
jest.mock("@/lib/api-client");
```

### Issue: localStorage Not Available

```bash
# Handled by tests - but if needed:
// Manually clear in test
beforeEach(() => {
  localStorage.clear();
});
```

### Issue: Race Conditions

```bash
# Use waitFor for async operations
await waitFor(() => expect(syncFcmToken).toHaveBeenCalled());
```

---

## Coverage Report Interpretation

```
Statements   : XX%  ✅ Target: >90%
Branches     : XX%  ✅ Target: >85%
Functions    : XX%  ✅ Target: >90%
Lines        : XX%  ✅ Target: >90%
```

If coverage is below target:

1. Run with `--verbose` flag to see which lines aren't covered
2. Add test cases for those scenarios
3. Check for unreachable code paths

---

## Debugging Failed Tests

### Enable Debug Output

```bash
pnpm test -- --verbose --testPathPattern="notification.service.test.ts"
```

### Print Test Values

```typescript
// In test
console.log("Token:", currentToken);
console.log("API called with:", apiClient.post.mock.calls);
```

### Run Single Test

```bash
pnpm test -- -t "should sync token when it's a new token"
```

### Run with Debugger

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
# Then open chrome://inspect in Chrome
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run FCM Tests
  run: pnpm test -- --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)" --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

---

## Performance Testing

### Measure Test Execution Time

```bash
pnpm test -- --testPathPattern="fcm.integration.test.ts" --verbose
```

Expected times:

- Unit tests: <1s each
- Integration tests: <2s each
- Full suite: <30s total

---

## Test Maintenance

### When to Update Tests

1. **Feature Changes**: Update corresponding test
2. **Bug Fixes**: Add regression test
3. **New Scenarios**: Add integration test
4. **Breaking Changes**: Update all affected tests

### Code Review Checklist

- [ ] Tests cover all code paths
- [ ] No console.log() in production code
- [ ] Mocks properly cleared between tests
- [ ] No hardcoded values (use constants)
- [ ] Tests are independent (order-independent)

---

## Key Test Scenarios (MUST PASS)

### 🔴 Critical Security Test

```bash
pnpm test -- -t "should prevent User A notifications from reaching User B"
```

**This test MUST pass for production deployment.**

### 🟡 Important Functionality Tests

```bash
pnpm test -- -t "should sync FCM token after successful login"
pnpm test -- -t "should unlink FCM token on logout"
pnpm test -- -t "should skip sync when token hasn't changed"
```

### 🟢 Nice-to-Have Edge Cases

```bash
pnpm test -- -t "should return true when no token exists to unlink"
pnpm test -- -t "should handle logout error gracefully"
```

---

## Resources

- Test Files: `__test__/` directory
- Documentation: `TESTING_CHECKLIST.md`
- Implementation: `src/services/notification.service.ts`
- Hooks: `src/hooks/useAuth.ts`, `src/hooks/useSyncFcmOnMount.ts`

---

## Quick Copy-Paste Commands

### Pre-deployment

```bash
# Full test suite with coverage
pnpm test -- --coverage --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)"

# Run critical security tests
pnpm test -- --testNamePattern="Shared Device|prevent User A"

# Verify all pass
pnpm test -- --testPathPattern="(notification|useAuth\.fcm|useSyncFcmOnMount|fcm\.integration)" --bail
```

### Development

```bash
# Watch mode
pnpm test -- --watch --testPathPattern="notification.service.test.ts"

# Single scenario
pnpm test -- -t "Registration with FCM"

# Verbose output
pnpm test -- --verbose fcm.integration.test.ts
```

---

## Notes

- All tests are async-aware (use waitFor, act, etc.)
- Mocks are properly scoped to prevent cross-contamination
- localStorage is mocked and cleared between tests
- Network calls are mocked (no real API calls in tests)
- Tests are environment-agnostic (work with JSDOM)
