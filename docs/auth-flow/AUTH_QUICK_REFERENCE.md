# Auth Quick Reference

## When to Use What

### `useAuth()` Hook

Use this in **any component that needs user data or auth state**.

```typescript
import { useAuth } from "@/hooks/useAuth-v2";

function MyComponent() {
  const {
    user,              // User object or null
    isAuthenticated,   // Boolean
    isLoading,        // Boolean
    checkPermission,  // (permission: string) => boolean
    checkRole,        // (role: string) => boolean
  } = useAuth();

  return (
    <>
      {isLoading && <Spinner />}
      {user && <p>Hello {user.fullName}</p>}
      {checkPermission("admin.view") && <AdminPanel />}
    </>
  );
}
```

### `useLogin()` Hook

Use this in **login form components**.

```typescript
import { useLogin } from "@/hooks/useAuth-v2";

function LoginForm() {
  const loginMutation = useLogin();

  const handleSubmit = (credentials) => {
    loginMutation.mutate(credentials);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button disabled={loginMutation.isPending}>Login</button>
      {loginMutation.isError && <Error message="Login failed" />}
    </form>
  );
}
```

### `useLogout()` Hook

Use this in **logout buttons**.

```typescript
import { useLogout } from "@/hooks/useAuth-v2";

function LogoutButton() {
  const logoutMutation = useLogout();

  return (
    <button onClick={() => logoutMutation.mutate()}>
      Logout
    </button>
  );
}
```

## Token Lifecycle at a Glance

```
User Logs In
    ↓
Backend issues:
  - accessToken (15 min)
  - refreshToken (24h)
    ↓
Both stored as HTTPOnly cookies
    ↓
15 minutes pass
    ↓
User makes request
    ↓
Server: "Token expired"
    ↓
Client automatically calls /auth/refresh
    ↓
Server validates refreshToken
    ↓
Server issues new accessToken
    ↓
Client retries original request ✅
    ↓
User never notices!
```

## File Location Quick Reference

```
Authentication Entry Point:
- src/context/AuthContext.tsx

HTTP Client:
- src/lib/api-client-v2.ts

Auth Hooks:
- src/hooks/useAuth-v2.ts

API Service:
- src/services/auth.service.ts

Server-Side Validation:
- src/middleware.ts

Configuration Files:
- docs/AUTH_ARCHITECTURE.md
- docs/MIGRATION_GUIDE.md
```

## Common Patterns

### Pattern 1: Check Auth Before Rendering

```typescript
function ProtectedComponent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return null;

  return <div>Protected content</div>;
}
```

### Pattern 2: Role-Based Rendering

```typescript
function AdminPanel() {
  const { checkRole } = useAuth();

  if (!checkRole("admin")) return null;

  return <div>Admin tools</div>;
}
```

### Pattern 3: Permission-Based Rendering

```typescript
function ExpenseForm() {
  const { checkPermission } = useAuth();

  if (!checkPermission("expense.create")) {
    return <div>No permission</div>;
  }

  return <form>Create expense</form>;
}
```

### Pattern 4: Conditional Navigation

```typescript
function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  return <LandingPage />;
}
```

### Pattern 5: Manual Refetch

```typescript
function ProfilePage() {
  const { user, refetch } = useAuth();

  return (
    <div>
      <UserProfile user={user} />
      <button onClick={() => refetch()}>
        Refresh Profile
      </button>
    </div>
  );
}
```

## Response Types

### User Object

```typescript
{
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;                    // "admin" | "user"
  isSuspended: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  permissions?: string[];          // ["admin.view", "user.edit", ...]
  profilePictureUrl?: string;
  balance: string;
  accountNumber: string;
  providerName: string;
  createdAt: string;
  updatedAt: string;
}
```

### Login Response

```typescript
{
  success: boolean;
  message: string;
  data: {
    accessToken: string; // 15-minute token
    refreshToken: string; // 24-hour token
    user: User;
  }
}
```

## Error Handling

### Automatic Error Cases

These are handled by the auth system automatically:

1. **401 Unauthorized** → Attempts token refresh
2. **Refresh fails** → Redirects to login
3. **Session expires** → Clears state and redirects
4. **Logout fails** → Still logs out locally

### Manual Error Handling

```typescript
function LoginForm() {
  const loginMutation = useLogin();

  return (
    <>
      {loginMutation.isError && (
        <Alert type="error">
          {loginMutation.error?.response?.data?.message ||
           "Login failed"}
        </Alert>
      )}
    </>
  );
}
```

## Performance Tips

1. **Don't call useAuth multiple times in same component**

   ```typescript
   // ❌ Bad - called twice
   const auth1 = useAuth();
   const auth2 = useAuth();

   // ✅ Good - called once
   const auth = useAuth();
   ```

2. **Use checkPermission early to avoid rendering**

   ```typescript
   // ✅ Good - checks permission before rendering
   if (!user.permissions?.includes("admin")) return null;

   // ❌ Bad - renders then shows error
   return <AdminPanel />; // might fail
   ```

3. **Leverage caching to reduce requests**

   ```typescript
   // ✅ Good - uses 5-minute cache
   const { user } = useAuth(); // Second call uses cache

   // ❌ Bad - forced refetch on each page
   const { user, refetch } = useAuth();
   useEffect(() => refetch(), []); // Not necessary
   ```

4. **Batch permission checks**

   ```typescript
   // ✅ Good - one method call
   if (checkPermission("admin.view")) { ... }

   // ❌ Bad - multiple calls
   if (user?.permissions?.includes("admin.view")) { ... }
   if (user?.permissions?.includes("admin.edit")) { ... }
   if (user?.permissions?.includes("admin.delete")) { ... }
   ```

## Debugging Commands

In browser console:

```javascript
// Check current auth state
localStorage.getItem("auth_user_cache");

// Check cache timestamp
localStorage.getItem("auth_user_cache_time");

// Check cookies
document.cookie;

// Check if refresh token exists
document.cookie.includes("refreshToken");

// Clear all auth state
localStorage.removeItem("auth_user_cache");
localStorage.removeItem("auth_user_cache_time");
document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
```

## Timeouts & Intervals

```
Access Token:     15 minutes
Refresh Token:    24 hours
Cache Time:       5 minutes
GC Time:          10 minutes
Max Refresh Attempts: 2
```

## Status Codes

| Code | Meaning      | Action             |
| ---- | ------------ | ------------------ |
| 200  | Success      | Process response   |
| 401  | Unauthorized | Try refresh token  |
| 403  | Forbidden    | Show error to user |
| 404  | Not found    | Show error to user |
| 500  | Server error | Show error to user |

## Troubleshooting

| Problem                           | Solution                               |
| --------------------------------- | -------------------------------------- |
| User stays logged in after logout | Clear cookies manually                 |
| User data not updating            | Call refetch() manually                |
| Multiple refresh calls            | Check network tab, should be 1 per 401 |
| Token never refreshes             | Check if /auth/refresh endpoint exists |
| Infinite redirect loop            | Check middleware.ts configuration      |
| Cache never updates               | Reduce staleTime in useAuth hook       |

## Related Docs

- Full architecture: `docs/AUTH_ARCHITECTURE.md`
- Migration steps: `docs/MIGRATION_GUIDE.md`
