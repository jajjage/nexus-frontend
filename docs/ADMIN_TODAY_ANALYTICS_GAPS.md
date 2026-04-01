# Admin Today Analytics - Gap Analysis

## Current Implementation vs Backend Specification

### 📊 Current `TodaySnapshot` Type

```typescript
export interface TodaySnapshot {
  transactions: {
    count: number; // ❌ Should be attemptedCount
    volume: number; // ✓
    profit: number; // ✓
    successful: number; // ❌ Should be successCount
    failed: number; // ❌ Should be failedCount
    pending: number; // ❌ Should be pendingCount
    // ❌ Missing: reversed, reversedCount
    // ❌ Missing: attemptedCount, attemptedVolume
  };
  newUsers: number; // ✓
  activeUsers: number; // ✓
  walletDeposits: number; // ✓
  walletWithdrawals: number; // ✓
  revenueEstimate: number; // ✓
  comparedToYesterday: {
    transactionsDelta: number; // ✓ (alias for attemptedTransactionsDelta)
    transactionsDeltaPercent: string; // ✓
    volumeDelta: number; // ✓
    volumeDeltaPercent: string; // ✓
    // ❌ Missing: attemptedTransactionsDelta
    // ❌ Missing: attemptedTransactionsDeltaPercent
    // ❌ Missing: successfulTransactionsDelta
    // ❌ Missing: successfulTransactionsDeltaPercent
    // ❌ Missing: failedTransactionsDelta
    // ❌ Missing: failedTransactionsDeltaPercent
    // ❌ Missing: pendingTransactionsDelta
    // ❌ Missing: pendingTransactionsDeltaPercent
    // ❌ Missing: reversedTransactionsDelta
    // ❌ Missing: reversedTransactionsDeltaPercent
  };
}
```

---

## Backend Specification (GET /today)

```json
{
  "success": true,
  "data": {
    "transactions": {
      "count": 150, // OLD: Use attemptedCount instead
      "attemptedCount": 158, // ✨ NEW FIELD (primary metric)
      "volume": 45000.5, // OLD: Use attemptedVolume
      "attemptedVolume": 47100.5, // ✨ NEW FIELD
      "profit": 2200.25, // ✓ Keep
      "successful": 145, // OLD: Use successCount
      "successCount": 145, // ✨ NEW FIELD (no client-side math)
      "failed": 3, // OLD: Use failedCount
      "failedCount": 3, // ✨ NEW FIELD (no client-side math)
      "pending": 2, // OLD: Use pendingCount
      "pendingCount": 2, // ✨ NEW FIELD (no client-side math)
      "reversed": 8, // ✨ NEW FIELD
      "reversedCount": 8 // ✨ NEW FIELD
    },
    "newUsers": 12, // ✓ Keep
    "activeUsers": 85, // ✓ Keep
    "walletDeposits": 65000.0, // ✓ Keep
    "walletWithdrawals": 12000.0, // ✓ Keep
    "revenueEstimate": 2200.25, // ✓ Keep
    "comparedToYesterday": {
      "transactionsDelta": 18, // ✓ Keep (alias)
      "transactionsDeltaPercent": "+12.9%", // ✓ Keep
      "attemptedTransactionsDelta": 18, // ✨ NEW FIELD
      "attemptedTransactionsDeltaPercent": "+12.9%", // ✨ NEW FIELD
      "successfulTransactionsDelta": 15, // ✨ NEW FIELD
      "successfulTransactionsDeltaPercent": "+11.1%", // ✨ NEW FIELD
      "failedTransactionsDelta": 1, // ✨ NEW FIELD
      "failedTransactionsDeltaPercent": "+50.0%", // ✨ NEW FIELD
      "pendingTransactionsDelta": -1, // ✨ NEW FIELD
      "pendingTransactionsDeltaPercent": "-33.3%", // ✨ NEW FIELD
      "reversedTransactionsDelta": 3, // ✨ NEW FIELD
      "reversedTransactionsDeltaPercent": "+60.0%", // ✨ NEW FIELD
      "volumeDelta": 5000.5, // ✓ Keep
      "volumeDeltaPercent": "+12.5%" // ✓ Keep
    }
  }
}
```

---

## 📝 Changes Needed

### 1. Update `TodaySnapshot` Type Definition

#### File: `src/types/admin/analytics.types.ts`

**Changes:**

- Add `attemptedCount` and `attemptedVolume` to transactions
- Rename/alias `successful` → `successCount`
- Rename/alias `failed` → `failedCount`
- Rename/alias `pending` → `pendingCount`
- Add `reversed` and `reversedCount`
- Expand `comparedToYesterday` with all status deltas

```typescript
export interface TodaySnapshot {
  transactions: {
    // Primary metrics (use attempted as the main metric)
    attemptedCount: number; // ✨ NEW
    attemptedVolume: number; // ✨ NEW

    // Legacy aliases for backward compatibility (if needed)
    count?: number; // Optional: alias for attemptedCount
    volume?: number; // Optional: alias for attemptedVolume

    profit: number; // ✓ Keep

    // Status counts (use direct counts, no client-side math)
    successCount: number; // ✨ NEW (was: successful)
    failedCount: number; // ✨ NEW (was: failed)
    pendingCount: number; // ✨ NEW (was: pending)
    reversedCount: number; // ✨ NEW

    // Legacy aliases for backward compatibility (if needed)
    successful?: number; // Optional: alias for successCount
    failed?: number; // Optional: alias for failedCount
    pending?: number; // Optional: alias for pendingCount
    reversed?: number; // Optional: alias for reversedCount
  };
  newUsers: number; // ✓ Keep
  activeUsers: number; // ✓ Keep
  walletDeposits: number; // ✓ Keep
  walletWithdrawals: number; // ✓ Keep
  revenueEstimate: number; // ✓ Keep
  comparedToYesterday: {
    // Transaction attempts (primary metric comparison)
    attemptedTransactionsDelta: number; // ✨ NEW
    attemptedTransactionsDeltaPercent: string; // ✨ NEW

    // Legacy alias for backward compatibility
    transactionsDelta?: number; // Optional: alias
    transactionsDeltaPercent?: string; // Optional: alias

    // Status breakdowns
    successfulTransactionsDelta: number; // ✨ NEW
    successfulTransactionsDeltaPercent: string; // ✨ NEW
    failedTransactionsDelta: number; // ✨ NEW
    failedTransactionsDeltaPercent: string; // ✨ NEW
    pendingTransactionsDelta: number; // ✨ NEW
    pendingTransactionsDeltaPercent: string; // ✨ NEW
    reversedTransactionsDelta: number; // ✨ NEW
    reversedTransactionsDeltaPercent: string; // ✨ NEW

    // Volume comparison
    volumeDelta: number; // ✓ Keep
    volumeDeltaPercent: string; // ✓ Keep
  };
}
```

---

### 2. Update UI Component to Display New Metrics

#### File: `src/components/features/admin/analytics/TodaySnapshotCard.tsx`

**New sections to add:**

- Show `attemptedCount` vs `successCount` breakdown
- Display status breakdown with all statuses:
  - ✓ Successful
  - ✗ Failed
  - ⚠️ Pending
  - ↻ Reversed (NEW)
- Show comparison deltas for each status (with ±% indicators)
- Distinguish between `attemptedVolume` (total attempted value) and actual volume

**Suggested UI layout:**

```
Today's Snapshot
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Attempted Tx │   Volume     │ Success Rate │  Revenue     │
│    158       │  ₦47,100     │  92.4% ↑     │  ₦2,200 ✓    │
│  +12.9% ↑    │  +12.5% ↑    │ (+11.1% ↑)   │ (₦2,200 prof)│
│ vs yesterday │ vs yesterday │ vs yesterday │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

Transaction Status Breakdown:
┌────────────────────────────────────────────────────────────┐
│ ✓ Successful: 145 (+15, +11.1%)                            │
│ ✗ Failed: 3 (+1, +50.0%)                                   │
│ ⚠ Pending: 2 (-1, -33.3%)                                  │
│ ↻ Reversed: 8 (+3, +60.0%)                                 │
│ ─────────────────────────────────────────────────────────  │
│ Total Attempts: 158 (+18, +12.9%)                          │
└────────────────────────────────────────────────────────────┘

Users & Wallet:
┌──────────────┬──────────────┬──────────────┐
│  Active      │  New Users   │  Wallet Flow │
│   85 users   │    +12       │  +₦65k /-₦12k│
└──────────────┴──────────────┴──────────────┘
```

---

### 3. Update Tests

#### Files:

- `__test__/services/admin/analytics.service.test.ts`
- `__test__/hooks/admin/useAdminAnalytics.test.ts`
- `__test__/components/features/admin/analytics/TodaySnapshotCard.test.tsx` (if exists)

**Changes:**

- Mock new fields in test data
- Verify new fields are returned from service
- Test new UI rendering of status breakdown
- Verify delta calculations and display formatting

---

## ✨ Key Points from Backend Spec

> `attemptedCount` is the primary total-attempts metric for the today-vs-yesterday card.
> `transactionsDelta` is now an alias of attempted transaction delta for convenience.
> Use `successCount`, `failedCount`, `pendingCount`, and `reversedCount` for the status subtotals without doing client-side subtraction.

**This means:**

1. ✅ Stop using `count` → use `attemptedCount` instead
2. ✅ Stop using `volume` → use `attemptedVolume` instead
3. ✅ Stop using `successful` → use `successCount` instead (no math needed)
4. ✅ Stop using `failed` → use `failedCount` instead (no math needed)
5. ✅ Stop using `pending` → use `pendingCount` instead (no math needed)
6. ✅ Start using `reversedCount` for reversal tracking
7. ✅ Use the specific delta fields for each status (not client-side calculation)

---

## Migration Path

### Phase 1: Update Type Definitions (Non-breaking)

- Add new fields to `TodaySnapshot`
- Keep old fields as optional aliases for backward compatibility
- Update backend service to map old field names to new names if needed

### Phase 2: Update UI Components

- Update `TodaySnapshotCard` to display new metrics
- Show full status breakdown with reversed transactions
- Display per-status deltas from backend

### Phase 3: Deprecate Old Fields

- Remove optional aliases after UI fully migrated
- Update all components to use new field names

---

## Summary Table

| Field                                             | Current | New | Action                         |
| ------------------------------------------------- | ------- | --- | ------------------------------ |
| `transactions.count`                              | ✓       | ❌  | Replace with `attemptedCount`  |
| `transactions.volume`                             | ✓       | ❌  | Replace with `attemptedVolume` |
| `transactions.successful`                         | ✓       | ❌  | Replace with `successCount`    |
| `transactions.failed`                             | ✓       | ❌  | Replace with `failedCount`     |
| `transactions.pending`                            | ✓       | ❌  | Replace with `pendingCount`    |
| `transactions.reversed`                           | ❌      | ✨  | **ADD**                        |
| `transactions.attemptedCount`                     | ❌      | ✨  | **ADD**                        |
| `transactions.attemptedVolume`                    | ❌      | ✨  | **ADD**                        |
| `comparedToYesterday.*Delta*`                     | ✓       | ✓   | Keep (keep both old & new)     |
| `comparedToYesterday.attemptedTransactionsDelta`  | ❌      | ✨  | **ADD**                        |
| `comparedToYesterday.successfulTransactionsDelta` | ❌      | ✨  | **ADD**                        |
| `comparedToYesterday.failedTransactionsDelta`     | ❌      | ✨  | **ADD**                        |
| `comparedToYesterday.pendingTransactionsDelta`    | ❌      | ✨  | **ADD**                        |
| `comparedToYesterday.reversedTransactionsDelta`   | ❌      | ✨  | **ADD**                        |

---

## Next Steps

1. Update `src/types/admin/analytics.types.ts` with new TodaySnapshot interface
2. Update `src/components/features/admin/analytics/TodaySnapshotCard.tsx` to display new metrics
3. Update tests to mock and verify new fields
4. Test in dashboard to verify layout and formatting
5. Commit changes
