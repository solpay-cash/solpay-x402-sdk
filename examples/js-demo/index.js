/**
 * SolPay x402 SDK - JavaScript Example
 *
 * This example demonstrates:
 * 1. Creating a payment intent
 * 2. Displaying the hosted payment URL
 * 3. Getting payment intent status
 * 4. Confirming a payment (simulated)
 * 5. Verifying a receipt
 */

const { SolPayX402, getHostedPaymentUrl } = require('../../sdk/js/dist/index.js');

// Configuration
const config = {
  apiBase: process.env.SOLPAY_API_BASE || 'https://www.solpay.cash',
  merchantWallet: process.env.MERCHANT_WALLET || 'YOUR_WALLET_ADDRESS',
  network: process.env.X402_NETWORK || 'solana:devnet',
  facilitatorId: process.env.X402_FACILITATOR_ID || 'facilitator.payai.network',
  debug: true
};

// UI base URL for hosted payment pages
const uiBase = process.env.SOLPAY_UI_BASE || 'https://www.solpay.cash';

async function main() {
  console.log('=== SolPay x402 SDK Demo ===\n');

  // Initialize client
  const client = new SolPayX402(config);

  try {
    // 1. Create payment intent (amounts in smallest units: 1 USDC = 1,000,000 micro-USDC)
    console.log('1. Creating payment intent...');
    const payment = await client.pay({
      amount: 1000000, // 1 USDC (6 decimals)
      asset: 'USDC',
      customerEmail: 'customer@example.com',
      metadata: {
        order_id: 'order_12345',
        product: 'Premium Subscription'
      }
    });

    console.log('✅ Payment intent created!');
    console.log('   Intent ID:', payment.intentId);
    console.log('   Status:', payment.status);

    // Display amount breakdown
    console.log('\n💰 Amount Breakdown:');
    console.log(`   Requested: ${payment.amount.requested / 1000000} USDC`);
    console.log(`   Total: ${payment.amount.total / 1000000} USDC`);
    console.log(`   Fees: ${payment.amount.fees / 1000000} USDC`);
    console.log(`   Merchant receives: ${payment.amount.net / 1000000} USDC`);

    // Generate and display hosted payment URL
    const hostedUrl = getHostedPaymentUrl(uiBase, payment.intentId);
    console.log('\n🔗 Hosted Payment URL:');
    console.log(`   ${hostedUrl}`);
    console.log('   👉 Open this URL to complete the payment');

    if (payment.x402) {
      console.log('\n🌐 x402 Context:', JSON.stringify(payment.x402, null, 2));
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

    // 4. Show settlement info if available
    if (payment.settlement) {
      console.log('4. Settlement Information:');
      console.log(`   Merchant amount: ${payment.settlement.merchant_received / 1000000} USDC`);
      console.log(`   Treasury fee: ${payment.settlement.treasury_fee / 1000000} USDC`);
      if (payment.settlement.facilitator_fee) {
        console.log(`   Facilitator fee: ${payment.settlement.facilitator_fee / 1000000} USDC`);
      }
      console.log('\n');
    }

    // 5. Verify receipt (if payment has receipt)
    if (payment.receipt) {
      console.log('5. Verifying receipt...');
      const verification = await client.verifyReceipt(payment.receipt.url);

      if (verification.ok) {
        console.log('✅ Receipt verified successfully!');
        console.log('   Receipt URL:', payment.receipt.url);
        console.log('   Computed hash:', verification.computed_hash);
        console.log('   Reported hash:', verification.reported_hash);
        console.log('   Transaction signature:', verification.receipt.transaction_signature);

        // Display Solana explorer link
        const network = config.network.includes('devnet') ? 'devnet' : 'mainnet-beta';
        const explorerUrl = `https://explorer.solana.com/tx/${verification.receipt.transaction_signature}?cluster=${network}`;
        console.log(`   🔍 View on Solana Explorer: ${explorerUrl}`);
      } else {
        console.log('❌ Receipt verification failed!');
        console.log('   Error:', verification.error);
      }
    } else {
      console.log('5. No receipt available yet (payment not completed)');
      console.log('   👉 Complete the payment at:', hostedUrl);
      console.log('   💡 After payment, re-run this script to see receipt info');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run example
main();
