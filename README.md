# SolPay x402 SDK

**One-line integration for accepting Solana payments with x402 facilitator context.**

This SDK provides a simple, unified interface for integrating SolPay payments with x402 protocol support across JavaScript/TypeScript, Python, and PHP.

## Features

- ✅ Create payment intents with dynamic amounts
- ✅ Confirm payments with x402 facilitator context
- ✅ Verify receipts using SHA-256 canonical JSON hashing
- ✅ Support for Solana devnet and mainnet
- ✅ No client-side fee calculations - trust API values
- ✅ Full receipt and settlement info
- ✅ Memo attestation support

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
  apiBase: 'https://api.solpay.cash',
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
    api_base='https://api.solpay.cash',
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
    'api_base' => 'https://api.solpay.cash',
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
SOLPAY_API_BASE=https://api.solpay.cash
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
- **Issues**: https://github.com/solpay/x402-sdk/issues

## License

MIT License - see LICENSE file for details

## Contributing

See CONTRIBUTING.md for guidelines.

---

Built with ❤️ for the Solana ecosystem
