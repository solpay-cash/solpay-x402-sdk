# Postman Collection

This directory contains the Postman collection for testing the SolPay x402 API.

## Import Collection

1. Open Postman
2. Click "Import" button
3. Select `SolPay-x402-Facilitator.postman_collection.json`
4. Collection will be imported with all requests

## Setup

### Configure Variables

After importing, set the collection variables:

1. Click on the collection name
2. Go to "Variables" tab
3. Set the following values:

| Variable | Description | Example |
|----------|-------------|---------|
| `api_base` | API base URL | `https://api.solpay.cash` |
| `merchant_wallet` | Your Solana wallet | `YOUR_WALLET_ADDRESS` |
| `facilitator_id` | Facilitator ID | `facilitator.payai.network` |
| `network` | Network identifier | `solana:devnet` or `solana:mainnet` |
| `api_key` | API key (optional) | Leave empty for public endpoints |
| `intent_id` | Payment intent ID | Will be set automatically |

## Included Requests

### Payment Intents
- **Create Payment Intent** - Create a new payment with x402 context
- **Get Payment Intent** - Fetch payment status by ID
- **Confirm Payment Intent** - Confirm payment with transaction signature
- **List Payment Intents** - List all payment intents for merchant

### Receipts
- **Get Receipt** - Fetch receipt by ID
- **Verify Receipt Hash** - Automatic verification using test script

### Webhooks
- **Payment Succeeded Webhook** - Example webhook payload

### Health Check
- **API Health** - Check API availability

## Receipt Verification

The "Verify Receipt Hash" request includes a test script that:
1. Fetches the receipt
2. Removes the hash field
3. Computes canonical JSON (sorted keys)
4. Calculates SHA-256 hash
5. Compares with reported hash

This demonstrates the receipt verification algorithm.

## Example Workflow

1. **Create Payment Intent**
   - Send POST request
   - Copy `id` from response
   - Variable `intent_id` will be automatically set

2. **Get Payment Status**
   - Use the `intent_id` variable
   - Check status field

3. **Verify Receipt** (if payment completed)
   - Get receipt URL from payment intent
   - Use "Verify Receipt Hash" request
   - Test script will validate the hash

## Environment Setup

For testing multiple environments:

1. Create environments (Development, Production)
2. Set environment-specific variables
3. Switch between environments as needed

Example Development Environment:
```json
{
  "api_base": "https://api.solpay.cash",
  "network": "solana:devnet",
  "merchant_wallet": "YOUR_DEVNET_WALLET"
}
```

Example Production Environment:
```json
{
  "api_base": "https://api.solpay.cash",
  "network": "solana:mainnet",
  "merchant_wallet": "YOUR_MAINNET_WALLET"
}
```

## Testing Tips

- Test on devnet first before mainnet
- Enable "Save Responses" to debug issues
- Use the Console tab to see request/response details
- Check test results in the "Test Results" tab

## Support

- [API Documentation](https://docs.solpay.cash)
- [GitHub Issues](https://github.com/solpay/x402-sdk/issues)
- Email: support@solpay.cash
