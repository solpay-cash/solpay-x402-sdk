"""
SolPay x402 SDK - Python Example

This example demonstrates:
1. Creating a payment intent
2. Getting payment intent status
3. Confirming a payment (simulated)
4. Verifying a receipt
"""

import os
import sys
import json

# Add SDK to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../sdk/python'))

from solpay_x402 import SolPayX402, get_hosted_payment_url

# Configuration
config = {
    'api_base': os.getenv('SOLPAY_API_BASE', 'https://www.solpay.cash'),
    'merchant_wallet': os.getenv('MERCHANT_WALLET', 'YOUR_WALLET_ADDRESS'),
    'network': os.getenv('X402_NETWORK', 'solana:devnet'),
    'facilitator_id': os.getenv('X402_FACILITATOR_ID', 'facilitator.payai.network'),
    'debug': True
}

# UI base URL for hosted payment pages
ui_base = os.getenv('SOLPAY_UI_BASE', 'https://www.solpay.cash')


def main():
    print('=== SolPay x402 SDK Demo ===\n')

    # Initialize client
    client = SolPayX402(**config)

    try:
        # 1. Create payment intent (amounts in smallest units: 1 USDC = 1,000,000 micro-USDC)
        print('1. Creating payment intent...')
        payment = client.pay(
            amount=1000000,  # 1 USDC (6 decimals)
            asset='USDC',
            customer_email='customer@example.com',
            metadata={
                'order_id': 'order_12345',
                'product': 'Premium Subscription'
            }
        )

        print('✅ Payment intent created!')
        print(f"   Intent ID: {payment['intent_id']}")
        print(f"   Status: {payment['status']}")

        # Display amount breakdown
        print('\n💰 Amount Breakdown:')
        print(f"   Requested: {payment['amount']['requested'] / 1000000} USDC")
        print(f"   Total: {payment['amount']['total'] / 1000000} USDC")
        print(f"   Fees: {payment['amount']['fees'] / 1000000} USDC")
        print(f"   Merchant receives: {payment['amount']['net'] / 1000000} USDC")

        # Generate and display hosted payment URL
        hosted_url = get_hosted_payment_url(ui_base, payment['intent_id'])
        print('\n🔗 Hosted Payment URL:')
        print(f"   {hosted_url}")
        print('   👉 Open this URL to complete the payment')

        if payment.get('x402'):
            print(f"\n🌐 x402 Context: {json.dumps(payment['x402'], indent=2)}")

        print('\n')

        # 2. Get payment intent status
        print('2. Fetching payment intent...')
        intent = client.get_payment_intent(payment['intent_id'])
        print('✅ Payment intent fetched!')
        print(f"   Status: {intent['status']}")
        print('\n')

        # 3. Confirm payment (requires actual transaction signature)
        print('3. Confirming payment...')
        print('   ⚠️  Skipped: Requires real transaction signature from wallet')
        print('   In production: confirmed = client.confirm_payment(intent_id, signature)')
        print('\n')

        # 4. Show settlement info if available
        if payment.get('settlement'):
            print('4. Settlement Information:')
            print(f"   Merchant amount: {payment['settlement']['merchant_received'] / 1000000} USDC")
            print(f"   Treasury fee: {payment['settlement']['treasury_fee'] / 1000000} USDC")
            if payment['settlement'].get('facilitator_fee'):
                print(f"   Facilitator fee: {payment['settlement']['facilitator_fee'] / 1000000} USDC")
            print('\n')

        # 5. Verify receipt (if payment has receipt)
        if payment.get('receipt'):
            print('5. Verifying receipt...')
            verification = client.verify_receipt(payment['receipt']['url'])

            if verification['ok']:
                print('✅ Receipt verified successfully!')
                print(f"   Receipt URL: {payment['receipt']['url']}")
                print(f"   Computed hash: {verification['computed_hash']}")
                print(f"   Reported hash: {verification['reported_hash']}")
                print(f"   Transaction signature: {verification['receipt']['transaction_signature']}")

                # Display Solana explorer link
                network = 'devnet' if 'devnet' in config['network'] else 'mainnet-beta'
                explorer_url = f"https://explorer.solana.com/tx/{verification['receipt']['transaction_signature']}?cluster={network}"
                print(f"   🔍 View on Solana Explorer: {explorer_url}")
            else:
                print('❌ Receipt verification failed!')
                print(f"   Error: {verification.get('error')}")
        else:
            print('5. No receipt available yet (payment not completed)')
            print(f"   👉 Complete the payment at: {hosted_url}")
            print('   💡 After payment, re-run this script to see receipt info')

    except Exception as error:
        print(f'❌ Error: {str(error)}')
        sys.exit(1)


if __name__ == '__main__':
    main()
