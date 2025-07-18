# Netlify Deployment Troubleshooting Guide

## Current Issue: 404 Error on Deployed Site

Your application is working locally but getting 404 errors on the deployed Netlify site (`https://jotform-v.netlify.app`).

## Step-by-Step Troubleshooting

### 1. Check Netlify Function Deployment

First, test if Netlify functions are working at all:

```bash
# Test the basic function
curl https://jotform-v.netlify.app/.netlify/functions/test

# Test the Monday units function
curl https://jotform-v.netlify.app/.netlify/functions/monday-units
```

### 2. Check Netlify Dashboard

1. Go to your Netlify dashboard
2. Navigate to your site (`jotform-v`)
3. Check the **Functions** tab to see if functions are deployed
4. Check the **Deploys** tab for any build errors

### 3. Verify Environment Variables

In your Netlify dashboard, go to **Site settings > Environment variables** and ensure these are set:

- `MONDAY_API_TOKEN` - Your Monday.com API token
- `MONDAY_BOARD_ID` - Your Monday.com board ID (8740450373)
- `DATABASE_URL` - Your database connection string
- `ENCRYPTION_KEY` - Your encryption key

### 4. Check Function Logs

1. In Netlify dashboard, go to **Functions** tab
2. Click on `monday-units` function
3. Check the **Logs** tab for any errors
4. Look for the console.log messages we added

### 5. Test Function Invocation

Try calling the function directly:

```bash
# Test with curl
curl -X GET https://jotform-v.netlify.app/.netlify/functions/monday-units

# Test with browser
# Open: https://jotform-v.netlify.app/.netlify/functions/monday-units
```

### 6. Check Redirect Rules

The redirect rule in `netlify.toml` should work:
```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

But let's also try adding a more specific rule:

```toml
[[redirects]]
  from = "/api/monday/units"
  to = "/.netlify/functions/monday-units"
  status = 200
```

### 7. Force Redeploy

If functions aren't updating:

1. Go to Netlify dashboard
2. Navigate to **Deploys**
3. Click **Trigger deploy** > **Deploy site**
4. Wait for the build to complete

### 8. Check Build Logs

Look for any errors in the build process:

1. Go to **Deploys** tab
2. Click on the latest deploy
3. Check the build logs for any errors

### 9. Alternative: Use Direct Function URLs

If the redirect isn't working, you can temporarily update your frontend to call the functions directly:

```javascript
// In client/src/lib/monday-api.ts
const response = await fetch('/.netlify/functions/monday-units', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 10. Debug Function Locally

Test the function locally with Netlify CLI:

```bash
# Install Netlify CLI globally if not already installed
npm install -g netlify-cli

# Test locally
netlify dev

# Then visit: http://localhost:8888/.netlify/functions/monday-units
```

## Common Issues and Solutions

### Issue 1: Functions Not Deployed
**Solution**: Check if the `netlify/functions` directory is being included in the build.

### Issue 2: Environment Variables Not Set
**Solution**: Set all required environment variables in Netlify dashboard.

### Issue 3: Function Name Mismatch
**Solution**: Ensure function file name matches the URL path.

### Issue 4: Redirect Rules Not Working
**Solution**: Try more specific redirect rules or call functions directly.

### Issue 5: Build Errors
**Solution**: Check build logs and fix any dependency or syntax errors.

## Next Steps

1. **Test the functions directly** using the URLs above
2. **Check Netlify dashboard** for deployment status
3. **Verify environment variables** are set correctly
4. **Check function logs** for detailed error messages
5. **Force a redeploy** if needed

## Contact Support

If the issue persists:
1. Check Netlify's status page
2. Review Netlify's function documentation
3. Contact Netlify support with your function logs 