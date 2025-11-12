# Changelog

All notable changes to the SolPay x402 SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-15

### Added
- Initial release of SolPay x402 SDK
- JavaScript/TypeScript SDK with full TypeScript support
- Python SDK with type hints
- PHP SDK with PSR-4 autoloading
- One-line payment intent creation
- Payment confirmation with transaction signatures
- Receipt verification using SHA-256 canonical JSON hashing
- x402 facilitator context support
- Network selection (devnet/mainnet)
- Comprehensive documentation
- Working examples for all three languages
- Postman API collection
- Support for custom metadata and URLs
- Debug logging mode
- API key authentication support

### Features
- Create payment intents with dynamic amounts
- Confirm payments with x402 facilitator context
- Verify receipts cryptographically
- Support for multiple assets (USDC, SOL, etc.)
- Transparent fee structure (no client-side calculations)
- Full receipt and settlement information
- SHA-256 hash-based receipt verification
- Success/cancel URL redirects
- Customer email tracking
- Metadata support for custom integrations

### Documentation
- Overview guide
- Receipt verification deep dive
- x402 context explanation
- Quickstart guides for JS, Python, and PHP
- Example projects with README files
- API reference documentation
- Postman collection with test scripts

### SDK Structure
```
solpay-x402-sdk/
├── sdk/
│   ├── js/         # JavaScript/TypeScript SDK
│   ├── python/     # Python SDK
│   └── php/        # PHP SDK
├── examples/
│   ├── js-demo/
│   ├── python-demo/
│   └── php-demo/
├── docs/
│   ├── overview.md
│   ├── receipts-and-memo.md
│   ├── x402-context.md
│   ├── quickstart-js.md
│   ├── quickstart-python.md
│   └── quickstart-php.md
├── postman/
│   └── SolPay-x402-Facilitator.postman_collection.json
└── README.md
```

## Roadmap

### [1.1.0] - Future
- Webhook signature verification helpers
- Batch payment support
- Subscription/recurring payment support
- Additional language SDKs (Go, Rust, Ruby)
- CLI tool for testing
- Enhanced error handling and retry logic

### [1.2.0] - Future
- Stream payment support
- QR code generation
- Mobile SDK (React Native, Flutter)
- Payment link generation
- Invoice management

## Migration Guide

N/A - Initial release

## Support

For questions, issues, or feature requests:
- GitHub Issues: https://github.com/solpay-cash/solpay-x402-sdk/issues
- Documentation: https://docs.solpay.cash
- Email: support@solpay.cash

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities
