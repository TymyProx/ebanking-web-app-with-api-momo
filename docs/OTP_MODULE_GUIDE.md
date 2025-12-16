# OTP Module - Complete Guide

This guide explains how to use the OTP (One-Time Password) module to secure transactions and sensitive operations in the e-banking portal.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Components](#backend-components)
4. [Frontend Components](#frontend-components)
5. [Integration Examples](#integration-examples)
6. [API Reference](#api-reference)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The OTP module provides secure two-factor authentication for sensitive operations like:
- Bank transfers
- Beneficiary additions
- Payment confirmations
- Account modifications
- Card operations

**Features:**
- ✅ SMS and Email delivery
- ✅ Configurable expiration time
- ✅ Rate limiting (max attempts)
- ✅ Automatic OTP generation
- ✅ Resend functionality
- ✅ Beautiful UI components
- ✅ TypeScript support

---

## Architecture

### Flow Diagram

```
User Action → Generate OTP → Send SMS/Email → User Enters Code → Verify OTP → Execute Action
```

### Components

**Backend (API Server):**
- OTP Model (Database)
- OTP Repository (Data Access)
- OTP Service (Business Logic)
- OTP API Endpoints (REST)

**Frontend (E-Portal):**
- OTP Service (API Client)
- OTP Input Component (UI)
- OTP Modal Component (UI)

---

## Backend Components

### 1. Database Model

Location: `/backendebanking/src/database/models/otp.ts`

**Fields:**
- `code` - Hashed OTP code (bcrypt)
- `purpose` - Purpose of OTP (e.g., 'TRANSFER', 'PAYMENT')
- `referenceId` - Optional reference to transaction
- `phoneNumber` - User's phone number
- `email` - User's email (optional)
- `deliveryMethod` - SMS, EMAIL, or BOTH
- `attempts` - Number of verification attempts
- `maxAttempts` - Maximum allowed attempts (default: 3)
- `expiresInMinutes` - Expiration duration (default: 5)
- `expiresAt` - Actual expiration timestamp
- `verified` - Verification status
- `blocked` - Blocked due to max attempts

### 2. OTP Service

Location: `/backendebanking/src/services/otpService.ts`

**Key Methods:**

```typescript
// Generate and send OTP
async generate(options: OtpGenerateOptions): Promise<{
  success: boolean;
  otpId: string;
  expiresAt: Date;
}>

// Verify OTP code
async verify(options: OtpVerifyOptions): Promise<{
  success: boolean;
  verified: boolean;
  message?: string;
}>

// Resend OTP
async resend(purpose: string, referenceId?: string): Promise<{
  success: boolean;
  otpId: string;
  expiresAt: Date;
}>
```

### 3. API Endpoints

Base URL: `/api/otp`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/otp/generate` | POST | Generate and send OTP |
| `/api/otp/verify` | POST | Verify OTP code |
| `/api/otp/resend` | POST | Resend OTP |
| `/api/otp` | GET | List OTPs (admin) |

---

## Frontend Components

### 1. OTP Service

Location: `/ebanking-web-app-with-api-momo/lib/otp-service.ts`

**Usage:**

```typescript
import { OtpService } from '@/lib/otp-service'

// Generate OTP
const result = await OtpService.generate({
  purpose: 'TRANSFER',
  referenceId: 'TXN-12345',
  deliveryMethod: 'SMS',
})

// Verify OTP
const verifyResult = await OtpService.verify({
  code: '123456',
  purpose: 'TRANSFER',
  referenceId: 'TXN-12345',
})

// Resend OTP
const resendResult = await OtpService.resend('TRANSFER', 'TXN-12345')
```

### 2. OTP Input Component

Location: `/ebanking-web-app-with-api-momo/components/ui/otp-input.tsx`

**Features:**
- 6-digit input (configurable)
- Auto-focus and auto-advance
- Paste support
- Keyboard navigation (arrows, backspace)
- Disabled state
- Auto-complete callback

**Usage:**

```tsx
import { OtpInput } from '@/components/ui/otp-input'

<OtpInput
  length={6}
  value={otpValue}
  onChange={setOtpValue}
  onComplete={(code) => handleVerify(code)}
  autoFocus
/>
```

### 3. OTP Modal Component

Location: `/ebanking-web-app-with-api-momo/components/otp-modal.tsx`

**Features:**
- Complete OTP flow (generate → verify)
- Countdown timer
- Resend button (with cooldown)
- Error handling
- Success feedback
- Auto-generate on open

**Usage:**

```tsx
import { OtpModal } from '@/components/otp-modal'

<OtpModal
  open={showOtpModal}
  onOpenChange={setShowOtpModal}
  onVerified={handleOtpVerified}
  purpose="TRANSFER"
  referenceId="TXN-12345"
  title="Confirmer le virement"
  description="Entrez le code OTP pour confirmer"
  deliveryMethod="SMS"
  autoGenerate={true}
/>
```

---

## Integration Examples

### Example 1: Transfer with OTP

```tsx
"use client"

import { useState } from 'react'
import { OtpModal } from '@/components/otp-modal'
import { Button } from '@/components/ui/button'

export default function TransferPage() {
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [transferData, setTransferData] = useState<any>(null)

  // Step 1: Prepare transfer
  const handleSubmit = (data: any) => {
    setTransferData(data)
    setShowOtpModal(true)
  }

  // Step 2: Execute after OTP verification
  const handleOtpVerified = async () => {
    // Now execute the transfer
    await executeTransfer(transferData)
    setShowOtpModal(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Your transfer form */}
        <Button type="submit">Valider</Button>
      </form>

      <OtpModal
        open={showOtpModal}
        onOpenChange={setShowOtpModal}
        onVerified={handleOtpVerified}
        purpose="TRANSFER"
        referenceId={transferData?.id}
      />
    </>
  )
}
```

### Example 2: Payment Confirmation

```tsx
const handlePayment = async (paymentData: any) => {
  // Generate OTP
  const otpResult = await OtpService.generate({
    purpose: 'PAYMENT',
    referenceId: paymentData.id,
    deliveryMethod: 'BOTH', // SMS + Email
  })

  // Show OTP input
  setShowOtpModal(true)
}

const handleVerifyAndPay = async (code: string) => {
  try {
    // Verify OTP
    await OtpService.verify({
      code,
      purpose: 'PAYMENT',
      referenceId: paymentData.id,
    })

    // Execute payment
    await processPayment(paymentData)
  } catch (error) {
    console.error('OTP verification failed:', error)
  }
}
```

### Example 3: Add Beneficiary

```tsx
const handleAddBeneficiary = async (beneficiaryData: any) => {
  setCurrentBeneficiary(beneficiaryData)
  setShowOtpModal(true)
}

const handleOtpVerified = async () => {
  // Save beneficiary after OTP verification
  await saveBeneficiary(currentBeneficiary)
  setShowOtpModal(false)
  toast.success('Bénéficiaire ajouté avec succès')
}

<OtpModal
  open={showOtpModal}
  onOpenChange={setShowOtpModal}
  onVerified={handleOtpVerified}
  purpose="BENEFICIARY_ADD"
  title="Confirmer l'ajout"
  description="Entrez le code OTP pour ajouter ce bénéficiaire"
/>
```

---

## API Reference

### Generate OTP

**Endpoint:** `POST /api/otp/generate`

**Request Body:**
```json
{
  "purpose": "TRANSFER",
  "referenceId": "TXN-12345",
  "phoneNumber": "+224621234567",
  "email": "user@example.com",
  "deliveryMethod": "SMS",
  "expiresInMinutes": 5,
  "maxAttempts": 3,
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "otpId": "uuid",
  "expiresAt": "2024-01-01T12:05:00Z"
}
```

### Verify OTP

**Endpoint:** `POST /api/otp/verify`

**Request Body:**
```json
{
  "code": "123456",
  "purpose": "TRANSFER",
  "referenceId": "TXN-12345"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "message": "OTP verified successfully"
}
```

### Resend OTP

**Endpoint:** `POST /api/otp/resend`

**Request Body:**
```json
{
  "purpose": "TRANSFER",
  "referenceId": "TXN-12345"
}
```

**Response:**
```json
{
  "success": true,
  "otpId": "new-uuid",
  "expiresAt": "2024-01-01T12:10:00Z"
}
```

---

## Security Considerations

### 1. OTP Code Security
- ✅ Codes are hashed using bcrypt before storage
- ✅ Never log or display OTP codes in production
- ✅ Codes expire after configured time (default: 5 minutes)

### 2. Rate Limiting
- ✅ Maximum 3 verification attempts (configurable)
- ✅ Account locked after max attempts
- ✅ 30-second cooldown between resend requests

### 3. Validation
- ✅ User authentication required for all OTP operations
- ✅ OTP tied to specific user and purpose
- ✅ Reference ID validation for transaction-specific OTPs

### 4. Best Practices

**DO:**
- ✅ Use unique reference IDs for each transaction
- ✅ Set appropriate expiration times (3-5 minutes)
- ✅ Log OTP generation and verification events
- ✅ Clean up expired OTPs regularly

**DON'T:**
- ❌ Never expose OTP codes in API responses
- ❌ Don't reuse OTPs across different purposes
- ❌ Don't allow unlimited verification attempts
- ❌ Don't use OTP for low-security operations

---

## Troubleshooting

### OTP Not Received

**SMS Not Delivered:**
1. Check phone number format
2. Verify SMS service configuration
3. Check SMS provider logs
4. Ensure phone number is valid

**Email Not Delivered:**
1. Check email configuration (SendGrid)
2. Verify email templates exist
3. Check spam folder
4. Ensure email address is valid

### Verification Fails

**"OTP Invalid":**
- Check if code was typed correctly
- Ensure OTP hasn't expired
- Verify user is using the latest OTP

**"OTP Expired":**
- Request a new OTP using resend
- Check expiration time configuration

**"Max Attempts Reached":**
- OTP is blocked, request new OTP
- Consider increasing max attempts

### Integration Issues

**CORS Errors:**
```typescript
// Ensure API_BASE_URL is configured correctly
// In /lib/config.ts
```

**Authentication Errors:**
```typescript
// Ensure user token is valid
// Check localStorage.getItem("token")
```

**TypeScript Errors:**
```bash
# Install missing types
npm install --save-dev @types/react
```

---

## Testing

### Manual Testing

1. **Generate OTP:**
   - Navigate to example page: `/transfers/new-with-otp`
   - Fill form and submit
   - Verify OTP is generated (check console logs)

2. **Verify OTP:**
   - Enter the 6-digit code
   - Check verification success

3. **Resend OTP:**
   - Wait 30 seconds
   - Click "Resend" button
   - Verify new OTP is generated

### Check Backend Logs

In development, OTP codes are logged to console:
```
[OTP SMS] Sending OTP 123456 to +224621234567 for purpose: TRANSFER
```

### Database Verification

```sql
-- Check OTP records
SELECT * FROM otps WHERE "userId" = 'user-id' ORDER BY "createdAt" DESC LIMIT 10;

-- Check expired OTPs
SELECT * FROM otps WHERE "expiresAt" < NOW();

-- Check blocked OTPs
SELECT * FROM otps WHERE blocked = true;
```

---

## Migration Guide

If you have an existing transfer/payment system, here's how to add OTP:

### Before (Without OTP):
```tsx
const handleSubmit = async (data) => {
  await executeTransfer(data)
}
```

### After (With OTP):
```tsx
const [showOtp, setShowOtp] = useState(false)

const handleSubmit = async (data) => {
  setTransferData(data)
  setShowOtp(true)  // Show OTP modal instead
}

const handleOtpVerified = async () => {
  await executeTransfer(transferData)  // Execute after OTP
  setShowOtp(false)
}

// Add OTP Modal to your JSX
<OtpModal
  open={showOtp}
  onOpenChange={setShowOtp}
  onVerified={handleOtpVerified}
  purpose="TRANSFER"
/>
```

---

## Support

For issues or questions:
1. Check this documentation
2. Review example implementation: `/app/transfers/new-with-otp/page.tsx`
3. Check backend logs for OTP generation/verification
4. Review API error messages

---

## License

This OTP module is part of the BNG E-Banking system.
