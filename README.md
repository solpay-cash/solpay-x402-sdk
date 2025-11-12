# SolPay x402 SDK

**One-line integration for accepting Solana payments with x402 facilitator context.**

This SDK provides a simple, unified interface for integrating SolPay payments with x402 protocol support across JavaScript/TypeScript, Python, and PHP.

## 🎥 Video Demo

Watch the SDK in action: [SolPay x402 SDK Demo](https://www.loom.com/share/27b7acbfe50e485da116c9f238d70443)

## Features

- ✅ Create payment intents with dynamic amounts
- ✅ Confirm payments with x402 facilitator context
- ✅ Verify receipts using SHA-256 canonical JSON hashing
- ✅ Support for Solana devnet and mainnet
- ✅ No client-side fee calculations - trust API values
- ✅ Full receipt and settlement info
- ✅ SHA-256 hash-based receipt verification

## 🔒 Security Notice

**CRITICAL:** The SDK automatically includes the `network` parameter in all payment requests to prevent payment fraud. This parameter ensures payments are verified on the correct network (devnet vs mainnet) and prevents attackers from paying with worthless devnet tokens when mainnet tokens are expected.

**Never modify the SDK to remove the network parameter.** See [SECURITY.md](./SECURITY.md) for complete security guidelines and attack scenarios.

## Supported Languages

| Language | Status | Documentation |
|----------|--------|---------------|
| JavaScript/TypeScript | ✅ Ready | [Quickstart](./docs/quickstart-js.md) |
| Python | ✅ Ready | [Quickstart](./docs/quickstart-python.md) |
| PHP | ✅ Ready | [Quickstart](./docs/quickstart-php.md) |

## Quick Start

### JavaScript/TypeScript

```bash
cd sdk/js
npm install
```

```typescript
import { SolPayX402 } from '@solpay/x402-sdk';

const client = new SolPayX402({
  apiBase: 'https://www.solpay.cash',
  merchantWallet: 'YOUR_WALLET_ADDRESS',
  network: 'solana:devnet'
});

// Create payment intent
const result = await client.pay({
  amount: 10.0,
  asset: 'USDC',
  customerEmail: 'customer@example.com'
});

console.log('Payment URL:', result.paymentUrl);
console.log('Receipt:', result.receipt);
```

### Python

```bash
cd sdk/python
pip install -r requirements.txt
```

```python
from solpay_x402 import SolPayX402

client = SolPayX402(
    api_base='https://www.solpay.cash',
    merchant_wallet='YOUR_WALLET_ADDRESS',
    network='solana:devnet'
)

# Create payment intent
result = client.pay(
    amount=10.0,
    asset='USDC',
    customer_email='customer@example.com'
)

print(f"Payment URL: {result['payment_url']}")
print(f"Receipt: {result['receipt']}")
```

### PHP

```bash
cd sdk/php
composer install
```

```php
<?php
require_once 'vendor/autoload.php';

use SolPay\X402\Client;

$client = new Client([
    'api_base' => 'https://www.solpay.cash',
    'merchant_wallet' => 'YOUR_WALLET_ADDRESS',
    'network' => 'solana:devnet'
]);

// Create payment intent
$result = $client->pay([
    'amount' => 10.0,
    'asset' => 'USDC',
    'customer_email' => 'customer@example.com'
]);

echo "Payment URL: " . $result['payment_url'] . "\n";
echo "Receipt: " . json_encode($result['receipt']) . "\n";
```

## Hosted Payment Pages

The SDK supports two payment flows with hosted pages:

### Payment Intents (Flow-B)
- **Route**: `/pay/:piId` (Payment Intent IDs start with `pi_`)
- **Use case**: Direct payment requests with fixed amounts
- **Features**: Fee breakdown, settlement details, receipt verification

### Checkout Sessions (Flow-A)
- **Route**: `/checkout/:csId` (Checkout Session IDs start with `cs_`)
- **Use case**: Price-based checkout with product catalogs
- **Features**: Product selection, dynamic pricing

```typescript
import { getHostedPaymentUrl } from '@solpay/x402-sdk';

// Generate hosted payment URL
const payment = await client.pay({ amount: 1000000, asset: 'USDC' });
const hostedUrl = getHostedPaymentUrl('https://www.solpay.cash', payment.intentId);
// => https://www.solpay.cash/pay/pi_abc123
```

## Quick Test

Test the SDK quickly without setting up a full project:

```bash
# Test with your wallet address
node quick-test.js YOUR_SOLANA_WALLET_ADDRESS

# Test against production
SOLPAY_API_BASE=https://www.solpay.cash \
SOLPAY_UI_BASE=https://www.solpay.cash \
node quick-test.js YOUR_WALLET_ADDRESS

# Test against local development
SOLPAY_API_BASE=http://localhost:3002 \
SOLPAY_UI_BASE=http://localhost:3002 \
node quick-test.js YOUR_WALLET_ADDRESS
```

This will create a test payment intent and display the hosted payment URL.

## Installation

Each SDK is self-contained in its respective language folder. See the quickstart guides for detailed installation instructions.

## Examples

Full working examples are available in the `/examples` directory:

- `/examples/js-demo` - JavaScript payment flow with receipt verification
- `/examples/python-demo` - Python integration example
- `/examples/php-demo` - PHP payment processing

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- [Overview](./docs/overview.md) - Architecture and concepts
- [Receipts & Memo](./docs/receipts-and-memo.md) - Receipt verification
- [x402 Context](./docs/x402-context.md) - Understanding x402 protocol

## Configuration

Copy `.env.example` to `.env` and configure:

```env
SOLPAY_API_BASE=https://www.solpay.cash
MERCHANT_WALLET=your_solana_wallet_address
X402_FACILITATOR_ID=facilitator.payai.network
X402_NETWORK=solana:devnet
```

## API Reference

### Creating Payment Intents

```typescript
await client.pay({
  amount: number,           // Amount in native units (e.g., 10 USDC)
  asset: string,           // Asset type: 'USDC', 'SOL', etc.
  customerEmail?: string,  // Optional customer email
  metadata?: object        // Optional metadata
});
```

### Verifying Receipts

```typescript
const verification = await client.verifyReceipt(receiptUrl);

console.log(verification.ok);              // true if hash matches
console.log(verification.computed_hash);   // SHA-256 hash we computed
console.log(verification.reported_hash);   // Hash from receipt
```

## Testing

Run the test suite for each SDK:

```bash
# JavaScript
cd sdk/js && npm test

# Python
cd sdk/python && python -m pytest

# PHP
cd sdk/php && ./vendor/bin/phpunit
```

## Postman Collection

Import `postman/SolPay-x402-Facilitator.postman_collection.json` for API testing.

## Support

- **Documentation**: [/docs](./docs)
- **Examples**: [/examples](./examples)
- **Issues**: https://github.com/solpay-cash/solpay-x402-sdk/issues

## License

MIT License - see LICENSE file for details

## Contributing

See CONTRIBUTING.md for guidelines.

---

Built with ❤️ for the Solana ecosystem
