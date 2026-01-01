# Admin API Guide

This document provides a comprehensive guide to the admin API endpoints available in the Nexus Data backend system. This guide is designed for frontend developers to understand how to interact with the admin endpoints.

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Dashboard & Analytics](#dashboard--analytics)
4. [Session Management](#session-management)
5. [Role Management](#role-management)
6. [Transaction Management](#transaction-management)
7. [Topup Request Management](#topup-request-management)
8. [Job Management](#job-management)
9. [Settlement Management](#settlement-management)
10. [Operator Management](#operator-management)
11. [Supplier Management](#supplier-management)
12. [Supplier Markup Management](#supplier-markup-management)
13. [Product Management](#product-management)
14. [Offer Management](#offer-management)
15. [Notification Management](#notification-management)
16. [Biometric Management](#biometric-management)
17. [Audit & Analytics](#audit--analytics)

## Authentication

All admin endpoints require authentication. You must include a valid JWT token in the Authorization header:

```javascript
headers: {
  'Authorization': 'Bearer ' + token,
  'Content-Type': 'application/json'
}
```

## User Management

### Get All Users

- **Endpoint**: `GET /api/v1/admin/users`
- **Permissions Required**: `users.read.all`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of users per page (default: 10)
- **Response**:

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "string",
        "full_name": "string",
        "email": "string",
        "phone_number": "string",
        "role": "string",
        "is_suspended": "boolean"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Get User by ID

- **Endpoint**: `GET /api/v1/admin/users/:userId`
- **Permissions Required**: `users.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "userId": "string",
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "role": "string",
    "isVerified": "boolean",
    "isSuspended": "boolean",
    "balance": "string"
  }
}
```

### Create User

- **Endpoint**: `POST /api/v1/admin/users`
- **Permissions Required**: `users.create`
- **Request Body**:

```json
{
  "email": "string",
  "password": "string",
  "phoneNumber": "string",
  "fullName": "string",
  "role": "admin|staff|user"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "id": "string",
    "email": "string"
  }
}
```

### Update User

- **Endpoint**: `PUT /api/v1/admin/users/:userId`
- **Permissions Required**: `users.update.all`
- **Request Body**:

```json
{
  "fullName": "string",
  "phoneNumber": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "userId": "string",
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "role": "string",
    "isVerified": "boolean",
    "isSuspended": "boolean",
    "balance": "string"
  }
}
```

### Suspend User

- **Endpoint**: `POST /api/v1/admin/users/:userId/suspend`
- **Permissions Required**: `users.update.all`
- **Response**:

```json
{
  "success": true,
  "message": "User suspended successfully"
}
```

### Unsuspend User

- **Endpoint**: `POST /api/v1/admin/users/:userId/unsuspend`
- **Permissions Required**: `users.update.all`
- **Response**:

```json
{
  "success": true,
  "message": "User unsuspended successfully"
}
```

### Credit User Wallet

- **Endpoint**: `POST /api/v1/admin/users/:userId/credit`
- **Permissions Required**: `users.update.all`
- **Request Body**:

```json
{
  "amount": "number"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Wallet credited successfully",
  "data": {
    "newBalance": "number"
  }
}
```

### Debit User Wallet

- **Endpoint**: `POST /api/v1/admin/users/:userId/debit`
- **Permissions Required**: `users.update.all`
- **Request Body**:

```json
{
  "amount": "number"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Wallet debited successfully",
  "data": {
    "newBalance": "number"
  }
}
```

### Disable 2FA for User

- **Endpoint**: `POST /api/v1/admin/users/:userId/disable-2fa`
- **Permissions Required**: `users.update.all`
- **Response**:

```json
{
  "success": true,
  "message": "2FA disabled successfully for user"
}
```

### Get Inactive Users

- **Endpoint**: `GET /api/v1/admin/users/inactive`
- **Permissions Required**: `users.read.all`
- **Query Parameters**:
  - `inactiveSince`: Date string in YYYY-MM-DD format
- **Response**:

```json
{
  "success": true,
  "message": "Inactive users retrieved successfully",
  "data": {
    "inactiveUsers": [
      {
        "id": "string",
        "full_name": "string",
        "email": "string",
        "phone_number": "string"
      }
    ]
  }
}
```

## Dashboard & Analytics

### Get Dashboard Stats

- **Endpoint**: `GET /api/v1/admin/dashboard/stats`
- **Permissions Required**: `system.settings`
- **Response**:

```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "totalUsers": "number",
    "totalTransactions": "number",
    "totalTopupRequests": "number"
  }
}
```

### Get Failed Jobs

- **Endpoint**: `GET /api/v1/admin/dashboard/failed-jobs`
- **Permissions Required**: `system.settings`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of jobs per page (default: 10)
- **Response**:

```json
{
  "success": true,
  "message": "Failed jobs retrieved successfully",
  "data": {
    "jobs": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

## Session Management

### Get User Sessions

- **Endpoint**: `GET /api/v1/admin/users/:userId/sessions`
- **Permissions Required**: `users.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "User sessions retrieved successfully",
  "data": {
    "sessions": [...]
  }
}
```

### Revoke User Sessions

- **Endpoint**: `DELETE /api/v1/admin/users/:userId/sessions`
- **Permissions Required**: `users.update.all`
- **Response**:

```json
{
  "success": true,
  "message": "Revoked X session(s) for user",
  "data": {
    "sessionsRevoked": "number"
  }
}
```

## Role Management

### Get All Roles

- **Endpoint**: `GET /api/v1/admin/roles`
- **Permissions Required**: `roles.assign`
- **Response**:

```json
{
  "success": true,
  "message": "Roles retrieved successfully",
  "data": {
    "roles": [...]
  }
}
```

### Assign Role to User

- **Endpoint**: `POST /api/v1/admin/assign-role`
- **Permissions Required**: `roles.assign`
- **Request Body**:

```json
{
  "userId": "string",
  "roleId": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Role assigned successfully",
  "data": {
    "userId": "string",
    "roleId": "string",
    "roleName": "string"
  }
}
```

## Transaction Management

### Get All Transactions

- **Endpoint**: `GET /api/v1/admin/transactions`
- **Permissions Required**: `transactions.read.all`
- **Query Parameters**:
  - `userId` (optional): Filter by user ID
  - `dateFrom` (optional): Filter from date
  - `dateTo` (optional): Filter to date
  - `direction` (optional): Filter by direction ('debit' or 'credit')
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of transactions per page (default: 10)
- **Response**:

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [...],
    "pagination": {...}
  }
}
```

### Get Transaction by ID

- **Endpoint**: `GET /api/v1/admin/transactions/:transactionId`
- **Permissions Required**: `transactions.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "Transaction retrieved successfully",
  "data": {
    "transaction": {...}
  }
}
```

## Topup Request Management

### Get All Topup Requests

- **Endpoint**: `GET /api/v1/admin/topup-requests`
- **Permissions Required**: `topup-requests.read.all`
- **Query Parameters**:
  - `status` (optional): Filter by status ('pending', 'completed', 'failed', 'cancelled')
  - `userId` (optional): Filter by user ID
  - `dateFrom` (optional): Filter from date
  - `dateTo` (optional): Filter to date
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of requests per page (default: 10)
- **Response**:

```json
{
  "success": true,
  "message": "Topup requests retrieved successfully",
  "data": {
    "requests": [...],
    "pagination": {...}
  }
}
```

### Get Topup Request by ID

- **Endpoint**: `GET /api/v1/admin/topup-requests/:requestId`
- **Permissions Required**: `topup-requests.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "Topup request retrieved successfully",
  "data": {
    "request": {...}
  }
}
```

### Retry Topup Request

- **Endpoint**: `POST /api/v1/admin/topup-requests/:requestId/retry`
- **Permissions Required**: `topup-requests.update`
- **Response**:

```json
{
  "success": true,
  "message": "Topup request retry initiated successfully"
}
```

## Job Management

### Get All Jobs

- **Endpoint**: `GET /api/v1/admin/jobs/all`
- **Permissions Required**: `system.settings`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of jobs per page (default: 10)
- **Response**:

```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [...],
    "pagination": {...}
  }
}
```

### Get Job by ID

- **Endpoint**: `GET /api/v1/admin/jobs/:jobId`
- **Permissions Required**: `system.settings`
- **Response**:

```json
{
  "success": true,
  "message": "Job retrieved successfully",
  "data": {
    "job": {...}
  }
}
```

## Settlement Management

### Get All Settlements

- **Endpoint**: `GET /api/v1/admin/settlements`
- **Permissions Required**: `settlements.read.all`
- **Query Parameters**:
  - `providerId` (optional): Filter by provider ID
  - `dateFrom` (optional): Filter from date
  - `dateTo` (optional): Filter to date
- **Response**:

```json
{
  "success": true,
  "message": "Settlements retrieved successfully",
  "data": {
    "settlements": [...]
  }
}
```

### Get Settlement by ID

- **Endpoint**: `GET /api/v1/admin/settlements/:settlementId`
- **Permissions Required**: `settlements.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "Settlement retrieved successfully",
  "data": {
    "settlement": {...}
  }
}
```

### Create Settlement

- **Endpoint**: `POST /api/v1/admin/settlements`
- **Permissions Required**: `settlements.create`
- **Request Body**:

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

- **Response**:

```json
{
  "success": true,
  "message": "Settlement created successfully",
  "data": {
    "settlement": {...}
  }
}
```

## Operator Management

### Get All Operators

- **Endpoint**: `GET /api/v1/admin/operators`
- **Permissions Required**: `operators.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "Operators retrieved successfully",
  "data": {
    "operators": [...]
  }
}
```

### Get Operator by ID

- **Endpoint**: `GET /api/v1/admin/operators/:operatorId`
- **Permissions Required**: `operators.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "Operator retrieved successfully",
  "data": {
    "operator": {...}
  }
}
```

### Create Operator

- **Endpoint**: `POST /api/v1/admin/operators`
- **Permissions Required**: `operators.create`
- **Request Body**:

```json
{
  "code": "string",
  "name": "string",
  "isoCountry": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Operator created successfully",
  "data": {
    "operator": {...}
  }
}
```

### Update Operator

- **Endpoint**: `PUT /api/v1/admin/operators/:operatorId`
- **Permissions Required**: `operators.update`
- **Request Body**:

```json
{
  "name": "string",
  "isoCountry": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Operator updated successfully",
  "data": {
    "operator": {...}
  }
}
```

## Supplier Management

### Get All Suppliers

- **Endpoint**: `GET /api/v1/admin/suppliers`
- **Permissions Required**: `suppliers.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "Suppliers retrieved successfully",
  "data": {
    "suppliers": [...]
  }
}
```

### Get Supplier by ID

- **Endpoint**: `GET /api/v1/admin/suppliers/:supplierId`
- **Permissions Required**: `suppliers.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "Supplier retrieved successfully",
  "data": {
    "supplier": {...}
  }
}
```

### Create Supplier

- **Endpoint**: `POST /api/v1/admin/suppliers`
- **Permissions Required**: `suppliers.create`
- **Request Body**:

```json
{
  "name": "string",
  "slug": "string",
  "apiBase": "string",
  "apiKey": "string",
  "priorityInt": "number",
  "isActive": "boolean"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "supplier": {...}
  }
}
```

### Update Supplier

- **Endpoint**: `PUT /api/v1/admin/suppliers/:supplierId`
- **Permissions Required**: `suppliers.update`
- **Request Body**:

```json
{
  "name": "string",
  "apiBase": "string",
  "apiKey": "string",
  "priorityInt": "number",
  "isActive": "boolean"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Supplier updated successfully",
  "data": {
    "supplier": {...}
  }
}
```

## Supplier Markup Management

### List All Supplier Markups

- **Endpoint**: `GET /api/v1/admin/supplier-markups`
- **Permissions Required**: `supplier-markup.read`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of markups per page (default: 10)
  - `supplierId` (optional): Filter by supplier ID
- **Response**:

```json
{
  "success": true,
  "message": "Supplier markups retrieved successfully",
  "data": {
    "markups": [...],
    "pagination": {...}
  }
}
```

### Create Supplier Markup

- **Endpoint**: `POST /api/v1/admin/supplier-markups`
- **Permissions Required**: `supplier-markup.create`
- **Request Body**:

```json
{
  "supplierId": "string",
  "operatorProductId": "string",
  "markupPercent": "number",
  "validFrom": "string",
  "validUntil": "string",
  "description": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Supplier markup created successfully",
  "data": {
    "markup": {...}
  }
}
```

### Get Supplier Markup by ID

- **Endpoint**: `GET /api/v1/admin/supplier-markups/:id`
- **Permissions Required**: `supplier-markup.read`
- **Response**:

```json
{
  "success": true,
  "message": "Markup retrieved successfully",
  "data": {
    "markup": {...}
  }
}
```

### Update Supplier Markup

- **Endpoint**: `PUT /api/v1/admin/supplier-markups/:id`
- **Permissions Required**: `supplier-markup.update`
- **Request Body**:

```json
{
  "markupPercent": "number",
  "validFrom": "string",
  "validUntil": "string",
  "description": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Markup updated successfully",
  "data": {
    "markup": {...}
  }
}
```

### Delete Supplier Markup

- **Endpoint**: `DELETE /api/v1/admin/supplier-markups/:id`
- **Permissions Required**: `supplier-markup.delete`
- **Response**:

```json
{
  "success": true,
  "message": "Markup deleted successfully",
  "data": {...}
}
```

### Activate Supplier Markup

- **Endpoint**: `PATCH /api/v1/admin/supplier-markups/:id/activate`
- **Permissions Required**: `supplier-markup.update`
- **Response**:

```json
{
  "success": true,
  "message": "Markup activated successfully",
  "data": {
    "markup": {...}
  }
}
```

### Deactivate Supplier Markup

- **Endpoint**: `PATCH /api/v1/admin/supplier-markups/:id/deactivate`
- **Permissions Required**: `supplier-markup.update`
- **Response**:

```json
{
  "success": true,
  "message": "Markup deactivated successfully",
  "data": {
    "markup": {...}
  }
}
```

### Get Supplier Markups

- **Endpoint**: `GET /api/v1/admin/suppliers/:supplierId/markups`
- **Permissions Required**: `supplier-markup.read`
- **Response**:

```json
{
  "success": true,
  "message": "Supplier markups retrieved successfully",
  "data": {
    "markups": [...]
  }
}
```

## Product Management

### Get All Products

- **Endpoint**: `GET /api/v1/admin/products`
- **Permissions Required**: `products.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "products": [...]
  }
}
```

### Get Product by ID

- **Endpoint**: `GET /api/v1/admin/products/:productId`
- **Permissions Required**: `products.read.all`
- **Response**:

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "product": {...}
  }
}
```

### Create Product

- **Endpoint**: `POST /api/v1/admin/products`
- **Permissions Required**: `products.create`
- **Request Body**:

```json
{
  "operatorId": "string",
  "productCode": "string",
  "name": "string",
  "productType": "string",
  "denomAmount": "number",
  "dataMb": "number",
  "validityDays": "number",
  "isActive": "boolean",
  "metadata": "object",
  "supplierId": "string",
  "supplierProductCode": "string",
  "supplierPrice": "number",
  "minOrderAmount": "number",
  "maxOrderAmount": "number",
  "leadTimeSeconds": "number",
  "mappingIsActive": "boolean"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Product (and optionally mapping) created successfully",
  "data": {
    "product": {...},
    "mapping": {...}
  }
}
```

### Update Product

- **Endpoint**: `PUT /api/v1/admin/products/:productId`
- **Permissions Required**: `products.update`
- **Request Body**:

```json
{
  "name": "string",
  "productCode": "string",
  "productType": "string",
  "denomAmount": "number",
  "dataMb": "number",
  "validityDays": "number",
  "isActive": "boolean",
  "metadata": "object"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {...}
  }
}
```

### Map Product to Supplier

- **Endpoint**: `POST /api/v1/admin/products/:productId/map-to-supplier`
- **Permissions Required**: `products.update`
- **Request Body**:

```json
{
  "supplierId": "string",
  "supplierProductCode": "string",
  "supplierPrice": "number",
  "minOrderAmount": "number",
  "maxOrderAmount": "number",
  "leadTimeSeconds": "number",
  "isActive": "boolean"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Product mapped to supplier successfully",
  "data": {
    "mapping": {...}
  }
}
```

## Offer Management

### Compute Offer Segment

- **Endpoint**: `POST /api/v1/admin/offers/:offerId/compute-segment`
- **Permissions Required**: `offer.admin`
- **Response**:

```json
{
  "success": true,
  "message": "Segment computed",
  "data": {
    "total": "number"
  }
}
```

### Get Offer Segment Members

- **Endpoint**: `GET /api/v1/admin/offers/:offerId/eligible-users`
- **Permissions Required**: `offer.read`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of users per page (default: 50)
- **Response**:

```json
{
  "success": true,
  "message": "Segment members retrieved",
  "data": {
    "members": [...],
    "total": "number"
  }
}
```

### Preview Offer Eligibility

- **Endpoint**: `GET /api/v1/admin/offers/:offerId/preview-eligibility`
- **Permissions Required**: `offer.read`
- **Query Parameters**:
  - `limit` (optional): Number of sample users (default: 100)
- **Response**:

```json
{
  "success": true,
  "message": "Preview eligibility retrieved",
  "data": {
    "preview": [...]
  }
}
```

### Create Offer Redemptions Job

- **Endpoint**: `POST /api/v1/admin/offers/:offerId/redemptions`
- **Permissions Required**: `offer.redeem`
- **Request Body**:

```json
{
  "userIds": ["string"],
  "fromSegment": "boolean",
  "price": "number",
  "discount": "number"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Bulk redemption job created",
  "data": {
    "jobId": "string"
  }
}
```

## Notification Management

### Create Notification

- **Endpoint**: `POST /api/v1/admin/notifications`
- **Permissions Required**: `create.notification`
- **Request Body**:

```json
{
  "title": "string",
  "body": "string",
  "type": "info|success|warning|error|alert",
  "category": "string",
  "targetCriteria": "object",
  "publish_at": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Notification created",
  "data": {
    "notification": {...}
  }
}
```

### List All Notifications

- **Endpoint**: `GET /api/v1/admin/notifications`
- **Permissions Required**: `view.notification`
- **Query Parameters**:
  - `limit` (optional): Items per page (default: 50)
  - `offset` (optional): Pagination offset (default: 0)
  - `archived` (optional): Include archived notifications
- **Response**:

```json
{
  "success": true,
  "message": "List of notifications",
  "data": {
    "notifications": [...]
  }
}
```

### Edit Notification

- **Endpoint**: `PATCH /api/v1/admin/notifications/:notificationId`
- **Permissions Required**: `update.notification`
- **Request Body**:

```json
{
  "title": "string",
  "body": "string",
  "type": "info|success|warning|error|alert",
  "category": "string",
  "publish_at": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Notification updated",
  "data": {
    "notification": {...}
  }
}
```

### Archive Notification

- **Endpoint**: `DELETE /api/v1/admin/notifications/:notificationId`
- **Permissions Required**: `delete.notification`
- **Response**:

```json
{
  "success": true,
  "message": "Notification archived"
}
```

### Create Notification from Template

- **Endpoint**: `POST /api/v1/admin/notifications/from-template`
- **Permissions Required**: `create.notification`
- **Request Body**:

```json
{
  "template_id": "string",
  "variables": "object",
  "category": "string",
  "type": "info|success|warning|error|alert",
  "targetCriteria": "object",
  "publish_at": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Notification created from template",
  "data": {
    "notification": {...}
  }
}
```

### Create Notification Template

- **Endpoint**: `POST /api/v1/admin/notifications/templates`
- **Permissions Required**: `manage.notification_templates`
- **Request Body**:

```json
{
  "name": "string",
  "title": "string",
  "body": "string",
  "type": "info|success|warning|error|alert",
  "category": "string",
  "variables": ["string"]
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Template created",
  "data": {
    "template": {...}
  }
}
```

### List Notification Templates

- **Endpoint**: `GET /api/v1/admin/notifications/templates`
- **Permissions Required**: `manage.notification_templates`
- **Response**:

```json
{
  "success": true,
  "message": "List of templates",
  "data": [
    {...}
  ]
}
```

## Biometric Management

### Get Biometric System Stats

- **Endpoint**: `GET /api/v1/admin/biometric/stats`
- **Permissions Required**: `biometric.audit`
- **Query Parameters**:
  - `hoursBack` (optional): Hours back to calculate stats for (default: 24)
- **Response**:

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "hoursBack": "number",
    "period_start": "string",
    "period_end": "string"
  }
}
```

### Get Biometric Audit Log for User

- **Endpoint**: `GET /api/v1/admin/biometric/audit-log/:userId`
- **Permissions Required**: `biometric.audit`
- **Query Parameters**:
  - `limit` (optional): Number of logs per page (default: 100)
  - `offset` (optional): Pagination offset (default: 0)
- **Response**:

```json
{
  "success": true,
  "message": "Audit logs retrieved successfully",
  "data": {
    "userId": "string",
    "logs": [...],
    "count": "number"
  }
}
```

### Get User Biometric Enrollments

- **Endpoint**: `GET /api/v1/admin/biometric/enrollments/:userId`
- **Permissions Required**: `biometric.audit`
- **Response**:

```json
{
  "success": true,
  "message": "Enrollments retrieved successfully",
  "data": {
    "userId": "string",
    "enrollments": [...],
    "count": "number",
    "active_count": "number"
  }
}
```

### Revoke All Biometric Enrollments for User

- **Endpoint**: `POST /api/v1/admin/biometric/revoke-all`
- **Permissions Required**: `biometric.admin.revoke_all`
- **Request Body**:

```json
{
  "userId": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Revoked X biometric enrollments",
  "data": {
    "userId": "string",
    "revokedCount": "number"
  }
}
```

## Notification Management

### Create Notification

- **Endpoint**: `POST /api/v1/admin/notifications`
- **Permissions Required**: `create.notification`
- **Request Body**:

```json
{
  "title": "string",
  "body": "string",
  "type": "info|success|warning|error|alert",
  "category": "string",
  "targetCriteria": "object",
  "publish_at": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Notification created",
  "data": {
    "notification": {...}
  }
}
```

### Create Scheduled Notification

- **Endpoint**: `POST /api/v1/admin/notifications/schedule`
- **Permissions Required**: `create.notification`
- **Request Body**:

```json
{
  "title": "string",
  "body": "string",
  "type": "info|success|warning|error|alert",
  "category": "string",
  "targetCriteria": "object",
  "publish_at": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Notification created (and sent immediately if publish_at is null or in the past)",
  "data": {
    "notification": {...}
  }
}
```

### Create Notification from Template

- **Endpoint**: `POST /api/v1/admin/notifications/from-template`
- **Permissions Required**: `create.notification`
- **Request Body**:

```json
{
  "template_id": "string",
  "variables": "object",
  "category": "string",
  "type": "info|success|warning|error|alert",
  "targetCriteria": "object",
  "publish_at": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Notification created from template",
  "data": {
    "notification": {...}
  }
}
```

### List All Notifications

- **Endpoint**: `GET /api/v1/admin/notifications`
- **Permissions Required**: `view.notification`
- **Query Parameters**:
  - `limit` (optional): Items per page (default: 50)
  - `offset` (optional): Pagination offset (default: 0)
  - `archived` (optional): Include archived notifications
- **Response**:

```json
{
  "success": true,
  "message": "List of notifications",
  "data": {
    "notifications": [...]
  }
}
```

### Edit Notification

- **Endpoint**: `PATCH /api/v1/admin/notifications/:notificationId`
- **Permissions Required**: `update.notification`
- **Request Body**:

```json
{
  "title": "string",
  "body": "string",
  "type": "info|success|warning|error|alert",
  "category": "string",
  "publish_at": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Notification updated",
  "data": {
    "notification": {...}
  }
}
```

### Archive Notification

- **Endpoint**: `DELETE /api/v1/admin/notifications/:notificationId`
- **Permissions Required**: `delete.notification`
- **Response**:

```json
{
  "success": true,
  "message": "Notification archived"
}
```

### Get Notification Analytics

- **Endpoint**: `GET /api/v1/admin/notifications/:notificationId/analytics`
- **Permissions Required**: `view.notification_analytics`
- **Response**:

```json
{
  "success": true,
  "message": "Analytics data for notification",
  "data": {
    "analytics": {...}
  }
}
```

### Create Notification Template

- **Endpoint**: `POST /api/v1/admin/notifications/templates`
- **Permissions Required**: `manage.notification_templates`
- **Request Body**:

```json
{
  "name": "string",
  "title": "string",
  "body": "string",
  "type": "info|success|warning|error|alert",
  "category": "string",
  "variables": ["string"]
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Template created",
  "data": {
    "template": {...}
  }
}
```

### List Notification Templates

- **Endpoint**: `GET /api/v1/admin/notifications/templates`
- **Permissions Required**: `manage.notification_templates`
- **Response**:

```json
{
  "success": true,
  "message": "List of templates",
  "data": [
    {...}
  ]
}
```

### Get Notification Template by ID

- **Endpoint**: `GET /api/v1/admin/notifications/templates/:templateId`
- **Permissions Required**: `manage.notification_templates`
- **Response**:

```json
{
  "success": true,
  "message": "Template details",
  "data": {
    "template": {...}
  }
}
```

### Update Notification Template

- **Endpoint**: `PUT /api/v1/admin/notifications/templates/:templateId`
- **Permissions Required**: `manage.notification_templates`
- **Request Body**:

```json
{
  "name": "string",
  "title": "string",
  "body": "string",
  "type": "info|success|warning|error|alert",
  "category": "string",
  "variables": ["string"]
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Template updated",
  "data": {
    "template": {...}
  }
}
```

### Delete Notification Template

- **Endpoint**: `DELETE /api/v1/admin/notifications/templates/:templateId`
- **Permissions Required**: `manage.notification_templates`
- **Response**:

```json
{
  "success": true,
  "message": "Template deleted"
}
```

## Rewards Management

### Check and Award Eligible Badges for User (Admin)

- **Endpoint**: `POST /api/v1/dashboard/rewards/check-badges`
- **Permissions Required**: `admin` role
- **Request Body**:

```json
{
  "userId": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Badge check completed",
  "data": {
    "awardedBadges": [...]
  }
}
```

### Credit Pending Points for User (Admin)

- **Endpoint**: `POST /api/v1/dashboard/rewards/credit-points`
- **Permissions Required**: `admin` role
- **Request Body**:

```json
{
  "userId": "string"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Points credited successfully",
  "data": {
    "newBalance": "number"
  }
}
```

### Create Referral Manually (Admin)

- **Endpoint**: `POST /api/v1/dashboard/referrals/_admin/create`
- **Permissions Required**: `admin` role
- **Request Body**:

```json
{
  "referrerUserId": "string",
  "referredUserId": "string",
  "initialAmount": "number"
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Referral created successfully",
  "data": {
    "referral": {...}
  }
}
```

### Mark Referral as Completed (Admin)

- **Endpoint**: `POST /api/v1/dashboard/referrals/:referralId/complete`
- **Permissions Required**: `admin` role
- **Response**:

```json
{
  "success": true,
  "message": "Referral completed successfully",
  "data": {
    "referral": {...}
  }
}
```

## Audit & Analytics

### Get User Analytics Overview

- **Endpoint**: `GET /api/v1/admin/analytics/users/overview`
- **Permissions Required**: `analytics.view_users`
- **Response**:

```json
{
  "success": true,
  "message": "User analytics retrieved successfully",
  "data": {
    "analytics": {...}
  }
}
```

### Get Transaction Analytics Overview

- **Endpoint**: `GET /api/v1/admin/analytics/transactions/overview`
- **Permissions Required**: `analytics.view_transactions`
- **Query Parameters**:
  - `fromDate` (optional): Start date
  - `toDate` (optional): End date
- **Response**:

```json
{
  "success": true,
  "message": "Transaction analytics retrieved successfully",
  "data": {
    "analytics": {...}
  }
}
```

### Get Transaction Trends

- **Endpoint**: `GET /api/v1/admin/analytics/transactions/trends`
- **Permissions Required**: `analytics.view_transactions`
- **Query Parameters**:
  - `fromDate` (required): Start date
  - `toDate` (required): End date
- **Response**:

```json
{
  "success": true,
  "message": "Transaction trends retrieved successfully",
  "data": {
    "trends": [...]
  }
}
```

### Get Topup Analytics Overview

- **Endpoint**: `GET /api/v1/admin/analytics/topup/overview`
- **Permissions Required**: `analytics.view_transactions`
- **Query Parameters**:
  - `fromDate` (optional): Start date
  - `toDate` (optional): End date
- **Response**:

```json
{
  "success": true,
  "message": "Topup analytics retrieved successfully",
  "data": {
    "analytics": {...}
  }
}
```

### Get Wallet Analytics Overview

- **Endpoint**: `GET /api/v1/admin/analytics/wallet/overview`
- **Permissions Required**: `analytics.view_transactions`
- **Response**:

```json
{
  "success": true,
  "message": "Wallet analytics retrieved successfully",
  "data": {
    "analytics": {...}
  }
}
```

### Get System Health

- **Endpoint**: `GET /api/v1/admin/analytics/system/health`
- **Permissions Required**: `analytics.view_system`
- **Response**:

```json
{
  "success": true,
  "message": "System health retrieved successfully",
  "data": {
    "health": {...}
  }
}
```

### Get Audit Log

- **Endpoint**: `GET /api/v1/admin/analytics/audit-log`
- **Permissions Required**: `audit.view_log`
- **Query Parameters**:
  - `adminId` (optional): Filter by admin ID
  - `actionType` (optional): Filter by action type
  - `targetUserId` (optional): Filter by target user ID
  - `fromDate` (optional): Start date
  - `toDate` (optional): End date
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Results per page (default: 50)
- **Response**:

```json
{
  "success": true,
  "message": "Audit log retrieved successfully",
  "data": {
    "logs": [...],
    "pagination": {...}
  }
}
```

### Get Recent Actions

- **Endpoint**: `GET /api/v1/admin/analytics/audit-log/recent`
- **Permissions Required**: `audit.view_log`
- **Query Parameters**:
  - `minutes` (optional): Look back period in minutes (default: 60)
- **Response**:

```json
{
  "success": true,
  "message": "Recent actions retrieved successfully",
  "data": {
    "entries": [...]
  }
}
```

### Get Audit Log Statistics

- **Endpoint**: `GET /api/v1/admin/analytics/audit-log/statistics`
- **Permissions Required**: `audit.view_log`
- **Query Parameters**:
  - `fromDate` (optional): Start date
  - `toDate` (optional): End date
- **Response**:

```json
{
  "success": true,
  "message": "Audit log statistics retrieved successfully",
  "data": {
    "stats": {...}
  }
}
```

### Export Audit Log

- **Endpoint**: `GET /api/v1/admin/analytics/audit-log/export`
- **Permissions Required**: `audit.export`
- **Query Parameters**:
  - `adminId` (optional): Filter by admin ID
  - `actionType` (optional): Filter by action type
  - `fromDate` (optional): Start date
  - `toDate` (optional): End date
- **Response**: JSON file download

### Get Admin Activity History

- **Endpoint**: `GET /api/v1/admin/analytics/admins/:adminId/activity`
- **Permissions Required**: `audit.view_log`
- **Query Parameters**:
  - `limit` (optional): Number of entries (default: 50)
- **Response**:

```json
{
  "success": true,
  "message": "Admin activity history retrieved successfully",
  "data": {
    "adminId": "string",
    "entries": [...]
  }
}
```

### Get Actions on User

- **Endpoint**: `GET /api/v1/admin/analytics/users/:userId/actions`
- **Permissions Required**: `audit.view_log`
- **Query Parameters**:
  - `limit` (optional): Number of entries (default: 100)
- **Response**:

```json
{
  "success": true,
  "message": "User actions retrieved successfully",
  "data": {
    "userId": "string",
    "entries": [...]
  }
}
```

## Frontend Integration Tips

1. **Error Handling**: Always handle potential errors from the API, including 401 (unauthorized), 403 (forbidden), and 500 (server errors).

2. **Loading States**: Implement loading states for all API calls to provide better UX.

3. **Pagination**: Use the pagination data returned by the API to implement proper pagination in your UI.

4. **Permissions**: Check user permissions before showing admin features in the UI.

5. **Token Expiry**: Implement token refresh logic to handle JWT expiration.

6. **Validation**: Validate user inputs on the frontend before sending requests to the API.

7. **Response Handling**: Always check the `success` field in the response before processing the data.

8. **Security**: Never expose sensitive data from the API in the frontend logs or console.
