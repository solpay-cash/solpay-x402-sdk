# Web App Implementation Guide

**For: localhost:3002 web application**

This guide explains how to implement the `/pay/:piId` route in your web app to support Payment Intent hosted pages.

## Task 1: Web App Routing

### 1.1 Add Route Guards

Add guards to redirect between payment types:

```typescript
// In your routing file (e.g., app/checkout/[id]/page.tsx or routes.ts)

export async function CheckoutPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Guard: If ID is a Payment Intent, redirect to /pay
  if (id.startsWith('pi_')) {
    redirect(`/pay/${id}`);
  }

  // Continue with existing Checkout Session logic
  // ... existing code for cs_ IDs
}
```

### 1.2 Create `/pay/:piId` Page

Create a new page component for Payment Intents:

```typescript
// app/pay/[piId]/page.tsx (Next.js example)

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface PaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  merchant_wallet: string;
  description?: string;
  fees: {
    processor_fee_bps: number;
    processor_fee_amount: number;
  };
  settlement: {
    merchant_amount: number;
    merchant_wallet: string;
  };
  receipt_url?: string;
  receipt_hash?: string;
  x402: {
    network: string; // e.g., 'solana:devnet'
  };
}

export default function PaymentIntentPage() {
  const { piId } = useParams();
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard: Redirect if ID is a Checkout Session
  useEffect(() => {
    if (piId && typeof piId === 'string' && piId.startsWith('cs_')) {
      window.location.href = `/checkout/${piId}`;
    }
  }, [piId]);

  // Fetch Payment Intent
  useEffect(() => {
    if (!piId || typeof piId !== 'string') return;

    fetchPaymentIntent(piId);
  }, [piId]);

  async function fetchPaymentIntent(id: string) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/payment_intents/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch payment intent: ${response.statusText}`);
      }

      const data = await response.json();
      setIntent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(paymentSignature: string, customerWallet: string) {
    if (!piId || typeof piId !== 'string') return;

    try {
      const response = await fetch(`/api/v1/payment_intents/${piId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_signature: paymentSignature,
          customer_wallet: customerWallet
        })
      });

      if (!response.ok) {
        throw new Error('Payment confirmation failed');
      }

      // Re-fetch to get updated status and receipt
      await fetchPaymentIntent(piId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading payment intent...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !intent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error || 'Payment intent not found'}</p>
        </div>
      </div>
    );
  }

  // Payment succeeded - show receipt
  if (intent.status === 'succeeded') {
    return <ReceiptPanel intent={intent} />;
  }

  // Payment pending - show confirmation UI
  return <ConfirmationPanel intent={intent} onConfirm={handleConfirm} />;
}

// Confirmation Panel Component
function ConfirmationPanel({
  intent,
  onConfirm
}: {
  intent: PaymentIntent;
  onConfirm: (signature: string, wallet: string) => Promise<void>;
}) {
  // Convert minor units to human-readable (USDC has 6 decimals)
  const decimals = intent.currency === 'USDC' ? 6 : 9;
  const amount = intent.amount / Math.pow(10, decimals);
  const feeAmount = intent.fees.processor_fee_amount / Math.pow(10, decimals);
  const merchantAmount = intent.settlement.merchant_amount / Math.pow(10, decimals);

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Payment Request</h1>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">{amount} {intent.currency}</span>
        </div>

        {intent.description && (
          <div className="flex justify-between">
            <span className="text-gray-600">Description:</span>
            <span>{intent.description}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600">Merchant:</span>
          <span className="font-mono text-sm">{intent.merchant_wallet.slice(0, 8)}...</span>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Fee ({intent.fees.processor_fee_bps / 100}%):</span>
            <span>{feeAmount} {intent.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Merchant receives:</span>
            <span>{merchantAmount} {intent.currency}</span>
          </div>
        </div>
      </div>

      {/* Wallet connection UI would go here */}
      <button
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        onClick={() => {
          // TODO: Integrate with Phantom/Solflare to get signature and wallet
          alert('Connect wallet integration needed');
        }}
      >
        Connect Wallet & Confirm
      </button>
    </div>
  );
}

// Receipt Panel Component
function ReceiptPanel({ intent }: { intent: PaymentIntent }) {
  const decimals = intent.currency === 'USDC' ? 6 : 9;
  const amount = intent.amount / Math.pow(10, decimals);
  const merchantAmount = intent.settlement.merchant_amount / Math.pow(10, decimals);
  const feeAmount = intent.fees.processor_fee_amount / Math.pow(10, decimals);

  // Determine explorer URL based on network (using transaction signature from receipt)
  const network = intent.x402.network.includes('devnet') ? 'devnet' : 'mainnet-beta';
  // Note: You would need to add transaction_signature field to the receipt
  // For now, explorerUrl would link to the payment transaction signature
  const explorerUrl = intent.receipt_url
    ? `https://explorer.solana.com/tx/TRANSACTION_SIGNATURE_HERE?cluster=${network}`
    : null;

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount Paid:</span>
          <span className="font-semibold">{amount} {intent.currency}</span>
        </div>

        <div className="border-t pt-4 space-y-2">
          <h3 className="font-semibold text-sm text-gray-700">Settlement Details</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Merchant receives:</span>
            <span>{merchantAmount} {intent.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Processing fee:</span>
            <span>{feeAmount} {intent.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Fee rate:</span>
            <span>{intent.fees.processor_fee_bps / 100}%</span>
          </div>
        </div>

        {intent.receipt_url && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Receipt</h3>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Hash:</span>
              <span className="font-mono text-xs">{intent.receipt_hash?.slice(0, 16)}...</span>
            </div>
            <a
              href={intent.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              📄 View canonical JSON
            </a>
          </div>
        )}

        {intent.receipt_url && explorerUrl && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Blockchain Verification</h3>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              🔍 View Payment Transaction on Solana Explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 1.3 Update Checkout Page Guard

Update your existing `/checkout/:id` page:

```typescript
// app/checkout/[id]/page.tsx

export async function CheckoutPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // NEW: Guard to redirect Payment Intents to /pay
  if (id.startsWith('pi_')) {
    redirect(`/pay/${id}`);
  }

  // Existing Checkout Session logic for cs_ IDs
  // ...rest of your existing code unchanged
}
```

## Environment Variables

Add to your `.env`:

```bash
# No changes needed - existing env vars work
# API calls use /api/v1/payment_intents which already exists
```

## Testing

1. Create a payment intent via SDK:
   ```bash
   node examples/js-demo/index.js
   ```

2. Copy the hosted URL (e.g., `http://localhost:3002/pay/pi_...`)

3. Open in browser - should load the payment UI

4. Test guards:
   - Visit `/checkout/pi_abc` → should redirect to `/pay/pi_abc`
   - Visit `/pay/cs_abc` → should redirect to `/checkout/cs_abc`

## Summary

**What's new:**
- ✅ New route: `/pay/:piId`
- ✅ Guard in `/checkout/:id` to redirect `pi_*` IDs
- ✅ Guard in `/pay/:id` to redirect `cs_*` IDs
- ✅ Receipt panel with fees, settlement, and explorer link
- ✅ Pending state with amount/fee breakdown

**What's unchanged:**
- ✅ Existing `/checkout/:csId` behavior for Checkout Sessions
- ✅ API endpoints (`/api/v1/payment_intents/*`)
- ✅ Fee calculation logic (all server-side)
