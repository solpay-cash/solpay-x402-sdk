# Python Quickstart

Get started with SolPay x402 payments in Python.

## Installation

```bash
pip install requests
```

Then copy `solpay_x402.py` to your project or add the SDK path to your Python path.

## Basic Setup

```python
from solpay_x402 import SolPayX402

client = SolPayX402(
    api_base='https://www.solpay.cash',
    merchant_wallet='YOUR_SOLANA_WALLET_ADDRESS',
    network='solana:devnet',  # or 'solana:mainnet'
    debug=True  # Enable logging (optional)
)
```

## Create a Payment

```python
def create_payment():
    try:
        result = client.pay(
            amount=10.0,
            asset='USDC',
            customer_email='customer@example.com',  # Optional
            metadata={'order_id': '12345'}  # Optional
        )

        print(f"Payment URL: {result['payment_url']}")
        print(f"Intent ID: {result['intent_id']}")

        # Redirect customer to payment URL
        return result['payment_url']
    except Exception as error:
        print(f"Payment failed: {str(error)}")
```

## Check Payment Status

```python
def check_payment(intent_id):
    intent = client.get_payment_intent(intent_id)

    print(f"Status: {intent['status']}")
    # Status can be: 'pending', 'processing', 'succeeded', 'failed'

    if intent['status'] == 'succeeded':
        print('Payment completed!')
        print(f"Receipt: {intent['receipt']}")
```

## Verify Receipt

```python
def verify_payment(receipt_url):
    verification = client.verify_receipt(receipt_url)

    if verification['ok']:
        print('✅ Receipt verified!')
        print(f"Transaction: {verification['receipt']['transaction_signature']}")

        # Fulfill order here
        fulfill_order(verification['receipt'])
    else:
        print(f"❌ Invalid receipt: {verification.get('error')}")
```

## Complete Example

```python
import os
from solpay_x402 import SolPayX402

client = SolPayX402(
    api_base=os.getenv('SOLPAY_API_BASE'),
    merchant_wallet=os.getenv('MERCHANT_WALLET'),
    network=os.getenv('SOLPAY_NETWORK'),
    api_key=os.getenv('SOLPAY_API_KEY')  # For server-side
)

# Create payment
def checkout(amount, asset):
    payment = client.pay(
        amount=amount,
        asset=asset,
        customer_email='customer@example.com',
        success_url='https://yoursite.com/success',
        cancel_url='https://yoursite.com/cancel'
    )

    return payment

# Handle success redirect
def handle_success(intent_id):
    intent = client.get_payment_intent(intent_id)

    if intent['status'] == 'succeeded' and intent.get('receipt'):
        # Verify receipt
        verification = client.verify_receipt(intent['receipt']['url'])

        if verification['ok']:
            # Payment confirmed - fulfill order
            print('Order fulfilled!')

# Usage
payment = checkout(10.0, 'USDC')
print(f"Pay here: {payment['payment_url']}")
```

## Flask Integration

```python
from flask import Flask, request, redirect, jsonify
from solpay_x402 import SolPayX402

app = Flask(__name__)

client = SolPayX402(
    api_base=os.getenv('SOLPAY_API_BASE'),
    merchant_wallet=os.getenv('MERCHANT_WALLET'),
    network='solana:mainnet'
)

@app.route('/checkout', methods=['POST'])
def checkout():
    data = request.json

    payment = client.pay(
        amount=data['amount'],
        asset='USDC',
        customer_email=data.get('email'),
        success_url=request.host_url + 'success',
        cancel_url=request.host_url + 'cancel'
    )

    return jsonify({
        'payment_url': payment['payment_url'],
        'intent_id': payment['intent_id']
    })

@app.route('/success')
def success():
    intent_id = request.args.get('intent_id')

    intent = client.get_payment_intent(intent_id)

    if intent['status'] == 'succeeded':
        # Verify receipt
        verification = client.verify_receipt(intent['receipt']['url'])

        if verification['ok']:
            return 'Payment successful!'

    return 'Payment verification failed', 400

if __name__ == '__main__':
    app.run(debug=True)
```

## Django Integration

```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from solpay_x402 import SolPayX402
import json

client = SolPayX402(
    api_base=os.getenv('SOLPAY_API_BASE'),
    merchant_wallet=os.getenv('MERCHANT_WALLET'),
    network='solana:mainnet'
)

@csrf_exempt
def checkout(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        payment = client.pay(
            amount=data['amount'],
            asset='USDC',
            customer_email=data.get('email')
        )

        return JsonResponse({
            'payment_url': payment['payment_url'],
            'intent_id': payment['intent_id']
        })

def verify_payment(request, intent_id):
    intent = client.get_payment_intent(intent_id)

    if intent['status'] == 'succeeded':
        verification = client.verify_receipt(intent['receipt']['url'])

        if verification['ok']:
            # Fulfill order
            return JsonResponse({'status': 'success'})

    return JsonResponse({'status': 'failed'}, status=400)
```

## Environment Variables

Create a `.env` file:

```env
SOLPAY_API_BASE=https://www.solpay.cash
MERCHANT_WALLET=your_solana_wallet_address
SOLPAY_NETWORK=solana:devnet
SOLPAY_API_KEY=your_api_key_for_server_side
```

## Next Steps

- Run the [example project](../examples/python-demo)
- Read the [overview](./overview.md) to understand the architecture
- Learn about [receipt verification](./receipts-and-memo.md)
- Understand [x402 context](./x402-context.md)

## Support

- GitHub: https://github.com/solpay-cash/solpay-x402-sdk
- Documentation: https://docs.solpay.cash
- Support: support@solpay.cash
