# Documentation Update Summary: Purchase Flow Details

## Problem Identified

The original `mobile-purchase-flow-guide.md` provided a good **high-level overview** but was missing critical implementation details that developers need to actually build the feature. Specifically:

1. **Biometric Backend Verification** - Mentioned but not detailed
2. **Price Calculation Logic** - Formula shown but not complete
3. **PIN Input Implementation** - Auto-focus, backspace, validation not explained
4. **State Management** - Which states and transitions needed
5. **Error Handling** - Specific HTTP status codes and messages
6. **React Query Optimization** - How optimistic updates work
7. **Receipt Generation** - Technical steps using ViewShot

---

## Solution: New Comprehensive Guide

Created **[PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md](PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md)** with:

### 1. Input Validation (NEW)

```typescript
✓ Phone number format validation (11 digits, 07-09 prefix)
✓ Network operator detection and matching
✓ Sufficient balance check before purchase
```

### 2. Price Calculation (DETAILED)

```typescript
✓ Face value vs. supplier cost
✓ Markup calculation by supplier (MTN 15%, Airtel 12%, etc.)
✓ Selling price calculation
✓ Cashback deduction logic
✓ Bonus earning calculation
```

### 3. Biometric with Backend (CRITICAL - WAS MISSING!)

```typescript
✓ Check device hardware support
✓ Check if user enrolled in biometric
✓ Show native biometric prompt
✓ Get challenge from GET /biometric/auth/options
✓ Sign challenge cryptographically
✓ Send proof to POST /biometric/auth/verify
✓ Receive and use verificationToken in transaction
```

### 4. PIN Input Full Implementation (NEW)

```typescript
✓ State management for 4 digit inputs
✓ Auto-focus to next input on digit entry
✓ Auto-focus back on backspace
✓ Auto-submit when 4th digit entered
✓ Secure masking (secureTextEntry)
✓ Error display
```

### 5. Complete Transaction Flow (EXPANDED)

```typescript
✓ Prepare exact payload structure
✓ Handle both biometric (verificationToken) and PIN (pin) paths
✓ Show processing state
✓ Handle all error HTTP status codes (401, 402, 503)
✓ Optimistic balance update
✓ Rollback on error
✓ Success/failure state management
```

### 6. React Query Optimization (COMPLETE)

```typescript
✓ Optimistic updates in onMutate
✓ Rollback in onError
✓ Refetch in onSettled
✓ Query cache invalidation
```

### 7. Receipt Generation (FULL STEPS)

```typescript
✓ Fetch full transaction data from API
✓ Render receipt component off-screen
✓ Capture as image using ViewShot
✓ Share via native share sheet
✓ Handle sharing availability
```

### 8. Complete State Machine (NEW)

```typescript
✓ Defined all states: idle, checkout, biometric, pin, processing, success, failed
✓ Defined valid transitions between states
✓ Prevents invalid state changes
```

---

## Key Missing Details Now Covered

### Before (Original Guide)

```typescript
// "Backend integration" mentioned but vague
const verifyWithBackend = async () => {
  // Call backend to verify biometric...
}

// PIN "sent when 4th digit entered" but no details
<TextInput maxLength={1} />

// "Optimistic updates" mentioned but not shown
const { mutate } = useTopup();
```

### After (New Guide)

```typescript
// Complete biometric backend flow with all steps
async function proceedWithBiometricVerification() {
  const optionsResponse = await apiClient.get("/biometric/auth/options");
  const { challenge, rpId, allowCredentials } = optionsResponse.data.data;
  const assertionResponse = signChallengeWithKey(challenge);
  const verificationResponse = await apiClient.post(
    "/biometric/auth/verify",
    assertionResponse
  );
  const { verificationToken } = verificationResponse.data.data;
  await completeTransaction({ verificationToken });
}

// Complete PIN input with all edge cases
function handlePINInput(index: number, digit: string) {
  const newPins = [...pinModal.pins];
  newPins[index] = digit;
  if (digit && index < 3) pinInputRefs[index + 1]?.focus();
  if (newPins.every(pin => pin !== "")) handlePINSubmit(newPins.join(""));
}

// Complete optimistic update implementation
onMutate: async (newTransaction) => {
  await queryClient.cancelQueries({ queryKey: ["auth", "user"] });
  const previousUser = queryClient.getQueryData(["auth", "user"]);
  queryClient.setQueryData(["auth", "user"], (old) => ({
    ...old,
    wallet: { ...old.wallet, balance: old.wallet.balance - newTransaction.amount }
  }));
  return { previousUser };
},
onError: (err, newTransaction, context) => {
  if (context?.previousUser) {
    queryClient.setQueryData(["auth", "user"], context.previousUser);
  }
},
```

---

## What Each Developer Role Needs

### Mobile Developer (iOS/Android)

1. Read: `mobile-purchase-flow-guide.md` → High-level understanding
2. Read: `PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md` → All implementation details
3. Copy: Code snippets from section 3 (Biometric) and section 4 (PIN)
4. Implement: Following the complete flow sections 1-8

### Backend Developer

1. Read: Section 5 (Transaction API Call)
2. Check: Expected request payload structure
3. Verify: HTTP error status codes (401, 402, 503)
4. Confirm: `verificationToken` generation and format

### QA/QE

1. Read: `mobile-purchase-flow-guide.md` → Test scenarios
2. Check: Section 10 (Testing Checklist) in new guide
3. Validate: All states, transitions, error cases

### AI Coding Agents

1. Read: AI instructions in `.github/copilot-instructions.md`
2. Reference: `.PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md` for exact patterns
3. Follow: Code structure and error handling examples

---

## Files Updated/Created

| File                                                                                 | Status   | Why                                         |
| ------------------------------------------------------------------------------------ | -------- | ------------------------------------------- |
| [mobile-purchase-flow-guide.md](mobile-purchase-flow-guide.md)                       | Updated  | Added reference to new implementation guide |
| [PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md](PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md) | Created  | Complete implementation with all details    |
| [MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md](MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md)       | Existing | Focused on biometric-specific details       |
| [MOBILE_BIOMETRIC_CHECKLIST.md](MOBILE_BIOMETRIC_CHECKLIST.md)                       | Existing | Validation checklist                        |

---

## How to Use These Guides

### Quick Start (5 minutes)

→ Read: `mobile-purchase-flow-guide.md`

### Implementation (2-3 hours)

1. Read: `PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md` section 1-2
2. Implement: Input validation & price calculation
3. Read: Section 3-4
4. Implement: Biometric & PIN flows
5. Read: Section 5-7
6. Implement: Transaction API & receipt

### Deep Dive (for biometric specifics)

→ Read: `MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md`

### Validation & Testing

→ Use: Section 10 of `PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md`

---

## Common Questions Answered

**Q: Where do I see biometric backend verification code?**
A: Section 3.3 of `PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md` - "Backend Biometric Challenge"

**Q: How do I handle PIN auto-focus?**
A: Section 4.2 - Complete PIN input handling with ref management

**Q: What's the exact transaction payload?**
A: Section 5.1 - Full interface definition and example

**Q: How do optimistic updates work?**
A: Section 5.2 - Complete React Query hook with all callbacks

**Q: What error codes should I handle?**
A: Section 5.1 - Lists 401, 402, 503 with specific handling

**Q: How do I share receipts?**
A: Section 7.2 - Complete with ViewShot capture and native sharing

---

## What's Improved

### Before

- "Show biometric prompt" ✓
- "Call API if success" ✓
- "Show error if failed" ✓

### Now

- ✓ Check device hardware support
- ✓ Check user enrollment
- ✓ Get challenge from backend
- ✓ Sign challenge cryptographically
- ✓ Send proof to backend
- ✓ Receive verification token
- ✓ Use token in transaction
- ✓ Handle all error cases
- ✓ Optimistic update + rollback
- ✓ Receipt generation
- ✓ State machine transitions
- ✓ Complete code examples

---

## Next Steps for Teams

1. **Mobile Team**: Review `PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md` sections 3-4
2. **Backend Team**: Confirm endpoint contracts match section 5
3. **QA/QE**: Use section 10 checklist for test planning
4. **AI Agents**: Reference this guide for accurate code generation

---

## Integration with Biometric Guides

These guides work together:

```
MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md
    ↓ Explains two-tier system (soft lock + transaction)
    ↓ Shows backend contract in detail
    ↓
PURCHASE_FLOW_COMPLETE_IMPLEMENTATION.md
    ↓ Shows how biometric integrates into purchase flow
    ↓ Shows when backend calls happen
    ↓
mobile-purchase-flow-guide.md
    ↓ High-level overview
    ↓ Links to both detailed guides
```
