# Operator Management Implementation Plan

## 1. Overview

Implement Operator Management for the Admin Dashboard, allowing admins to view, create, and update network operators (e.g., MTN, Airtel, Glo).

**Reference**: `docs/ADMIN_GUIDE.md` (Section: Operator Management)

## 2. API Endpoints

| Method | Endpoint                       | Permission           | Description         |
| ------ | ------------------------------ | -------------------- | ------------------- |
| GET    | `/admin/operators`             | `operators.read.all` | Get all operators   |
| GET    | `/admin/operators/:operatorId` | `operators.read.all` | Get operator by ID  |
| POST   | `/admin/operators`             | `operators.create`   | Create new operator |
| PUT    | `/admin/operators/:operatorId` | `operators.update`   | Update operator     |

## 3. Implementation Checklist

- [x] Types: `operator.types.ts`
- [x] Service: `operator.service.ts`
- [x] Hooks: `useAdminOperators.ts`
- [x] Components: `OperatorListTable.tsx`, `OperatorDetailView.tsx`, `CreateOperatorForm.tsx`
- [x] Routes: list, detail, new
- [x] Sidebar: Add "Operators" to navigation
