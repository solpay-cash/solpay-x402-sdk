# SolPay x402 SDK - Overview

## Introduction

The SolPay x402 SDK provides a simple, unified interface for accepting Solana payments with x402 protocol support. The SDK abstracts away the complexity of blockchain interactions while maintaining full transparency and verifiability through cryptographic receipt verification.

## Architecture

```
┌─────────────────┐
│  Your App/Site  │
└────────┬────────┘
         │
         │ SolPay x402 SDK
         │
         ▼
┌─────────────────┐
│  SolPay API     │◄─────── x402 Facilitator Context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Solana Network │
│  (USDC/SOL)     │
└─────────────────┘
```

## Key Concepts

### Payment Intent

A payment intent represents a request for payment. It contains:
- Amount and asset type (USDC, SOL, etc.)
- Merchant wallet address
- Customer information (optional)
- x402 facilitator context
- Status tracking

### x402 Facilitator Context

The x402 protocol enables HTTP 402 "Payment Required" responses for micropayments. The facilitator context includes:
- `facilitator_id`: Unique identifier for the payment facilitator
- `network`: Solana network (mainnet or devnet)
- `resource`: API endpoint that handles the payment

This context ensures payments are properly attributed and routed.

### Receipt Verification

Every completed payment generates a cryptographically verifiable receipt:
- **SHA-256 Hash**: Computed over canonical JSON (sorted keys, no whitespace) for tamper-proof verification
- **Transaction Signature**: Solana blockchain payment transaction ID for on-chain verification
- **Memo**: Included in payment transaction linking payment to merchant
- **Settlement Details**: Breakdown of fees and merchant receives

### Fee Structure

The SDK never calculates fees client-side. All fee calculations are performed server-side by the SolPay API to ensure accuracy and prevent manipulation. The API returns:
- `amount_required`: Total amount customer must pay
- `fees_total`: All fees (platform + network)
- `merchant_receives`: Net amount after fees

## Payment Flow

### 1. Create Payment Intent

```typescript
const result = await client.pay({
  amount: 10.0,
  asset: 'USDC',
  customerEmail: 'customer@example.com'
});
```

This creates a payment intent and returns:
- `intentId`: Unique payment intent ID
- `paymentUrl`: Checkout URL for customer
- `status`: Current payment status
- `amount`: Detailed amount breakdown

### 2. Customer Completes Payment

Direct the customer to `paymentUrl` where they can:
- Connect their Solana wallet
- Review payment details
- Approve the transaction
- Receive confirmation

### 3. Confirm Payment (Optional)

If you have the transaction signature from the customer's wallet:

```typescript
const confirmed = await client.confirmPayment(intentId, signature);
```

### 4. Verify Receipt

Once payment is complete, verify the receipt:

```typescript
const verification = await client.verifyReceipt(receiptUrl);

if (verification.ok) {
  // Receipt is valid - payment confirmed on-chain
}
```

## Network Support

### Devnet (Testing)

- Network: `solana:devnet`
- RPC: `https://api.devnet.solana.com`
- USDC Mint: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`
- Use for development and testing

### Mainnet (Production)

- Network: `solana:mainnet`
- RPC: `https://api.mainnet-beta.solana.com` (or premium provider)
- USDC Mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Use for production with real funds

## Security Considerations

### Receipt Verification

Always verify receipts before fulfilling orders:
1. Fetch receipt from provided URL
2. Compute SHA-256 hash over canonical JSON (excluding hash field)
3. Compare computed hash with reported hash
4. Verify transaction signature on Solana blockchain (optional)

### API Keys

For server-side integrations, use API keys:
- Never expose API keys in client-side code
- Rotate keys regularly
- Use environment variables

### Network Selection

Ensure your configuration matches your environment:
- Development: Use devnet
- Production: Use mainnet
- Never mix networks (e.g., mainnet RPC with devnet USDC)

## Error Handling

All SDK methods throw exceptions on errors:

```typescript
try {
  const result = await client.pay({ amount: 10, asset: 'USDC' });
} catch (error) {
  console.error('Payment failed:', error.message);
  // Handle error appropriately
}
```

Common errors:
- Invalid configuration (missing required fields)
- Network errors (API unavailable)
- Insufficient funds (customer wallet)
- Invalid transaction signature

## Best Practices

1. **Always verify receipts** - Don't trust payment status without verification
2. **Use webhooks** - Implement webhooks for real-time payment notifications
3. **Handle errors gracefully** - Network issues can occur, implement retry logic
4. **Log transactions** - Keep records of all payment intents and receipts
5. **Test on devnet first** - Always test integration on devnet before mainnet
6. **Monitor payment status** - Poll or use webhooks to track payment completion
7. **Secure API keys** - Never commit keys to version control

## Next Steps

- [Receipts & Memo](./receipts-and-memo.md) - Deep dive into receipt verification
- [x402 Context](./x402-context.md) - Understanding the x402 protocol
- [JavaScript Quickstart](./quickstart-js.md)
- [Python Quickstart](./quickstart-python.md)
- [PHP Quickstart](./quickstart-php.md)
