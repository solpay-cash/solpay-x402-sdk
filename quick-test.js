#!/usr/bin/env node
/**
 * Quick Test Script for SolPay x402 SDK
 *
 * Usage: node quick-test.js YOUR_WALLET_ADDRESS
 *
 * Environment variables:
 *   SOLPAY_API_BASE - API endpoint (default: https://www.solpay.cash)
 *   SOLPAY_UI_BASE - UI for hosted pages (default: https://www.solpay.cash)
 *   X402_NETWORK - Network (default: solana:devnet)
 */

const { SolPayX402, getHostedPaymentUrl } = require('./sdk/js/dist/index.js');

// Get wallet address from command line or use placeholder
const merchantWallet = process.argv[2] || 'YOUR_WALLET_ADDRESS_HERE';

if (merchantWallet === 'YOUR_WALLET_ADDRESS_HERE') {
  console.error('❌ Please provide your Solana wallet address:');
  console.error('   node quick-test.js YOUR_WALLET_ADDRESS');
  console.error('\n💡 Get a devnet wallet at: https://phantom.app or https://solflare.com');
  console.error('\n📝 Environment variables (optional):');
  console.error('   SOLPAY_API_BASE=https://www.solpay.cash');
  console.error('   SOLPAY_UI_BASE=https://www.solpay.cash');
  console.error('   X402_NETWORK=solana:devnet');
  process.exit(1);
}

// Configuration from environment variables
const apiBase = process.env.SOLPAY_API_BASE || 'https://dev.solpay.cash';
const uiBase = process.env.SOLPAY_UI_BASE || 'https://dev.solpay.cash';
const network = process.env.X402_NETWORK || 'solana:devnet';

console.log('🚀 Testing SolPay x402 SDK\n');
console.log(`API Base: ${apiBase}`);
console.log(`UI Base: ${uiBase}`);
console.log(`Network: ${network}`);
console.log(`Merchant Wallet: ${merchantWallet}\n`);

// Initialize client
const client = new SolPayX402({
  apiBase: apiBase,
  merchantWallet: merchantWallet,
  network: network,
  debug: true
});

async function test() {
  try {
    console.log('📝 Creating payment intent for 0.1 USDC (100000 micro-USDC)...\n');

    const payment = await client.pay({
      amount: 100000, // 0.1 USDC in smallest units (6 decimals)
      asset: 'USDC',
      customerEmail: 'test@example.com',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Payment intent created!\n');
    console.log('📋 Details:');
    console.log(`   Intent ID: ${payment.intentId}`);
    console.log(`   Status: ${payment.status}`);

    // Display amount breakdown (convert from micro-units)
    console.log(`\n💰 Amount Breakdown:`);
    console.log(`   Requested: ${payment.amount.requested / 1000000} USDC`);
    console.log(`   Total (with fees): ${payment.amount.total / 1000000} USDC`);
    console.log(`   Fees: ${payment.amount.fees / 1000000} USDC`);
    console.log(`   Merchant receives: ${payment.amount.net / 1000000} USDC`);

    // Generate and display hosted payment URL
    const hostedUrl = getHostedPaymentUrl(uiBase, payment.intentId);
    console.log(`\n🔗 Hosted Payment URL:`);
    console.log(`   ${hostedUrl}`);
    console.log('   👉 Open this URL to complete the payment');

    // Display settlement info if available
    if (payment.settlement) {
      console.log(`\n📊 Settlement:`);
      console.log(`   Merchant receives: ${payment.settlement.merchant_amount / 1000000} USDC`);
      const treasuryFee = payment.amount.fees;
      console.log(`   Processor fee: ${treasuryFee / 1000000} USDC (${payment.fees?.processor_fee_bps / 100}%)`);
      if (payment.settlement.facilitator_fee) {
        console.log(`   Facilitator fee: ${payment.settlement.facilitator_fee / 1000000} USDC`);
      }
    }

    if (payment.x402) {
      console.log(`\n🌐 x402 Context:`);
      console.log(`   Facilitator: ${payment.x402.facilitator_id}`);
      console.log(`   Network: ${payment.x402.network}`);
      console.log(`   Resource: ${payment.x402.resource}`);
    }

    // Show receipt info if available
    if (payment.receipt) {
      console.log(`\n🧾 Receipt:`);
      console.log(`   URL: ${payment.receipt.url}`);
      console.log(`   Hash: ${payment.receipt.hash}`);
      console.log(`   Transaction: ${payment.receipt.signature}`);

      // Show Solana explorer link
      const networkType = network.includes('devnet') ? 'devnet' : 'mainnet-beta';
      const explorerUrl = `https://explorer.solana.com/tx/${payment.receipt.signature}?cluster=${networkType}`;
      console.log(`   🔍 Explorer: ${explorerUrl}`);
    }

    console.log('\n✨ Test complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Tip: Check your API connection');
      console.error(`   Current API: ${apiBase}`);
      console.error('   For local: SOLPAY_API_BASE=http://localhost:3002');
      console.error('   For prod:  SOLPAY_API_BASE=https://www.solpay.cash');
    } else if (error.message.includes('wallet')) {
      console.error('\n💡 Tip: Check your wallet address format');
    } else if (error.message.includes('table') || error.message.includes('column')) {
      console.error('\n💡 Tip: Local database not set up');
      console.error('   Run migrations in your API server');
    }

    process.exit(1);
  }
}

test();
