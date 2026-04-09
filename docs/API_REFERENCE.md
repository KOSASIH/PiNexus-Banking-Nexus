# PiNexus API Reference

## Overview

The PiNexus API provides programmatic access to all ecosystem services. Authentication is via $PNX-signed JWT tokens.

**Base URL**: `https://api.pinexus.io/v1`

## Authentication

```bash
# Request auth token
POST /auth/token
{
  "wallet_address": "0x...",
  "signature": "signed_challenge",
  "timestamp": 1700000000
}

# Response
{
  "access_token": "eyJ...",
  "expires_in": 3600,
  "agent_tier": "premium"
}
```

## Endpoints

### Mining

#### Start Neural Mining Session
```
POST /mining/start
Authorization: Bearer <token>

Request:
{
  "device_profile": {
    "cpu_cores": 8,
    "gpu_model": "RTX 4090",
    "ram_gb": 32,
    "bandwidth_mbps": 100
  },
  "preferences": {
    "max_cpu_usage": 0.5,
    "max_gpu_usage": 0.8,
    "task_types": ["inference", "training", "data_processing"]
  }
}

Response:
{
  "session_id": "ms_abc123",
  "assigned_tasks": [...],
  "estimated_earnings": {
    "per_hour": "1250.00 PNX",
    "per_day": "30000.00 PNX"
  }
}
```

#### Get Mining Status
```
GET /mining/status/{session_id}
Authorization: Bearer <token>

Response:
{
  "session_id": "ms_abc123",
  "status": "active",
  "tasks_completed": 142,
  "total_earned": "4500.00 PNX",
  "current_task": {
    "type": "inference",
    "difficulty": 750,
    "progress": 0.67
  },
  "intelligence_score": 8542
}
```

### AGI Agents

#### List Available Agents
```
GET /agents?type=defi&status=available
Authorization: Bearer <token>

Response:
{
  "agents": [
    {
      "agent_id": "defi_agent_0042",
      "type": "DeFi",
      "sub_type": "Trading",
      "status": "available",
      "performance_score": 9.7,
      "tasks_completed": 1250000
    }
  ],
  "total": 1500,
  "page": 1
}
```

#### Request Agent Service
```
POST /agents/{agent_id}/request
Authorization: Bearer <token>

Request:
{
  "task": "optimize_portfolio",
  "parameters": {
    "risk_tolerance": "medium",
    "target_apy": 25,
    "assets": ["PNX", "ETH", "BTC"],
    "max_drawdown": 0.15
  }
}

Response:
{
  "request_id": "req_xyz789",
  "agent_id": "defi_agent_0042",
  "status": "processing",
  "estimated_completion": "2024-01-01T00:00:05Z",
  "cost": "100.00 PNX"
}
```

### DeFi

#### Get DeFi Vaults
```
GET /defi/vaults
Authorization: Bearer <token>

Response:
{
  "vaults": [
    {
      "vault_id": "v_stable_01",
      "name": "AGI Stable Yield",
      "strategy": "multi_protocol_yield_farming",
      "apy": 24.5,
      "tvl": "500000000 PNX",
      "risk_score": 2,
      "managed_by": ["defi_agent_0042", "defi_agent_0108"]
    }
  ]
}
```

#### Deposit to Vault
```
POST /defi/vaults/{vault_id}/deposit
Authorization: Bearer <token>

Request:
{
  "amount": "10000.00",
  "token": "PNX",
  "auto_compound": true
}

Response:
{
  "tx_hash": "0x...",
  "shares_received": "9985.50",
  "vault_token": "vPNX",
  "estimated_daily_yield": "6.72 PNX"
}
```

### RWA (Real-World Assets)

#### Submit Asset for Tokenization
```
POST /rwa/submit
Authorization: Bearer <token>

Request:
{
  "asset_type": "real_estate",
  "details": {
    "address": "123 Main St, New York, NY",
    "valuation": 5000000,
    "currency": "USD",
    "documents": ["deed_url", "appraisal_url"]
  },
  "fractions": 10000,
  "minimum_investment": "500 PNX"
}

Response:
{
  "submission_id": "rwa_sub_001",
  "status": "pending_verification",
  "assigned_agents": ["innovation_agent_0101", "innovation_agent_0102"],
  "estimated_verification": "48 hours"
}
```

### Metaverse

#### Get Available Land
```
GET /metaverse/land?zone=downtown&available=true
Authorization: Bearer <token>

Response:
{
  "parcels": [
    {
      "parcel_id": "land_x42_y108",
      "coordinates": {"x": 42, "y": 108, "z": 0},
      "zone": "downtown",
      "size": "10x10",
      "price": "50000 PNX",
      "features": ["waterfront", "high_traffic"],
      "generated_by": "innovation_agent_0350"
    }
  ]
}
```

### Bridge

#### Cross-Chain Transfer
```
POST /bridge/transfer
Authorization: Bearer <token>

Request:
{
  "from_chain": "pinexus",
  "to_chain": "ethereum",
  "token": "PNX",
  "amount": "1000.00",
  "destination_address": "0x..."
}

Response:
{
  "bridge_tx_id": "br_abc123",
  "status": "routing",
  "route": {
    "path": ["pinexus", "agi_bridge", "ethereum"],
    "estimated_fee": "0.50 PNX",
    "estimated_time": "30 seconds"
  },
  "agi_optimizer": "bridge_agent_0015"
}
```

### Governance

#### Get Active Proposals
```
GET /governance/proposals?status=active
Authorization: Bearer <token>

Response:
{
  "proposals": [
    {
      "proposal_id": "prop_042",
      "title": "Increase mining rewards by 5%",
      "proposer": "0x...",
      "status": "voting",
      "agi_analysis": {
        "impact_score": 7.2,
        "risk_level": "low",
        "recommendation": "approve",
        "simulated_outcomes": [...]
      },
      "votes": {
        "for": "15000000000 PNX",
        "against": "3000000000 PNX",
        "quorum_reached": true
      },
      "voting_ends": "2024-01-15T00:00:00Z"
    }
  ]
}
```

### UBI (Universal Basic Intelligence)

#### Check UBI Status
```
GET /ubi/status
Authorization: Bearer <token>

Response:
{
  "eligible": true,
  "daily_base": "100.00 PNX",
  "engagement_multiplier": 3.2,
  "agi_contribution_bonus": "50.00 PNX",
  "total_daily": "370.00 PNX",
  "next_distribution": "2024-01-02T00:00:00Z",
  "lifetime_received": "45000.00 PNX"
}
```

## WebSocket Streams

### Real-Time Agent Activity
```javascript
ws://stream.pinexus.io/v1/agents/feed

// Subscribe to DeFi agent actions
{ "subscribe": "agent_activity", "filter": { "type": "defi" } }

// Events
{ "event": "trade_executed", "agent": "defi_agent_0042", "pair": "PNX/ETH", "side": "buy", "amount": "50000 PNX" }
{ "event": "risk_alert", "agent": "risk_agent_0015", "severity": "medium", "message": "Elevated volatility detected" }
```

### Mining Task Stream
```javascript
ws://stream.pinexus.io/v1/mining/tasks

// New task assignment
{ "event": "task_assigned", "task_id": "t_123", "type": "inference", "difficulty": 500, "reward": "10 PNX" }
```

## Rate Limits

| Tier | Requests/min | WebSocket Streams |
|---|---|---|
| Free | 60 | 2 |
| Staker (10K PNX) | 300 | 10 |
| Premium (100K PNX) | 1000 | 50 |
| Validator | Unlimited | Unlimited |

## Error Codes

| Code | Message | Description |
|---|---|---|
| 1001 | `insufficient_balance` | Not enough $PNX for operation |
| 1002 | `agent_unavailable` | Requested agent type at capacity |
| 1003 | `invalid_signature` | Wallet signature verification failed |
| 1004 | `rate_limited` | Too many requests |
| 1005 | `kyc_required` | KYC verification needed |
| 2001 | `mining_task_failed` | Task computation rejected by validators |
| 3001 | `bridge_congestion` | Cross-chain bridge temporarily delayed |

## SDKs

- **JavaScript/TypeScript**: `npm install @pinexus/sdk`
- **Python**: `pip install pinexus`
- **Rust**: `cargo add pinexus-sdk`
- **Go**: `go get github.com/pinexus/go-sdk`
