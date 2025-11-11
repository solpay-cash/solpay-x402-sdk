# PHP Quickstart

Get started with SolPay x402 payments in PHP.

## Installation

```bash
composer require solpay/x402-sdk
```

Or manually include the SDK:
```bash
cd sdk/php
composer install
```

## Basic Setup

```php
<?php
require_once 'vendor/autoload.php';

use SolPay\X402\Client;

$client = new Client([
    'api_base' => 'https://api.solpay.cash',
    'merchant_wallet' => 'YOUR_SOLANA_WALLET_ADDRESS',
    'network' => 'solana:devnet', // or 'solana:mainnet'
    'debug' => true // Enable logging (optional)
]);
```

## Create a Payment

```php
function createPayment($client) {
    try {
        $result = $client->pay([
            'amount' => 10.0,
            'asset' => 'USDC',
            'customer_email' => 'customer@example.com', // Optional
            'metadata' => ['order_id' => '12345'] // Optional
        ]);

        echo "Payment URL: " . $result['payment_url'] . "\n";
        echo "Intent ID: " . $result['intent_id'] . "\n";

        // Redirect customer to payment URL
        header('Location: ' . $result['payment_url']);
        exit;
    } catch (Exception $error) {
        echo "Payment failed: " . $error->getMessage() . "\n";
    }
}
```

## Check Payment Status

```php
function checkPayment($client, $intentId) {
    $intent = $client->getPaymentIntent($intentId);

    echo "Status: " . $intent['status'] . "\n";
    // Status can be: 'pending', 'processing', 'succeeded', 'failed'

    if ($intent['status'] === 'succeeded') {
        echo "Payment completed!\n";
        echo "Receipt: " . json_encode($intent['receipt']) . "\n";
    }
}
```

## Verify Receipt

```php
function verifyPayment($client, $receiptUrl) {
    $verification = $client->verifyReceipt($receiptUrl);

    if ($verification['ok']) {
        echo "✅ Receipt verified!\n";
        echo "Transaction: " . $verification['receipt']['transaction_signature'] . "\n";

        // Fulfill order here
        fulfillOrder($verification['receipt']);
    } else {
        echo "❌ Invalid receipt: " . $verification['error'] . "\n";
    }
}
```

## Complete Example

```php
<?php
require_once 'vendor/autoload.php';

use SolPay\X402\Client;

$client = new Client([
    'api_base' => getenv('SOLPAY_API_BASE'),
    'merchant_wallet' => getenv('MERCHANT_WALLET'),
    'network' => getenv('SOLPAY_NETWORK'),
    'api_key' => getenv('SOLPAY_API_KEY') // For server-side
]);

// Create payment
function checkout($client, $amount, $asset) {
    $payment = $client->pay([
        'amount' => $amount,
        'asset' => $asset,
        'customer_email' => 'customer@example.com',
        'success_url' => 'https://yoursite.com/success',
        'cancel_url' => 'https://yoursite.com/cancel'
    ]);

    return $payment;
}

// Handle success redirect
function handleSuccess($client, $intentId) {
    $intent = $client->getPaymentIntent($intentId);

    if ($intent['status'] === 'succeeded' && isset($intent['receipt'])) {
        // Verify receipt
        $verification = $client->verifyReceipt($intent['receipt']['url']);

        if ($verification['ok']) {
            // Payment confirmed - fulfill order
            echo "Order fulfilled!\n";
        }
    }
}

// Usage
$payment = checkout($client, 10.0, 'USDC');
echo "Pay here: " . $payment['payment_url'] . "\n";
```

## Laravel Integration

```php
<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use SolPay\X402\Client;

class PaymentController extends Controller
{
    private $client;

    public function __construct()
    {
        $this->client = new Client([
            'api_base' => config('solpay.api_base'),
            'merchant_wallet' => config('solpay.merchant_wallet'),
            'network' => config('solpay.network')
        ]);
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'email' => 'nullable|email'
        ]);

        $payment = $this->client->pay([
            'amount' => $validated['amount'],
            'asset' => 'USDC',
            'customer_email' => $validated['email'] ?? null,
            'success_url' => route('payment.success'),
            'cancel_url' => route('payment.cancel')
        ]);

        return response()->json([
            'payment_url' => $payment['payment_url'],
            'intent_id' => $payment['intent_id']
        ]);
    }

    public function success(Request $request)
    {
        $intentId = $request->query('intent_id');

        $intent = $this->client->getPaymentIntent($intentId);

        if ($intent['status'] === 'succeeded') {
            $verification = $this->client->verifyReceipt($intent['receipt']['url']);

            if ($verification['ok']) {
                // Fulfill order
                return view('payment.success');
            }
        }

        return response('Payment verification failed', 400);
    }
}
```

## WordPress Integration

```php
<?php
// In your theme's functions.php or custom plugin

require_once get_template_directory() . '/vendor/autoload.php';

use SolPay\X402\Client;

function solpay_init() {
    $client = new Client([
        'api_base' => get_option('solpay_api_base'),
        'merchant_wallet' => get_option('solpay_merchant_wallet'),
        'network' => get_option('solpay_network')
    ]);

    return $client;
}

// Shortcode: [solpay_button amount="10" asset="USDC"]
function solpay_button_shortcode($atts) {
    $atts = shortcode_atts([
        'amount' => '10',
        'asset' => 'USDC'
    ], $atts);

    $client = solpay_init();

    $payment = $client->pay([
        'amount' => floatval($atts['amount']),
        'asset' => $atts['asset']
    ]);

    return sprintf(
        '<a href="%s" class="solpay-button">Pay with SolPay</a>',
        esc_url($payment['payment_url'])
    );
}
add_shortcode('solpay_button', 'solpay_button_shortcode');

// Webhook handler
function solpay_webhook_handler() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['solpay_webhook'])) {
        $payload = json_decode(file_get_contents('php://input'), true);

        $client = solpay_init();
        $intent = $client->getPaymentIntent($payload['intent_id']);

        if ($intent['status'] === 'succeeded') {
            // Process order
            do_action('solpay_payment_succeeded', $intent);
        }

        exit;
    }
}
add_action('init', 'solpay_webhook_handler');
```

## Environment Variables

Create a `.env` file or set environment variables:

```env
SOLPAY_API_BASE=https://api.solpay.cash
MERCHANT_WALLET=your_solana_wallet_address
SOLPAY_NETWORK=solana:devnet
SOLPAY_API_KEY=your_api_key_for_server_side
```

## Error Handling

```php
try {
    $payment = $client->pay([
        'amount' => 10.0,
        'asset' => 'USDC'
    ]);
} catch (InvalidArgumentException $e) {
    // Configuration error
    error_log('Configuration error: ' . $e->getMessage());
} catch (Exception $e) {
    // API or network error
    error_log('Payment error: ' . $e->getMessage());
}
```

## Next Steps

- Run the [example project](../examples/php-demo)
- Read the [overview](./overview.md) to understand the architecture
- Learn about [receipt verification](./receipts-and-memo.md)
- Understand [x402 context](./x402-context.md)

## Support

- GitHub: https://github.com/solpay/x402-sdk
- Documentation: https://docs.solpay.cash
- Support: support@solpay.cash
