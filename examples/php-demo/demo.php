<?php
/**
 * SolPay x402 SDK - PHP Example
 *
 * This example demonstrates:
 * 1. Creating a payment intent
 * 2. Getting payment intent status
 * 3. Confirming a payment (simulated)
 * 4. Verifying a receipt
 */

require_once __DIR__ . '/../../sdk/php/vendor/autoload.php';

use SolPay\X402\Client;

// Configuration
$config = [
    'api_base' => getenv('SOLPAY_API_BASE') ?: 'https://api.solpay.cash',
    'merchant_wallet' => getenv('MERCHANT_WALLET') ?: 'YOUR_WALLET_ADDRESS',
    'network' => getenv('X402_NETWORK') ?: 'solana:devnet',
    'facilitator_id' => getenv('X402_FACILITATOR_ID') ?: 'facilitator.payai.network',
    'debug' => true
];

function main() {
    global $config;

    echo "=== SolPay x402 SDK Demo ===\n\n";

    // Initialize client
    $client = new Client($config);

    try {
        // 1. Create payment intent
        echo "1. Creating payment intent...\n";
        $payment = $client->pay([
            'amount' => 10.0,
            'asset' => 'USDC',
            'customer_email' => 'customer@example.com',
            'metadata' => [
                'order_id' => 'order_12345',
                'product' => 'Premium Subscription'
            ],
            'success_url' => 'https://yoursite.com/success',
            'cancel_url' => 'https://yoursite.com/cancel'
        ]);

        echo "✅ Payment intent created!\n";
        echo "   Intent ID: {$payment['intent_id']}\n";
        echo "   Payment URL: {$payment['payment_url']}\n";
        echo "   Status: {$payment['status']}\n";
        echo "   Amount: " . json_encode($payment['amount'], JSON_PRETTY_PRINT) . "\n";

        if (isset($payment['x402'])) {
            echo "   x402 Context: " . json_encode($payment['x402'], JSON_PRETTY_PRINT) . "\n";
        }

        echo "\n";

        // 2. Get payment intent status
        echo "2. Fetching payment intent...\n";
        $intent = $client->getPaymentIntent($payment['intent_id']);
        echo "✅ Payment intent fetched!\n";
        echo "   Status: {$intent['status']}\n";
        echo "\n";

        // 3. Confirm payment (requires actual transaction signature)
        echo "3. Confirming payment...\n";
        echo "   ⚠️  Skipped: Requires real transaction signature from wallet\n";
        echo "   In production: \$confirmed = \$client->confirmPayment(\$intentId, \$signature)\n";
        echo "\n";

        // 4. Verify receipt (if payment has receipt)
        if (isset($payment['receipt'])) {
            echo "4. Verifying receipt...\n";
            $verification = $client->verifyReceipt($payment['receipt']['url']);

            if ($verification['ok']) {
                echo "✅ Receipt verified successfully!\n";
                echo "   Computed hash: {$verification['computed_hash']}\n";
                echo "   Reported hash: {$verification['reported_hash']}\n";
                echo "   Transaction: {$verification['receipt']['transaction_signature']}\n";
            } else {
                echo "❌ Receipt verification failed!\n";
                echo "   Error: {$verification['error']}\n";
            }
        } else {
            echo "4. No receipt available yet (payment not completed)\n";
        }

    } catch (Exception $error) {
        echo "❌ Error: {$error->getMessage()}\n";
        exit(1);
    }
}

// Run example
main();
