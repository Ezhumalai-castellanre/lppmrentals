# Netlify Environment Variables Setup

## 🔧 **AWS Cognito Configuration for Production**

To fix the authentication issues in production, you need to set up the following environment variables in your Netlify dashboard.

### **📋 Required Environment Variables**

Go to your Netlify dashboard → Site settings → Environment variables and add:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `VITE_AWS_REGION` | `us-east-1` | AWS region for Cognito |
| `VITE_AWS_USER_POOL_ID` | `us-east-1_d07c780Tz` | Your Cognito User Pool ID |
| `VITE_AWS_USER_POOL_CLIENT_ID` | `dodlhbfd06i8u5t9kl6lkk6a0` | Your Cognito App Client ID |
| `VITE_AWS_IDENTITY_POOL_ID` | `us-east-1:317775cf-6015-4ce2-9551-57994672861d` | Your Cognito Identity Pool ID |
| `VITE_AWS_COGNITO_DOMAIN` | `your-cognito-domain.auth.us-east-1.amazoncognito.com` | Your Cognito domain (optional) |
| `VITE_REDIRECT_SIGN_IN` | `https://your-site.netlify.app/` | Production redirect URL |
| `VITE_REDIRECT_SIGN_OUT` | `https://your-site.netlify.app/` | Production redirect URL |

### **🚀 How to Set Environment Variables in Netlify**

1. **Go to Netlify Dashboard**
   - Navigate to your site
   - Click on "Site settings"

2. **Environment Variables**
   - Click on "Environment variables" in the left sidebar
   - Click "Add a variable" for each variable above

3. **Add Each Variable**
   - **Variable name**: `VITE_AWS_REGION`
   - **Value**: `us-east-1`
   - **Scope**: All scopes (Production, Deploy previews, Branch deploys)

4. **Repeat for All Variables**
   - Add all 7 variables listed above
   - Make sure to use your actual production URLs for redirects

### **🔍 Debug Information**

The application now includes debug logging to help troubleshoot configuration issues. Check the browser console for:

```
AWS Configuration Debug: {
  hasAwsCredentials: true/false,
  userPoolId: "us-east-1_d07c780Tz",
  userPoolClientId: "dodlhbfd06i8u5t9kl6lkk6a0",
  identityPoolId: "us-east-1:317775cf-6015-4ce2-9551-57994672861d",
  region: "us-east-1"
}
```

### **✅ Verification Steps**

1. **After setting environment variables:**
   - Trigger a new deployment in Netlify
   - Check the browser console for debug information
   - Test the login functionality

2. **Expected Behavior:**
   - `hasAwsCredentials` should be `true`
   - All AWS configuration values should be populated
   - Login should work without "InvalidParameterException"

### **🐛 Common Issues**

1. **"InvalidParameterException: demo-client-id"**
   - Environment variables not set in Netlify
   - Solution: Add all required environment variables

2. **"hasAwsCredentials: false"**
   - Missing or incorrect environment variables
   - Solution: Verify all variables are set correctly

3. **CORS Issues**
   - Add your Netlify domain to Cognito User Pool settings
   - Update redirect URLs in Cognito configuration

### **📞 Support**

If you continue to have issues:
1. Check the browser console for debug information
2. Verify all environment variables are set in Netlify
3. Ensure your Cognito User Pool is properly configured
4. Test with the updated configuration

### **🔄 Deployment**

After setting environment variables:
1. Commit and push your changes
2. Netlify will automatically deploy
3. Test the authentication flow
4. Verify redirect functionality works

---

**Note**: Make sure to replace `your-site.netlify.app` with your actual Netlify domain in the redirect URLs. 