# Industry-Standard Authentication Architecture for Next.js

## Overview

This document outlines the complete authentication lifecycle and best practices implemented in this application. This approach follows standards used by companies like Vercel, Next.js examples, and enterprise SaaS applications.

## Token Strategy

### Token Types & Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ACCESS TOKEN                     REFRESH TOKEN                 │
│  ─────────────────────────────    ─────────────────────────────│
│  Lifetime: 15 minutes             Lifetime: 24 hours            │
│  Storage: HTTPOnly Cookie         Storage: HTTPOnly Cookie      │
│  Use: Authorization header        Use: Token refresh endpoint    │
│  Risk: Low (short-lived)          Risk: Medium (long-lived)     │
│                                                                  │
│  Flow:                                                          │
│  1. User logs in → Backend issues both tokens                  │
│  2. Both stored as HTTPOnly cookies (secure, not JS accessible) │
│  3. Frontend attaches Access Token to requests                 │
│  4. After 15 min, Access Token expires → 401 response          │
│  5. Frontend calls /auth/refresh with Refresh Token            │
│  6. Backend validates Refresh Token → issues new Access Token  │
│  7. Cycle repeats                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Storage Strategy: HTTPOnly Cookies

**Why HTTPOnly?**

- ✅ Secure: JavaScript cannot access them (prevents XSS attacks)
- ✅ Automatic: Browser sends them with every request via `withCredentials`
- ✅ CSRF Protected: SameSite flag prevents CSRF attacks
- ❌ Downside: Cannot manually add to headers from JavaScript

**Why Not LocalStorage?**

- ❌ Vulnerable to XSS attacks
- ❌ Must manually add to headers
- ❌ More code to maintain
- ❌ Slower performance

## Request Flow

### Successful Request Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   REQUEST WITH VALID TOKEN                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User Action (GET /dashboard)                                │
│     ↓                                                            │
│  2. Browser sends request with cookies (withCredentials: true)   │
│     Authorization: Bearer {accessToken}  (from httpOnly cookie) │
│     ↓                                                            │
│  3. Server validates token                                       │
│     ↓                                                            │
│  4. Token valid? YES                                            │
│     ↓                                                            │
│  5. Return 200 OK with data                                     │
│     ↓                                                            │
│  6. Update React Query cache                                    │
│     ↓                                                            │
│  7. ✅ Component renders with data                              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Token Refresh Flow

```
┌──────────────────────────────────────────────────────────────────┐
│              REQUEST WITH EXPIRED TOKEN                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User Action (GET /dashboard)                                │
│     ↓                                                            │
│  2. Server receives request, checks token                        │
│     ↓                                                            │
│  3. Token expired? YES                                          │
│     ↓                                                            │
│  4. Return 401 Unauthorized                                     │
│     ↓                                                            │
│  5. Axios Response Interceptor catches 401                      │
│     ↓                                                            │
│  6. Queue this request (don't process yet)                      │
│     ↓                                                            │
│  7. Call POST /auth/refresh                                     │
│     - Browser sends Refresh Token cookie automatically          │
│     ↓                                                            │
│  8. Server validates Refresh Token                              │
│     ↓                                                            │
│  9. Valid? YES                                                  │
│     ↓                                                            │
│  10. Issue new Access Token                                     │
│      - Set new accessToken cookie in response                   │
│      ↓                                                           │
│  11. Browser receives response with new cookie                  │
│      ↓                                                           │
│  12. Retry original request (GET /dashboard) with new token     │
│      ↓                                                           │
│  13. Server validates new token                                 │
│      ↓                                                           │
│  14. Token valid? YES                                           │
│      ↓                                                           │
│  15. Return 200 OK with data                                    │
│      ↓                                                           │
│  16. ✅ Component renders with data                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Session Expiration Flow

```
┌──────────────────────────────────────────────────────────────────┐
│         REQUEST WITH BOTH TOKENS EXPIRED                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User Action (GET /dashboard)                                │
│     ↓                                                            │
│  2. Server receives request with expired Access Token           │
│     ↓                                                            │
│  3. Return 401 Unauthorized                                     │
│     ↓                                                            │
│  4. Axios Interceptor catches 401                               │
│     ↓                                                            │
│  5. Call POST /auth/refresh                                     │
│     - Browser sends expired Refresh Token cookie                │
│     ↓                                                            │
│  6. Server validates Refresh Token                              │
│     ↓                                                            │
│  7. Token expired? YES                                          │
│     ↓                                                            │
│  8. Return 401 (cannot refresh)                                 │
│     ↓                                                            │
│  9. Axios Interceptor catches this 401 on refresh endpoint      │
│     ↓                                                            │
│  10. Increment failed refresh count                             │
│      Max reached (2 attempts)? YES                              │
│      ↓                                                           │
│  11. Session is expired!                                        │
│      ↓                                                           │
│  12. Call sessionExpiredCallback()                              │
│      ↓                                                           │
│  13. Clear all auth state & cookies                             │
│      ↓                                                           │
│  14. Navigate to /login page                                    │
│      ↓                                                           │
│  15. ✅ User sees login page                                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Architecture Components

### 1. Proxy Layer (src/proxy.ts)

**Purpose**: Server-side validation BEFORE page renders

**Responsibilities**:

- ✅ Validate access token (is it expired?)
- ✅ Check refresh token exists (can we refresh?)
- ✅ Redirect to login if no valid auth
- ✅ Redirect authenticated users away from login page
- ✅ Enforce role-based path access

**When Runs**:

- Before every page load
- Before API routes execute
- Note: Uses `export default function proxy()` (not middleware)

**Benefits**:

- Prevents loading protected pages without auth
- No flashing of unauthorized content
- Fast redirect (no client-side latency)

### 2. Auth Context (src/context/AuthContext.tsx)

**Purpose**: Single source of truth for auth state

**Manages**:

- Current user profile
- Loading states
- Session expiration flag
- User cache (5-minute lifetime)

**Benefits**:

- Prevents multiple re-fetches
- Easy state updates across all components
- Centralized session management

### 3. API Client (src/lib/api-client-v2.ts)

**Purpose**: HTTP requests with automatic token refresh

**Features**:

1. **Request Interceptor**
   - Adds authorization headers
   - Adds cache-busting headers
   - Ensures every request has credentials

2. **Response Interceptor** - The most important part
   - Catches 401 responses
   - Attempts automatic token refresh
   - Queues failed requests during refresh
   - Prevents duplicate refresh calls
   - Limits refresh attempts to 2
   - Clears session on permanent failure

3. **Queue Management**
   - Multiple failed requests queue during refresh
   - All queued requests retry after refresh succeeds
   - If refresh fails, all queued requests fail

### 4. useAuth Hook (src/hooks/useAuth-v2.ts)

**Purpose**: React interface for authentication

**Key Features**:

1. **Smart Caching**
   - 5-minute stale time (prevents N+1 requests)
   - 10-minute garbage collection
   - No refetch on mount if cached
   - No refetch on window focus

2. **Error Handling**
   - Handles 401 from interceptor
   - Detects session expiration
   - Notifies context to redirect

3. **Available Methods**:
   ```typescript
   const {
     user, // Current user object
     isAuthenticated, // Boolean: is logged in?
     isLoading, // Boolean: fetching user?
     refetch, // Function: manually refetch
     checkPermission, // Function: has permission?
     checkRole, // Function: has role?
   } = useAuth();
   ```

## Best Practices Implemented

### 1. Token Refresh Limits

- **Max 2 refresh attempts** before considering session expired
- Prevents infinite loops
- Gracefully handles network issues

### 2. Request Queueing

- Multiple simultaneous 401 errors don't trigger multiple refresh calls
- Prevents "thundering herd" of refresh requests
- All queued requests retry with new token

### 3. Cache Strategy

- **5-minute stale time**: Good balance between freshness and performance
- **No refetch on mount**: Uses cache if available
- **No refetch on focus**: Reduces unnecessary requests
- **Reconnect refetch**: Only refetch if network issue

### 4. Centralized Session Management

- Auth Context holds all state
- No scattered state across components
- Easy to track session lifecycle

### 5. Secure Token Storage

- HTTPOnly cookies: JavaScript cannot access
- Automatic transmission: No manual header setting required
- CSRF protected: SameSite flag

## Common Scenarios

### Scenario 1: User Opens Dashboard

```
1. Middleware checks accessToken
2. Valid? → Allow through
3. Client renders Dashboard
4. useAuth hook runs
5. React Query fetches /user/profile/me
6. Cache response for 5 minutes
7. Component renders with user data
```

### Scenario 2: User Idle for 15+ Minutes

```
1. User interacts with app
2. Request fails with 401
3. Axios interceptor catches it
4. Calls /auth/refresh
5. Server validates 24h refresh token
6. Valid? → Issue new 15m access token
7. Original request retried
8. ✅ User doesn't notice (transparent)
```

### Scenario 3: User Idle for 24+ Hours

```
1. User interacts with app
2. Request fails with 401
3. Axios interceptor calls /auth/refresh
4. Refresh token expired → 401 response
5. Interceptor increments failure count
6. Count reaches 2 → Session expired
7. sessionExpiredCallback triggers
8. Context updates isSessionExpired = true
9. useAuth hook detects this
10. Redirects to /login
11. ✅ User sees login page
```

### Scenario 4: User Logs Out

```
1. User clicks Logout
2. useLogout hook runs
3. Makes DELETE /auth/logout request
4. Backend clears cookies
5. AuthContext clears user state
6. React Query cache cleared
7. Router redirects to /login
8. ✅ All state wiped clean
```

## File Structure

```
src/
├── context/
│   └── AuthContext.tsx              ← Global auth state
├── lib/
│   └── api-client-v2.ts            ← HTTP client with token refresh
├── hooks/
│   └── useAuth-v2.ts               ← React auth interface
├── services/
│   └── auth.service.ts             ← API endpoints
├── proxy.ts                         ← Server-side validation (NOT middleware.ts)
└── types/
    └── api.types.ts                ← TypeScript definitions
```

**Important**: Next.js now uses `proxy.ts` instead of the old `middleware.ts` naming convention.

## Migration Checklist

- [ ] Add AuthProvider to root layout
- [ ] Update imports to use api-client-v2
- [ ] Update imports to use useAuth-v2
- [ ] Update middleware.ts configuration
- [ ] Test login flow
- [ ] Test token refresh (wait 15 min)
- [ ] Test session expiration (set tokens to expire)
- [ ] Test concurrent requests
- [ ] Test logout
- [ ] Verify no console errors

## Performance Metrics

**Target Metrics**:

- First load: < 1.5s (with user fetch)
- Dashboard load (cached): < 500ms
- Token refresh: < 200ms
- Session detection: < 100ms

**Current Implementation**:

- ✅ No unnecessary re-renders
- ✅ Minimal API calls
- ✅ Efficient queue management
- ✅ Server-side redirect optimization

## Security Checklist

- ✅ HTTPOnly cookies (XSS protected)
- ✅ SameSite flag (CSRF protected)
- ✅ HTTPS only in production
- ✅ No token in localStorage
- ✅ No token in request body
- ✅ Refresh token rotation (handled by backend)
- ✅ Secure refresh endpoint (POST only)
- ✅ No token logging in console (debug logs only)

## Troubleshooting

### Issue: Users logged out unexpectedly

**Cause**: Refresh token expired or not set correctly
**Solution**: Check backend cookie settings, ensure refresh token has 24h expiry

### Issue: Infinite redirect loop

**Cause**: Middleware and client-side both redirecting
**Solution**: Middleware should handle initial auth check, client-side handles subsequent

### Issue: Multiple refresh attempts

**Cause**: Multiple 401s hitting interceptor before first refresh completes
**Solution**: Queue management should handle this - verify it's working

### Issue: Cache stale data longer than expected

**Cause**: Increased staleTime setting
**Solution**: Check React Query configuration, reduce staleTime if needed

## References

- [Next.js Authentication](https://nextjs.org/docs/authentication/fundamentals)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [React Query Documentation](https://tanstack.com/query/latest)
- [OWASP Token Security](https://owasp.org/www-community/attacks/xss/)
- [HTTPOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
