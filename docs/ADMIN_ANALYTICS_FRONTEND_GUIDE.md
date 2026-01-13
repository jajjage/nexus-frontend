# Admin Analytics: Frontend Integration Guide

This document provides details on the new and enhanced analytics endpoints available for the Admin Dashboard.

## Base URL

All endpoints are relative to: `/api/v1/admin/analytics`

## Authentication

All endpoints require a valid admin JWT token in the `Authorization` header:
`Authorization: Bearer <token>`

---

## 1. Today's Snapshot

**Endpoint:** `GET /today`
**Description:** Get a high-level summary of today's activity compared to yesterday. Perfect for dashboard overview cards.

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "transactions": {
      "count": 150,
      "volume": 45000.5,
      "profit": 2200.25,
      "successful": 145,
      "failed": 3,
      "pending": 2
    },
    "newUsers": 12,
    "activeUsers": 85,
    "walletDeposits": 65000.0,
    "walletWithdrawals": 12000.0,
    "revenueEstimate": 2200.25,
    "comparedToYesterday": {
      "transactionsDelta": 15,
      "transactionsDeltaPercent": "+11.1%",
      "volumeDelta": 5000.5,
      "volumeDeltaPercent": "+12.5%"
    }
  }
}
```

---

## 2. Daily Metrics Time Series

**Endpoint:** `GET /daily-metrics`
**Description:** Get trend data for charts (Transactions, User registrations, Wallet flow).

### Query Parameters

| Parameter     | Type     | Required | Description                      |
| :------------ | :------- | :------- | :------------------------------- |
| `fromDate`    | `string` | Yes      | Start date (YYYY-MM-DD)          |
| `toDate`      | `string` | Yes      | End date (YYYY-MM-DD)            |
| `granularity` | `string` | No       | `day` (default), `week`, `month` |

### Response `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-01-01",
      "transactions": {
        "count": 100,
        "volume": 25000,
        "successCount": 98,
        "failedCount": 1,
        "reversedCount": 1
      },
      "users": {
        "newRegistrations": 5,
        "activeUsers": 45
      },
      "wallet": {
        "deposits": 30000,
        "withdrawals": 5000,
        "netFlow": 25000
      },
      "topups": {
        "count": 100,
        "volume": 25000
      }
    }
  ]
}
```

---

## 3. Revenue & Profit Metrics

**Endpoint:** `GET /revenue`
**Description:** Financial health report including GMV, Revenue, and Profit breakdown.

### Query Parameters

| Parameter  | Type     | Required | Description                           |
| :--------- | :------- | :------- | :------------------------------------ |
| `fromDate` | `string` | No       | Start date (defaults to 1st of month) |
| `toDate`   | `string` | No       | End date (defaults to today)          |

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "period": { "from": "2026-01-01", "to": "2026-01-12" },
    "gmv": 1000000.0,
    "revenue": 50000.0,
    "profit": 35000.0,
    "profitMargin": "3.5%",
    "costBreakdown": {
      "supplierCosts": 950000.0,
      "paymentFees": 15000.0,
      "otherCosts": 0
    },
    "revenueByProduct": [
      {
        "productType": "data",
        "operator": "MTN",
        "gmv": 400000,
        "revenue": 20000,
        "margin": "5.0%"
      }
    ]
  }
}
```

---

## 4. Operator & Supplier Performance

**Endpoint:** `GET /operators/performance`
**Description:** Performance metrics for each operator/network.

### Query Parameters

| Parameter  | Type     | Required | Description |
| :--------- | :------- | :------- | :---------- |
| `fromDate` | `string` | No       | Start date  |
| `toDate`   | `string` | No       | End date    |

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "operators": [
      {
        "name": "MTN",
        "supplierSlug": "smeplug",
        "transactions": {
          "total": 500,
          "successful": 480,
          "failed": 20,
          "successRate": "96.0%"
        },
        "volume": {
          "total": 150000,
          "successful": 144000
        },
        "avgResponseTime": 0,
        "trend": {
          "volumeChange": "0%",
          "successRateChange": "0%"
        }
      }
    ]
  }
}
```

---

## 5. User Segmentation

**Endpoint:** `GET /users/segments`
**Description:** Distribution of users by activity levels and spending power.

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "byActivity": {
      "superActive": 15,
      "active": 45,
      "occasional": 120,
      "dormant": 300,
      "churned": 500
    },
    "bySpend": {
      "highValue": 10,
      "medium": 80,
      "low": 400
    },
    "byRegistration": {
      "last7Days": 25,
      "last30Days": 110,
      "last90Days": 450,
      "older": 1200
    }
  }
}
```

---

## 6. Transaction Overview (Enhanced)

**Endpoint:** `GET /transactions/overview`
**Description:** Enhanced overview adding `reversed` and `processing` statuses.

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "totalTransactions": 1500,
    "totalValue": 450000,
    "successRate": "94.5%",
    "breakdownByStatus": {
      "successful": 1410,
      "failed": 40,
      "pending": 30,
      "reversed": 15,
      "processing": 5
    },
    "valueByStatus": {
      "successful": 420000,
      "failed": 12000,
      "pending": 9000,
      "reversed": 4500,
      "processing": 1500
    }
  }
}
```
