#!/usr/bin/env node
/**
 * Debug Test - Shows raw API response
 */

const merchantWallet = process.argv[2] || 'DsAfN2mwcc3EuJ1gFMtwEddNbaNgp64kDzHFmKF62k2z';

console.log('🔍 Debug Test - Raw API Request\n');
console.log(`Merchant Wallet: ${merchantWallet}\n`);

const body = {
  amount: 0.1,
  currency: 'USDC',
  merchant_wallet: merchantWallet,
  customer_email: 'test@example.com',
  metadata: {
    test: true,
    sdk: '@solpay/x402-sdk',
    sdk_version: '1.0.0'
  },
  x402_context: {
    facilitator_id: 'facilitator.payai.network',
    network: 'solana:devnet',
    resource: 'https://www.solpay.cash/api/v1/payment_intents'
  }
};

console.log('📤 Request Body:');
console.log(JSON.stringify(body, null, 2));
console.log('\n📤 Request Headers:');
console.log({
  'Content-Type': 'application/json',
  'x-merchant-wallet': merchantWallet
});

fetch('http://localhost:3002/api/v1/payment_intents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-merchant-wallet': merchantWallet
  },
  body: JSON.stringify(body)
})
  .then(async (response) => {
    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('\n📥 Response Body:');
    console.log(text);

    try {
      const json = JSON.parse(text);
      console.log('\n📥 Parsed JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('(Not valid JSON)');
    }
  })
  .catch(error => {
    console.error('\n❌ Fetch Error:', error.message);
    console.error(error);
  });
