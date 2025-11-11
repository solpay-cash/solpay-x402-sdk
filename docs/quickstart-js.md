# JavaScript/TypeScript Quickstart

Get started with SolPay x402 payments in JavaScript/TypeScript.

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

## Next Steps

- Run the [example project](../examples/js-demo)
- Read the [overview](./overview.md) to understand the architecture
- Learn about [receipt verification](./receipts-and-memo.md)
- Understand [x402 context](./x402-context.md)

## Support

- GitHub: https://github.com/solpay-cash/solpay-x402-sdk
- Documentation: https://docs.solpay.cash
- Support: support@solpay.cash
