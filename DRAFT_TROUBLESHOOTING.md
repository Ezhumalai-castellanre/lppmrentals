# Draft Functionality Troubleshooting Guide

## The Problem You're Experiencing

**Error**: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**What This Means**: Your frontend is receiving HTML instead of JSON from your API endpoint.

## Root Cause Analysis

The issue occurs because:
1. **Frontend**: Expects to call `/.netlify/functions/save-draft` (Netlify functions)
2. **Backend**: You created `netlify/functions/save-draft.js` but you're running locally
3. **Local Development**: You need to call your local backend server (e.g., `http://localhost:3001`)

## What We've Fixed

✅ **Updated Draft Service**: Now automatically detects development vs production
✅ **Added Local Endpoints**: Added `/api/drafts` endpoints to your local server
✅ **Added Debugging**: Console logs to help troubleshoot API calls
✅ **Created Test Script**: `test-draft-local.js` to verify endpoints work

## Step-by-Step Testing

### Step 1: Start Your Local Server

```bash
cd server
npm start
# or
node index.js
```

You should see: `Backend server running on http://localhost:3001`

### Step 2: Test the Endpoints

```bash
node test-draft-local.js
```

This will test:
- Health endpoint: `/api/health`
- Save draft: `POST /api/drafts`
- Load draft: `GET /api/drafts/:applicantId`

### Step 3: Check Browser Console

1. Open your React app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Click "Save Draft" button
5. Look for these logs:
   ```
   🔄 Saving draft to: http://localhost:3001/api/drafts
   📊 Draft data size: XXX bytes
   📡 Response status: 200
   ```

## Expected Behavior

### ✅ Success Case
```
🔄 Saving draft to: http://localhost:3001/api/drafts
📊 Draft data size: 1234 bytes
📡 Response status: 200
📡 Response headers: {...}
✅ Draft saved successfully
```

### ❌ Error Cases

**Case 1: Server Not Running**
```
❌ Health Check Failed: connect ECONNREFUSED 127.0.0.1:3001
💡 Make sure your local server is running on port 3001
```

**Case 2: Wrong Endpoint**
```
🔄 Saving draft to: http://localhost:3001/wrong-endpoint
📡 Response status: 404
❌ Draft functionality test failed
```

**Case 3: CORS Issues**
```
🔄 Saving draft to: http://localhost:3001/api/drafts
❌ Failed to fetch: CORS error
```

## Debugging Steps

### 1. Check Network Tab
1. Open Developer Tools → Network tab
2. Click "Save Draft"
3. Look for the failed request
4. Check:
   - **Request URL**: Should be `http://localhost:3001/api/drafts`
   - **Response**: Should be JSON, not HTML

### 2. Check Server Logs
Your server terminal should show:
```
✅ Received request to save draft: 2:30:45 PM
✅ Draft saved for TEST-USER-001, size: 1234 bytes
```

### 3. Check Environment Variables
Ensure your `.env` file has:
```env
VITE_API_BASE_URL=http://localhost:3001
```

## Common Issues & Solutions

### Issue 1: "Server Not Running"
**Solution**: Start your local server
```bash
cd server
npm start
```

### Issue 2: "Wrong Port"
**Solution**: Check if server is running on correct port
```bash
# In server terminal, you should see:
Backend server running on http://localhost:3001
```

### Issue 3: "CORS Error"
**Solution**: Your server already has CORS enabled, but if issues persist:
```javascript
// In server/routes.ts, ensure CORS is properly configured
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite dev server
  credentials: true
}));
```

### Issue 4: "Endpoint Not Found"
**Solution**: Verify the endpoint is registered
```javascript
// In server/routes.ts, you should see:
app.post("/api/drafts", async (req, res) => { ... });
app.get("/api/drafts/:applicantId", async (req, res) => { ... });
```

## Production vs Development

### Development (Local)
- **API Base**: `http://localhost:3001`
- **Endpoints**: `/api/drafts`
- **Storage**: In-memory (Map)

### Production (Netlify)
- **API Base**: `/.netlify/functions`
- **Endpoints**: `/save-draft`, `/load-draft`
- **Storage**: DynamoDB

## Testing Your Fix

1. **Start local server**: `cd server && npm start`
2. **Run test script**: `node test-draft-local.js`
3. **Test in browser**: Use your React app's draft buttons
4. **Check console**: Look for success logs

## Still Having Issues?

If the problem persists:

1. **Check server logs** for any errors
2. **Verify endpoints** are registered correctly
3. **Test with curl** to isolate the issue:
   ```bash
   curl -X POST http://localhost:3001/api/drafts \
     -H "Content-Type: application/json" \
     -d '{"applicantId":"test","formData":{"test":"data"}}'
   ```
4. **Check browser console** for detailed error messages

## Success Indicators

You'll know it's working when:
- ✅ Server starts without errors
- ✅ Test script shows all green checkmarks
- ✅ Browser console shows successful API calls
- ✅ Draft buttons work without errors
- ✅ No more "Unexpected token '<'" errors
