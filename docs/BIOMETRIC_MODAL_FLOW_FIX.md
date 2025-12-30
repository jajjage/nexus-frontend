# BiometricVerificationModal Flow Fix

## Problem Summary

The biometric/PIN modal flow had three critical UX issues:

### Issue 1: No Error Message Display

When a user's device didn't support biometric, or biometric failed on first auto-attempt, the modal would show nothing useful before transitioning to PIN. The error was extracted but never displayed to the user.

**Expected:** User sees error message for 2 seconds (e.g., "Your device doesn't support biometric verification. Switching to PIN...")

**Actual:** Modal silently waited then transitioned without showing why

### Issue 2: Checkout Modal Visibility During Transitions

When BiometricVerificationModal or PinVerificationModal were open, the parent CheckoutModal from airtime-plans/data-plans was still being rendered in the background, causing it to briefly flash/appear when modals transitioned.

**Expected:** Checkout modal completely hidden while verification modals are visible

**Actual:** Checkout modal was visible in the background, causing visual distraction and poor UX

### Issue 3: No PIN Setup Check

When biometric failed and the app tried to show the PIN modal, it didn't check if the user had actually set up a PIN. Users without a PIN would see the PIN verification modal but couldn't complete it.

**Expected:** Check `user.hasPin` before showing PIN modal. If false, show PinSetupModal instead. After setup succeeds, show PIN verification modal.

**Actual:** Always showed PIN verification modal regardless of PIN status

## Solutions Implemented

### Fix 1: Error Message Display with State Management

**File:** `BiometricVerificationModal.tsx`

Added `errorMessage` state to handle custom error messages separate from mutation errors:

```tsx
const [errorMessage, setErrorMessage] = useState<string>("");
const error = errorMessage || mutationError?.message || "";
```

When biometric is unsupported in `useEffect`, we now set a helpful message:

```tsx
} else {
  // WebAuthn not supported - immediately show error and transition
  setShowModal(true);
  setIsAutoRetry(false);
  setShowErrorBeforeTransition(true);

  // Set helpful error message for unsupported biometric
  setErrorMessage("Your device doesn't support biometric verification. Switching to PIN...");

  setTimeout(() => {
    transitionToNextModal();
  }, 2000);  // Wait 2 seconds so user sees the error
}
```

The error displays in the modal for 2 seconds before auto-transitioning:

```tsx
{
  showErrorBeforeTransition && error && (
    <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
      <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-red-900">
          Biometric Unavailable
        </p>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    </div>
  );
}
```

When showing main content, error is hidden:

```tsx
{!showErrorBeforeTransition && (
  // All the biometric UI
)}
```

### Fix 2: Checkout Modal Visibility Control

**Files:**

- `airtime-plans.tsx` (line 404)
- `data-plans.tsx` (line 447)

Changed the conditional render to hide checkout modal when EITHER biometric or PIN modal is open:

```tsx
// BEFORE (missing showBiometricModal check)
{selectedProduct && !showPinModal && !topupMutation.isPending && (
  <CheckoutModal ... />
)}

// AFTER (now hides when either modal is visible)
{selectedProduct && !showPinModal && !showBiometricModal && !topupMutation.isPending && (
  <CheckoutModal ... />
)}
```

This prevents the checkout modal from rendering at all when verification is in progress.

### Fix 3: PIN Setup Check and Modal Flow

**Files:**

- `BiometricVerificationModal.tsx` (interface + flow)
- `airtime-plans.tsx`
- `data-plans.tsx`

#### Step 1: Add onNoPinSetup Callback

Updated `BiometricVerificationModalProps` to accept optional `onNoPinSetup` callback:

```tsx
interface BiometricVerificationModalProps {
  onBiometricUnavailable: () => void; // Fallback to PIN
  onNoPinSetup?: () => void; // Show PIN setup modal if no PIN set
  // ...
}
```

#### Step 2: Check PIN Status in Transition

In `transitionToNextModal()`, immediately check `user?.hasPin` and call appropriate callback:

```tsx
const transitionToNextModal = () => {
  // Immediately check PIN status while error is showing
  const hasPin = user?.hasPin;

  // Hide this modal first (fade out)
  setShowModal(false);
  setShowErrorBeforeTransition(false);

  // After fade-out, show appropriate next modal
  setTimeout(() => {
    if (hasPin) {
      // User has PIN set - show PIN verification modal
      onBiometricUnavailable();
    } else {
      // User doesn't have PIN set - show PIN setup modal
      if (onNoPinSetup) {
        onNoPinSetup();
      } else {
        onBiometricUnavailable();
      }
    }
  }, 300);
};
```

#### Step 3: Add PIN Setup Modal to Parent Components

In `airtime-plans.tsx` and `data-plans.tsx`:

Added new state:

```tsx
const [showPinSetupModal, setShowPinSetupModal] = useState(false);
```

Added handlers:

```tsx
// Handle no PIN setup - Show PIN setup modal
const handleNoPinSetup = () => {
  console.log("[DataPlans] No PIN set up, showing PIN setup modal");
  setShowBiometricModal(false);

  // Show PIN setup modal after brief delay
  setTimeout(() => {
    setShowPinSetupModal(true);
  }, 300);
};

// Handle PIN setup success - Show PIN verification modal
const handlePinSetupSuccess = () => {
  console.log(
    "[DataPlans] PIN setup completed, now showing PIN verification modal"
  );
  setShowPinSetupModal(false);

  // Refetch user to get updated hasPin status
  refetchUser();

  // Show PIN verification modal for transaction
  setTimeout(() => {
    setShowPinModal(true);
  }, 300);
};
```

Imported and added PinSetupModal to renders:

```tsx
import { PinSetupModal } from "@/components/features/security/pin-setup-modal";

// In JSX:
<PinSetupModal
  isOpen={showPinSetupModal}
  onClose={() => {
    setShowPinSetupModal(false);
    setPendingPaymentData(null);
  }}
  onSuccess={handlePinSetupSuccess}
/>;
```

Passed callback to BiometricVerificationModal:

```tsx
<BiometricVerificationModal
  open={showBiometricModal}
  onClose={() => { ... }}
  onSuccess={handleBiometricSuccess}
  onBiometricUnavailable={handleBiometricUnavailable}
  onNoPinSetup={handleNoPinSetup}  // NEW
  transactionAmount={...}
  productCode={...}
  phoneNumber={...}
/>
```

## Complete User Flow

### Scenario 1: Biometric Supported & Enabled

1. User clicks Pay button on Checkout modal
2. Biometric modal opens, starts auto-verification
3. ✅ Biometric succeeds
4. Modal closes, payment proceeds

### Scenario 2: Biometric Not Supported

1. User clicks Pay button on Checkout modal
2. BiometricVerificationModal opens
3. useEffect checks WebAuthn support → NOT supported
4. 🔴 Error message shows: "Your device doesn't support biometric verification. Switching to PIN..."
5. User reads error for 2 seconds
6. Modal checks `user.hasPin`
   - **If PIN is set:** Shows PinVerificationModal
   - **If PIN not set:** Shows PinSetupModal → User sets PIN → Then shows PinVerificationModal

### Scenario 3: Biometric Supported But Fails on Auto-Attempt

1. User clicks Pay button on Checkout modal
2. BiometricVerificationModal opens, starts auto-verification
3. Auto-verification fails (e.g., not enrolled, canceled by user)
4. 🔴 Error message shows actual API error (e.g., "No biometric enrolled")
5. User reads error for 2 seconds
6. Modal checks `user.hasPin` and transitions appropriately

### Scenario 4: User Clicks "Use PIN Instead"

1. User is on BiometricVerificationModal and clicks "Use PIN Instead" button
2. Modal transitions to PIN modal (same flow as above)

## Key Improvements

✅ **No more silent failures** - Helpful error messages always displayed
✅ **No background modal flash** - Checkout modal completely hidden during verification
✅ **Proper PIN setup flow** - Users without PIN see setup modal first
✅ **Auto-transition timing** - 2-second error visibility, 300ms fade transitions
✅ **State cleanup** - User refetched after PIN setup to update `hasPin` status
✅ **Smooth UX** - All transitions fade out the current modal before showing next

## Files Modified

1. `src/components/auth/BiometricVerificationModal.tsx`
   - Added errorMessage state
   - Added hasPin check in transitionToNextModal()
   - Added helpful error messages for unsupported biometric
   - Added 2-second delay before transition to show errors

2. `src/components/features/dashboard/airtime/airtime-plans.tsx`
   - Added showPinSetupModal state
   - Added handleNoPinSetup and handlePinSetupSuccess handlers
   - Updated CheckoutModal condition to include !showBiometricModal
   - Added PinSetupModal import and render
   - Passed onNoPinSetup to BiometricVerificationModal

3. `src/components/features/dashboard/data/data-plans.tsx`
   - Same changes as airtime-plans.tsx

## Testing Checklist

- [ ] Biometric not supported → Shows error → Transitions to PIN/PIN setup
- [ ] Biometric fails on auto-attempt → Shows error → Transitions properly
- [ ] User clicks "Use PIN Instead" → Transitions with animation
- [ ] User without PIN → Shows PIN setup modal → After setup shows PIN verification
- [ ] User with PIN → Shows PIN verification modal directly
- [ ] Checkout modal never visible during verification modal lifecycle
- [ ] All error messages are helpful and specific
- [ ] 2-second delay for error visibility works
- [ ] Modal transitions are smooth (300ms fade)
