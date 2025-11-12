# JavaScript/TypeScript Quickstart

Get started with SolPay x402 payments in JavaScript/TypeScript.

## 🔒 Security: Network Parameter

**CRITICAL SECURITY REQUIREMENT:**

The SDK automatically includes the `network` parameter in all payment requests. This is a **critical security feature** that prevents payment fraud.

### Why This Matters

Without the network parameter, an attacker could:
1. Intercept a payment request intended for mainnet (real USDC)
2. Pay with worthless devnet tokens instead
3. Server might default to devnet verification
4. Payment succeeds, merchant loses real money

### How the SDK Protects You

The SDK automatically includes `network` in the `x402_context` when creating payment intents:

```typescript
// SDK automatically adds this to your payment request:
{
  x402_context: {
    facilitator_id: 'facilitator.payai.network',
    network: 'solana:devnet',  // ← CRITICAL: Explicitly set
    resource: 'https://www.solpay.cash/api/v1/payment_intents'
  }
}
```

**See [SECURITY.md](../SECURITY.md) for complete security guidelines.**

---

## Installation

```bash
npm install @solpay/x402-sdk
```

Or with yarn:
```bash
yarn add @solpay/x402-sdk
```

## Basic Setup

```typescript
import { SolPayX402 } from '@solpay/x402-sdk';

const client = new SolPayX402({
  apiBase: 'https://www.solpay.cash',
  merchantWallet: 'YOUR_SOLANA_WALLET_ADDRESS',
  network: 'solana:devnet', // or 'solana:mainnet'
  debug: true // Enable logging (optional)
});
```

## Create a Payment

```typescript
async function createPayment() {
  try {
    const result = await client.pay({
      amount: 10.0,
      asset: 'USDC',
      customerEmail: 'customer@example.com', // Optional
      metadata: { orderId: '12345' } // Optional
    });

    console.log('Payment URL:', result.paymentUrl);
    console.log('Intent ID:', result.intentId);

    // Redirect customer to payment URL
    window.location.href = result.paymentUrl;
  } catch (error) {
    console.error('Payment failed:', error.message);
  }
}
```

## Check Payment Status

```typescript
async function checkPayment(intentId: string) {
  const intent = await client.getPaymentIntent(intentId);

  console.log('Status:', intent.status);
  // Status can be: 'pending', 'processing', 'succeeded', 'failed'

  if (intent.status === 'succeeded') {
    console.log('Payment completed!');
    console.log('Receipt:', intent.receipt);
  }
}
```

## Verify Receipt

```typescript
async function verifyPayment(receiptUrl: string) {
  const verification = await client.verifyReceipt(receiptUrl);

  if (verification.ok) {
    console.log('✅ Receipt verified!');
    console.log('Transaction:', verification.receipt.transaction_signature);

    // Fulfill order here
    await fulfillOrder(verification.receipt);
  } else {
    console.error('❌ Invalid receipt:', verification.error);
  }
}
```

## Complete Example

```typescript
import { SolPayX402 } from '@solpay/x402-sdk';

const client = new SolPayX402({
  apiBase: process.env.SOLPAY_API_BASE,
  merchantWallet: process.env.MERCHANT_WALLET,
  network: process.env.SOLPAY_NETWORK as any,
  apiKey: process.env.SOLPAY_API_KEY // For server-side
});

// Create payment
async function checkout(amount: number, asset: string) {
  const payment = await client.pay({
    amount,
    asset,
    customerEmail: 'customer@example.com',
    successUrl: 'https://yoursite.com/success',
    cancelUrl: 'https://yoursite.com/cancel'
  });

  return payment;
}

// Handle success redirect
async function handleSuccess(intentId: string) {
  const intent = await client.getPaymentIntent(intentId);

  if (intent.status === 'succeeded' && intent.receipt) {
    // Verify receipt
    const verification = await client.verifyReceipt(intent.receipt.url);

    if (verification.ok) {
      // Payment confirmed - fulfill order
      console.log('Order fulfilled!');
    }
  }
}

// Usage
const payment = await checkout(10.0, 'USDC');
console.log('Pay here:', payment.paymentUrl);
```

## TypeScript Types

The SDK includes full TypeScript definitions:

```typescript
interface SolPayX402Config {
  apiBase: string;
  merchantWallet: string;
  network: 'solana:devnet' | 'solana:mainnet';
  facilitatorId?: string;
  facilitatorUrl?: string;
  apiKey?: string;
  debug?: boolean;
}

interface PayParams {
  amount: number;
  asset: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
  successUrl?: string;
  cancelUrl?: string;
}

interface PayResult {
  intentId: string;
  paymentUrl: string;
  status: string;
  amount: {
    requested: number;
    total: number;
    fees: number;
    net: number;
  };
  receipt?: {
    url: string;
    hash: string;
    memo: string;
    signature: string;
  };
  settlement?: {
    merchant_received: number;
    treasury_fee: number;
    facilitator_fee?: number;
  };
  x402?: {
    facilitator_id: string;
    network: string;
    resource: string;
  };
}
```

## Environment Variables

Create a `.env` file:

```env
SOLPAY_API_BASE=https://www.solpay.cash
MERCHANT_WALLET=your_solana_wallet_address
SOLPAY_NETWORK=solana:devnet
SOLPAY_API_KEY=your_api_key_for_server_side
```

## Hosted Payment Pages

The SDK provides two types of hosted payment flows:

### Payment Intents (Flow-B) - `/pay/:piId`

For direct payment intents, use the hosted payment page:

```typescript
import { getHostedPaymentUrl } from '@solpay/x402-sdk';

const payment = await client.pay({
  amount: 1000000, // 1 USDC (amounts in micro-units)
  asset: 'USDC'
});

// Generate hosted payment URL
const hostedUrl = getHostedPaymentUrl('https://www.solpay.cash', payment.intentId);
console.log('Pay here:', hostedUrl);
// => https://www.solpay.cash/pay/pi_abc123

// Direct customer to this URL to complete payment
```

**Features of `/pay/:piId`:**
- Displays payment amount and currency
- Shows merchant wallet
- Fee breakdown (processor fee in bps and amount)
- Settlement details (merchant amount)
- Receipt verification with canonical JSON and SHA-256 hashing
- Link to Solana explorer for payment transaction

### Checkout Sessions (Flow-A) - `/checkout/:csId`

For price-based checkout sessions:

```typescript
import { getHostedCheckoutUrl } from '@solpay/x402-sdk';

const url = getHostedCheckoutUrl('https://www.solpay.cash', 'cs_abc123');
// => https://www.solpay.cash/checkout/cs_abc123
```

### Environment Variables

Configure your hosted pages with environment variables:

```bash
# API endpoint
SOLPAY_API_BASE=https://www.solpay.cash

# UI base for hosted pages
SOLPAY_UI_BASE=https://www.solpay.cash

# For local development
SOLPAY_API_BASE=http://localhost:3002
SOLPAY_UI_BASE=http://localhost:3002
```

### Important Notes

- **Amount Format**: Amounts must be in smallest units (micro-USDC for USDC with 6 decimals)
  - 1 USDC = 1,000,000 micro-USDC
  - 0.1 USDC = 100,000 micro-USDC
- **Network Detection**: Explorer links auto-detect devnet/mainnet from `x402.network`
- **Receipt Verification**: Receipts include SHA-256 hash for tamper-proof verification

## Next Steps

- Run the [example project](../examples/js-demo)
- Read the [overview](./overview.md) to understand the architecture
- Learn about [receipt verification](./receipts-and-memo.md)
- Understand [x402 context](./x402-context.md)

## Support

- GitHub: https://github.com/solpay-cash/solpay-x402-sdk
- Documentation: https://docs.solpay.cash
- Support: support@solpay.cash
