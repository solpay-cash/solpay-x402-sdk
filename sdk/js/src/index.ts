/**
 * SolPay x402 SDK
 *
 * One-line integration for accepting Solana payments with x402 facilitator context.
 *
 * @packageDocumentation
 */

import crypto from 'crypto';

/**
 * Configuration options for SolPayX402 client
 */
export interface SolPayX402Config {
  /** API base URL (e.g., https://api.solpay.cash) */
  apiBase: string;
  /** Merchant Solana wallet address */
  merchantWallet: string;
  /** Network identifier (solana:devnet or solana:mainnet) */
  network: 'solana:devnet' | 'solana:mainnet';
  /** Optional x402 facilitator ID */
  facilitatorId?: string;
  /** Optional x402 facilitator URL */
  facilitatorUrl?: string;
  /** Optional API key for authenticated requests */
  apiKey?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Payment parameters
 */
export interface PayParams {
  /** Payment amount in native units (e.g., 10 USDC) */
  amount: number;
  /** Asset type (USDC, SOL, etc.) */
  asset: string;
  /** Optional customer email */
  customerEmail?: string;
  /** Optional custom metadata */
  metadata?: Record<string, any>;
  /** Optional success URL for redirects */
  successUrl?: string;
  /** Optional cancel URL for redirects */
  cancelUrl?: string;
}

/**
 * Payment result containing intent and receipt info
 */
export interface PayResult {
  /** Payment intent ID */
  intentId: string;
  /** Payment URL for customer checkout */
  paymentUrl: string;
  /** Payment status */
  status: string;
  /** Amount details */
  amount: {
    requested: number;
    total: number;
    fees: number;
    net: number;
  };
  /** Receipt information (if payment completed) */
  receipt?: {
    url: string;
    hash: string;
    memo: string;
    signature: string;
  };
  /** Settlement information */
  settlement?: {
    merchant_received: number;
    treasury_fee: number;
    facilitator_fee?: number;
  };
  /** x402 context */
  x402?: {
    facilitator_id: string;
    network: string;
    resource: string;
  };
}

/**
 * Receipt verification result
 */
export interface ReceiptVerification {
  /** Whether the receipt hash is valid */
  ok: boolean;
  /** Hash we computed from receipt data */
  computed_hash: string;
  /** Hash reported in the receipt */
  reported_hash: string;
  /** Receipt data */
  receipt?: any;
  /** Error message if verification failed */
  error?: string;
}

/**
 * SolPay x402 SDK Client
 *
 * @example
 * ```typescript
 * const client = new SolPayX402({
 *   apiBase: 'https://api.solpay.cash',
 *   merchantWallet: 'YOUR_WALLET',
 *   network: 'solana:devnet'
 * });
 *
 * const result = await client.pay({
 *   amount: 10,
 *   asset: 'USDC',
 *   customerEmail: 'customer@example.com'
 * });
 * ```
 */
export class SolPayX402 {
  private config: Required<SolPayX402Config>;

  constructor(config: SolPayX402Config) {
    this.config = {
      facilitatorId: 'facilitator.payai.network',
      facilitatorUrl: 'https://facilitator.payai.network',
      apiKey: '',
      debug: false,
      ...config,
    };

    // Validate configuration
    if (!this.config.apiBase) {
      throw new Error('apiBase is required');
    }
    if (!this.config.merchantWallet) {
      throw new Error('merchantWallet is required');
    }
    if (!this.config.network) {
      throw new Error('network is required');
    }
  }

  /**
   * Create a payment intent and optionally confirm it
   *
   * @param params - Payment parameters
   * @returns Payment result with intent ID, URL, and receipt
   *
   * @example
   * ```typescript
   * const result = await client.pay({
   *   amount: 10,
   *   asset: 'USDC',
   *   customerEmail: 'customer@example.com'
   * });
   *
   * console.log('Payment URL:', result.paymentUrl);
   * console.log('Intent ID:', result.intentId);
   * ```
   */
  async pay(params: PayParams): Promise<PayResult> {
    try {
      this.log('Creating payment intent...', params);

      // Create payment intent
      const intent = await this.createPaymentIntent(params);

      this.log('Payment intent created:', intent);

      // Return formatted result
      return {
        intentId: intent.id,
        paymentUrl: intent.payment_url || `${this.config.apiBase}/checkout/${intent.id}`,
        status: intent.status,
        amount: {
          requested: params.amount,
          total: intent.amount_required || params.amount,
          fees: intent.fees_total || 0,
          net: intent.merchant_receives || params.amount,
        },
        receipt: intent.receipt ? {
          url: intent.receipt.url,
          hash: intent.receipt.sha256_hash,
          memo: intent.receipt.memo,
          signature: intent.receipt.transaction_signature,
        } : undefined,
        settlement: intent.settlement,
        x402: intent.x402_context,
      };
    } catch (error) {
      this.log('Payment error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a payment intent via API
   *
   * @param params - Payment parameters
   * @returns Raw payment intent response
   */
  private async createPaymentIntent(params: PayParams): Promise<any> {
    const url = `${this.config.apiBase}/api/v1/payment_intents`;

    const body = {
      amount: params.amount,
      asset: params.asset,
      merchant_wallet: this.config.merchantWallet,
      customer_email: params.customerEmail,
      metadata: {
        ...params.metadata,
        sdk: '@solpay/x402-sdk',
        sdk_version: '1.0.0',
      },
      x402_context: {
        facilitator_id: this.config.facilitatorId,
        network: this.config.network,
        resource: `${this.config.apiBase}/api/v1/payment_intents`,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Confirm a payment intent with transaction signature
   *
   * @param intentId - Payment intent ID
   * @param signature - Transaction signature from wallet
   * @returns Confirmed payment result
   *
   * @example
   * ```typescript
   * const result = await client.confirmPayment(
   *   'pi_abc123',
   *   '4xY7Z...'  // Transaction signature from wallet
   * );
   * ```
   */
  async confirmPayment(intentId: string, signature: string): Promise<PayResult> {
    try {
      this.log('Confirming payment...', { intentId, signature });

      const url = `${this.config.apiBase}/api/v1/payment_intents/${intentId}/confirm`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transaction_signature: signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const intent = await response.json();

      return {
        intentId: intent.id,
        paymentUrl: intent.payment_url || `${this.config.apiBase}/checkout/${intent.id}`,
        status: intent.status,
        amount: {
          requested: intent.amount_requested || 0,
          total: intent.amount_required || 0,
          fees: intent.fees_total || 0,
          net: intent.merchant_receives || 0,
        },
        receipt: intent.receipt ? {
          url: intent.receipt.url,
          hash: intent.receipt.sha256_hash,
          memo: intent.receipt.memo,
          signature: intent.receipt.transaction_signature,
        } : undefined,
        settlement: intent.settlement,
        x402: intent.x402_context,
      };
    } catch (error) {
      this.log('Confirmation error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Verify a receipt by computing SHA-256 hash over canonical JSON
   *
   * @param receiptUrl - URL to the receipt JSON
   * @returns Verification result with computed and reported hashes
   *
   * @example
   * ```typescript
   * const verification = await client.verifyReceipt(
   *   'https://api.solpay.cash/receipts/rec_abc123'
   * );
   *
   * if (verification.ok) {
   *   console.log('Receipt is valid!');
   * } else {
   *   console.error('Receipt verification failed');
   * }
   * ```
   */
  async verifyReceipt(receiptUrl: string): Promise<ReceiptVerification> {
    try {
      this.log('Verifying receipt...', { receiptUrl });

      // Fetch receipt
      const response = await fetch(receiptUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch receipt: ${response.statusText}`);
      }

      const receipt = await response.json();

      // Extract reported hash
      const reportedHash = receipt.sha256_hash || receipt.hash;

      if (!reportedHash) {
        throw new Error('Receipt does not contain sha256_hash field');
      }

      // Compute hash over canonical JSON
      const computedHash = this.computeReceiptHash(receipt);

      // Verify
      const ok = computedHash === reportedHash;

      this.log('Receipt verification result:', {
        ok,
        computed_hash: computedHash,
        reported_hash: reportedHash,
      });

      return {
        ok,
        computed_hash: computedHash,
        reported_hash: reportedHash,
        receipt,
      };
    } catch (error) {
      this.log('Receipt verification error:', error);
      return {
        ok: false,
        computed_hash: '',
        reported_hash: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Compute SHA-256 hash of receipt using canonical JSON
   *
   * @param receipt - Receipt object
   * @returns SHA-256 hash (hex string)
   */
  private computeReceiptHash(receipt: any): string {
    // Create canonical receipt by excluding the hash field itself
    const canonical = { ...receipt };
    delete canonical.sha256_hash;
    delete canonical.hash;

    // Sort keys and stringify
    const canonicalJson = this.canonicalJSON(canonical);

    // Compute SHA-256
    const hash = crypto.createHash('sha256');
    hash.update(canonicalJson);
    return hash.digest('hex');
  }

  /**
   * Convert object to canonical JSON (sorted keys, no whitespace)
   *
   * @param obj - Object to serialize
   * @returns Canonical JSON string
   */
  private canonicalJSON(obj: any): string {
    if (obj === null) {
      return 'null';
    }

    if (typeof obj !== 'object') {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.canonicalJSON(item)).join(',') + ']';
    }

    // Sort keys
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(key => {
      const value = this.canonicalJSON(obj[key]);
      return `"${key}":${value}`;
    });

    return '{' + pairs.join(',') + '}';
  }

  /**
   * Get payment intent by ID
   *
   * @param intentId - Payment intent ID
   * @returns Payment intent object
   */
  async getPaymentIntent(intentId: string): Promise<any> {
    try {
      this.log('Fetching payment intent...', { intentId });

      const url = `${this.config.apiBase}/api/v1/payment_intents/${intentId}`;

      const headers: Record<string, string> = {};
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      this.log('Get payment intent error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[SolPayX402]', ...args);
    }
  }

  /**
   * Handle and format errors
   */
  private handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}

/**
 * Default export
 */
export default SolPayX402;

/**
 * Helper function to create a client instance
 *
 * @param config - Client configuration
 * @returns SolPayX402 client instance
 *
 * @example
 * ```typescript
 * import { createClient } from '@solpay/x402-sdk';
 *
 * const client = createClient({
 *   apiBase: 'https://api.solpay.cash',
 *   merchantWallet: 'YOUR_WALLET',
 *   network: 'solana:devnet'
 * });
 * ```
 */
export function createClient(config: SolPayX402Config): SolPayX402 {
  return new SolPayX402(config);
}
