# Security Guidelines for SolPay x402 SDK

## 🔒 Critical Security Requirements

### Network Parameter MUST Be Included

**Severity:** CRITICAL
**Impact:** Financial loss, payment fraud

#### The Vulnerability

If the SDK does not explicitly send the `network` parameter to the API, the server may fall back to environment defaults. This creates a critical attack vector:

**Attack Scenario:**
1. Merchant configures SDK for mainnet (real USDC/SOL)
2. SDK fails to include `network` in API request
3. Server defaults to `devnet` and stores `network='devnet'` in database
4. Attacker intercepts payment request
5. Attacker pays with **worthless devnet tokens**
6. Server verifies transaction on devnet (matches stored network) ✅
7. Payment marked as succeeded
8. **Merchant loses real money, attacker paid nothing**

#### Required Implementation

All SDKs **MUST** include the `network` parameter in the `x402` object when creating payment intents:

```javascript
// JavaScript/TypeScript
const payment = await client.pay({
  amount: 1000000,
  asset: 'USDC',
  // SDK automatically includes network in x402_context:
  // x402_context: {
  //   facilitator_id: 'facilitator.payai.network',
  //   network: 'solana:devnet',  // ← CRITICAL
  //   resource: 'https://api.solpay.cash/api/v1/payment_intents'
  // }
});
```

```python
# Python
payment = client.pay(
    amount=1000000,
    asset='USDC',
    # SDK automatically includes network in x402_context
)
```

```php
// PHP
$payment = $client->pay([
    'amount' => 1000000,
    'asset' => 'USDC',
    // SDK automatically includes network in x402_context
]);
```

#### API Request Body

The API request **MUST** include:

```json
{
  "amount": 1000000,
  "currency": "USDC",
  "x402_context": {
    "facilitator_id": "facilitator.payai.network",
    "network": "solana:devnet",
    "resource": "https://api.solpay.cash/api/v1/payment_intents"
  }
}
```

**⚠️ NEVER** rely on server-side defaults for network selection.

#### SDK Implementation Status

| SDK | Status | Network Included |
|-----|--------|------------------|
| JavaScript | ✅ Secure | Line 219 in `sdk/js/src/index.ts` |
| Python | ✅ Secure | Line 193 in `sdk/python/solpay_x402.py` |
| PHP | ✅ Fixed | Line 287 in `sdk/php/src/Client.php` |

#### Server-Side Validation

API servers **MUST**:

1. **Require explicit network parameter** - Reject requests without `x402.network`
2. **Store network with intent** - Save to `payment_intents.network` column
3. **Verify on specified network** - Never fall back to default network
4. **Match stored network** - Only verify transactions on the network stored in DB

```typescript
// Server-side example (API endpoint)
if (!body.x402_context?.network) {
  return res.status(400).json({
    error: 'validation_error',
    message: 'x402.network is required'
  });
}

// Store in database
await db.paymentIntents.create({
  network: body.x402_context.network,  // Store explicitly
  // ... other fields
});
```

---

## 🛡️ Additional Security Best Practices

### 1. Always Verify Amounts Server-Side

**Never** trust client-provided fee calculations:

```typescript
// ❌ WRONG - Client calculates fees
const fees = amount * 0.015;  // Client-side
client.pay({ amount, fees });  // Server accepts client fees

// ✅ CORRECT - Server calculates fees
client.pay({ amount });  // Server computes fees
```

The server **MUST**:
- Calculate fees based on merchant tier
- Return exact amounts in response
- Client displays but never calculates

### 2. Use Smallest Units for Amounts

Always use **micro-units** (lamports/micro-USDC) to avoid floating-point errors:

```typescript
// ✅ CORRECT
amount: 1000000  // 1 USDC (6 decimals)

// ❌ WRONG
amount: 1.0  // Floating point - precision issues
```

**Conversion table:**
- **USDC**: 1 USDC = 1,000,000 micro-USDC (6 decimals)
- **SOL**: 1 SOL = 1,000,000,000 lamports (9 decimals)

### 3. Validate Transaction On-Chain

Always verify blockchain transactions match payment intent:

```typescript
// Server-side verification
const tx = await connection.getTransaction(signature);

// Verify:
// 1. Transaction succeeded
if (tx.meta?.err) throw new Error('Transaction failed');

// 2. Amount matches
const transferAmount = extractAmount(tx);
if (transferAmount !== intent.amount) throw new Error('Amount mismatch');

// 3. Recipient matches
const recipient = extractRecipient(tx);
if (recipient !== intent.merchant_wallet) throw new Error('Wrong recipient');

// 4. Network matches (CRITICAL)
const network = getNetworkFromConnection(connection);
if (network !== intent.network) throw new Error('Network mismatch');
```

### 4. Implement Idempotency

Use idempotency keys to prevent duplicate payments:

```typescript
const idempotencyKey = uuidv4();

await client.pay({
  amount: 1000000,
  asset: 'USDC',
}, {
  headers: {
    'idempotency-key': idempotencyKey
  }
});
```

### 5. Verify Webhook Signatures

Always verify webhook signatures using HMAC-SHA256:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

### 6. Rate Limit Payment Creation

Implement rate limiting to prevent abuse:

- **Per wallet**: 10 payment intents per minute
- **Per IP**: 100 requests per minute
- **Use exponential backoff** for retries

### 7. Set Reasonable Expiration Times

Payment intents should expire to prevent stale payments:

```typescript
const payment = await client.pay({
  amount: 1000000,
  asset: 'USDC',
  // Server sets expiration (typically 15 minutes)
});

// Check expiration before payment
if (new Date(payment.expires_at) < new Date()) {
  throw new Error('Payment intent expired');
}
```

---

## 🔍 Security Checklist

Before deploying to production:

- [ ] **Network parameter included** in all payment intent requests
- [ ] **Server validates network** parameter (rejects if missing)
- [ ] **Fees calculated server-side** only
- [ ] **Amounts in micro-units** (no floating point)
- [ ] **Transaction verification** includes network check
- [ ] **Webhook signatures verified** with HMAC-SHA256
- [ ] **Idempotency keys** implemented
- [ ] **Rate limiting** enabled
- [ ] **HTTPS only** in production
- [ ] **API keys stored securely** (environment variables)
- [ ] **Receipt verification** implemented with SHA-256 hash validation

---

## 📞 Reporting Security Issues

If you discover a security vulnerability in the SolPay x402 SDK:

1. **DO NOT** open a public GitHub issue
2. Email: security@solpay.cash
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 24 hours and provide a fix within 7 days for critical issues.

---

## 📚 Additional Resources

- [API Documentation](./docs/)
- [Receipt Verification](./docs/receipts-and-memo.md)
- [x402 Protocol](./docs/x402-context.md)
- [Solana Best Practices](https://docs.solana.com/developing/programming-model/transactions)

---

**Last Updated:** 2025-11-11
**SDK Version:** 1.0.0+security-fix
