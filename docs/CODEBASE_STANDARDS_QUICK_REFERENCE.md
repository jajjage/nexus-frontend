# Codebase Standards - Visual Quick Reference

## The Pattern at a Glance

```
🏗️ EVERY FEATURE FOLLOWS THIS EXACT STRUCTURE:

docs/[feature]/
├── README.md ────────────────────── 📍 Entry point
├── QUICK_START.md ───────────────── ⚡ 5-min overview
├── IMPLEMENTATION_GUIDE.md ──────── 👨‍💻 For developers
├── ARCHITECTURE.md ──────────────── 🏛️ Technical deep dive
├── API_REFERENCE.md ─────────────── 📖 All functions
├── TESTING_GUIDE.md ─────────────── 🧪 How to test
├── TESTING_CHECKLIST.md ─────────── ✅ Test cases
├── TROUBLESHOOTING.md ───────────── 🔧 Common issues
└── EXAMPLES.md ──────────────────── 💡 Code examples

src/
├── services/[feature].service.ts ─ 🔧 Business logic
├── hooks/use[Feature].ts ───────── 🪝 React hooks
├── types/[feature].types.ts ────── 📝 Types
└── components/features/[feature]/ ┐ 🎨 UI components
                                   └─ [Component].tsx

__test__/
├── services/[feature].service.test.ts ─ Unit tests
├── hooks/use[Feature].test.ts ────────── Hook tests
└── integration/[feature].integration.test.ts ─ Full flows
```

---

## Documentation Audience Mapping

```
📊 WHO READS WHAT:

New Team Member
└─ README.md → QUICK_START.md → EXAMPLES.md → Ready! ✅

Feature Developer
└─ QUICK_START.md → IMPLEMENTATION_GUIDE.md → API_REFERENCE.md

Bug Hunter
└─ TROUBLESHOOTING.md → EXAMPLES.md → Fixed! ✅

QA Engineer
└─ TESTING_GUIDE.md → TESTING_CHECKLIST.md → Test complete! ✅

Tech Lead
└─ README.md → ARCHITECTURE.md → Understood! ✅

Learning by Example
└─ QUICK_START.md → EXAMPLES.md → Got it! ✅
```

---

## File Purposes (One-Liner Summary)

| File                        | Purpose                        | Audience        |
| --------------------------- | ------------------------------ | --------------- |
| **README.md**               | "What is this?"                | Everyone        |
| **QUICK_START.md**          | "Show me fast"                 | Busy developers |
| **IMPLEMENTATION_GUIDE.md** | "How do I build with this?"    | Developers      |
| **ARCHITECTURE.md**         | "How does it work internally?" | Architects      |
| **API_REFERENCE.md**        | "What functions exist?"        | Developers      |
| **TESTING_GUIDE.md**        | "How do I test this?"          | QA/Developers   |
| **TESTING_CHECKLIST.md**    | "What exactly should I test?"  | QA Engineers    |
| **TROUBLESHOOTING.md**      | "How do I fix this?"           | Everyone        |
| **EXAMPLES.md**             | "Show me code!"                | Developers      |

---

## Comparison: Notification Feature

### Current Structure (CORRECT ✅)

```
docs/notification/
├── README.md
├── QUICK_START.md
├── IMPLEMENTATION_GUIDE.md
├── ARCHITECTURE.md
├── API_REFERENCE.md
├── TESTING_GUIDE.md
├── TESTING_CHECKLIST.md
├── TROUBLESHOOTING.md
└── EXAMPLES.md

docs/test/notification/
├── TESTING_CHECKLIST.md
├── TESTING_IMPLEMENTATION_SUMMARY.md
├── TESTING_COMPLETION_REPORT.md
└── TESTING_QUICK_REFERENCE.md
```

**Better Organization (SUGGESTED)**:

```
docs/notification/
├── README.md
├── QUICK_START.md
├── IMPLEMENTATION_GUIDE.md
├── ARCHITECTURE.md
├── API_REFERENCE.md
├── TESTING/
│   ├── GUIDE.md
│   ├── CHECKLIST.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   └── COMPLETION_REPORT.md
├── TROUBLESHOOTING.md
└── EXAMPLES.md
```

---

## Implementation Workflow

### When Starting a New Feature

```
Step 1: Create Folders
  mkdir -p docs/[feature]
  mkdir -p src/services
  mkdir -p src/hooks
  mkdir -p src/types
  mkdir -p src/components/features/[feature]
  mkdir -p __test__/services
  mkdir -p __test__/integration

Step 2: Write Code
  ✏️ Create src/services/[feature].service.ts
  ✏️ Create src/types/[feature].types.ts
  ✏️ Create src/hooks/use[Feature].ts
  ✏️ Create src/components/features/[feature]/

Step 3: Write Tests
  ✏️ Create __test__/services/[feature].service.test.ts
  ✏️ Create __test__/hooks/use[Feature].test.ts
  ✏️ Create __test__/integration/[feature].integration.test.ts

Step 4: Write Documentation
  ✏️ README.md → QUICK_START.md → IMPLEMENTATION_GUIDE.md
  ✏️ ARCHITECTURE.md → API_REFERENCE.md
  ✏️ TESTING_GUIDE.md → TESTING_CHECKLIST.md
  ✏️ TROUBLESHOOTING.md → EXAMPLES.md

Step 5: Validate
  ✅ All tests pass
  ✅ All docs created
  ✅ Code is organized
  ✅ Ready for review!
```

---

## Naming Conventions

```
📝 FOLLOW THESE PATTERNS:

Services:
  notification.service.ts      ✅ GOOD
  Notification.service.ts      ❌ BAD
  notificationService.ts       ❌ BAD

Hooks:
  useNotification.ts           ✅ GOOD
  useNotificationService.ts    ✅ GOOD
  notification.hook.ts         ❌ BAD
  useNotification_sync.ts      ❌ BAD

Types:
  notification.types.ts        ✅ GOOD
  NotificationTypes.ts         ❌ BAD
  types/Notification.ts        ❌ BAD

Components:
  NotificationBell.tsx         ✅ GOOD
  notification-bell.tsx        ❌ BAD
  NotificationBellComponent.tsx ❌ BAD

Tests:
  notification.service.test.ts        ✅ GOOD
  notification.service.spec.ts        ✅ OK
  notificationService.test.ts         ❌ BAD
  notification-test.ts                ❌ BAD

Folders:
  docs/notification/           ✅ GOOD
  docs/Notification/           ❌ BAD
  docs/notification-service/   ❌ BAD

Documentation:
  QUICK_START.md               ✅ GOOD
  QuickStart.md                ❌ BAD
  quick_start.md               ❌ BAD
```

---

## Folder Organization Rules

### ✅ CORRECT

```
docs/
├── notification/           (one folder per feature)
│   ├── README.md          (all docs inside)
│   ├── QUICK_START.md
│   ├── IMPLEMENTATION_GUIDE.md
│   └── ...
└── wallet/
    ├── README.md
    ├── QUICK_START.md
    └── ...

src/
├── services/
│   ├── notification.service.ts    (one per feature)
│   ├── wallet.service.ts
│   └── auth.service.ts
├── hooks/
│   ├── useNotification.ts
│   ├── useWallet.ts
│   └── useAuth.ts
└── components/features/
    ├── notification/              (feature folder)
    │   └── NotificationBell.tsx
    ├── wallet/
    │   ├── WalletCard.tsx
    │   └── WalletHistory.tsx
    └── auth/
        ├── LoginForm.tsx
        └── RegisterForm.tsx

__test__/
├── services/
│   ├── notification.service.test.ts
│   ├── wallet.service.test.ts
│   └── auth.service.test.ts
├── hooks/
│   ├── useNotification.test.ts
│   ├── useWallet.test.ts
│   └── useAuth.test.ts
└── integration/
    ├── notification.integration.test.ts
    ├── wallet.integration.test.ts
    └── auth.integration.test.ts
```

### ❌ INCORRECT

```
docs/
├── NOTIFICATION_QUICK_START.md        (NO - mixed naming)
├── NOTIFICATION_GUIDE.md
├── WALLET_QUICK_START.md
└── WALLET_GUIDE.md

docs/
├── notification/
│   └── NOTIFICATION_QUICK_START.md    (NO - redundant naming)

docs/
├── notification/
│   ├── testing/
│   │   ├── CHECKLIST.md              (NO - segregates related docs)
│   │   └── GUIDE.md
│   └── implementation/
│       ├── GUIDE.md
│       └── EXAMPLES.md

src/
├── notificationService.ts             (NO - wrong naming)
├── useNotification_Service.ts         (NO - wrong naming)
└── notifications/                     (NO - wrong plural)
    └── NotificationBell.tsx
```

---

## Quick Checklist for New Features

```
Copy-paste this and check off as you go:

CODE
  ☐ Service created (src/services/[feature].service.ts)
  ☐ Types created (src/types/[feature].types.ts)
  ☐ Hooks created (src/hooks/use[Feature].ts)
  ☐ Components created (src/components/features/[feature]/)
  ☐ TypeScript errors resolved
  ☐ Linting passes

TESTS
  ☐ Unit tests (✅ >85% coverage)
  ☐ Hook tests (✅ >85% coverage)
  ☐ Integration tests (✅ >85% coverage)
  ☐ All tests passing

DOCUMENTATION
  ☐ README.md created
  ☐ QUICK_START.md created
  ☐ IMPLEMENTATION_GUIDE.md created
  ☐ ARCHITECTURE.md created
  ☐ API_REFERENCE.md created
  ☐ TESTING_GUIDE.md created
  ☐ TESTING_CHECKLIST.md created
  ☐ TROUBLESHOOTING.md created
  ☐ EXAMPLES.md created
  ☐ All files readable and useful

ORGANIZATION
  ☐ Code in right folder
  ☐ Tests in right folder
  ☐ Docs in right folder
  ☐ Naming conventions followed
  ☐ No orphaned files

QUALITY
  ☐ Code reviewed
  ☐ Tests verified
  ☐ Docs reviewed
  ☐ Ready to merge ✅
```

---

## Before & After: Notification Feature

### Before (Scattered Everywhere ❌)

```
Root level:
├── CODEBASE_ARCHITECTURE.md
├── FCM_NOTIFICATION_LIFECYCLE.md
├── NOTIFICATION_SERVICE_SUMMARY.md
├── README_FCM_IMPLEMENTATION.md
├── DEVELOPER_CHECKLIST.md
├── IMPLEMENTATION_EXAMPLES.md
├── FCM_ARCHITECTURE_DIAGRAMS.md
├── NOTIFICATION_IMPLEMENTATION_GUIDE.md
├── FCM_QUICK_REFERENCE.md
└── TESTING_QUICK_REFERENCE.md

docs/
└── test/notification/
    ├── TESTING_CHECKLIST.md
    ├── TESTING_COMPLETION_REPORT.md
    ├── TESTING_IMPLEMENTATION_SUMMARY.md
    └── TESTING_QUICK_REFERENCE.md
```

**Problems**:

- Files scattered across root and subdirectories
- Inconsistent naming
- Hard to find related docs
- No clear organization structure

### After (Organized ✅)

```
docs/notification/
├── README.md
├── QUICK_START.md
├── IMPLEMENTATION_GUIDE.md
├── ARCHITECTURE.md
├── API_REFERENCE.md
├── TESTING_GUIDE.md
├── TESTING_CHECKLIST.md
├── TESTING/
│   ├── COMPLETION_REPORT.md
│   └── IMPLEMENTATION_SUMMARY.md
├── TROUBLESHOOTING.md
└── EXAMPLES.md

src/
├── services/notification.service.ts
├── hooks/useSyncFcmOnMount.ts
├── types/notification.types.ts
└── components/features/notifications/

__test__/
├── services/notification.service.test.ts
├── hooks/useSyncFcmOnMount.test.ts
└── integration/notification.integration.test.ts
```

**Benefits**:

- ✅ All docs in one folder
- ✅ Consistent naming
- ✅ Easy to navigate
- ✅ Clear organization
- ✅ Scalable pattern

---

## For Different Roles

### 👨‍💻 Developer Starting New Feature

1. Read `docs/CODEBASE_STANDARDS.md` (this file)
2. Look at `docs/notification/` for reference
3. Create your feature folder structure
4. Copy docs from notification feature
5. Update with your feature info
6. Code away!

### 🏗️ Tech Lead Reviewing Feature

1. Check `docs/[feature]/README.md` exists
2. Verify all 9 doc files created
3. Scan `src/` folder structure
4. Verify tests in `__test__/`
5. Check code organization
6. Approve! ✅

### 🧪 QA Engineer Testing Feature

1. Open `docs/[feature]/TESTING_GUIDE.md`
2. Follow `docs/[feature]/TESTING_CHECKLIST.md`
3. Execute manual test steps
4. Report findings
5. Done! ✅

### 🆕 New Team Member Learning

1. Read `docs/[feature]/README.md`
2. Follow `docs/[feature]/QUICK_START.md`
3. Study `docs/[feature]/EXAMPLES.md`
4. Read `docs/[feature]/IMPLEMENTATION_GUIDE.md`
5. Ready to contribute! ✅

---

## Summary

**This is the blueprint. All features must follow this pattern:**

```
✅ FOLDER STRUCTURE
   └─ docs/[feature]/ with 9 specific files

✅ CODE ORGANIZATION
   └─ Service, types, hooks, components in proper folders

✅ TEST ORGANIZATION
   └─ Unit, hook, integration tests aligned with code structure

✅ DOCUMENTATION STRATEGY
   └─ One file per purpose, organized by audience

✅ NAMING CONVENTIONS
   └─ Consistent naming across all files and folders

✅ VALIDATION
   └─ Use checklist before calling feature complete
```

**Result**:

- 🎯 Consistent codebase
- 🧭 Easy navigation
- 📚 Complete documentation
- 🚀 Fast onboarding
- ✅ Professional quality

---

## Next Steps

1. **Reference this document** when creating new features
2. **Use notification feature** as the template/example
3. **Follow the checklist** for every new feature
4. **Keep this updated** as patterns evolve
5. **Hold team accountable** to these standards

**Remember: This is THE standard. No exceptions.**
