# Token Efficiency API Reference

**Complete REST API documentation for token efficiency monitoring**

## Overview

The Token Efficiency API provides 6 HTTP endpoints for accessing real-time token usage metrics, cost savings, and efficiency analysis. All endpoints return JSON responses and support time-period filtering.

**Base URL**: `http://localhost:1337` (configurable via `O8_HTTP_PORT`)

**Authentication**: None required (local server only)

**Content-Type**: `application/json`

## Endpoints

### GET /api/tokens/efficiency

Returns a comprehensive efficiency snapshot including overall metrics, category breakdown, cache statistics, trends, and performance insights.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `last_hour` | Time period to analyze |

**Valid Period Values**:
- `last_hour` - Past 60 minutes
- `last_day` - Past 24 hours
- `last_week` - Past 7 days
- `last_month` - Past 30 days
- `all_time` - All recorded data

**Response Schema**:

```typescript
{
  timestamp: string;              // ISO 8601 timestamp
  period: string;                 // Time period analyzed
  overall: {
    totalTokens: number;          // Actual tokens consumed
    baselineTokens: number;       // Tokens without orchestr8
    tokensSaved: number;          // Difference
    efficiencyPercentage: number; // (saved / baseline) × 100
    costUSD: number;              // Actual cost in USD
    costSavingsUSD: number;       // Money saved in USD
  };
  byCategory: Array<{
    category: string;             // Resource category
    loadCount: number;            // Times loaded
    totalTokens: number;          // Category total tokens
    inputTokens: number;          // Input tokens
    outputTokens: number;         // Output tokens
    cacheTokens: number;          // Cache tokens
    baselineTokens: number;       // Category baseline
    tokensSaved: number;          // Category savings
    efficiency: number;           // Category efficiency %
    costUSD: number;              // Category cost
    costSavingsUSD: number;       // Category savings
    topResources: Array<{
      uri: string;                // Resource URI
      loadCount: number;          // Times loaded
      tokens: number;             // Resource tokens
    }>;
  }>;
  cache: {
    totalCacheHits: number;       // Cache hits count
    totalCacheReads: number;      // Cache read tokens
    totalCacheCreations: number;  // Cache creation tokens
    cacheHitRate: number;         // Hit rate percentage
    cacheTokensSaved: number;     // Tokens saved via cache
  };
  trend: {
    efficiencyChange: number;     // Percentage point change
    tokenSavingsChange: number;   // Token change
    costSavingsChange: number;    // Cost change in USD
    direction: string;            // 'improving' | 'stable' | 'declining'
  };
  topPerformers: Array<{
    uri: string;                  // Resource URI
    category: string;             // Resource category
    efficiency: number;           // Efficiency percentage
    tokensSaved: number;          // Tokens saved
  }>;
  needsOptimization: Array<{
    uri: string;                  // Resource URI
    category: string;             // Resource category
    efficiency: number;           // Efficiency percentage
    loadCount: number;            // Times loaded
  }>;
}
```

**Example Request**:

```bash
curl http://localhost:1337/api/tokens/efficiency?period=last_day
```

**Example Response**:

```json
{
  "timestamp": "2025-11-12T21:30:00.000Z",
  "period": "last_day",
  "overall": {
    "totalTokens": 125000,
    "baselineTokens": 3600000,
    "tokensSaved": 3475000,
    "efficiencyPercentage": 96.53,
    "costUSD": 0.375,
    "costSavingsUSD": 10.425
  },
  "byCategory": [
    {
      "category": "agents",
      "loadCount": 45,
      "totalTokens": 67500,
      "inputTokens": 45000,
      "outputTokens": 15000,
      "cacheTokens": 7500,
      "baselineTokens": 675000,
      "tokensSaved": 607500,
      "efficiency": 90.0,
      "costUSD": 0.2025,
      "costSavingsUSD": 2.025,
      "topResources": [
        {
          "uri": "o8://agents/typescript-developer",
          "loadCount": 15,
          "tokens": 22500
        },
        {
          "uri": "o8://agents/python-expert-core",
          "loadCount": 12,
          "tokens": 18000
        }
      ]
    },
    {
      "category": "skills",
      "loadCount": 67,
      "totalTokens": 33500,
      "inputTokens": 22000,
      "outputTokens": 8000,
      "cacheTokens": 3500,
      "baselineTokens": 670000,
      "tokensSaved": 636500,
      "efficiency": 95.0,
      "costUSD": 0.1005,
      "costSavingsUSD": 2.01,
      "topResources": [
        {
          "uri": "o8://skills/api-optimization",
          "loadCount": 18,
          "tokens": 9000
        }
      ]
    }
  ],
  "cache": {
    "totalCacheHits": 88,
    "totalCacheReads": 125000,
    "totalCacheCreations": 37500,
    "cacheHitRate": 78.6,
    "cacheTokensSaved": 112500
  },
  "trend": {
    "efficiencyChange": 1.2,
    "tokenSavingsChange": 12500,
    "costSavingsChange": 0.038,
    "direction": "improving"
  },
  "topPerformers": [
    {
      "uri": "o8://skills/api-optimization",
      "category": "skill",
      "efficiency": 98.2,
      "tokensSaved": 15234
    },
    {
      "uri": "o8://patterns/event-driven-cqrs",
      "category": "pattern",
      "efficiency": 97.8,
      "tokensSaved": 12456
    }
  ],
  "needsOptimization": [
    {
      "uri": "o8://agents/legacy-system-analyst",
      "category": "agent",
      "efficiency": 52.1,
      "loadCount": 8
    }
  ]
}
```

**Status Codes**:

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Invalid period parameter |
| `503` | Token tracking system not initialized |
| `500` | Internal server error |

**Error Response**:

```json
{
  "error": "Token tracking system not initialized"
}
```

---

### GET /api/tokens/summary

Returns a simplified summary of token usage without detailed breakdowns. Ideal for dashboard displays and quick checks.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `last_hour` | Time period to analyze |

**Response Schema**:

```typescript
{
  period: string;              // Time period analyzed
  totalTokens: number;         // Actual tokens used
  baselineTokens: number;      // Baseline tokens
  tokensSaved: number;         // Tokens saved
  efficiency: number;          // Efficiency percentage
  costUSD: number;             // Actual cost in USD
  costSavingsUSD: number;      // Cost savings in USD
  messageCount: number;        // Number of messages processed
  cacheHitRate: number;        // Cache hit rate percentage
}
```

**Example Request**:

```bash
curl http://localhost:1337/api/tokens/summary?period=last_week
```

**Example Response**:

```json
{
  "period": "last_week",
  "totalTokens": 875000,
  "baselineTokens": 25200000,
  "tokensSaved": 24325000,
  "efficiency": 96.53,
  "costUSD": 26.25,
  "costSavingsUSD": 756.00,
  "messageCount": 1050,
  "cacheHitRate": 82.3
}
```

**Status Codes**:

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Invalid period parameter |
| `503` | Token tracking system not initialized |
| `500` | Internal server error |

---

### GET /api/tokens/sessions/:id

Retrieves detailed token usage data for a specific session. Sessions represent individual conversations or workflow runs.

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Session ID to retrieve |

**Response Schema**:

```typescript
{
  sessionId: string;              // Session identifier
  startTime: string;              // ISO 8601 start timestamp
  endTime?: string;               // ISO 8601 end timestamp (if ended)
  messageCount: number;           // Messages in session
  trackedMessageIds: string[];    // Array of message IDs
  totalInputTokens: number;       // Total input tokens
  totalOutputTokens: number;      // Total output tokens
  totalCacheReadTokens: number;   // Total cache read tokens
  totalCacheCreationTokens: number; // Total cache creation tokens
  totalTokens: number;            // Total all tokens
  totalBaselineTokens: number;    // Total baseline tokens
  totalTokensSaved: number;       // Total tokens saved
  sessionEfficiency: number;      // Session efficiency percentage
  totalCostUSD: number;           // Total session cost
  totalCostSavingsUSD: number;    // Total session savings
  usageRecords: Array<{
    messageId: string;
    timestamp: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
    totalTokens: number;
    category?: string;
    resourceUri?: string;
    baselineTokens: number;
    tokensSaved: number;
    efficiencyPercentage: number;
    costUSD: number;
    costSavingsUSD: number;
  }>;
}
```

**Example Request**:

```bash
curl http://localhost:1337/api/tokens/sessions/sess_abc123
```

**Example Response**:

```json
{
  "sessionId": "sess_abc123",
  "startTime": "2025-11-12T20:00:00.000Z",
  "endTime": "2025-11-12T21:00:00.000Z",
  "messageCount": 15,
  "trackedMessageIds": [
    "msg_01ABC123",
    "msg_01DEF456",
    "msg_01GHI789"
  ],
  "totalInputTokens": 12500,
  "totalOutputTokens": 4250,
  "totalCacheReadTokens": 8750,
  "totalCacheCreationTokens": 2500,
  "totalTokens": 28000,
  "totalBaselineTokens": 675000,
  "totalTokensSaved": 647000,
  "sessionEfficiency": 95.85,
  "totalCostUSD": 0.084,
  "totalCostSavingsUSD": 2.019,
  "usageRecords": [
    {
      "messageId": "msg_01ABC123",
      "timestamp": "2025-11-12T20:05:00.000Z",
      "inputTokens": 1200,
      "outputTokens": 350,
      "cacheReadTokens": 2500,
      "cacheCreationTokens": 1200,
      "totalTokens": 5250,
      "category": "agent",
      "resourceUri": "o8://agents/typescript-developer",
      "baselineTokens": 15000,
      "tokensSaved": 9750,
      "efficiencyPercentage": 65.0,
      "costUSD": 0.0158,
      "costSavingsUSD": 0.0450
    }
  ]
}
```

**Status Codes**:

| Code | Description |
|------|-------------|
| `200` | Success |
| `404` | Session not found |
| `503` | Token tracking system not initialized |
| `500` | Internal server error |

---

### GET /api/tokens/by-category

Returns token metrics grouped by resource category. Useful for understanding which resource types are most/least efficient.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `last_hour` | Time period to analyze |

**Response Schema**:

```typescript
{
  categories: Array<{
    category: string;             // Resource category
    loadCount: number;            // Times loaded
    totalTokens: number;          // Category total tokens
    inputTokens: number;          // Input tokens
    outputTokens: number;         // Output tokens
    cacheTokens: number;          // Cache tokens
    baselineTokens: number;       // Category baseline
    tokensSaved: number;          // Category savings
    efficiency: number;           // Category efficiency %
    costUSD: number;              // Category cost
    costSavingsUSD: number;       // Category savings
    topResources: Array<{
      uri: string;                // Resource URI
      loadCount: number;          // Times loaded
      tokens: number;             // Resource tokens
    }>;
  }>;
  timestamp: string;              // ISO 8601 timestamp
}
```

**Example Request**:

```bash
curl http://localhost:1337/api/tokens/by-category?period=last_day
```

**Example Response**:

```json
{
  "categories": [
    {
      "category": "agents",
      "loadCount": 45,
      "totalTokens": 67500,
      "inputTokens": 45000,
      "outputTokens": 15000,
      "cacheTokens": 7500,
      "baselineTokens": 675000,
      "tokensSaved": 607500,
      "efficiency": 90.0,
      "costUSD": 0.2025,
      "costSavingsUSD": 2.025,
      "topResources": [
        {
          "uri": "o8://agents/typescript-developer",
          "loadCount": 15,
          "tokens": 22500
        }
      ]
    },
    {
      "category": "skills",
      "loadCount": 67,
      "totalTokens": 33500,
      "inputTokens": 22000,
      "outputTokens": 8000,
      "cacheTokens": 3500,
      "baselineTokens": 670000,
      "tokensSaved": 636500,
      "efficiency": 95.0,
      "costUSD": 0.1005,
      "costSavingsUSD": 2.01,
      "topResources": [
        {
          "uri": "o8://skills/api-optimization",
          "loadCount": 18,
          "tokens": 9000
        }
      ]
    },
    {
      "category": "patterns",
      "loadCount": 23,
      "totalTokens": 11500,
      "inputTokens": 7500,
      "outputTokens": 3000,
      "cacheTokens": 1000,
      "baselineTokens": 230000,
      "tokensSaved": 218500,
      "efficiency": 95.0,
      "costUSD": 0.0345,
      "costSavingsUSD": 0.69,
      "topResources": []
    }
  ],
  "timestamp": "2025-11-12T21:30:00.000Z"
}
```

**Status Codes**:

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Invalid period parameter |
| `503` | Token tracking system not initialized |
| `500` | Internal server error |

---

### GET /api/tokens/cost-savings

Returns a focused cost savings report with baseline comparison and efficiency metrics.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `last_hour` | Time period to analyze |

**Response Schema**:

```typescript
{
  period: string;              // Time period analyzed
  totalCostUsd: number;        // Actual cost with orchestr8
  totalCostSavingsUsd: number; // Money saved
  baselineCostUsd: number;     // Cost without orchestr8
  efficiency: number;          // Efficiency percentage
  tokensSaved: number;         // Tokens saved
  timestamp: string;           // ISO 8601 timestamp
}
```

**Example Request**:

```bash
curl http://localhost:1337/api/tokens/cost-savings?period=last_month
```

**Example Response**:

```json
{
  "period": "last_month",
  "totalCostUsd": 125.50,
  "totalCostSavingsUsd": 3621.75,
  "baselineCostUsd": 3747.25,
  "efficiency": 96.65,
  "tokensSaved": 116500000,
  "timestamp": "2025-11-12T21:30:00.000Z"
}
```

**Interpretation**:
- **totalCostUsd**: What you actually paid
- **baselineCostUsd**: What you would have paid without orchestr8
- **totalCostSavingsUsd**: How much orchestr8 saved you
- **efficiency**: Percentage of baseline cost avoided

**Status Codes**:

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Invalid period parameter |
| `503` | Token tracking system not initialized |
| `500` | Internal server error |

---

### GET /api/tokens/trends

Returns trend analysis comparing current period against previous period. Helps identify efficiency improvements or degradations over time.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `last_hour` | Time period to analyze |

**Response Schema**:

```typescript
{
  trend: {
    efficiencyChange: number;     // Percentage point change
    tokenSavingsChange: number;   // Token change (absolute)
    costSavingsChange: number;    // Cost change in USD
    direction: string;            // 'improving' | 'stable' | 'declining'
  };
  overall: {
    totalTokens: number;          // Current period tokens
    baselineTokens: number;       // Current period baseline
    tokensSaved: number;          // Current period saved
    efficiencyPercentage: number; // Current period efficiency
    costUSD: number;              // Current period cost
    costSavingsUSD: number;       // Current period savings
  };
  timestamp: string;              // ISO 8601 timestamp
}
```

**Example Request**:

```bash
curl http://localhost:1337/api/tokens/trends?period=last_week
```

**Example Response**:

```json
{
  "trend": {
    "efficiencyChange": 1.8,
    "tokenSavingsChange": 45000,
    "costSavingsChange": 0.135,
    "direction": "improving"
  },
  "overall": {
    "totalTokens": 875000,
    "baselineTokens": 25200000,
    "tokensSaved": 24325000,
    "efficiencyPercentage": 96.53,
    "costUSD": 26.25,
    "costSavingsUSD": 756.00
  },
  "timestamp": "2025-11-12T21:30:00.000Z"
}
```

**Trend Direction**:
- `improving`: Efficiency increased by >1 percentage point
- `stable`: Efficiency changed by ±1 percentage point
- `declining`: Efficiency decreased by >1 percentage point

**Status Codes**:

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Invalid period parameter |
| `503` | Token tracking system not initialized |
| `500` | Internal server error |

---

## Common Usage Patterns

### Pattern 1: Quick Health Check

```bash
# Get current efficiency
curl -s http://localhost:1337/api/tokens/summary | jq '{
  efficiency: .efficiency,
  saved: .tokensSaved,
  cost_saved: .costSavingsUSD
}'
```

### Pattern 2: Detailed Analysis

```bash
# Get full snapshot with breakdowns
curl -s http://localhost:1337/api/tokens/efficiency?period=last_day | jq '{
  overall: .overall,
  top_category: .byCategory[0],
  trend: .trend.direction
}'
```

### Pattern 3: Cost Reporting

```bash
# Generate cost report
curl -s http://localhost:1337/api/tokens/cost-savings?period=last_month | jq '{
  actual_cost: .totalCostUsd,
  saved: .totalCostSavingsUsd,
  roi: ((.totalCostSavingsUsd / .totalCostUsd) * 100)
}'
```

### Pattern 4: Performance Monitoring

```bash
# Monitor trends
curl -s http://localhost:1337/api/tokens/trends | jq '{
  direction: .trend.direction,
  efficiency_delta: .trend.efficiencyChange,
  current_efficiency: .overall.efficiencyPercentage
}'
```

### Pattern 5: Category Comparison

```bash
# Compare category efficiency
curl -s http://localhost:1337/api/tokens/by-category | \
  jq -r '.categories | sort_by(.efficiency) | reverse |
    .[] | "\(.category): \(.efficiency)%"'
```

---

## Rate Limiting

**Current Implementation**: None (local server only)

**Future Considerations**: If exposing publicly, implement rate limiting:
- 100 requests/minute per IP
- 1000 requests/hour per IP

---

## CORS Configuration

**Current Implementation**: Disabled (local server only)

**For Public Deployment**:
```typescript
app.use(cors({
  origin: 'https://your-domain.com',
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
}));
```

---

## WebSocket Integration

Token metrics are also broadcast via WebSocket for real-time dashboard updates:

**WebSocket URL**: `ws://localhost:1337`

**Message Format**:
```json
{
  "type": "stats_update",
  "data": {
    "tokenEfficiency": {
      "efficiency": 96.5,
      "tokensSaved": 435000,
      "costSavingsUSD": 1.305
    }
  }
}
```

**Broadcast Frequency**: Every 5 seconds

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message description"
}
```

**Common Errors**:

| Error Message | Status Code | Cause |
|---------------|-------------|-------|
| `Token tracking system not initialized` | 503 | Token system disabled or failed to start |
| `Session {id} not found` | 404 | Invalid session ID |
| `Invalid period parameter` | 400 | Unsupported period value |
| `Internal server error` | 500 | Unexpected server error |

---

## Testing Examples

### cURL Examples

```bash
# Test all endpoints
curl http://localhost:1337/api/tokens/efficiency
curl http://localhost:1337/api/tokens/summary
curl http://localhost:1337/api/tokens/by-category
curl http://localhost:1337/api/tokens/cost-savings
curl http://localhost:1337/api/tokens/trends
curl http://localhost:1337/api/tokens/sessions/sess_123

# Test with different periods
curl http://localhost:1337/api/tokens/efficiency?period=last_hour
curl http://localhost:1337/api/tokens/efficiency?period=last_day
curl http://localhost:1337/api/tokens/efficiency?period=last_week
curl http://localhost:1337/api/tokens/efficiency?period=all_time
```

### JavaScript/TypeScript Examples

```typescript
// Using fetch API
async function getTokenEfficiency(period: string = 'last_hour') {
  const response = await fetch(
    `http://localhost:1337/api/tokens/efficiency?period=${period}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return await response.json();
}

// Usage
const snapshot = await getTokenEfficiency('last_day');
console.log(`Efficiency: ${snapshot.overall.efficiencyPercentage}%`);
console.log(`Saved: $${snapshot.overall.costSavingsUSD}`);
```

### Python Examples

```python
import requests

def get_token_summary(period='last_hour'):
    url = f'http://localhost:1337/api/tokens/summary?period={period}'
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

# Usage
summary = get_token_summary('last_week')
print(f"Efficiency: {summary['efficiency']}%")
print(f"Cost Saved: ${summary['costSavingsUSD']}")
```

---

## Changelog

**v8.1.0** (2025-11-12)
- Initial release of Token Efficiency API
- 6 REST endpoints
- Real-time WebSocket broadcasting
- Support for 5 time periods
- Comprehensive error handling

---

## Related Documentation

- **[Token Efficiency Monitoring](../token-efficiency-monitoring.md)** - Complete feature guide
- **[Architecture](../architecture/system-design.md)** - Technical implementation
- **[Web Dashboard](../web-ui.md)** - UI integration
- **[Troubleshooting](../guides/troubleshooting.md)** - Common issues

---

## Support

**Need Help?**
- Review [usage patterns](#common-usage-patterns)
- Check [error handling](#error-handling)
- See [testing examples](#testing-examples)
- Open an issue: [GitHub Issues](https://github.com/seth-schultz/orchestr8/issues)
