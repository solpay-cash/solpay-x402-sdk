"""
SolPay x402 SDK - Python

One-line integration for accepting Solana payments with x402 facilitator context.
"""

import hashlib
import json
import requests
from typing import Dict, Any, Optional, Literal


class SolPayX402:
    """
    SolPay x402 SDK Client

    Example:
        client = SolPayX402(
            api_base='https://api.solpay.cash',
            merchant_wallet='YOUR_WALLET',
            network='solana:devnet'
        )

        result = client.pay(
            amount=10.0,
            asset='USDC',
            customer_email='customer@example.com'
        )
    """

    def __init__(
        self,
        api_base: str,
        merchant_wallet: str,
        network: Literal['solana:devnet', 'solana:mainnet'],
        facilitator_id: str = 'facilitator.payai.network',
        facilitator_url: str = 'https://facilitator.payai.network',
        api_key: Optional[str] = None,
        debug: bool = False
    ):
        """
        Initialize SolPayX402 client

        Args:
            api_base: API base URL (e.g., https://api.solpay.cash)
            merchant_wallet: Merchant Solana wallet address
            network: Network identifier (solana:devnet or solana:mainnet)
            facilitator_id: Optional x402 facilitator ID
            facilitator_url: Optional x402 facilitator URL
            api_key: Optional API key for authenticated requests
            debug: Enable debug logging
        """
        if not api_base:
            raise ValueError('api_base is required')
        if not merchant_wallet:
            raise ValueError('merchant_wallet is required')
        if not network:
            raise ValueError('network is required')

        self.api_base = api_base
        self.merchant_wallet = merchant_wallet
        self.network = network
        self.facilitator_id = facilitator_id
        self.facilitator_url = facilitator_url
        self.api_key = api_key
        self.debug = debug

    def pay(
        self,
        amount: float,
        asset: str,
        customer_email: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a payment intent"""
        try:
            self._log('Creating payment intent...', {'amount': amount, 'asset': asset})
            intent = self._create_payment_intent({
                'amount': amount,
                'asset': asset,
                'customer_email': customer_email,
                'metadata': metadata,
                'success_url': success_url,
                'cancel_url': cancel_url
            })
            self._log('Payment intent created:', intent)
            return {
                'intent_id': intent['id'],
                'payment_url': intent.get('payment_url') or f"{self.api_base}/checkout/{intent['id']}",
                'status': intent['status'],
                'amount': {
                    'requested': amount,
                    'total': intent.get('amount_required', amount),
                    'fees': intent.get('fees_total', 0),
                    'net': intent.get('merchant_receives', amount)
                },
                'receipt': {
                    'url': intent['receipt']['url'],
                    'hash': intent['receipt']['sha256_hash'],
                    'memo': intent['receipt']['memo'],
                    'signature': intent['receipt']['transaction_signature']
                } if intent.get('receipt') else None,
                'settlement': intent.get('settlement'),
                'x402': intent.get('x402_context')
            }
        except Exception as e:
            self._log('Payment error:', str(e))
            raise

    def confirm_payment(self, intent_id: str, signature: str) -> Dict[str, Any]:
        """Confirm a payment intent with transaction signature"""
        try:
            self._log('Confirming payment...', {'intent_id': intent_id, 'signature': signature})
            url = f"{self.api_base}/api/v1/payment_intents/{intent_id}/confirm"
            headers = {'Content-Type': 'application/json'}
            if self.api_key:
                headers['Authorization'] = f'Bearer {self.api_key}'
            response = requests.post(url, headers=headers, json={'transaction_signature': signature})
            if not response.ok:
                error_data = response.json() if response.content else {'error': 'Unknown error'}
                raise Exception(error_data.get('error', f'HTTP {response.status_code}: {response.reason}'))
            intent = response.json()
            return {
                'intent_id': intent['id'],
                'payment_url': intent.get('payment_url') or f"{self.api_base}/checkout/{intent['id']}",
                'status': intent['status'],
                'amount': {
                    'requested': intent.get('amount_requested', 0),
                    'total': intent.get('amount_required', 0),
                    'fees': intent.get('fees_total', 0),
                    'net': intent.get('merchant_receives', 0)
                },
                'receipt': {
                    'url': intent['receipt']['url'],
                    'hash': intent['receipt']['sha256_hash'],
                    'memo': intent['receipt']['memo'],
                    'signature': intent['receipt']['transaction_signature']
                } if intent.get('receipt') else None,
                'settlement': intent.get('settlement'),
                'x402': intent.get('x402_context')
            }
        except Exception as e:
            self._log('Confirmation error:', str(e))
            raise

    def verify_receipt(self, receipt_url: str) -> Dict[str, Any]:
        """Verify a receipt by computing SHA-256 hash over canonical JSON"""
        try:
            self._log('Verifying receipt...', {'receipt_url': receipt_url})
            response = requests.get(receipt_url)
            if not response.ok:
                raise Exception(f'Failed to fetch receipt: {response.reason}')
            receipt = response.json()
            reported_hash = receipt.get('sha256_hash') or receipt.get('hash')
            if not reported_hash:
                raise Exception('Receipt does not contain sha256_hash field')
            computed_hash = self._compute_receipt_hash(receipt)
            ok = computed_hash == reported_hash
            self._log('Receipt verification result:', {'ok': ok, 'computed_hash': computed_hash, 'reported_hash': reported_hash})
            return {'ok': ok, 'computed_hash': computed_hash, 'reported_hash': reported_hash, 'receipt': receipt}
        except Exception as e:
            self._log('Receipt verification error:', str(e))
            return {'ok': False, 'computed_hash': '', 'reported_hash': '', 'error': str(e)}

    def get_payment_intent(self, intent_id: str) -> Dict[str, Any]:
        """Get payment intent by ID"""
        try:
            self._log('Fetching payment intent...', {'intent_id': intent_id})
            url = f"{self.api_base}/api/v1/payment_intents/{intent_id}"
            headers = {}
            if self.api_key:
                headers['Authorization'] = f'Bearer {self.api_key}'
            response = requests.get(url, headers=headers)
            if not response.ok:
                error_data = response.json() if response.content else {'error': 'Unknown error'}
                raise Exception(error_data.get('error', f'HTTP {response.status_code}: {response.reason}'))
            return response.json()
        except Exception as e:
            self._log('Get payment intent error:', str(e))
            raise

    def _create_payment_intent(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Create a payment intent via API"""
        url = f"{self.api_base}/api/v1/payment_intents"
        body = {
            'amount': params['amount'],
            'asset': params['asset'],
            'merchant_wallet': self.merchant_wallet,
            'customer_email': params.get('customer_email'),
            'metadata': {**(params.get('metadata') or {}), 'sdk': '@solpay/x402-sdk-python', 'sdk_version': '1.0.0'},
            'x402_context': {'facilitator_id': self.facilitator_id, 'network': self.network, 'resource': f"{self.api_base}/api/v1/payment_intents"},
            'success_url': params.get('success_url'),
            'cancel_url': params.get('cancel_url')
        }
        headers = {'Content-Type': 'application/json'}
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
        response = requests.post(url, headers=headers, json=body)
        if not response.ok:
            error_data = response.json() if response.content else {'error': 'Unknown error'}
            raise Exception(error_data.get('error', f'HTTP {response.status_code}: {response.reason}'))
        return response.json()

    def _compute_receipt_hash(self, receipt: Dict[str, Any]) -> str:
        """Compute SHA-256 hash of receipt using canonical JSON"""
        canonical = dict(receipt)
        canonical.pop('sha256_hash', None)
        canonical.pop('hash', None)
        canonical_json = self._canonical_json(canonical)
        hash_obj = hashlib.sha256()
        hash_obj.update(canonical_json.encode('utf-8'))
        return hash_obj.hexdigest()

    def _canonical_json(self, obj: Any) -> str:
        """Convert object to canonical JSON (sorted keys, no whitespace)"""
        if obj is None:
            return 'null'
        if not isinstance(obj, (dict, list)):
            return json.dumps(obj, separators=(',', ':'))
        if isinstance(obj, list):
            items = [self._canonical_json(item) for item in obj]
            return '[' + ','.join(items) + ']'
        keys = sorted(obj.keys())
        pairs = [f'"{key}":{self._canonical_json(obj[key])}' for key in keys]
        return '{' + ','.join(pairs) + '}'

    def _log(self, *args):
        """Log debug messages if debug mode is enabled"""
        if self.debug:
            print('[SolPayX402]', *args)


def create_client(**config) -> SolPayX402:
    """Helper function to create a client instance"""
    return SolPayX402(**config)
