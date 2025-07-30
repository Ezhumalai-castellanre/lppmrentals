import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle, User as UserIcon } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset';

const LoginPage: React.FC = () => {
  const { signIn, signUp, confirmSignUp, forgotPassword, confirmForgotPassword, resendConfirmationCode, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Form states
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [markEmailVerified, setMarkEmailVerified] = useState(false);
  const [markPhoneVerified, setMarkPhoneVerified] = useState(false);

  // Redirect to home page if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormLoading(true);
    setError('');

    try {
      await signIn(username, password);
      toast({
        title: 'Success',
        description: 'Signed in successfully!',
      });
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign in',
        variant: 'destructive',
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 1 and has 11 digits, it's a US number
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it has 10 digits, assume it's a US number and add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it already starts with +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Otherwise, add + prefix
    return `+${cleaned}`;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsFormLoading(false);
      return;
    }

    try {
      const userAttributes: any = {
        email,
        name: `${firstName} ${lastName}`.trim(),
        given_name: firstName,
        family_name: lastName,
      };

      // Add phone number if provided (with proper formatting)
      if (phoneNumber.trim()) {
        const formattedPhone = formatPhoneNumber(phoneNumber);
        // Only add if formatting was successful
        if (formattedPhone && formattedPhone.length > 1) {
          userAttributes.phone_number = formattedPhone;
        }
      }

      await signUp(username, email, password, userAttributes);
      setMode('confirm');
      toast({
        title: 'Success',
        description: 'Account created! Please check your email for verification code.',
      });
    } catch (error: any) {
      setError(error.message || 'Failed to sign up');
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign up',
        variant: 'destructive',
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormLoading(true);
    setError('');

    try {
      await confirmSignUp(username, otpCode);
      setMode('signin');
      setOtpCode('');
      toast({
        title: 'Success',
        description: 'Account verified! You can now sign in.',
      });
    } catch (error: any) {
      setError(error.message || 'Failed to confirm sign up');
      toast({
        title: 'Error',
        description: error.message || 'Failed to confirm sign up',
        variant: 'destructive',
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormLoading(true);
    setError('');

    try {
      await forgotPassword(username);
      setMode('reset');
      toast({
        title: 'Success',
        description: 'Password reset code sent to your email.',
      });
    } catch (error: any) {
      setError(error.message || 'Failed to send reset code');
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset code',
        variant: 'destructive',
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormLoading(true);
    setError('');

    try {
      await confirmForgotPassword(username, otpCode, newPassword);
      setMode('signin');
      setOtpCode('');
      setNewPassword('');
      toast({
        title: 'Success',
        description: 'Password reset successfully! You can now sign in.',
      });
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsFormLoading(true);
    setError('');

    try {
      await resendConfirmationCode(username);
      toast({
        title: 'Success',
        description: 'Verification code resent to your email.',
      });
    } catch (error: any) {
      setError(error.message || 'Failed to resend code');
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend code',
        variant: 'destructive',
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setNewPassword('');
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
    setMarkEmailVerified(false);
    setMarkPhoneVerified(false);
  };

  // Show loading spinner while checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f2f8fe' }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't show login form if already authenticated (redirect will happen via useEffect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f2f8fe' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#f2f8fe' }}>
      {/* Logo in Left Corner - Hidden on mobile */}
      <div className="absolute top-8 left-8 z-20 hidden md:block">
        <img 
          src="https://www.jotform.com/uploads/CRP_Affordable/form_files/image_686d7ef15b36a.png?nc=1" 
          alt="Company Logo" 
          className="h-16 w-auto"
        />
      </div>

      {/* Mobile Logo - Centered at top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 md:hidden">
        <img 
          src="https://www.jotform.com/uploads/CRP_Affordable/form_files/image_686d7ef15b36a.png?nc=1" 
          alt="Company Logo" 
          className="h-12 w-auto"
        />
      </div>

      {/* Top Right Corner Shapes - Reduced size on mobile */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-green-400 rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-0 right-0 w-40 h-40 md:w-80 md:h-80 bg-blue-500 rounded-full opacity-20 transform translate-x-1/3 -translate-y-1/3"></div>
      </div>

      {/* Bottom Left Corner Shapes - Reduced size on mobile */}
      <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute bottom-0 left-0 w-36 h-36 md:w-72 md:h-72 bg-yellow-400 rounded-full opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-orange-500 rounded-full opacity-20 transform -translate-x-1/3 translate-y-1/3"></div>
      </div>

      <Card className="w-full max-w-sm md:max-w-md relative z-10 mt-16 md:mt-0">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'confirm' && 'Verify Email'}
            {mode === 'forgot' && 'Forgot Password'}
            {mode === 'reset' && 'Reset Password'}
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            {mode === 'signin' && 'Welcome back! Please sign in to your account.'}
            {mode === 'signup' && 'Create a new account to get started.'}
            {mode === 'confirm' && 'Enter the verification code sent to your email.'}
            {mode === 'forgot' && 'Enter your username to receive a reset code.'}
            {mode === 'reset' && 'Enter the reset code and your new password.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 md:px-6">
          {error && (
            <Alert className="mb-4 text-sm" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 h-12 text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-12 h-12 text-base"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isFormLoading}>
                {isFormLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="text-center space-y-3">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => {
                    setMode('signup');
                    resetForm();
                  }}
                >
                  Don't have an account? Sign up
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => {
                    setMode('forgot');
                    resetForm();
                  }}
                >
                  Forgot your password?
                </Button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username" className="text-sm font-medium">
                  Username <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username (required)"
                    className="pl-10 h-12 text-base"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Username is a required attribute based on your user pool configuration.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="pl-10 h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="pl-10 h-12 text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="pl-10 h-12 text-base"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Email can be used for sign-in, account recovery, and confirmation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number <span className="text-gray-400">(optional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10 h-12 text-base"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Include country code (e.g., +1 for US). Phone number is optional.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="pl-10 pr-12 h-12 text-base"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-10 pr-12 h-12 text-base"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isFormLoading}>
                {isFormLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => {
                    setMode('signin');
                    resetForm();
                  }}
                >
                  Already have an account? Sign in
                </Button>
              </div>
            </form>
          )}

          {mode === 'confirm' && (
            <form onSubmit={handleConfirmSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Verification Code</Label>
                <div className="flex justify-center">
                  <Input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="text-center text-lg font-mono tracking-widest h-12"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || otpCode.length !== 6}>
                {isFormLoading ? 'Verifying...' : 'Verify Email'}
              </Button>

              <div className="text-center space-y-3">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={handleResendCode}
                  disabled={isFormLoading}
                >
                  Resend Code
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => {
                    setMode('signin');
                    resetForm();
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="forgot-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 h-12 text-base"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isFormLoading}>
                {isFormLoading ? 'Sending Reset Code...' : 'Send Reset Code'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => {
                    setMode('signin');
                    resetForm();
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reset Code</Label>
                <div className="flex justify-center">
                  <Input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="text-center text-lg font-mono tracking-widest h-12"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-10 pr-12 h-12 text-base"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || otpCode.length !== 6}>
                {isFormLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => {
                    setMode('signin');
                    resetForm();
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage; 