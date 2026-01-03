# Settlement Management Implementation Plan

## 1. Overview

Implement Settlement Management for the Admin Dashboard, allowing admins to view, filter, and create settlements with providers.

**Reference**: `docs/ADMIN_GUIDE.md` (Section: Settlement Management)

## 2. API Endpoints

| Method | Endpoint                           | Permission             | Description                        |
| ------ | ---------------------------------- | ---------------------- | ---------------------------------- |
| GET    | `/admin/settlements`               | `settlements.read.all` | Get all settlements (with filters) |
| GET    | `/admin/settlements/:settlementId` | `settlements.read.all` | Get settlement by ID               |
| POST   | `/admin/settlements`               | `settlements.create`   | Create new settlement              |

### Query Parameters (GET list)

- `providerId` - Filter by provider
- `dateFrom` - Filter from date
- `dateTo` - Filter to date

### Create Request Body

```json
{
  "providerId": "string",
  "settlementDate": "string",
  "amount": "number",
  "fees": "number",
  "reference": "string",
  "rawReport": "object"
}
```

## 3. Architecture & Data Flow

### 3.1 Types (`src/types/admin/settlement.types.ts`)

```typescript
interface Settlement {
  id: string;
  providerId: string;
  providerName?: string;
  settlementDate: string;
  amount: number;
  fees: number;
  netAmount: number;
  reference: string;
  rawReport?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

interface SettlementListResponse {
  settlements: Settlement[];
}

interface SettlementQueryParams {
  providerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface CreateSettlementRequest {
  providerId: string;
  settlementDate: string;
  amount: number;
  fees: number;
  reference: string;
  rawReport?: Record<string, unknown>;
}
```

### 3.2 Service Layer (`src/services/admin/settlement.service.ts`)

- `getSettlements(params)` → GET `/admin/settlements`
- `getSettlementById(id)` → GET `/admin/settlements/:id`
- `createSettlement(data)` → POST `/admin/settlements`

### 3.3 React Query Hooks (`src/hooks/admin/useAdminSettlements.ts`)

- `useAdminSettlements(params)` - List with filters
- `useAdminSettlement(id)` - Single settlement
- `useCreateSettlement()` - Create mutation

## 4. Routes & Pages

| Route                               | Page                 | Description                    |
| ----------------------------------- | -------------------- | ------------------------------ |
| `/admin/dashboard/settlements`      | SettlementListPage   | All settlements with filtering |
| `/admin/dashboard/settlements/new`  | CreateSettlementPage | Create form                    |
| `/admin/dashboard/settlements/[id]` | SettlementDetailPage | Settlement details             |

## 5. UI/UX Components

### 5.1 SettlementListTable

- Columns: Provider, Date, Amount, Fees, Net, Reference, Actions
- Date range filter
- Provider filter (if available)
- View details action

### 5.2 SettlementDetailView

- Settlement metadata
- Amount breakdown (Amount, Fees, Net)
- Raw report JSON viewer
- Back to list

### 5.3 CreateSettlementForm

- Provider select
- Settlement date picker
- Amount input
- Fees input
- Reference input
- Raw report JSON editor (optional)

### 5.4 Sidebar Update

Add "Settlements" item to admin sidebar.

## 6. Implementation Checklist

### Phase 1: Types & Service ✅

- [x] Create `src/types/admin/settlement.types.ts`
- [x] Create `src/services/admin/settlement.service.ts`

### Phase 2: Hooks ✅

- [x] Create `src/hooks/admin/useAdminSettlements.ts`

### Phase 3: Components ✅

- [x] Create `SettlementListTable.tsx`
- [x] Create `SettlementDetailView.tsx`
- [x] Create `CreateSettlementForm.tsx`

### Phase 4: Routes ✅

- [x] Create settlements list page
- [x] Create settlement detail page
- [x] Create new settlement page

### Phase 5: Sidebar ✅

- [x] Add "Settlements" to navigation

## 7. Testing Strategy

### Manual Verification

1. Navigate to Settlements via sidebar
2. Verify list loads with date filters
3. Create a new settlement
4. View settlement details
5. Verify amount calculations
