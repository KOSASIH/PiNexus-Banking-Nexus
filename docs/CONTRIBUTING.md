# Contributing to PiNexus

Thank you for your interest in contributing to PiNexus! This document provides guidelines for contributing to the project.

## Code of Conduct

PiNexus is committed to providing a welcoming and inclusive environment. All contributors are expected to adhere to our Code of Conduct.

## How to Contribute

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Use the issue template for bug reports or feature requests
3. Provide detailed reproduction steps for bugs
4. Include system information (OS, Node version, etc.)

### Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/pinexus-core.git
cd pinexus-core

# Install dependencies
npm install

# Run tests
npm test

# Start development environment
npm run dev
```

### Pull Request Process

1. Create a feature branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards:
   - TypeScript/JavaScript: ESLint + Prettier
   - Python: Black + isort + mypy
   - Rust: `cargo fmt` + `cargo clippy`
   - Solidity: Solhint

3. Write tests for new functionality
4. Update documentation if needed
5. Submit a PR against `develop` branch

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new DeFi vault strategy
fix: resolve sharding rebalance race condition
docs: update API reference for agent endpoints
test: add unit tests for PoI consensus
refactor: simplify cross-chain bridge routing
perf: optimize agent swarm messaging latency
```

## Architecture Decisions

For significant changes, create an Architecture Decision Record (ADR) in `docs/adr/`:

```markdown
# ADR-XXX: Title

## Status: Proposed | Accepted | Deprecated

## Context
Why is this decision needed?

## Decision
What are we doing?

## Consequences
What are the tradeoffs?
```

## Module Ownership

| Module | Team | Contact |
|---|---|---|
| Blockchain Core | Chain Team | chain@pinexus.io |
| AGI Engine | AI Team | ai@pinexus.io |
| Smart Contracts | Contract Team | contracts@pinexus.io |
| Frontend | UI Team | ui@pinexus.io |
| Infrastructure | DevOps Team | devops@pinexus.io |

## Security Vulnerabilities

**Do NOT open public issues for security vulnerabilities.**

Email: security@pinexus.io
Bug Bounty: Up to $10M for critical vulnerabilities

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
