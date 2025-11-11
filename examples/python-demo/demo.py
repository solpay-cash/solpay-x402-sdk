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

from solpay_x402 import SolPayX402

# Configuration
config = {
    'api_base': os.getenv('SOLPAY_API_BASE', 'https://api.solpay.cash'),
    'merchant_wallet': os.getenv('MERCHANT_WALLET', 'YOUR_WALLET_ADDRESS'),
    'network': os.getenv('X402_NETWORK', 'solana:devnet'),
    'facilitator_id': os.getenv('X402_FACILITATOR_ID', 'facilitator.payai.network'),
    'debug': True
}


def main():
    print('=== SolPay x402 SDK Demo ===\n')

    # Initialize client
    client = SolPayX402(**config)

    try:
        # 1. Create payment intent
        print('1. Creating payment intent...')
        payment = client.pay(
            amount=10.0,
            asset='USDC',
            customer_email='customer@example.com',
            metadata={
                'order_id': 'order_12345',
                'product': 'Premium Subscription'
            },
            success_url='https://yoursite.com/success',
            cancel_url='https://yoursite.com/cancel'
        )

        print('✅ Payment intent created!')
        print(f"   Intent ID: {payment['intent_id']}")
        print(f"   Payment URL: {payment['payment_url']}")
        print(f"   Status: {payment['status']}")
        print(f"   Amount: {json.dumps(payment['amount'], indent=2)}")

        if payment.get('x402'):
            print(f"   x402 Context: {json.dumps(payment['x402'], indent=2)}")

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

        # 4. Verify receipt (if payment has receipt)
        if payment.get('receipt'):
            print('4. Verifying receipt...')
            verification = client.verify_receipt(payment['receipt']['url'])

            if verification['ok']:
                print('✅ Receipt verified successfully!')
                print(f"   Computed hash: {verification['computed_hash']}")
                print(f"   Reported hash: {verification['reported_hash']}")
                print(f"   Transaction: {verification['receipt']['transaction_signature']}")
            else:
                print('❌ Receipt verification failed!')
                print(f"   Error: {verification.get('error')}")
        else:
            print('4. No receipt available yet (payment not completed)')

    except Exception as error:
        print(f'❌ Error: {str(error)}')
        sys.exit(1)


if __name__ == '__main__':
    main()
