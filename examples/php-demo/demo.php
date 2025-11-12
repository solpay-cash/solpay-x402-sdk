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
use function SolPay\X402\getHostedPaymentUrl;

// Configuration
$config = [
    'api_base' => getenv('SOLPAY_API_BASE') ?: 'https://www.solpay.cash',
    'merchant_wallet' => getenv('MERCHANT_WALLET') ?: 'YOUR_WALLET_ADDRESS',
    'network' => getenv('X402_NETWORK') ?: 'solana:devnet',
    'facilitator_id' => getenv('X402_FACILITATOR_ID') ?: 'facilitator.payai.network',
    'debug' => true
];

// UI base URL for hosted payment pages
$uiBase = getenv('SOLPAY_UI_BASE') ?: 'https://www.solpay.cash';

function main() {
    global $config;

    echo "=== SolPay x402 SDK Demo ===\n\n";

    // Initialize client
    $client = new Client($config);

    try {
        // 1. Create payment intent (amounts in smallest units: 1 USDC = 1,000,000 micro-USDC)
        echo "1. Creating payment intent...\n";
        $payment = $client->pay([
            'amount' => 1000000,  // 1 USDC (6 decimals)
            'asset' => 'USDC',
            'customer_email' => 'customer@example.com',
            'metadata' => [
                'order_id' => 'order_12345',
                'product' => 'Premium Subscription'
            ]
        ]);

        echo "✅ Payment intent created!\n";
        echo "   Intent ID: {$payment['intent_id']}\n";
        echo "   Status: {$payment['status']}\n";

        // Display amount breakdown
        echo "\n💰 Amount Breakdown:\n";
        echo "   Requested: " . ($payment['amount']['requested'] / 1000000) . " USDC\n";
        echo "   Total: " . ($payment['amount']['total'] / 1000000) . " USDC\n";
        echo "   Fees: " . ($payment['amount']['fees'] / 1000000) . " USDC\n";
        echo "   Merchant receives: " . ($payment['amount']['net'] / 1000000) . " USDC\n";

        // Generate and display hosted payment URL
        $hostedUrl = getHostedPaymentUrl($uiBase, $payment['intent_id']);
        echo "\n🔗 Hosted Payment URL:\n";
        echo "   {$hostedUrl}\n";
        echo "   👉 Open this URL to complete the payment\n";

        if (isset($payment['x402'])) {
            echo "\n🌐 x402 Context: " . json_encode($payment['x402'], JSON_PRETTY_PRINT) . "\n";
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

        // 4. Show settlement info if available
        if (isset($payment['settlement'])) {
            echo "4. Settlement Information:\n";
            echo "   Merchant amount: " . ($payment['settlement']['merchant_received'] / 1000000) . " USDC\n";
            echo "   Treasury fee: " . ($payment['settlement']['treasury_fee'] / 1000000) . " USDC\n";
            if (isset($payment['settlement']['facilitator_fee'])) {
                echo "   Facilitator fee: " . ($payment['settlement']['facilitator_fee'] / 1000000) . " USDC\n";
            }
            echo "\n";
        }

        // 5. Verify receipt (if payment has receipt)
        if (isset($payment['receipt'])) {
            echo "5. Verifying receipt...\n";
            $verification = $client->verifyReceipt($payment['receipt']['url']);

            if ($verification['ok']) {
                echo "✅ Receipt verified successfully!\n";
                echo "   Receipt URL: {$payment['receipt']['url']}\n";
                echo "   Computed hash: {$verification['computed_hash']}\n";
                echo "   Reported hash: {$verification['reported_hash']}\n";
                echo "   Transaction signature: {$verification['receipt']['transaction_signature']}\n";

                // Display Solana explorer link
                $network = strpos($config['network'], 'devnet') !== false ? 'devnet' : 'mainnet-beta';
                $explorerUrl = "https://explorer.solana.com/tx/{$verification['receipt']['transaction_signature']}?cluster={$network}";
                echo "   🔍 View on Solana Explorer: {$explorerUrl}\n";
            } else {
                echo "❌ Receipt verification failed!\n";
                echo "   Error: {$verification['error']}\n";
            }
        } else {
            echo "5. No receipt available yet (payment not completed)\n";
            echo "   👉 Complete the payment at: {$hostedUrl}\n";
            echo "   💡 After payment, re-run this script to see receipt info\n";
        }

    } catch (Exception $error) {
        echo "❌ Error: {$error->getMessage()}\n";
        exit(1);
    }
}

// Run example
main();
