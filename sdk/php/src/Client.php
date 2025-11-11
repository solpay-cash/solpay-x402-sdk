<?php

declare(strict_types=1);

namespace SolPay\X402;

use Exception;

/**
 * SolPay X-402 PHP SDK Client
 *
 * A complete implementation for interacting with the SolPay X-402 payment protocol.
 * Supports creating payment intents, confirming payments, and verifying receipts.
 *
 * @package SolPay\X402
 * @version 1.0.0
 */
class Client
{
    /**
     * @var string API base URL
     */
    private string $apiBase;

    /**
     * @var string Merchant's Solana wallet address
     */
    private string $merchantWallet;

    /**
     * @var string Network (mainnet-beta, devnet, testnet)
     */
    private string $network;

    /**
     * @var string|null Optional facilitator ID
     */
    private ?string $facilitatorId;

    /**
     * @var string|null Optional facilitator URL
     */
    private ?string $facilitatorUrl;

    /**
     * @var string|null Optional API key for authentication
     */
    private ?string $apiKey;

    /**
     * @var bool Enable debug logging
     */
    private bool $debug;

    /**
     * Client constructor.
     *
     * @param array<string, mixed> $config Configuration array with keys:
     *                                     - api_base (string, required): Base URL for the API
     *                                     - merchant_wallet (string, required): Merchant's Solana wallet address
     *                                     - network (string, required): Solana network (mainnet-beta, devnet, testnet)
     *                                     - facilitator_id (string, optional): Facilitator identifier
     *                                     - facilitator_url (string, optional): Facilitator webhook URL
     *                                     - api_key (string, optional): API key for authentication
     *                                     - debug (bool, optional): Enable debug logging (default: false)
     *
     * @throws Exception If required configuration parameters are missing
     */
    public function __construct(array $config)
    {
        // Validate required parameters
        if (empty($config['api_base'])) {
            throw new Exception('Configuration error: api_base is required');
        }
        if (empty($config['merchant_wallet'])) {
            throw new Exception('Configuration error: merchant_wallet is required');
        }
        if (empty($config['network'])) {
            throw new Exception('Configuration error: network is required');
        }

        // Validate network value
        $validNetworks = ['mainnet-beta', 'devnet', 'testnet'];
        if (!in_array($config['network'], $validNetworks, true)) {
            throw new Exception(
                sprintf('Configuration error: network must be one of: %s', implode(', ', $validNetworks))
            );
        }

        $this->apiBase = rtrim($config['api_base'], '/');
        $this->merchantWallet = $config['merchant_wallet'];
        $this->network = $config['network'];
        $this->facilitatorId = $config['facilitator_id'] ?? null;
        $this->facilitatorUrl = $config['facilitator_url'] ?? null;
        $this->apiKey = $config['api_key'] ?? null;
        $this->debug = $config['debug'] ?? false;

        $this->log('Client initialized', [
            'api_base' => $this->apiBase,
            'merchant_wallet' => $this->merchantWallet,
            'network' => $this->network,
        ]);
    }

    /**
     * Create a payment intent and return payment details.
     *
     * This is the primary method for initiating a payment. It creates a payment intent
     * on the server and returns the necessary information for the customer to complete
     * the payment.
     *
     * @param array<string, mixed> $params Payment parameters:
     *                                     - amount (float, required): Payment amount in tokens
     *                                     - token (string, required): Token mint address (use 'SOL' for native SOL)
     *                                     - reference (string, optional): Unique payment reference
     *                                     - label (string, optional): Human-readable label
     *                                     - message (string, optional): Message to display to customer
     *                                     - memo (string, optional): Memo to include in transaction
     *                                     - metadata (array, optional): Additional metadata
     *
     * @return array<string, mixed> Payment intent details including:
     *                              - intent_id (string): Unique payment intent identifier
     *                              - merchant_wallet (string): Destination wallet address
     *                              - amount (float): Payment amount
     *                              - token (string): Token mint address
     *                              - reference (string): Payment reference
     *                              - network (string): Solana network
     *                              - label (string, optional): Payment label
     *                              - message (string, optional): Payment message
     *                              - memo (string, optional): Transaction memo
     *
     * @throws Exception If payment creation fails or validation errors occur
     */
    public function pay(array $params): array
    {
        $this->log('Creating payment', $params);

        // Validate required parameters
        if (!isset($params['amount']) || !is_numeric($params['amount']) || $params['amount'] <= 0) {
            throw new Exception('Invalid parameter: amount must be a positive number');
        }
        if (empty($params['token'])) {
            throw new Exception('Invalid parameter: token is required');
        }

        // Create the payment intent
        $intent = $this->createPaymentIntent($params);

        $this->log('Payment created successfully', ['intent_id' => $intent['intent_id']]);

        return $intent;
    }

    /**
     * Confirm a payment with transaction signature.
     *
     * After the customer completes the payment transaction, call this method to
     * confirm the payment and retrieve the receipt.
     *
     * @param string $intentId Payment intent ID returned from pay()
     * @param string $signature Transaction signature from the blockchain
     *
     * @return array<string, mixed> Payment receipt including:
     *                              - receipt_id (string): Unique receipt identifier
     *                              - intent_id (string): Associated payment intent ID
     *                              - signature (string): Transaction signature
     *                              - amount (float): Paid amount
     *                              - token (string): Token used
     *                              - merchant_wallet (string): Destination wallet
     *                              - customer_wallet (string): Source wallet
     *                              - status (string): Payment status
     *                              - timestamp (string): ISO 8601 timestamp
     *                              - receipt_hash (string): SHA-256 hash for verification
     *
     * @throws Exception If confirmation fails or payment not found
     */
    public function confirmPayment(string $intentId, string $signature): array
    {
        $this->log('Confirming payment', [
            'intent_id' => $intentId,
            'signature' => $signature,
        ]);

        if (empty($intentId)) {
            throw new Exception('Invalid parameter: intentId is required');
        }
        if (empty($signature)) {
            throw new Exception('Invalid parameter: signature is required');
        }

        $endpoint = sprintf('/payment-intents/%s/confirm', $intentId);
        $payload = ['signature' => $signature];

        $receipt = $this->request('POST', $endpoint, $payload);

        $this->log('Payment confirmed successfully', ['receipt_id' => $receipt['receipt_id'] ?? 'unknown']);

        return $receipt;
    }

    /**
     * Verify a payment receipt's integrity.
     *
     * Validates that the receipt has not been tampered with by recomputing the
     * receipt hash using canonical JSON serialization and comparing it to the
     * provided hash.
     *
     * @param array<string, mixed> $receipt Receipt data to verify
     *
     * @return bool True if receipt is valid, false otherwise
     */
    public function verifyReceipt(array $receipt): bool
    {
        $this->log('Verifying receipt', ['receipt_id' => $receipt['receipt_id'] ?? 'unknown']);

        if (empty($receipt['receipt_hash'])) {
            $this->log('Verification failed: receipt_hash missing');
            return false;
        }

        $providedHash = $receipt['receipt_hash'];
        $computedHash = $this->computeReceiptHash($receipt);

        $isValid = hash_equals($providedHash, $computedHash);

        $this->log('Verification result', [
            'valid' => $isValid,
            'provided_hash' => $providedHash,
            'computed_hash' => $computedHash,
        ]);

        return $isValid;
    }

    /**
     * Retrieve a payment intent by ID.
     *
     * Fetch the current state of a payment intent, including its status and
     * associated details.
     *
     * @param string $intentId Payment intent ID
     *
     * @return array<string, mixed> Payment intent details
     *
     * @throws Exception If intent not found or request fails
     */
    public function getPaymentIntent(string $intentId): array
    {
        $this->log('Fetching payment intent', ['intent_id' => $intentId]);

        if (empty($intentId)) {
            throw new Exception('Invalid parameter: intentId is required');
        }

        $endpoint = sprintf('/payment-intents/%s', $intentId);
        $intent = $this->request('GET', $endpoint);

        $this->log('Payment intent retrieved', ['intent_id' => $intentId]);

        return $intent;
    }

    /**
     * Create a payment intent on the server.
     *
     * @param array<string, mixed> $params Payment parameters
     *
     * @return array<string, mixed> Created payment intent
     *
     * @throws Exception If creation fails
     */
    private function createPaymentIntent(array $params): array
    {
        $payload = [
            'merchant_wallet' => $this->merchantWallet,
            'amount' => (float) $params['amount'],
            'token' => $params['token'],
            'network' => $this->network,
        ];

        // Add optional parameters
        if (!empty($params['reference'])) {
            $payload['reference'] = $params['reference'];
        }
        if (!empty($params['label'])) {
            $payload['label'] = $params['label'];
        }
        if (!empty($params['message'])) {
            $payload['message'] = $params['message'];
        }
        if (!empty($params['memo'])) {
            $payload['memo'] = $params['memo'];
        }
        if (!empty($params['metadata'])) {
            $payload['metadata'] = $params['metadata'];
        }

        // Add facilitator information if configured
        if ($this->facilitatorId !== null) {
            $payload['facilitator_id'] = $this->facilitatorId;
        }
        if ($this->facilitatorUrl !== null) {
            $payload['facilitator_url'] = $this->facilitatorUrl;
        }

        return $this->request('POST', '/payment-intents', $payload);
    }

    /**
     * Compute the SHA-256 hash of a receipt for verification.
     *
     * Uses canonical JSON serialization to ensure consistent hashing regardless
     * of key order or formatting differences.
     *
     * @param array<string, mixed> $receipt Receipt data
     *
     * @return string Hex-encoded SHA-256 hash
     */
    private function computeReceiptHash(array $receipt): string
    {
        // Create a copy without the receipt_hash field
        $dataToHash = $receipt;
        unset($dataToHash['receipt_hash']);

        // Convert to canonical JSON and compute hash
        $canonicalJson = $this->canonicalJSON($dataToHash);
        $hash = hash('sha256', $canonicalJson);

        $this->log('Computed receipt hash', [
            'canonical_json' => $canonicalJson,
            'hash' => $hash,
        ]);

        return $hash;
    }

    /**
     * Convert data to canonical JSON format.
     *
     * Ensures consistent JSON serialization by:
     * - Sorting object keys alphabetically
     * - Using consistent formatting (no extra whitespace)
     * - Recursively processing nested structures
     *
     * @param mixed $data Data to convert
     *
     * @return string Canonical JSON string
     */
    private function canonicalJSON($data): string
    {
        if (is_array($data)) {
            // Check if this is an associative array (object) or indexed array (list)
            $isObject = array_keys($data) !== range(0, count($data) - 1);

            if ($isObject) {
                // Sort keys for objects
                ksort($data);
                $pairs = [];
                foreach ($data as $key => $value) {
                    $pairs[] = json_encode((string) $key, JSON_UNESCAPED_SLASHES) . ':' . $this->canonicalJSON($value);
                }
                return '{' . implode(',', $pairs) . '}';
            } else {
                // Arrays remain in order
                $items = array_map([$this, 'canonicalJSON'], $data);
                return '[' . implode(',', $items) . ']';
            }
        } elseif (is_null($data)) {
            return 'null';
        } elseif (is_bool($data)) {
            return $data ? 'true' : 'false';
        } elseif (is_int($data) || is_float($data)) {
            return (string) $data;
        } else {
            // String
            return json_encode($data, JSON_UNESCAPED_SLASHES);
        }
    }

    /**
     * Make an HTTP request to the API.
     *
     * @param string $method HTTP method (GET, POST, PUT, DELETE)
     * @param string $endpoint API endpoint path
     * @param array<string, mixed>|null $data Request payload for POST/PUT
     *
     * @return array<string, mixed> Response data
     *
     * @throws Exception If request fails or returns error status
     */
    private function request(string $method, string $endpoint, ?array $data = null): array
    {
        $url = $this->apiBase . $endpoint;

        $this->log('Making HTTP request', [
            'method' => $method,
            'url' => $url,
            'data' => $data,
        ]);

        // Initialize cURL
        $ch = curl_init();

        // Set common options
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        // Set headers
        $headers = [
            'Content-Type: application/json',
            'Accept: application/json',
        ];

        if ($this->apiKey !== null) {
            $headers[] = 'Authorization: Bearer ' . $this->apiKey;
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        // Set method and data
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if ($data !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        } elseif ($method === 'GET') {
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        }

        // Execute request
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Handle cURL errors
        if ($response === false) {
            $this->log('Request failed', ['error' => $error]);
            throw new Exception(sprintf('Request failed: %s', $error));
        }

        // Parse response
        $responseData = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->log('Invalid JSON response', ['response' => $response]);
            throw new Exception(sprintf('Invalid JSON response: %s', json_last_error_msg()));
        }

        $this->log('Request completed', [
            'status' => $httpCode,
            'response' => $responseData,
        ]);

        // Handle HTTP errors
        if ($httpCode >= 400) {
            $errorMessage = $responseData['error'] ?? $responseData['message'] ?? 'Unknown error';
            throw new Exception(sprintf('API error (%d): %s', $httpCode, $errorMessage));
        }

        return $responseData;
    }

    /**
     * Log a debug message if debug mode is enabled.
     *
     * @param string $message Log message
     * @param array<string, mixed> $context Additional context data
     *
     * @return void
     */
    private function log(string $message, array $context = []): void
    {
        if (!$this->debug) {
            return;
        }

        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context, JSON_UNESCAPED_SLASHES) : '';

        error_log(sprintf('[%s] SolPay\X402\Client: %s%s', $timestamp, $message, $contextStr));
    }
}
