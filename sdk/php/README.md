# SolPay x402 SDK (PHP)

Official PHP SDK for SolPay x402 payments.

## Installation

```bash
composer install
```

## Quick Start

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
echo "Intent ID: " . $result['intent_id'] . "\n";
```

## API Reference

### Constructor

```php
new Client(array $config)
```

**Config Options:**
- `api_base` (string, required) - API base URL
- `merchant_wallet` (string, required) - Your Solana wallet address
- `network` (string, required) - 'solana:devnet' or 'solana:mainnet'
- `facilitator_id` (string, optional) - x402 facilitator ID
- `facilitator_url` (string, optional) - x402 facilitator URL
- `api_key` (string, optional) - API key for authenticated requests
- `debug` (bool, optional) - Enable debug logging

### Methods

#### `pay(array $params): array`

Create a payment intent.

**Returns:** Array with payment details

#### `confirmPayment(string $intentId, string $signature): array`

Confirm a payment with transaction signature.

**Returns:** Array with updated payment details

#### `verifyReceipt(string $receiptUrl): array`

Verify a receipt by computing SHA-256 hash.

**Returns:** Array with verification result

#### `getPaymentIntent(string $intentId): array`

Get payment intent by ID.

**Returns:** Payment intent object

## Examples

See `/examples/php-demo` for complete working examples.

## Requirements

- PHP >= 7.4
- ext-json
- ext-curl

## License

MIT
