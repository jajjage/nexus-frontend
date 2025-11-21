# Codebase Standards & Documentation Blueprint

## Overview

This document establishes the **standard pattern** for developing features and organizing documentation in the Nexus Data Frontend codebase. All new features **MUST** follow this exact structure.

---

## Table of Contents

1. [Folder Structure](#folder-structure)
2. [Feature Development Pattern](#feature-development-pattern)
3. [Documentation Requirements](#documentation-requirements)
4. [Implementation Checklist](#implementation-checklist)
5. [Examples](#examples)

---

## Folder Structure

### Root Organization

```
nexus-data-frontend/
├── src/
│   ├── components/
│   │   └── features/
│   │       └── [feature-name]/
│   │           ├── [component-1].tsx
│   │           └── [component-2].tsx
│   ├── hooks/
│   │   └── use[FeatureName].ts
│   ├── services/
│   │   └── [feature-name].service.ts
│   ├── types/
│   │   └── [feature-name].types.ts
│   └── lib/
│       └── [utility-files].ts
│
├── __test__/
│   ├── components/
│   │   └── features/
│   │       └── [feature-name]/
│   │           └── [component].test.ts
│   ├── hooks/
│   │   └── use[FeatureName].test.ts
│   ├── services/
│   │   └── [feature-name].service.test.ts
│   └── integration/
│       └── [feature-name].integration.test.ts
│
├── docs/
│   ├── CODEBASE_STANDARDS.md        (This file)
│   ├── CODEBASE_ARCHITECTURE.md
│   └── [feature-name]/
│       ├── README.md                (Start here)
│       ├── QUICK_START.md           (5-minute overview)
│       ├── IMPLEMENTATION_GUIDE.md  (Developers)
│       ├── ARCHITECTURE.md          (Technical deep dive)
│       ├── API_REFERENCE.md         (Functions/hooks)
│       ├── TESTING_GUIDE.md         (QA/Testers)
│       ├── TESTING_CHECKLIST.md     (Test cases)
│       ├── TROUBLESHOOTING.md       (Common issues)
│       └── EXAMPLES.md              (Code examples)
│
└── [other folders...]
```

---

## Feature Development Pattern

### Step 1: Create Feature Folder

When creating a new feature (e.g., `wallet`):

```bash
# Create folder structure
mkdir -p docs/wallet
mkdir -p __test__/services
mkdir -p __test__/integration
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/types
```

### Step 2: Implement Business Logic

#### **2a. Create Service Layer** (`src/services/[feature].service.ts`)

```typescript
/**
 * [Feature] Service
 *
 * Handles all API communication and business logic for [feature].
 * This is the single source of truth for [feature] operations.
 *
 * @see docs/[feature]/IMPLEMENTATION_GUIDE.md for detailed docs
 */

export const [feature]Service = {
  // Methods here
};
```

#### **2b. Create Types** (`src/types/[feature].types.ts`)

```typescript
/**
 * [Feature] Type Definitions
 *
 * All types used throughout the [feature] module.
 * Ensures type safety and consistency.
 */

export interface [FeatureModel] {
  // Properties
}
```

#### **2c. Create Hooks** (`src/hooks/use[Feature].ts`)

```typescript
/**
 * Custom React Hooks for [Feature]
 *
 * Combines service layer with React Query for state management.
 * Provides clean API for components.
 */

export const use[Feature] = () => {
  // Hook implementation
};
```

#### **2d. Create Components** (`src/components/features/[feature]/`)

```typescript
/**
 * [Feature] Components
 *
 * UI components for [feature].
 * Should be simple and use hooks from use[Feature].ts
 */

export function [ComponentName]() {
  // Component code
}
```

### Step 3: Create Tests

#### **3a. Unit Tests** (`__test__/services/[feature].service.test.ts`)

```typescript
/**
 * [Feature] Service Unit Tests
 *
 * Tests individual service methods.
 * Mocks all external dependencies.
 */

describe("[Feature] Service", () => {
  // Tests
});
```

#### **3b. Hook Tests** (`__test__/hooks/use[Feature].test.ts`)

```typescript
/**
 * [Feature] Hook Tests
 *
 * Tests React hooks and state management.
 * Includes React Query integration tests.
 */

describe("use[Feature]", () => {
  // Tests
});
```

#### **3c. Integration Tests** (`__test__/integration/[feature].integration.test.ts`)

```typescript
/**
 * [Feature] Integration Tests
 *
 * Tests complete user workflows.
 * Simulates real usage scenarios.
 */

describe("[Feature] Integration", () => {
  // Tests
});
```

### Step 4: Create Documentation

Create all documents in `docs/[feature]/`:

#### **4a. README.md** - Entry Point

```markdown
# [Feature] Documentation

**Start here.** Contains overview and links to all other docs.

## Quick Navigation

- New to this feature? → QUICK_START.md
- Want to implement? → IMPLEMENTATION_GUIDE.md
- Need API details? → API_REFERENCE.md
- Debugging issues? → TROUBLESHOOTING.md
- Writing tests? → TESTING_GUIDE.md
```

#### **4b. QUICK_START.md** - 5-Minute Overview

**Audience**: Everyone (developers, PMs, designers)

```markdown
# [Feature] Quick Start

## What is this feature?

[1-2 sentence explanation]

## How does it work? (User perspective)

[Simple 3-step user flow]

## Key files to know about

[List important files]

## Running the code

[Copy-paste command]

## Common tasks

[3-5 quick examples]
```

#### **4c. IMPLEMENTATION_GUIDE.md** - For Developers

**Audience**: Developers implementing the feature

```markdown
# [Feature] Implementation Guide

## Architecture

[How components fit together]

## Data flow

[Request → Service → Component flow]

## Service layer

[Available methods, parameters, return values]

## Hooks

[Available hooks, what they do, examples]

## State management

[How React Query is used]

## Error handling

[How errors are handled]

## Code examples

[Real code snippets]

## Common patterns

[Things developers should know]
```

#### **4d. ARCHITECTURE.md** - Technical Deep Dive

**Audience**: Architects, senior developers

```markdown
# [Feature] Architecture

## System design

[Detailed architecture diagrams]

## Data models

[Database schema, types]

## API contracts

[Request/response format]

## Integration points

[How feature connects to other features]

## Security considerations

[Auth, permissions, data protection]

## Performance optimizations

[Caching, memoization, etc.]

## Scalability considerations

[How will this scale?]
```

#### **4e. API_REFERENCE.md** - Function Documentation

**Audience**: Developers using the feature

```markdown
# [Feature] API Reference

## Services

### [Service].method()

[Detailed signature, parameters, return value, examples]

## Hooks

### use[Feature]()

[What it returns, when to use, examples]

## Components

### [Component]

[Props, behavior, examples]
```

#### **4f. TESTING_GUIDE.md** - How to Test

**Audience**: QA, test engineers, developers

```markdown
# [Feature] Testing Guide

## What should be tested?

[Overview of test strategy]

## Running tests

[Commands to run tests]

## Unit tests

[What's tested, how to add more]

## Integration tests

[Complete workflows being tested]

## Manual testing

[Step-by-step manual test procedures]

## Edge cases

[Scenarios that are tricky]
```

#### **4g. TESTING_CHECKLIST.md** - Detailed Test Cases

**Audience**: QA engineers, thorough reviewers

```markdown
# [Feature] Testing Checklist

## Test Coverage

- [ ] Test case 1
- [ ] Test case 2
- [ ] Test case 3

## Manual Testing

- [ ] Step 1: ...
- [ ] Step 2: ...

## Edge Cases

- [ ] Edge case 1
- [ ] Edge case 2
```

#### **4h. TROUBLESHOOTING.md** - Common Issues

**Audience**: Anyone debugging

```markdown
# [Feature] Troubleshooting

## Issue: X doesn't work

**Problem**: Description
**Solution**: How to fix
**Prevention**: How to avoid

## Common errors

[Error messages and solutions]

## FAQ

[Frequently asked questions]
```

#### **4i. EXAMPLES.md** - Code Examples

**Audience**: Developers learning by example

```markdown
# [Feature] Examples

## Basic usage

[Simple example]

## Advanced usage

[Complex example]

## Error handling

[Example with error handling]

## With multiple features

[Integration with other features]
```

---

## Documentation Requirements

### Every Feature MUST Include

```
✅ README.md                 - Entry point
✅ QUICK_START.md            - 5-minute overview
✅ IMPLEMENTATION_GUIDE.md   - For developers
✅ API_REFERENCE.md          - Function docs
✅ TESTING_GUIDE.md          - Testing overview
✅ TESTING_CHECKLIST.md      - Detailed test cases
✅ ARCHITECTURE.md           - Technical deep dive
✅ TROUBLESHOOTING.md        - Common issues
✅ EXAMPLES.md               - Code examples
```

### Audience-Specific Content

```
📖 For New Team Members:
   → README.md → QUICK_START.md → EXAMPLES.md

👨‍💻 For Developers:
   → QUICK_START.md → IMPLEMENTATION_GUIDE.md → API_REFERENCE.md

🏗️ For Architects:
   → README.md → ARCHITECTURE.md

🧪 For QA/Testers:
   → TESTING_GUIDE.md → TESTING_CHECKLIST.md

🐛 For Debugging:
   → TROUBLESHOOTING.md

🎓 For Learning:
   → QUICK_START.md → EXAMPLES.md
```

---

## Implementation Checklist

When creating a new feature, use this checklist:

### Code Implementation

- [ ] Service layer created (`src/services/[feature].service.ts`)
- [ ] Types defined (`src/types/[feature].types.ts`)
- [ ] Custom hooks created (`src/hooks/use[Feature].ts`)
- [ ] Components created (`src/components/features/[feature]/`)
- [ ] Error handling implemented
- [ ] Type safety verified

### Testing

- [ ] Unit tests written (`__test__/services/`)
- [ ] Hook tests written (`__test__/hooks/`)
- [ ] Integration tests written (`__test__/integration/`)
- [ ] Coverage > 85%
- [ ] All tests passing

### Documentation

- [ ] README.md created
- [ ] QUICK_START.md created
- [ ] IMPLEMENTATION_GUIDE.md created
- [ ] API_REFERENCE.md created
- [ ] ARCHITECTURE.md created
- [ ] TESTING_GUIDE.md created
- [ ] TESTING_CHECKLIST.md created
- [ ] TROUBLESHOOTING.md created
- [ ] EXAMPLES.md created
- [ ] All code has JSDoc comments

### Quality Assurance

- [ ] Code follows linting rules
- [ ] No TypeScript errors
- [ ] Manual testing completed
- [ ] Security review done
- [ ] Documentation reviewed

---

## Examples

### Example 1: Notification Feature (Existing)

**Folder Structure**:

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

### Example 2: Future Wallet Feature (Template)

**Folder Structure**:

```
docs/wallet/
├── README.md
├── QUICK_START.md
├── IMPLEMENTATION_GUIDE.md
├── ARCHITECTURE.md
├── API_REFERENCE.md
├── TESTING_GUIDE.md
├── TESTING_CHECKLIST.md
├── TROUBLESHOOTING.md
└── EXAMPLES.md

src/
├── services/wallet.service.ts
├── hooks/useWallet.ts
├── types/wallet.types.ts
└── components/features/wallet/

__test__/
├── services/wallet.service.test.ts
├── hooks/useWallet.test.ts
└── integration/wallet.integration.test.ts
```

### Example 3: Future Auth Feature (Template)

**Folder Structure**:

```
docs/auth/
├── README.md
├── QUICK_START.md
├── IMPLEMENTATION_GUIDE.md
├── ARCHITECTURE.md
├── API_REFERENCE.md
├── TESTING_GUIDE.md
├── TESTING_CHECKLIST.md
├── TROUBLESHOOTING.md
└── EXAMPLES.md

src/
├── services/auth.service.ts
├── hooks/useAuth.ts
├── types/auth.types.ts
└── components/features/auth/

__test__/
├── services/auth.service.test.ts
├── hooks/useAuth.test.ts
└── integration/auth.integration.test.ts
```

---

## Documentation Template

### README.md Template

````markdown
# [Feature Name]

## Overview

[2-3 sentences describing what this feature does]

## Documentation Structure

This documentation is organized for different audiences:

- **New to this feature?** → Start with [QUICK_START.md](QUICK_START.md)
- **Implementing the feature?** → Read [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- **Need API details?** → Check [API_REFERENCE.md](API_REFERENCE.md)
- **Writing tests?** → See [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Debugging issues?** → Go to [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Understanding architecture?** → Read [ARCHITECTURE.md](ARCHITECTURE.md)
- **Learning by example?** → Check [EXAMPLES.md](EXAMPLES.md)
- **Detailed test cases?** → See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)

## Quick Start

```bash
# Run the feature
pnpm dev

# Run tests
pnpm test -- [feature-name]
```
````

## Key Files

| File                                 | Purpose          |
| ------------------------------------ | ---------------- |
| `src/services/[feature].service.ts`  | Business logic   |
| `src/hooks/use[Feature].ts`          | React hooks      |
| `src/types/[feature].types.ts`       | Type definitions |
| `src/components/features/[feature]/` | UI components    |

## Architecture Overview

[Simple diagram or description]

## Common Tasks

1. [Task 1]
2. [Task 2]
3. [Task 3]

## Getting Help

- [FAQ](#faq)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Architecture](ARCHITECTURE.md)

```

---

## Best Practices

### Code Organization
- ✅ One service per feature
- ✅ One custom hook per major feature
- ✅ Types in separate file
- ✅ Components in feature folder
- ✅ Clear separation of concerns

### Documentation
- ✅ Write for your audience
- ✅ Include code examples
- ✅ Keep it up-to-date
- ✅ Link between documents
- ✅ Use consistent formatting
- ✅ Include diagrams where helpful

### Testing
- ✅ Unit tests for services
- ✅ Hook tests for React integration
- ✅ Integration tests for workflows
- ✅ Manual testing procedures
- ✅ >85% code coverage

### Naming Conventions

```

Services: [feature].service.ts
Hooks: use[Feature].ts or use[FeatureAction].ts
Types: [feature].types.ts
Components: [Feature][Action].tsx
Tests: [file].test.ts
Test files: [feature].integration.test.ts

```

---

## Folder Organization Rules

### Rule 1: Features Get Their Own Folder
```

✅ GOOD: docs/notification/
✅ GOOD: docs/wallet/
✅ GOOD: docs/auth/

❌ BAD: docs/notification_testing/
❌ BAD: docs/notification_implementation/

```

### Rule 2: Documentation Lives in `docs/[feature]/`
```

✅ GOOD:
docs/notification/
├── QUICK_START.md
├── IMPLEMENTATION_GUIDE.md
└── ...

❌ BAD:
docs/NOTIFICATION_QUICK_START.md
docs/NOTIFICATION_IMPLEMENTATION.md

```

### Rule 3: Tests Live Alongside Source Code Structure
```

✅ GOOD:
src/services/notification.service.ts
**test**/services/notification.service.test.ts

src/hooks/useAuth.ts
**test**/hooks/useAuth.test.ts

❌ BAD:
src/services/notification.service.ts
**test**/notification/notification.service.test.ts

```

### Rule 4: Feature Folders Are Self-Contained
```

✅ Feature has:

- src/services/[feature].service.ts
- src/hooks/use[Feature].ts
- src/types/[feature].types.ts
- src/components/features/[feature]/
- **test**/[corresponding files]
- docs/[feature]/[all docs]

```

---

## Migration Plan

For existing features:

1. **Notification Feature** (Completed ✅)
   - All docs in `docs/notification/`
   - Tests in `__test__/services/` and `__test__/integration/`
   - Follow this pattern for all new features

2. **Future Features** (Use this template)
   - Create `docs/[feature]/` folder
   - Follow folder structure exactly
   - Create all 9 documentation files
   - Organize tests matching this pattern

3. **Refactoring Existing Features**
   - Move docs to `docs/[feature]/` structure
   - Reorganize tests if needed
   - Update CODEBASE_ARCHITECTURE.md

---

## Validation Checklist

Before calling a feature "complete":

```

Code Quality:
✅ ESLint passes
✅ TypeScript no errors
✅ Tests pass (>85% coverage)
✅ No console errors
✅ Proper error handling

Documentation:
✅ README.md exists
✅ QUICK_START.md exists
✅ IMPLEMENTATION_GUIDE.md exists
✅ API_REFERENCE.md exists
✅ TESTING_GUIDE.md exists
✅ TESTING_CHECKLIST.md exists
✅ ARCHITECTURE.md exists
✅ TROUBLESHOOTING.md exists
✅ EXAMPLES.md exists
✅ All docs are readable and useful

Testing:
✅ Unit tests exist
✅ Hook tests exist
✅ Integration tests exist
✅ Manual test procedures documented
✅ Critical scenarios covered

Organization:
✅ Code in right folders
✅ Tests in right folders
✅ Docs in right folders
✅ Naming conventions followed
✅ No orphaned files

```

---

## Summary

This is the **blueprint for all future development**. Every feature must:

1. **Follow the folder structure** exactly
2. **Create all required documentation** (9 files)
3. **Write comprehensive tests** (unit, hook, integration)
4. **Organize by audience** (different docs for different people)
5. **Keep documentation updated** as code changes

This ensures:
- ✅ Consistency across the codebase
- ✅ Easy onboarding for new developers
- ✅ Clear responsibility and organization
- ✅ Complete documentation
- ✅ Professional quality
- ✅ Easy maintenance

---

## Questions?

Refer to:
- **Notification example**: `docs/notification/`
- **Architecture overview**: `docs/CODEBASE_ARCHITECTURE.md`
- **Folder structure**: Check `docs/` folder

Remember: **This is the standard. All new features must follow this exact pattern.**
```
