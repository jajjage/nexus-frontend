# Two-Factor Authentication (2FA) API Guide

This document provides a comprehensive guide to the two-factor authentication (2FA) API endpoints available in the Nexus Data backend system. This guide is designed for frontend developers to understand how to implement 2FA functionality.

## Table of Contents

1. [Authentication](#authentication)
2. [2FA Setup](#2fa-setup)
3. [2FA Enable](#2fa-enable)
4. [2FA Disable](#2fa-disable)
5. [2FA Verification](#2fa-verification)
6. [2FA Status](#2fa-status)
7. [Frontend Integration Tips](#frontend-integration-tips)

## Authentication

All 2FA endpoints require authentication. You must include a valid JWT token in the Authorization header:

```javascript
headers: {
  'Authorization': 'Bearer ' + token,
  'Content-Type': 'application/json'
}
```

## 2FA Setup

### Initiate 2FA Setup

- **Endpoint**: `POST /api/v1/2fa/setup`
- **Authentication Required**: Yes
- **Role Requirements**: Only available for `admin` and `staff` roles
- **Description**: Initiates the 2FA setup process by generating a QR code and secret for the authenticator app
- **Response**:

```json
{
  "success": true,
  "message": "2FA setup initiated successfully",
  "data": {
    "qrCode": "string", // Base64 encoded QR code image
    "secret": "string" // Secret key for manual entry
  }
}
```

**Error Responses**:

- `400`: Authentication required
- `403`: 2FA setup is only available for admin and staff roles
- `400`: 2FA is already enabled for this account
- `500`: Internal server error

## 2FA Enable

### Enable 2FA with Verification Code

- **Endpoint**: `POST /api/v1/2fa/enable`
- **Authentication Required**: Yes
- **Role Requirements**: Only available for `admin` and `staff` roles
- **Rate Limiting**: Applied to prevent brute force attacks
- **Request Body**:

```json
{
  "totpCode": "string" // 6-digit TOTP code from authenticator app
}
```

- **Description**: Enables 2FA after verifying the TOTP code
- **Response**:

```json
{
  "success": true,
  "message": "2FA enabled successfully",
  "data": {
    "backupCodes": ["string"] // Array of backup codes for emergency access
  }
}
```

**Error Responses**:

- `400`: Authentication required
- `403`: 2FA is only available for admin and staff roles
- `404`: User not found
- `400`: 2FA is already enabled for this account
- `400`: Please initiate 2FA setup first
- `400`: TOTP code is required
- `400`: Invalid TOTP code
- `500`: Internal server error

## 2FA Disable

### Disable 2FA for User

- **Endpoint**: `POST /api/v1/2fa/disable`
- **Authentication Required**: Yes
- **Description**: Disables 2FA for the authenticated user
- **Response**:

```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

**Error Responses**:

- `401`: Authentication required
- `404`: User not found
- `400`: 2FA is not enabled for this account
- `500`: Internal server error

## 2FA Verification

### Verify 2FA Code

- **Endpoint**: `POST /api/v1/2fa/verify`
- **Authentication Required**: Yes
- **Rate Limiting**: Applied to prevent brute force attacks
- **Request Body**:

```json
{
  "totpCode": "string", // 6-digit TOTP code (optional if using backup code)
  "backupCode": "string" // Backup code (optional if using TOTP code)
}
```

- **Description**: Verifies a 2FA code (either TOTP or backup code)
- **Response**:

```json
{
  "success": true,
  "message": "2FA verification successful",
  "data": {}
}
```

**Error Responses**:

- `400`: Authentication required
- `404`: User not found
- `400`: 2FA is not enabled for this account
- `400`: Invalid backup code
- `400`: Invalid TOTP code
- `400`: Either TOTP code or backup code is required
- `500`: Internal server error

## 2FA Status

### Get 2FA Status

- **Endpoint**: `GET /api/v1/2fa/status`
- **Authentication Required**: Yes
- **Description**: Retrieves the 2FA status for the authenticated user
- **Response**:

```json
{
  "success": true,
  "message": "2FA status retrieved successfully",
  "data": {
    "enabled": "boolean", // Whether 2FA is enabled
    "roleRequires2FA": "boolean" // Whether the user's role requires 2FA
  }
}
```

**Error Responses**:

- `400`: Authentication required
- `404`: User not found
- `500`: Internal server error

## Frontend Integration Tips

1. **Role Restrictions**: Remember that 2FA setup is only available for `admin` and `staff` roles. Check the user's role before showing 2FA setup options.

2. **QR Code Display**: The QR code returned from the setup endpoint is base64 encoded. You'll need to display it as an image in your frontend.

3. **Backup Codes**: When 2FA is enabled, securely store or display the backup codes to the user. These are their only way to access their account if they lose their authenticator device.

4. **Rate Limiting**: Be aware of rate limiting on the enable and verify endpoints. Handle rate limit errors gracefully and inform the user.

5. **Error Handling**: Handle all possible error responses, especially:
   - Invalid TOTP codes
   - Already enabled/disabled states
   - Role restrictions

6. **User Experience**: Provide clear instructions for users during the 2FA setup process, including how to scan the QR code and store backup codes.

7. **Security**: Never log or store TOTP codes or backup codes in client-side storage.

8. **Validation**: Validate that the user enters a 6-digit numeric code for TOTP verification.

9. **State Management**: Keep track of the user's 2FA status in your application state to determine if additional verification is needed.

10. **Accessibility**: Ensure that users can manually enter the secret key if they cannot scan the QR code.
