import React, { createContext, useContext, useEffect, useState } from 'react';
import { signIn, signUp, confirmSignUp, signOut, resetPassword, confirmResetPassword, resendSignUpCode, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string, phoneNumber?: string) => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthState: () => Promise<void>;
  forgotPassword: (username: string) => Promise<void>;
  confirmForgotPassword: (username: string, code: string, newPassword: string) => Promise<void>;
  resendConfirmationCode: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        try {
          const userAttributes = await fetchUserAttributes();
          setUser({
            id: currentUser.username,
            email: userAttributes.email || '',
            username: currentUser.username,
          });
        } catch (identityError) {
          // If Identity Pool fails, still set the user from current user
          console.log('Identity Pool error during auth check (non-critical):', identityError);
          setUser({
            id: currentUser.username,
            email: '',
            username: currentUser.username,
          });
        }
      }
    } catch (error) {
      console.log('No authenticated user or AWS not configured');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (username: string, password: string) => {
    try {
      // First, check if there's already a signed-in user and sign them out
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          console.log('Found existing user, signing out first...');
          await signOut();
          setUser(null);
        }
      } catch (error) {
        // No current user, proceed with sign in
        console.log('No existing user found, proceeding with sign in');
      }

      // Now sign in
      await signIn({ username, password });
      
      // Try to get current user and attributes
      try {
        const currentUser = await getCurrentUser();
        const userAttributes = await fetchUserAttributes();
        setUser({
          id: currentUser.username,
          email: userAttributes.email || '',
          username: currentUser.username,
        });
      } catch (identityError) {
        // If Identity Pool fails, still set the user from sign-in
        console.log('Identity Pool error (non-critical):', identityError);
        // Set user with basic info from sign-in
        setUser({
          id: username,
          email: '',
          username: username,
        });
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const handleSignUp = async (username: string, email: string, password: string, userAttributes?: any) => {
    try {
      const attributes = userAttributes || {
        email,
      };

      await signUp({
        username,
        password,
        options: {
          userAttributes: attributes,
        },
      });
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const handleConfirmSignUp = async (username: string, code: string) => {
    try {
      await confirmSignUp({ username, confirmationCode: code });
    } catch (error: any) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error: any) {
      console.error('Error signing out:', error);
      // Even if signOut fails, clear the local state
      setUser(null);
      throw error;
    }
  };

  const clearAuthState = async () => {
    try {
      // Try to sign out if there's a current user
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          await signOut();
        }
      } catch (error) {
        // No current user, that's fine
      }
      
      // Clear local state
      setUser(null);
    } catch (error: any) {
      console.error('Error clearing auth state:', error);
      // Clear local state anyway
      setUser(null);
    }
  };

  const handleForgotPassword = async (username: string) => {
    try {
      await resetPassword({ username });
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  };

  const handleConfirmForgotPassword = async (username: string, code: string, newPassword: string) => {
    try {
      await confirmResetPassword({ username, confirmationCode: code, newPassword });
    } catch (error: any) {
      console.error('Error confirming password reset:', error);
      throw error;
    }
  };

  const handleResendConfirmationCode = async (username: string) => {
    try {
      await resendSignUpCode({ username });
    } catch (error: any) {
      console.error('Error resending confirmation code:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn: handleSignIn,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    signOut: handleSignOut,
    clearAuthState: clearAuthState,
    forgotPassword: handleForgotPassword,
    confirmForgotPassword: handleConfirmForgotPassword,
    resendConfirmationCode: handleResendConfirmationCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 