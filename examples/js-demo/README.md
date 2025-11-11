# JavaScript Demo

Example integration using the SolPay x402 JavaScript SDK.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (copy from root `.env.example`):
```bash
export SOLPAY_API_BASE=https://api.solpay.cash
export MERCHANT_WALLET=your_wallet_address
export X402_NETWORK=solana:devnet
```

3. Run the demo:
```bash
npm start
```

## What This Demo Does

1. Creates a payment intent for 10 USDC
2. Fetches the payment intent status
3. Shows how to confirm a payment (requires real transaction)
4. Verifies the receipt using SHA-256 hash

## Next Steps

- Integrate with your frontend to display the payment URL
- Use Solana wallet adapter to get transaction signatures
- Implement webhooks to handle payment confirmations server-side
