/**
 * SolPay x402 SDK - JavaScript Example
 *
 * This example demonstrates:
 * 1. Creating a payment intent
 * 2. Getting payment intent status
 * 3. Confirming a payment (simulated)
 * 4. Verifying a receipt
 */

const { SolPayX402 } = require('../../sdk/js/dist/index.js');

// Configuration
const config = {
  apiBase: process.env.SOLPAY_API_BASE || 'https://api.solpay.cash',
  merchantWallet: process.env.MERCHANT_WALLET || 'YOUR_WALLET_ADDRESS',
  network: process.env.X402_NETWORK || 'solana:devnet',
  facilitatorId: process.env.X402_FACILITATOR_ID || 'facilitator.payai.network',
  debug: true
};

async function main() {
  console.log('=== SolPay x402 SDK Demo ===\n');

  // Initialize client
  const client = new SolPayX402(config);

  try {
    // 1. Create payment intent
    console.log('1. Creating payment intent...');
    const payment = await client.pay({
      amount: 10.0,
      asset: 'USDC',
      customerEmail: 'customer@example.com',
      metadata: {
        order_id: 'order_12345',
        product: 'Premium Subscription'
      },
      successUrl: 'https://yoursite.com/success',
      cancelUrl: 'https://yoursite.com/cancel'
    });

    console.log('✅ Payment intent created!');
    console.log('   Intent ID:', payment.intentId);
    console.log('   Payment URL:', payment.paymentUrl);
    console.log('   Status:', payment.status);
    console.log('   Amount:', JSON.stringify(payment.amount, null, 2));

    if (payment.x402) {
      console.log('   x402 Context:', JSON.stringify(payment.x402, null, 2));
    }

    console.log('\n');

    // 2. Get payment intent status
    console.log('2. Fetching payment intent...');
    const intent = await client.getPaymentIntent(payment.intentId);
    console.log('✅ Payment intent fetched!');
    console.log('   Status:', intent.status);
    console.log('\n');

    // 3. Confirm payment (requires actual transaction signature)
    // In production, you would get this from the wallet after user signs
    console.log('3. Confirming payment...');
    console.log('   ⚠️  Skipped: Requires real transaction signature from wallet');
    console.log('   In production: const confirmed = await client.confirmPayment(intentId, signature)');
    console.log('\n');

    // 4. Verify receipt (if payment has receipt)
    if (payment.receipt) {
      console.log('4. Verifying receipt...');
      const verification = await client.verifyReceipt(payment.receipt.url);

      if (verification.ok) {
        console.log('✅ Receipt verified successfully!');
        console.log('   Computed hash:', verification.computed_hash);
        console.log('   Reported hash:', verification.reported_hash);
        console.log('   Transaction:', verification.receipt.transaction_signature);
      } else {
        console.log('❌ Receipt verification failed!');
        console.log('   Error:', verification.error);
      }
    } else {
      console.log('4. No receipt available yet (payment not completed)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run example
main();
