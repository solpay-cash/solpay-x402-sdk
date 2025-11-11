# x402 Context

## What is x402?

The x402 protocol extends HTTP status code 402 "Payment Required" to enable seamless micropayments on the web. It provides a standard way for servers to request payment and clients to provide proof of payment.

## Why x402?

Traditional payment flows require:
- Redirects to payment processors
- Complex checkout forms
- Multiple API calls
- Session management

x402 simplifies this to:
1. Server returns 402 with payment details
2. Client makes payment
3. Client retries request with payment proof
4. Server fulfills request

## x402 Facilitator

A facilitator is a service that handles payment logistics:
- Payment processing
- Fee collection
- Settlement
- Receipt generation

### Facilitator Context

Every SolPay payment includes x402 context:

```json
{
  "facilitator_id": "facilitator.payai.network",
  "network": "solana:devnet",
  "resource": "https://www.solpay.cash/api/v1/payment_intents"
}
```

**Fields:**
- `facilitator_id`: Unique identifier for the payment facilitator
- `network`: Blockchain network (solana or solana-devnet)
- `resource`: API endpoint that processes the payment

## How SolPay Uses x402

### Payment Intent Creation

When you create a payment intent, SolPay automatically includes x402 context:

```typescript
const result = await client.pay({
  amount: 10.0,
  asset: 'USDC',
  customerEmail: 'customer@example.com'
});

console.log(result.x402);
// {
//   facilitator_id: 'facilitator.payai.network',
//   network: 'solana:devnet',
//   resource: 'https://www.solpay.cash/api/v1/payment_intents'
// }
```

### Payment Flow with x402

```
1. Client requests resource
   GET /api/premium-content

2. Server responds with 402
   HTTP/1.1 402 Payment Required
   X-x402-Facilitator: facilitator.payai.network
   X-x402-Network: solana:devnet
   X-x402-Amount: 10 USDC

3. Client initiates payment via SolPay SDK
   const payment = await client.pay({
     amount: 10,
     asset: 'USDC'
   });

4. Customer completes payment in wallet

5. Client retries with payment proof
   GET /api/premium-content
   Authorization: Bearer {intentId}
   X-x402-Receipt: {receiptUrl}

6. Server verifies receipt and fulfills request
   HTTP/1.1 200 OK
   Content: {premium content}
```

## Facilitator Responsibilities

The x402 facilitator handles:

### 1. Payment Processing
- Accept payment requests
- Generate payment intents
- Create checkout URLs
- Monitor payment status

### 2. Fee Management
- Calculate platform fees
- Deduct network fees
- Handle fee distribution
- Provide transparent breakdowns

### 3. Receipt Generation
- Create verifiable receipts
- Compute SHA-256 hashes
- Include transaction signatures
- Provide public verification endpoints

### 4. Settlement
- Transfer funds to merchants
- Batch settlements for efficiency
- Provide settlement reports
- Handle failed payments

## Network Identifiers

x402 uses standardized network identifiers:

### Format

```
{blockchain}:{network}
```

### Supported Networks

| Identifier | Description |
|------------|-------------|
| `solana:mainnet` | Solana mainnet (production) |
| `solana:devnet` | Solana devnet (testing) |
| `solana` | Alias for solana:mainnet |
| `solana-devnet` | Alias for solana:devnet |

The SDK normalizes these formats automatically.

## Resource URLs

The `resource` field specifies where payment requests should be sent. For SolPay:

- Mainnet: `https://www.solpay.cash/api/v1/payment_intents`
- Devnet: `https://www.solpay.cash/api/v1/payment_intents`

Both environments use the same URL; the `network` field determines which blockchain is used.

## Configuring x402 Context

### Default Configuration

The SDK uses default facilitator settings:

```typescript
const client = new SolPayX402({
  apiBase: 'https://www.solpay.cash',
  merchantWallet: 'YOUR_WALLET',
  network: 'solana:devnet'
});
// Uses default facilitator: facilitator.payai.network
```

### Custom Facilitator

To use a custom facilitator:

```typescript
const client = new SolPayX402({
  apiBase: 'https://www.solpay.cash',
  merchantWallet: 'YOUR_WALLET',
  network: 'solana:devnet',
  facilitatorId: 'your-facilitator.network',
  facilitatorUrl: 'https://your-facilitator.network'
});
```

## Benefits of x402

### For Developers
- Standard protocol for payments
- Reduced integration complexity
- No redirect flows required
- Works with any payment method

### For Users
- Seamless payment experience
- No account creation required
- Use existing wallets
- Fast transaction times

### For Merchants
- Lower fees than traditional processors
- Instant settlement
- Global reach
- Programmable payments

## Real-World Example

### Content Paywall

```typescript
// Server: Protect content with x402
app.get('/api/article/:id', async (req, res) => {
  const intentId = req.headers['x-payment-intent'];

  if (!intentId) {
    // No payment - return 402
    return res.status(402).json({
      error: 'Payment Required',
      x402: {
        facilitator_id: 'facilitator.payai.network',
        network: 'solana:devnet',
        amount: 1.0,
        asset: 'USDC'
      }
    });
  }

  // Verify payment
  const intent = await client.getPaymentIntent(intentId);

  if (intent.status !== 'succeeded') {
    return res.status(402).json({
      error: 'Payment not completed'
    });
  }

  // Payment verified - serve content
  const article = await getArticle(req.params.id);
  res.json(article);
});

// Client: Handle 402 and make payment
async function fetchArticle(id) {
  const response = await fetch(`/api/article/${id}`);

  if (response.status === 402) {
    const { x402 } = await response.json();

    // Initiate payment
    const payment = await solpayClient.pay({
      amount: x402.amount,
      asset: x402.asset
    });

    // Wait for user to complete payment
    await waitForPayment(payment.paymentUrl);

    // Retry with payment proof
    return fetch(`/api/article/${id}`, {
      headers: {
        'X-Payment-Intent': payment.intentId
      }
    });
  }

  return response;
}
```

## Future of x402

The x402 protocol enables:
- Micropayments for content and APIs
- Pay-per-use services
- Streaming payments
- Machine-to-machine transactions
- Programmable monetization

SolPay is building the infrastructure to make x402 payments on Solana accessible to all developers.

## Related

- [Overview](./overview.md) - SDK architecture and concepts
- [Receipts & Memo](./receipts-and-memo.md) - Receipt verification
