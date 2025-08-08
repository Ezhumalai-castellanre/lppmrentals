# Missing Documents Tracker - 405 Error Fix

## Problem
The Missing Documents Tracker was returning a 405 HTTP error (Method Not Allowed) when trying to access the page.

## Root Cause
The issue was a mismatch between the client-side request method and the server-side function configuration:

1. **Client-side**: In production, the frontend was making POST requests to `/.netlify/functions/monday-missing-subitems`
2. **Server-side**: The Netlify function only supported GET requests

## Solution
Updated the Netlify function `monday-missing-subitems.js` to support both GET and POST requests:

### Changes Made

1. **Updated HTTP method validation**:
   ```javascript
   // Before: Only GET allowed
   if (event.httpMethod !== 'GET') {
     return createCorsResponse(405, { error: 'Method not allowed' });
   }
   
   // After: Both GET and POST allowed
   if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
     return createCorsResponse(405, { error: 'Method not allowed' });
   }
   ```

2. **Added POST request body parsing**:
   ```javascript
   // For POST requests, also check the request body
   if (!applicantId && event.httpMethod === 'POST' && event.body) {
     try {
       const body = JSON.parse(event.body);
       applicantId = body.applicantId;
       console.log('Extracted applicantId from POST body:', applicantId);
     } catch (parseError) {
       console.error('Failed to parse POST body:', parseError);
     }
   }
   ```

3. **Enhanced error logging**:
   - Added more detailed debug information in error responses
   - Improved logging for troubleshooting

### Files Modified
- `netlify/functions/monday-missing-subitems.js`
- `netlify/functions/test-missing-subitems.js` (for consistency)

## Testing
The fix allows the function to handle both:
- **GET requests**: With applicantId in the URL path
- **POST requests**: With applicantId in the request body

## Deployment
After making these changes, the function needs to be redeployed to Netlify for the fix to take effect.

## Client-Side Behavior
The client code in `client/src/pages/missing-documents.tsx` uses:
- **Development**: GET requests to `/api/monday/missing-subitems/${applicantId}`
- **Production**: POST requests to `/.netlify/functions/monday-missing-subitems`

This fix ensures both environments work correctly.
