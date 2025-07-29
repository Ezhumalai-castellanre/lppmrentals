# AWS Cognito Authentication Setup

This guide will help you set up AWS Cognito authentication with OTP (One-Time Password) login for the rental application.

## Prerequisites

1. AWS Account
2. AWS CLI configured (optional but recommended)
3. Node.js and npm installed

## Step 1: Create AWS Cognito User Pool

### Using AWS Console

1. Go to the AWS Cognito Console
2. Click "Create user pool"
3. Configure sign-in experience:
   - Choose "Cognito user pool"
   - Select "Email" as the sign-in option
   - Enable "Allow users to sign up"
   - Enable "Allow users to sign in with email"

4. Configure security requirements:
   - Password policy: Choose your requirements (recommended: minimum 8 characters)
   - Enable MFA: "Optional" or "Required" based on your needs
   - User account recovery: Enable "Self-service account recovery"

5. Configure sign-up experience:
   - Enable "Self-service sign-up"
   - Required attributes: Email
   - Optional attributes: Name, Phone number (if needed)

6. Configure message delivery:
   - Choose "Send email with Cognito"
   - From email address: Use a verified email in SES or Cognito default

7. Configure app integration:
   - User pool name: `rental-applications-pool`
   - Initial app client name: `rental-applications-client`
   - Enable "Generate client secret": No (for public clients)

8. Review and create the user pool

### Using AWS CLI (Alternative)

```bash
# Create user pool
aws cognito-idp create-user-pool \
  --pool-name "rental-applications-pool" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --auto-verified-attributes email \
  --username-attributes email \
  --schema '[
    {
      "Name": "email",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    }
  ]'

# Create app client
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name "rental-applications-client" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# AWS Cognito Configuration
VITE_AWS_REGION="us-east-1"
VITE_AWS_USER_POOL_ID="us-east-1_xxxxxxxxx"
VITE_AWS_USER_POOL_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
VITE_AWS_COGNITO_DOMAIN="your-app.auth.us-east-1.amazoncognito.com"
VITE_REDIRECT_SIGN_IN="http://localhost:5173/"
VITE_REDIRECT_SIGN_OUT="http://localhost:5173/"
```

Replace the placeholder values with your actual AWS Cognito configuration:

- `VITE_AWS_REGION`: Your AWS region (e.g., us-east-1)
- `VITE_AWS_USER_POOL_ID`: Your User Pool ID (found in the Cognito console)
- `VITE_AWS_USER_POOL_CLIENT_ID`: Your App Client ID (found in the Cognito console)
- `VITE_AWS_COGNITO_DOMAIN`: Your Cognito domain (if you created one)

## Step 3: Configure Cognito Domain (Optional)

If you want to use the hosted UI for authentication:

1. In the Cognito console, go to your user pool
2. Navigate to "App integration" > "Domain name"
3. Choose "Cognito domain" and enter a unique domain name
4. Save the domain name and update your environment variables

## Step 4: Test the Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173/login`

3. Test the following flows:
   - Sign up with a new account
   - Verify email with OTP code
   - Sign in with existing account
   - Forgot password flow
   - Password reset with OTP

## Step 5: Production Configuration

For production deployment:

1. Update the redirect URLs in your environment variables:
   ```env
   VITE_REDIRECT_SIGN_IN="https://your-domain.com/"
   VITE_REDIRECT_SIGN_OUT="https://your-domain.com/"
   ```

2. Configure your Cognito User Pool for production:
   - Set up email verification templates
   - Configure password reset templates
   - Set up proper MFA if required

3. Consider setting up a custom domain for Cognito (requires SSL certificate)

## Features Included

### Authentication Flows
- ✅ User registration with email verification
- ✅ Email/OTP verification for new accounts
- ✅ User sign-in with username/password
- ✅ Forgot password with OTP reset
- ✅ Password reset with verification code
- ✅ Resend verification code functionality

### UI Components
- ✅ Modern, responsive login page
- ✅ Form validation and error handling
- ✅ Loading states and user feedback
- ✅ Password visibility toggle
- ✅ OTP input with 6-digit verification
- ✅ Toast notifications for success/error states

### Security Features
- ✅ Protected routes for authenticated users
- ✅ Automatic redirect to login for unauthenticated users
- ✅ Secure password requirements
- ✅ Email verification required for new accounts
- ✅ Session management with AWS Cognito

## Troubleshooting

### Common Issues

1. **"User not found" error**
   - Ensure the user exists in your Cognito User Pool
   - Check that the username/email is correct

2. **"Invalid verification code" error**
   - The OTP code expires after a few minutes
   - Use the "Resend Code" button to get a new code

3. **"Password requirements not met" error**
   - Ensure the password meets your Cognito User Pool requirements
   - Check minimum length, character requirements, etc.

4. **"Network error" or "CORS error"**
   - Verify your environment variables are correct
   - Check that your Cognito User Pool is in the correct region
   - Ensure your app client is properly configured

### Debug Mode

To enable debug logging, add this to your browser console:
```javascript
localStorage.setItem('amplify-debug', 'true');
```

## Additional Configuration

### Custom Email Templates

You can customize email templates in the Cognito console:
1. Go to your User Pool
2. Navigate to "Messaging" > "Email"
3. Customize verification and password reset emails

### Advanced Security

Consider enabling these security features:
- Multi-factor authentication (MFA)
- Advanced security features
- Risk-based adaptive authentication
- Custom authentication challenges

### User Pool Triggers

You can add Lambda functions for:
- Pre-authentication
- Post-authentication
- Pre-sign-up
- Post-confirmation
- Custom message

## Support

For issues related to:
- AWS Cognito: Check the [AWS Cognito documentation](https://docs.aws.amazon.com/cognito/)
- AWS Amplify: Check the [Amplify documentation](https://docs.amplify.aws/)
- This implementation: Check the code comments and this guide 