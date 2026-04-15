# 🚀 Quick Start Guide - Testing the Production-Grade AI Engine

## Prerequisites

✅ Backend running on http://localhost:3001
✅ OpenAI API key in `.env` file
✅ All dependencies installed

```bash
cd /Users/abdulkadir/LEGAL_OPS/onyxlegal-core
npm install openai zod
```

---

## Test 1: Analyze a Contract

### Using cURL

```bash
curl -X POST http://localhost:3001/api/v1/ai/analyze-direct \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "contractText": "This is a service agreement between Company A and Company B. The parties agree to provide services. Company A is liable for all damages. The contract is valid for unlimited time.",
    "contractId": "test-contract-1"
  }'
```

### Expected Response

```json
{
  "success": true,
  "analysis": {
    "risks": [
      {
        "clause": "Liability",
        "issue": "Unlimited liability exposure",
        "severity": "high",
        "recommendation": "Cap liability at contract value or specific amount",
        "confidence": 88
      }
    ],
    "overallScore": 65,
    "summary": "Contract analyzed in 1 section. 1 risk identified..."
  },
  "tokensUsed": 342,
  "duration": 1205,
  "chunksProcessed": 1
}
```

---

## Test 2: Generate Clause Fix

```bash
curl -X POST http://localhost:3001/api/v1/ai/generate-fix \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "clause": "Company A is liable for all damages without limit.",
    "issue": "Unlimited liability exposure creates financial risk"
  }'
```

### Expected Response

```json
{
  "success": true,
  "fix": {
    "original": "Company A is liable for all damages without limit.",
    "improved": "Company A's total liability shall not exceed the annual contract value or one million rupees, whichever is lower.",
    "explanation": "This caps liability to a reasonable limit while protecting both parties",
    "confidence": 92
  },
  "tokensUsed": 256,
  "duration": 987
}
```

---

## Test 3: Check Compliance

```bash
curl -X POST http://localhost:3001/api/v1/ai/check-compliance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "contractText": "Service agreement. GST not specified. No data protection clause.",
    "contractId": "test-contract-2"
  }'
```

### Expected Response

```json
{
  "success": true,
  "check": {
    "compliant": false,
    "issues": [
      {
        "category": "GST",
        "severity": "high",
        "issue": "GST rate not specified in contract",
        "solution": "Add clause: 'All fees include 18% GST' or specify applicable rate"
      },
      {
        "category": "DataProtection",
        "severity": "medium",
        "issue": "No data protection or confidentiality clause",
        "solution": "Add comprehensive data protection clause with GDPR/India equivalent requirements"
      }
    ],
    "overallRisk": "high"
  },
  "tokensUsed": 428,
  "duration": 1342
}
```

---

## Test 4: Get Token Statistics

```bash
curl -X GET http://localhost:3001/api/v1/ai/tokens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Response

```json
{
  "totalPromptTokens": 1850,
  "totalCompletionTokens": 942,
  "totalRequests": 8,
  "failedRequests": 0,
  "averageTokensPerRequest": 348,
  "successRate": 100
}
```

---

## Test 5: Large Contract (Auto-Chunking)

```bash
# Create a large contract text (>20KB)
LARGE_CONTRACT=$(cat << 'EOF'
[Repeat the contract text multiple times to exceed 20KB]
Service Agreement Section 1...
Service Agreement Section 2...
...
EOF
)

curl -X POST http://localhost:3001/api/v1/ai/analyze-direct \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{
    \"contractText\": \"$LARGE_CONTRACT\",
    \"contractId\": \"large-contract-1\"
  }"
```

### What to Verify

- ✅ `chunksProcessed` > 1 (indicates auto-chunking worked)
- ✅ `success` = true (even with multiple chunks)
- ✅ `analysis.risks` contains merged results from all chunks
- ✅ No duplicate risks in output

---

## Test 6: Error Handling (Simulate Failure)

To test fallback behavior, modify `aiClient.ts` temporarily:

```typescript
// Line 100 - Make timeout very short (1ms)
private readonly timeout = 1; // Will always timeout

// Now run test
curl -X POST http://localhost:3001/api/v1/ai/analyze-direct \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "contractText": "Test contract",
    "contractId": "test-error"
  }'
```

### Expected Behavior

- ✅ No crash (UI should still work)
- ✅ `success` = false
- ✅ `analysis` = fallback value
- ✅ Error logged in backend

---

## Monitoring & Logging

### View Backend Logs

```bash
# Terminal where backend is running
# Look for these patterns:

✅ LLM call successful       # Good - LLM worked
⚠️ LLM call failed           # Retry happened
✅ Contract analysis complete # Analysis succeeded
❌ Contract analysis failed  # Returned fallback
```

### Expected Log Pattern for Successful Analysis

```
📄 Starting contract analysis | id: test-contract-1
📦 Contract split into 1 chunks
🔍 Analyzing chunk 1/1 (1234 chars)
✅ LLM call successful (attempt 1) | model: gpt-4o-mini | tokens: 342 | duration: 1205ms | retries: 0
✅ Contract analysis complete | risks: 1 | score: 65 | chunks: 1 | tokens: 342 | duration: 1456ms
```

---

## Integration with Frontend

### Update React Hooks to Use Real API

**File:** `onyxlegal-web/src/features/ai/hooks/useRecommendedActions.ts`

```typescript
// Replace mock API call with real endpoint
const { data } = useQuery({
  queryKey: ['recommendations', contractId],
  queryFn: async () => {
    const response = await api.post('/ai/analyze-direct', {
      contractText: contract.content,
      contractId: contract.id
    });
    return response.data.analysis;
  }
});
```

### Update API Client

**File:** `onyxlegal-web/src/lib/api.ts`

```typescript
const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Authorization': `Bearer ${token}` // Add JWT token
  }
});
```

---

## Debugging Tips

### Issue: "Cannot find module 'openai'"

**Solution:**
```bash
cd /Users/abdulkadir/LEGAL_OPS/onyxlegal-core
npm install openai
```

### Issue: API returns 401 Unauthorized

**Solution:** Ensure JWT token is valid and included in Authorization header

### Issue: Timeout (>10s)

**Solution:** 
- Check OpenAI API status
- Check network connectivity
- Reduce contract size to test

### Issue: "Token limit exceeded"

**Solution:**
- Increase `tenant.aiTokenLimit` in database
- Or reset `tenant.aiTokensUsed` to 0

### Issue: "OPENAI_API_KEY not set"

**Solution:**
```bash
# Add to .env file
OPENAI_API_KEY=sk-xxx...
```

---

## Performance Benchmarks

### Expected Timings

| Operation | Time | Tokens |
|-----------|------|--------|
| Small contract (<1KB) | 1-2s | 150-300 |
| Medium contract (5KB) | 2-3s | 300-600 |
| Large contract (20KB) | 4-5s | 1000-2000 |
| Clause fix | 1-2s | 200-300 |
| Compliance check | 2-3s | 300-500 |

### Optimization Tips

1. **Reduce contract size** - Remove unnecessary sections
2. **Use caching** - Cache analyses for 1 hour
3. **Batch requests** - Analyze multiple clauses together
4. **Monitor tokens** - Check `GET /ai/tokens` regularly

---

## Next Steps After Testing

1. ✅ Verify all endpoints work
2. ✅ Check token tracking
3. ✅ Monitor error logs
4. ✅ Test with real contracts
5. ✅ Integrate with frontend
6. ✅ Add rate limiting
7. ✅ Deploy to production

---

**Questions?** Check `AI_ENGINE_ARCHITECTURE.md` for detailed documentation.

