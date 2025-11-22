# Auth System Visual Diagrams

## 1. Complete Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER INTERACTS WITH APP                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────┐
                    │  Is user authenticated?       │
                    │  (Check AuthContext)          │
                    └───────────────────────────────┘
                         ↙               ↘
                    YES ↙                 ↘ NO
                   ↙                       ↘
    ┌──────────────────────┐    ┌──────────────────────┐
    │ Render Protected      │    │ Redirect to /login   │
    │ Content              │    │ (middleware catches) │
    └──────────────────────┘    └──────────────────────┘
            ↓
    Make API Request
            ↓
    ┌───────────────────────────────┐
    │ Add Authorization Header      │
    │ (Request Interceptor)         │
    └───────────────────────────────┘
            ↓
    ┌───────────────────────────────┐
    │ Send request with cookies     │
    │ (accessToken + refreshToken)  │
    └───────────────────────────────┘
            ↓
    ┌───────────────────────────────┐
    │ Server processes request      │
    └───────────────────────────────┘
            ↓
            └──────┬──────────┐
                   ↓          ↓
            ┌────────────┐  ┌────────┐
            │ 200 OK     │  │ 401    │
            └────────────┘  │Expired │
                ↓           └────────┘
            SUCCESS              ↓
                            (Response Interceptor)
                                  ↓
                    ┌──────────────────────────┐
                    │ Is this an auth endpoint?│
                    └──────────────────────────┘
                         ↙               ↘
                    NO ↙                 ↘ YES
                   ↙                       ↘
    ┌──────────────────────┐    ┌──────────────────────┐
    │ Attempt token        │    │ Return 401 error     │
    │ refresh              │    │ (Don't refresh)      │
    │ (POST /auth/refresh) │    └──────────────────────┘
    └──────────────────────┘
            ↓
            └──────┬──────────┐
                   ↓          ↓
            ┌────────────┐  ┌────────┐
            │ 200 OK     │  │ 401    │
            └────────────┘  │Refresh │
                ↓           │Expired │
            New Token       └────────┘
                ↓                ↓
        Queue original      Max Attempts?
        request & retry     ↓
                ↓           ├─ NO: return 401
            Retry           ├─ YES: Session Expired
            ↓                   ↓
        200 OK              Clear Auth State
            ↓               Clear Cookies
        ✅ Success          ↓
            ↓               Redirect to /login
        Update Cache
            ↓
        ✅ Render with data
```

## 2. Token States Diagram

```
                          LOGIN
                           ↓
                    ┌─────────────────┐
                    │  Access Token   │
                    │  (15 min)       │
                    │  VALID          │
                    │  Status: ✅     │
                    └─────────────────┘
                           ↓
                      (15 minutes pass)
                           ↓
                    ┌─────────────────┐
                    │  Access Token   │
                    │  (0 min left)   │
                    │  EXPIRED        │
                    │  Status: ⚠️     │
                    └─────────────────┘
                           ↓
                 (Next API request triggers)
                           ↓
                    ┌─────────────────┐
                    │  Refresh Token  │
                    │  (24h)          │
                    │  VALID          │
                    │  Status: ✅     │
                    └─────────────────┘
                           ↓
                    (New Access Token issued)
                           ↓
                    ┌─────────────────┐
                    │  Access Token   │
                    │  (15 min)       │
                    │  VALID          │
                    │  Status: ✅     │ (cycle repeats)
                    └─────────────────┘


Alternative (After 24 hours):

                    ┌─────────────────┐
                    │  Refresh Token  │
                    │  (0h left)      │
                    │  EXPIRED        │
                    │  Status: ⚠️     │
                    └─────────────────┘
                           ↓
                (Cannot issue new token)
                           ↓
                    ┌─────────────────┐
                    │  Session State  │
                    │  EXPIRED        │
                    │  Status: ❌     │
                    └─────────────────┘
                           ↓
                    Redirect to login
```

## 3. Component Communication Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     ROOT LAYOUT                                  │
│  <AuthProvider>                                                  │
│    <QueryClientProvider>                                         │
│      <App />                                                     │
│    </QueryClientProvider>                                        │
│  </AuthProvider>                                                 │
└──────────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────┴──────────────────┐
        ↓                                     ↓
   ┌─────────────────┐             ┌──────────────────┐
   │  Dashboard      │             │  Login Page      │
   │  Page           │             │                  │
   │  useAuth() ───────────────────→ useLogin()       │
   │                │             │                  │
   │  Calls:        │             │  Calls:          │
   │  ├─ refetch()  │             │  ├─ mutate()     │
   │  ├─ check      │             │  │  (sends creds)│
   │  │  Permission │             │  │               │
   │  └─ checkRole()│             │  └─ Redirects   │
   │                │             │     to /dashboard│
   └─────────────────┘             └──────────────────┘
        ↓                                   ↓
        └───────────────┬───────────────────┘
                        ↓
              ┌──────────────────────┐
              │  AuthContext         │
              │  ├─ user             │
              │  ├─ isAuthenticated  │
              │  ├─ isLoading        │
              │  ├─ setUser()        │
              │  └─ markSessionAs    │
              │     Expired()        │
              └──────────────────────┘
                        ↓
              ┌──────────────────────┐
              │  React Query         │
              │  ├─ Cache (5 min)    │
              │  ├─ Stale Time (5m)  │
              │  └─ GC Time (10m)    │
              └──────────────────────┘
                        ↓
              ┌──────────────────────┐
              │  API Client          │
              │  ├─ Request Int.     │
              │  ├─ Response Int.    │
              │  ├─ Queue Mgmt       │
              │  └─ Session Track.   │
              └──────────────────────┘
```

## 4. Error Recovery Flowchart

```
                     API Request
                          ↓
                    Get Response
                          ↓
                ┌───────────────────┐
                │ Check Status Code │
                └───────────────────┘
                   ↓    ↓    ↓    ↓
              200  ↓    ↓    ↓    ↓ 401
                   ↓    ↓    ↓    ↓
         ┌─────────┘    ↓    ↓    ↓
         ↓             ↓    ↓    └──────────┐
      SUCCESS      4xx    5xx         (Response Interceptor)
         ↓         ERROR   ERROR            ↓
    Return Data   (Show    (Show      ┌──────────────────┐
                  Error)   Error)     │Check if auth ep. │
                                      └──────────────────┘
                                         ↓
                                    Is auth endpoint?
                                    ↙               ↘
                                 NO ↙               ↘ YES
                                                     ↘
                              ┌──────────────────┐   │
                              │Already refreshing?   │
                              └──────────────────┘   │
                                 ↙               ↘   │
                              NO ↙               ↘   │
                             ↙                    ↘ YES
                        ┌─────────────┐       ┌────────────────┐
                        │ Refresh     │       │ Queue request  │
                        │ Token       │       │ & wait for     │
                        │ (POST       │       │ refresh result │
                        │ /auth/      │       └────────────────┘
                        │ refresh)    │               ↓
                        └─────────────┘        (if refresh succeeds)
                             ↓                       ↓
                        ┌─────────────┐       ┌────────────────┐
                        │ Refresh OK? │       │ Retry original │
                        └─────────────┘       │ request with   │
                         ↙         ↘         │ new token      │
                      YES           NO       └────────────────┘
                       ↙             ↘
              ┌──────────────┐    ┌──────────────┐
              │ Retry        │    │ Failed 2x?   │
              │ original     │    └──────────────┘
              │ request      │       ↙        ↘
              └──────────────┘    NO ↙        ↘ YES
                    ↓                        ↓
                SUCCESS              ┌──────────────────┐
                  ↓                  │Session Expired   │
            ✅ Continue         ┌─→ ├─ Clear cookies   │
                                │   ├─ Clear cache    │
                                │   ├─ Mark as expired│
                                │   └─ Redirect login│
                                │
                        ┌────────┘
                        │
              Try refresh again
              (max 2 attempts)
```

## 5. Page Load Sequence Diagram

```
User Type: New User                User Type: Returning User
────────────────────────           ──────────────────────────

1. Navigate to /dashboard          1. Navigate to /dashboard
        ↓                                  ↓
2. Middleware checks tokens         2. Middleware checks tokens
   ├─ No accessToken                  ├─ Has accessToken
   ├─ No refreshToken                 ├─ Not expired
   └─ Redirect to /login              └─ Allow through
        ↓                                  ↓
3. Server sends /login              3. Root layout loads
   HTML                                  ├─ AuthProvider wraps
        ↓                                  ├─ QueryProvider wraps
4. Browser runs JS                      └─ App renders
   ├─ AuthProvider init                 ↓
   ├─ AuthContext empty               4. Dashboard component
   └─ Login page renders                  mounts
        ↓                                  ├─ useAuth() called
5. User enters credentials              ├─ React Query checks
        ↓                                  │  cache
6. useLogin() mutates                   ├─ Cache hit! (< 5min)
   ├─ POST /auth/login                 └─ User data from cache
   ├─ Backend issues tokens               ↓
   └─ Backend sets cookies            5. ✅ Component renders
        ↓                                  instantly
7. Browser receives response
   ├─ Cookies set                   Cache Miss Scenario:
   ├─ User data in response          ─────────────────────
   └─ AuthContext updated            1. Cache miss (> 5min)
        ↓                                  ↓
8. onSuccess callback                 2. useAuth() fetches
   ├─ Invalidate useAuth              ├─ GET /user/profile/me
   │  query                            ├─ Browser sends
   ├─ Redirect to /dashboard          │  accessToken cookie
   └─ React Query refetch             └─ Server returns user
        ↓                                  ↓
9. Dashboard loads with              3. Cache updated (5min)
   ├─ React Query cache               ↓
   └─ User data                       4. ✅ Component renders
        ↓                               with fresh data
10. ✅ Component renders
    instantly
```

## 6. Request Queuing During Refresh

```
SCENARIO: 3 Simultaneous Requests with Expired Token

Time T=0ms:
┌──────────────────────────────────────────┐
│  Request 1: GET /user/profile         │
│  Request 2: GET /transactions         │
│  Request 3: GET /wallet               │
└──────────────────────────────────────────┘
            ↓
   All hit 401 Unauthorized

T=50ms:
   ┌─────────────────────────────────────┐
   │ Interceptor Catches 1st 401         │
   │ ├─ Queues Request 1                 │
   │ ├─ Sets isRefreshing = true         │
   │ └─ Calls POST /auth/refresh         │
   └─────────────────────────────────────┘

T=75ms:
   ┌─────────────────────────────────────┐
   │ Interceptor Catches 2nd 401         │
   │ ├─ isRefreshing = true already      │
   │ ├─ Queues Request 2 (waits)         │
   │ └─ Doesn't call refresh again       │
   └─────────────────────────────────────┘

T=100ms:
   ┌─────────────────────────────────────┐
   │ Interceptor Catches 3rd 401         │
   │ ├─ isRefreshing = true already      │
   │ ├─ Queues Request 3 (waits)         │
   │ └─ Doesn't call refresh again       │
   └─────────────────────────────────────┘

T=150ms:
   ┌─────────────────────────────────────┐
   │ Refresh Response Received: 200 OK   │
   │ ├─ New accessToken set in cookie    │
   │ ├─ isRefreshing = false             │
   │ └─ Process queue...                 │
   └─────────────────────────────────────┘

T=151ms:
   ┌─────────────────────────────────────┐
   │ Retry Queued Requests               │
   │ ├─ Retry Request 1 + new token      │
   │ ├─ Retry Request 2 + new token      │
   │ └─ Retry Request 3 + new token      │
   └─────────────────────────────────────┘

T=200ms:
   ┌─────────────────────────────────────┐
   │ All 3 Requests Succeed              │
   │ ├─ Request 1: 200 OK ✅             │
   │ ├─ Request 2: 200 OK ✅             │
   │ └─ Request 3: 200 OK ✅             │
   └─────────────────────────────────────┘

RESULT:
   • 1 Refresh call (not 3!)
   • All requests wait and retry
   • Efficient, no thundering herd
   • User experience: seamless
```

## 7. Cache Lifecycle Diagram

```
                    Component Mounts
                          ↓
                    useAuth() called
                          ↓
                ┌────────────────────┐
                │ Check Cache        │
                └────────────────────┘
                   ↓              ↓
            Cache HIT?      Cache MISS?
                   ↓              ↓
         ┌────────────────┐  ┌──────────────┐
         │ Return cached  │  │ Fetch from   │
         │ data instantly │  │ server       │
         │ (< 5 minutes)  │  │ GET /me      │
         └────────────────┘  └──────────────┘
                   ↓              ↓
              Component        Update cache
              renders fast      Trigger render
                   ↓              ↓
            ✅ 500ms           Component
                               renders
                                   ↓
                              ✅ 1.5s
                                   ↓
                          ┌────────────────┐
                          │ Data is "fresh"│
                          │ for 5 minutes  │
                          └────────────────┘
                                   ↓
                     (5 minutes pass, data goes "stale")
                                   ↓
                          ┌────────────────┐
                          │ Next request?  │
                          └────────────────┘
                           ↙              ↘
                        NO ↙              ↘ YES
                                           ↘
                                   (Refetch in background)
                                           ↓
                                   (User doesn't wait)
                                           ↓
                                   ✅ Seamless update
```

## Legend

```
Symbol    Meaning
─────────────────
✅        Success / Working / Ready
⚠️        Warning / Expiring soon
❌        Error / Expired / Failed
→         Flow direction
↓         Down
↑         Up
↙         Down-left
↘         Down-right
│         Vertical connection
```

---

**These diagrams represent the complete auth flow in the new system.**
