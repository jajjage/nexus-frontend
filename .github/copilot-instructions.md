# Nexus Data Frontend - AI Coding Agent Instructions

## Quick Start

- **Framework**: Next.js 15 with App Router (`src/app/` uses nested layouts)
- **Language**: TypeScript (strict mode enabled)
- **Build**: `pnpm build`; **Run**: `pnpm dev` (port 3001); **Test**: `pnpm test` or `pnpm test:watch`
- **Path alias**: `@/` maps to `src/`
- **API**: Backend at `http://localhost:3000/api/v1`; frontend proxies requests via Next.js rewrites to `/api/v1`

---

## Architecture Essentials

### Three-Layer Data Flow

1. **UI Components** (`src/components/features/`) → render from data
2. **Custom Hooks** (`src/hooks/`) → manage queries/mutations via React Query
3. **Services Layer** (`src/services/`) → API calls wrapped in promise-based functions

**Example flow**: `LoginForm` → `useAuth()` hook → `auth.service.ts` → `apiClient` (via `/api/v1` proxy)

### Critical: HTTPOnly Cookie + Token Refresh

- Both `accessToken` and `refreshToken` stored as HTTPOnly cookies (backend-managed)
- `apiClient` configured with `withCredentials: true` (auto-sends cookies)
- On **401 response**: automatic token refresh via queue mechanism (prevents duplicate refresh calls)
- Protected endpoints (login, register, forgot-password) skip token refresh logic
- **See**: [lib/api-client.ts](src/lib/api-client.ts#L1) for refresh queue implementation

### React Query Integration

- **Query keys**: Defined in hooks as `{ queryKey: ["feature", params], ... }`
- **Factory pattern**: `walletKeys = { all: ["wallet"], byId: (id) => [...all, id] }`
- **Invalidation**: Use `queryClient.invalidateQueries({ queryKey: ["feature"] })`
- **Example**: [useWallet.ts](src/hooks/useWallet.ts) shows pattern for queries, mutations, and invalidation

---

## File Organization & Patterns

### Feature Folder Structure

```
src/components/features/[feature-name]/
  ├── [Component1].tsx (UI only, no API calls)
  ├── [Component2].tsx
src/hooks/use[FeatureName].ts (React Query queries + mutations)
src/services/[feature-name].service.ts (API calls, no React state)
src/types/[feature-name].types.ts (TypeScript interfaces)
__test__/
  ├── components/features/[feature-name]/[Component].test.tsx
  ├── hooks/use[FeatureName].test.ts
  ├── services/[feature-name].service.test.ts
  ├── integration/[feature-name].integration.test.ts
docs/[feature-name]/ (IMPLEMENTATION_GUIDE.md, TESTING_CHECKLIST.md, etc.)
```

### Key Directories

- `src/app/` - Next.js routes (App Router with nested layouts)
- `src/components/ui/` - Radix UI headless components (not feature-specific)
- `src/components/guards/` - Auth/permission wrappers
- `src/components/layout/` - Shared layout components
- `src/context/` - React Context providers
- `src/lib/` - Utilities (api-client, auth-utils, firebase-client, react-query setup)
- `src/providers/` - Global providers (ReactQuery, auth, theme)
- `src/utils/` - General helper functions
- `src/types/` - TypeScript type definitions (NOT interfaces—use interfaces for extensibility)

---

## Development Workflows

### Adding a New Feature

1. Create service: `src/services/[feature].service.ts` with API functions
2. Create hook: `src/hooks/use[Feature].ts` with `useQuery`/`useMutation` + query key factory
3. Create types: `src/types/[feature].types.ts`
4. Create components: `src/components/features/[feature]/` consuming the hook
5. Add tests in `__test__/` mirroring structure

### Running Tests

- **Unit/Component**: `pnpm test` (runs Vitest in `__test__/`) or `pnpm test:watch`
- **UI Debugging**: `pnpm test:ui` opens Vitest dashboard
- **E2E (Playwright)**: `pnpm dev` first, then `pnpm playwright test` or `playwright --ui`
- **Test files**: Pattern is `feature.test.ts` or `feature.spec.ts`; mock location: `__mocks__/`

### Linting & Formatting

- `pnpm lint` (ESLint with 500 max warnings)
- `pnpm format:check` / `pnpm format` (Prettier)

---

## Testing Strategy

| Test Type       | Scope                            | Speed     | Where                                 | When                        |
| --------------- | -------------------------------- | --------- | ------------------------------------- | --------------------------- |
| **Unit**        | Single function isolated         | ⚡ Fast   | `__test__/services/`, `__test__/lib/` | Math, validation, logic     |
| **Component**   | UI rendering + interaction       | ⚡ Fast   | `__test__/components/features/`       | Form submission, visibility |
| **Integration** | Multiple services + storage flow | 🐢 Medium | `__test__/integration/`               | Auth lifecycle, state sync  |
| **E2E**         | Full app in real browser         | 🐌 Slow   | `e2e/` (Playwright)                   | Critical user journeys      |

**Setup files**: `vitest.setup.ts` (globals, mocks), `vitest.config.mts` (happy-dom environment, `until-async` polyfill)

---

## Key Dependencies & Integrations

### UI & Forms

- **Radix UI** (`@radix-ui/*`) - Headless components
- **React Hook Form** + `@hookform/resolvers` - Form state management
- **Sonner** - Toast notifications
- **Framer Motion** - Animations

### Data & State

- **React Query** (`@tanstack/react-query`) - Server state caching + sync (see [react-query.ts](src/lib/react-query.ts))
- **Firebase** - Messaging (FCM), analytics
- **Axios** - HTTP client (auto token refresh, see [api-client.ts](src/lib/api-client.ts))

### Auth & Security

- **WebAuthn** (`@github/webauthn-json`) - Biometric auth
- **js-cookie** - Cookie management
- **Local Storage** - Non-sensitive client data

### Testing

- **Vitest** - Unit/component tests (happy-dom environment)
- **Playwright** - E2E tests
- **@testing-library/react** - Component testing utilities

---

## Code Style & Conventions

### TypeScript & Naming

- Use **interfaces** (not types) for extensible shapes: `interface User { ... }`
- Use **types** only for unions/primitives: `type Status = 'pending' | 'done'`
- React components: PascalCase, `.tsx` files
- Hooks: camelCase prefix `use`, e.g., `useWallet`
- Services: kebab-case filenames: `wallet.service.ts`
- Constants/enums: SCREAMING_SNAKE_CASE

### Import Organization

```typescript
// 1. External libraries
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

// 2. Internal project imports
import { walletService } from "@/services/wallet.service";
import { WalletResponse } from "@/types/wallet.types";

// 3. Local relative imports (rare)
import { formatCurrency } from "./utils";
```

### Component Structure

```typescript
// 1. Imports
import { useWallet } from "@/hooks/useWallet";

// 2. Props interface
interface ComponentProps { /* ... */ }

// 3. Component definition
export const MyComponent: React.FC<ComponentProps> = ({ prop1 }) => {
  // 4. Hooks
  const { data } = useWallet();

  // 5. State
  const [local, setLocal] = useState(false);

  // 6. Render
  return ( /* JSX */ );
};
```

---

## Common Patterns & Anti-Patterns

### ✅ DO: Query Key Factories (prevents stale caches)

```typescript
export const walletKeys = {
  all: ["wallet"],
  balance: () => [...walletKeys.all, "balance"],
  transactions: (id: string) => [...walletKeys.all, "transactions", id],
};

// Use in hooks
useQuery({
  queryKey: walletKeys.transactions(userId),
  queryFn: () => walletService.getTransactions(userId),
});
```

### ✅ DO: Service Functions (API separation)

```typescript
// wallet.service.ts
export const walletService = {
  getBalance: () => apiClient.get("/wallet/balance"),
  getTransactions: (id) => apiClient.get(`/wallet/transactions/${id}`),
};
```

### ❌ DON'T: API calls in components

Components should **never** call `apiClient` directly; use services + hooks instead.

### ❌ DON'T: Store server state in Context

Use React Query instead; Context is for UI theme/auth status only.

### ✅ DO: Mock API responses in tests

```typescript
vi.mock("@/services/wallet.service", () => ({
  walletService: { getBalance: vi.fn(() => Promise.resolve({ balance: 100 })) },
}));
```

---

## Debugging & Troubleshooting

### 401 Token Refresh Issues

- Check `src/lib/api-client.ts` response interceptor logic
- Verify backend sets HTTPOnly cookies with correct names (`accessToken`, `refreshToken`)
- Test with `pnpm dev` and browser DevTools → Network tab → Cookies
- Protected endpoints (login, register) should skip refresh queue—see `authEndpoints` list

### Test Failures (Vitest)

- **Environment**: Tests run in `happy-dom` (not jsdom); check imports
- **Async issues**: Use `until-async` mock for wait utilities (see `__mocks__/until-async.js`)
- **Module aliasing**: `@/` path alias configured in `vitest.config.mts`

### Build Errors

- Run `pnpm build` locally first
- Check `tsconfig.json`: strict mode on, `target: ES2017`, ESM modules
- Docker build uses `next build && next start` with `output: "standalone"`

---

## Repository Structure Highlights

### Critical Service Files

- [api-client.ts](src/lib/api-client.ts) - Token refresh queue, interceptors
- [auth.service.ts](src/services/auth.service.ts) - Login/register/logout
- [notification.service.ts](src/services/notification.service.ts) - FCM sync
- [topup.service.ts](src/services/topup.service.ts) - Purchase flow

### Documentation

- [CODEBASE_ARCHITECTURE.md](docs/CODEBASE_ARCHITECTURE.md) - Deep dive on auth, API client
- [CODEBASE_STANDARDS.md](docs/CODEBASE_STANDARDS.md) - Feature development template
- [TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) - Test types & examples
- [MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md](docs/MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md) - Native biometric integration (iOS/Android)

---

## Biometric Architecture (Web & Native)

### Two-Tier System

1. **Soft Lock** (Device-only, **NO backend**) - App unlock via Face ID/fingerprint
   - Web: Passcode check from localStorage
   - iOS: LocalAuthentication framework
   - Android: BiometricPrompt API
   - **Important**: Zero network calls for soft lock

2. **Transaction Biometric** (Device + **backend verification**) - Payment/topup approval
   - Web: WebAuthn challenge → local biometric signature → backend verification
   - iOS/Android: Same pattern - backend challenge → local signing → backend token
   - Backend returns `verificationToken` used in `/user/topup`

**See**: [MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md](docs/MOBILE_BIOMETRIC_TRANSACTION_GUIDE.md) for native implementation

---

## Quick Reference Checklist

When implementing a new feature:

- [ ] Created service file with API functions (no React state)
- [ ] Created hook with query key factory + `useQuery`/`useMutation`
- [ ] Created types file with request/response interfaces
- [ ] Created component consuming the hook
- [ ] Added unit test for service (mock API responses)
- [ ] Added component test (mock hooks)
- [ ] Added integration test (real service + mock backend)
- [ ] Updated `CODEBASE_STANDARDS.md` if introducing new patterns
- [ ] Ran `pnpm lint`, `pnpm test`, verified build
