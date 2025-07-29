import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset';

const LoginPage: React.FC = () => {
  const { signIn, signUp, confirmSignUp, forgotPassword, confirmForgotPassword, resendConfirmationCode } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(username, email, password);
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
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setNewPassword('');
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
  };

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

              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
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
                <Label htmlFor="signup-username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="pl-10 h-12 text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 h-12 text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
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
                <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
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

              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
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
                  <InputOTP
                    value={otpCode}
                    onChange={setOtpCode}
                    maxLength={6}
                    render={({ slots }) => (
                      <InputOTPGroup className="gap-2 md:gap-3">
                        {slots.map((slot, index) => (
                          <InputOTPSlot 
                            key={index} 
                            {...slot} 
                            index={index}
                            className="w-10 h-12 md:w-12 md:h-14 text-lg"
                          />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || otpCode.length !== 6}>
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </Button>

              <div className="text-center space-y-3">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={handleResendCode}
                  disabled={isLoading}
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

              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                {isLoading ? 'Sending Reset Code...' : 'Send Reset Code'}
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
                  <InputOTP
                    value={otpCode}
                    onChange={setOtpCode}
                    maxLength={6}
                    render={({ slots }) => (
                      <InputOTPGroup className="gap-2 md:gap-3">
                        {slots.map((slot, index) => (
                          <InputOTPSlot 
                            key={index} 
                            {...slot} 
                            index={index}
                            className="w-10 h-12 md:w-12 md:h-14 text-lg"
                          />
                        ))}
                      </InputOTPGroup>
                    )}
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
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
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