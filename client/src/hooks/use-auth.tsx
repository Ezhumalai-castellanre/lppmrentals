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
  signUp: (username: string, email: string, password: string) => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
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

// Dummy authentication for testing
const DUMMY_MODE = true; // Set to false to use real AWS Cognito
const DUMMY_USERS = [
  { username: 'admin', email: 'admin@example.com', password: 'admin123' },
  { username: 'user', email: 'user@example.com', password: 'user123' },
  { username: 'test', email: 'test@example.com', password: 'test123' },
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dummyUsers, setDummyUsers] = useState(DUMMY_USERS);

  useEffect(() => {
    if (DUMMY_MODE) {
      // Check for existing dummy user in localStorage
      const savedUser = localStorage.getItem('dummyUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    } else {
      checkAuthState();
    }
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const userAttributes = await fetchUserAttributes();
        setUser({
          id: currentUser.username,
          email: userAttributes.email || '',
          username: currentUser.username,
        });
      }
    } catch (error) {
      console.log('No authenticated user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (username: string, password: string) => {
    if (DUMMY_MODE) {
      // Dummy authentication
      const dummyUser = dummyUsers.find(u => u.username === username && u.password === password);
      if (dummyUser) {
        const user = {
          id: dummyUser.username,
          email: dummyUser.email,
          username: dummyUser.username,
        };
        setUser(user);
        localStorage.setItem('dummyUser', JSON.stringify(user));
        return;
      } else {
        throw new Error('Invalid username or password');
      }
    }

    try {
      await signIn({ username, password });
      const currentUser = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      setUser({
        id: currentUser.username,
        email: userAttributes.email || '',
        username: currentUser.username,
      });
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const handleSignUp = async (username: string, email: string, password: string) => {
    if (DUMMY_MODE) {
      // Check if user already exists
      const existingUser = dummyUsers.find(u => u.username === username);
      if (existingUser) {
        throw new Error('Username already exists');
      }
      
      // Add new dummy user
      const newUser = { username, email, password };
      setDummyUsers([...dummyUsers, newUser]);
      return;
    }

    try {
      await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const handleConfirmSignUp = async (username: string, code: string) => {
    if (DUMMY_MODE) {
      // Dummy confirmation - accept any 6-digit code
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        return;
      } else {
        throw new Error('Invalid verification code');
      }
    }

    try {
      await confirmSignUp({ username, confirmationCode: code });
    } catch (error) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    if (DUMMY_MODE) {
      setUser(null);
      localStorage.removeItem('dummyUser');
      return;
    }

    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const handleForgotPassword = async (username: string) => {
    if (DUMMY_MODE) {
      // Check if user exists
      const existingUser = dummyUsers.find(u => u.username === username);
      if (!existingUser) {
        throw new Error('User not found');
      }
      return;
    }

    try {
      await resetPassword({ username });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  };

  const handleConfirmForgotPassword = async (username: string, code: string, newPassword: string) => {
    if (DUMMY_MODE) {
      // Dummy password reset - accept any 6-digit code
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        // Update user password in dummy users
        setDummyUsers(prev => prev.map(u => 
          u.username === username ? { ...u, password: newPassword } : u
        ));
        return;
      } else {
        throw new Error('Invalid reset code');
      }
    }

    try {
      await confirmResetPassword({ username, confirmationCode: code, newPassword });
    } catch (error) {
      console.error('Error confirming password reset:', error);
      throw error;
    }
  };

  const handleResendConfirmationCode = async (username: string) => {
    if (DUMMY_MODE) {
      // Dummy resend - just return success
      return;
    }

    try {
      await resendSignUpCode({ username });
    } catch (error) {
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
    forgotPassword: handleForgotPassword,
    confirmForgotPassword: handleConfirmForgotPassword,
    resendConfirmationCode: handleResendConfirmationCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 