# User Management Implementation Plan

## 1. Overview

Implement a comprehensive User Management system for the Admin Dashboard, allowing admins to verify, create, edit, suspend, and manage users, including their wallets and security settings.

**Reference**: `docs/ADMIN_GUIDE.md` (Section: User Management)

## 2. Architecture & Data Flow

### 2.1 Service Layer

Create `src/services/admin/user.service.ts` to handle all API communications.

- `getUsers(params: PaginationParams)`
- `getUserById(userId: string)`
- `createUser(data: CreateUserRequest)`
- `updateUser(userId: string, data: UpdateUserRequest)`
- `suspendUser(userId: string)`
- `unsuspendUser(userId: string)`
- `creditWallet(userId: string, amount: number)`
- `debitWallet(userId: string, amount: number)`
- `disable2FA(userId: string)`
- `getUserSessions(userId: string)`
- `revokeUserSessions(userId: string)`

### 2.2 React Query Hooks

Create `src/hooks/admin/useAdminUsers.ts`:

- `useAdminUsers(params)`: Fetch paginated list.
- `useAdminUser(userId)`: Fetch single user details.
- `useAdminUserMutations()`: Container for all action mutations (create, update, suspend, etc.) with automatic cache invalidation.

### 2.3 State Management

- **URL State**: Use URL search params for pagination (`page`, `limit`) and filters to ensure shareable links.
- **Server State**: React Query for all data.
- **Form State**: React Hook Form + Zod for validation.

---

## 3. UI/UX Components

### 3.1 Pages

- `/admin/users`: List view with data table.
- `/admin/users/[userId]`: Detail view with tabs (Profile, Wallet, Security, Activity).

### 3.2 Key Components

- **`UserTable`**:
  - Columns: Name, Email/Phone, Role (Badge), Status (Badge), Balance, Actions.
  - Features: Pagination, Search filter (if API supports it), Row actions.
- **`CreateUserModal`**:
  - Fields: Full Name, Email, Phone, Role (Select), Password (auto-generated or manual).
- **`UserProfileHeader`**:
  - Avatar, Name, Quick Actions (Suspend, Reset Password).
- **`WalletManagementCard`**:
  - Display current balance.
  - distinct "Credit" and "Debit" buttons opening `WalletTransactionModal`.
- **`SessionManagementList`**:
  - List active sessions with "Revoke" button.

---

## 4. Implementation Steps

### Phase 1: Service & Hooks

- [ ] Create `src/types/admin/user.types.ts`
- [ ] Implement `adminUserService`
- [ ] Implement `useAdminUsers` and `useAdminUserMutations` hooks

### Phase 2: User List View

- [ ] Create `/admin/users/page.tsx`
- [ ] Implement `UserTable` with Shadcn UI `Table`
- [ ] Add Pagination controls
- [ ] Implement `CreateUserModal`

### Phase 3: User Detail View

- [ ] Create `/admin/users/[userId]/page.tsx`
- [ ] Implement Profile Information card
- [ ] Implement Wallet Management section
- [ ] Implement Security section (2FA, Sessions)

---

## 5. Testing Strategy

### 5.1 Unit Tests (`src/services/admin/__tests__`)

- Mock API responses for `getUsers` and verify data transformation.
- Test error handling for `createUser` (e.g., duplicate email).

### 5.2 Component Tesst

- Test form validation in `CreateUserModal`.
- Verify pagination clicks update URL params.

### 5.3 Manual Verification

1. **List Users**: Verify pagination works and data loads.
2. **Create User**: Create a 'staff' user, verify they appear in the list.
3. **Suspend Action**: Suspend the new user, verify status change badge.
4. **Wallet**: Credit 100 units, verify balance update. Debit 50 units, verify balance.
