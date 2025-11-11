# Contributing to SolPay x402 SDK

Thank you for your interest in contributing to the SolPay x402 SDK! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/solpay/x402-sdk/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - SDK version and language
   - Code samples (if applicable)

### Suggesting Features

1. Check if the feature has been suggested in [Issues](https://github.com/solpay/x402-sdk/issues)
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Proposed implementation (optional)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

#### Pull Request Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation
- Keep PRs focused on a single feature/fix
- Write clear commit messages
- Reference related issues

## Development Setup

### JavaScript/TypeScript

```bash
cd sdk/js
npm install
npm run build
npm test
```

### Python

```bash
cd sdk/python
pip install -r requirements.txt
python -m pytest
```

### PHP

```bash
cd sdk/php
composer install
./vendor/bin/phpunit
```

## Code Style

### JavaScript/TypeScript
- Use TypeScript for new code
- Follow ESLint configuration
- Use 2 spaces for indentation
- Add JSDoc comments for public APIs

### Python
- Follow PEP 8
- Use type hints
- Add docstrings for public functions
- Use 4 spaces for indentation

### PHP
- Follow PSR-12 coding standard
- Add PHPDoc comments
- Use 4 spaces for indentation

## Testing

All SDKs should have:
- Unit tests for core functionality
- Integration tests (against devnet)
- Example code that runs successfully

## Documentation

When adding features:
- Update README.md
- Update relevant quickstart guides
- Add examples
- Update API documentation
- Update CHANGELOG.md

## Versioning

We use [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to ask questions in:
- GitHub Discussions
- Issues (with question label)
- Email: support@solpay.cash

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub contributors page

Thank you for making SolPay better! 🚀
