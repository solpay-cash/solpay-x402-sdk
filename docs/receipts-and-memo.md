# Receipt Verification

## Overview

SolPay uses cryptographic receipt verification to ensure payment authenticity. Every completed payment generates a receipt that can be independently verified using SHA-256 hashing over canonical JSON.

**Security Model:** Receipts are stored on the SolPay server with tamper-proof SHA-256 hash verification. The payment transaction signature can be verified directly on the Solana blockchain for additional assurance.

## Receipt Structure

A SolPay receipt contains:

```json
{
  "id": "rec_abc123",
  "payment_intent_id": "pi_xyz789",
  "merchant_wallet": "J7xnWtfi5Fa3JC1creRBHzo7DkRf6etugCBv1s9vEe5N",
  "amount": 10.0,
  "asset": "USDC",
  "transaction_signature": "4xY7Z...",
  "memo": "SolPay:pi_xyz789:merchant",
  "timestamp": "2025-01-15T10:30:00Z",
  "settlement": {
    "merchant_received": 9.7,
    "treasury_fee": 0.2,
    "facilitator_fee": 0.1
  },
  "sha256_hash": "a1b2c3d4..."
}
```

## Canonical JSON Hashing

### Why Canonical JSON?

JSON can be serialized in multiple ways (different key orders, whitespace, etc.). To ensure consistent hashing, we use canonical JSON:
- Keys sorted alphabetically
- No whitespace
- Deterministic serialization

### Algorithm

1. **Remove hash field** - Exclude `sha256_hash` from the receipt object
2. **Sort keys recursively** - Sort all object keys alphabetically
3. **Serialize to string** - Convert to compact JSON (no whitespace)
4. **Compute SHA-256** - Hash the resulting string

### Example

Given this receipt:
```json
{
  "amount": 10.0,
  "merchant": "ABC123",
  "sha256_hash": "xxx"
}
```

Canonical form (hash field removed, keys sorted):
```
{"amount":10.0,"merchant":"ABC123"}
```

SHA-256 hash:
```
echo -n '{"amount":10.0,"merchant":"ABC123"}' | sha256sum
```

## Verification Process

### Using the SDK

```typescript
const verification = await client.verifyReceipt(receiptUrl);

if (verification.ok) {
  console.log('✅ Receipt verified!');
  console.log('Hash:', verification.computed_hash);
} else {
  console.log('❌ Verification failed!');
  console.log('Error:', verification.error);
}
```

### Manual Verification

If you need to verify receipts manually:

```typescript
function verifyReceipt(receipt) {
  // 1. Extract reported hash
  const reportedHash = receipt.sha256_hash;

  // 2. Remove hash field
  const canonical = { ...receipt };
  delete canonical.sha256_hash;
  delete canonical.hash;

  // 3. Create canonical JSON
  const canonicalJson = canonicalJSON(canonical);

  // 4. Compute SHA-256
  const computedHash = crypto
    .createHash('sha256')
    .update(canonicalJson)
    .digest('hex');

  // 5. Compare
  return computedHash === reportedHash;
}

function canonicalJSON(obj) {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);

  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJSON).join(',') + ']';
  }

  // Sort keys
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(key =>
    `"${key}":${canonicalJSON(obj[key])}`
  );

  return '{' + pairs.join(',') + '}';
}
```

## Memo Field

### Purpose

The memo field is included in the Solana payment transaction and links the payment to:
- Payment intent ID
- Merchant identifier
- Optional metadata

### Format

```
SolPay:pi_{intent_id}:{merchant_identifier}
```

Example:
```
SolPay:pi_abc123:merchant_xyz
```

### Verification

The memo can be verified on-chain by:
1. Fetching the payment transaction using `transaction_signature`
2. Extracting the memo from transaction instructions
3. Comparing with expected format

**Note:** The memo is part of the payment transaction itself, not a separate attestation transaction.

## Settlement Details

Every receipt includes detailed settlement information:

```json
{
  "settlement": {
    "merchant_received": 9.7,
    "treasury_fee": 0.2,
    "facilitator_fee": 0.1
  }
}
```

This transparency ensures merchants can:
- Verify exact amounts received
- Track fee structures
- Reconcile payments with bank statements

## Security Properties

### Tamper-Proof

Any modification to the receipt (amount, merchant, timestamp, etc.) will invalidate the hash. This ensures receipts cannot be forged or modified.

### Independently Verifiable

Anyone with the receipt can verify its authenticity without contacting SolPay. The verification algorithm is public and deterministic.

### Blockchain-Backed

Payment transaction signatures can be verified on the Solana blockchain for additional assurance. The on-chain payment transaction includes:
- Transfer of exact amount
- Memo field linking to payment intent
- Timestamp
- Sender and recipient addresses

## Best Practices

### Always Verify Before Fulfillment

```typescript
async function fulfillOrder(receiptUrl) {
  // 1. Verify receipt
  const verification = await client.verifyReceipt(receiptUrl);

  if (!verification.ok) {
    throw new Error('Invalid receipt');
  }

  // 2. Check payment details
  const receipt = verification.receipt;
  if (receipt.amount < expectedAmount) {
    throw new Error('Insufficient payment');
  }

  // 3. Fulfill order
  await deliverProduct(receipt.payment_intent_id);
}
```

### Store Receipts

Keep a copy of all receipts for:
- Accounting and reconciliation
- Dispute resolution
- Audit trails

### Verify Payment Transaction On-Chain (Optional)

For high-value transactions, verify the payment transaction signature on Solana:

```typescript
import { Connection } from '@solana/web3.js';

async function verifyPaymentOnChain(transactionSignature) {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const tx = await connection.getTransaction(transactionSignature);

  // Verify transaction exists and succeeded
  if (!tx || tx.meta?.err) {
    throw new Error('Payment transaction not found or failed');
  }

  // Extract transfer amount, sender, recipient, and memo from transaction
  // Verify they match the receipt details

  return tx;
}
```

## Troubleshooting

### Hash Mismatch

If verification fails:
1. Check you're using canonical JSON (sorted keys, no whitespace)
2. Ensure you removed the hash field before hashing
3. Verify you're hashing the UTF-8 encoded string
4. Check for floating point precision issues in numbers

### Missing Receipt

If payment completed but no receipt:
1. Wait a few seconds (blockchain confirmation time)
2. Poll the payment intent status
3. Check for network errors
4. Contact support if issue persists

## Related

- [Overview](./overview.md) - SDK architecture and concepts
- [x402 Context](./x402-context.md) - Understanding x402 protocol
