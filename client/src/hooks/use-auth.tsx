import React, { createContext, useContext, useEffect, useState } from 'react';
import { signIn, signUp, confirmSignUp, signOut, resetPassword, confirmResetPassword, resendSignUpCode, getCurrentUser, fetchUserAttributes, updatePassword } from 'aws-amplify/auth';
import { generateLppmNumber, generateLppmUincid } from '@/lib/utils';
import { getCurrentUserWithDebug, getUserAttributesWithDebug } from '@/lib/aws-config';

interface User {
  id: string;
  email: string;
  username: string;
  applicantId?: string;
  zoneinfo?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string, userAttributes?: any, firstName?: string, lastName?: string, phoneNumber?: string) => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthState: () => Promise<void>;
  forgotPassword: (username: string) => Promise<void>;
  confirmForgotPassword: (username: string, code: string, newPassword: string) => Promise<void>;
  resendConfirmationCode: (username: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
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
      console.log('🔍 Checking authentication state...');
      setIsLoading(true);
      
      const currentUser = await getCurrentUser();
      console.log('✅ Current user found:', currentUser?.username);
      
      if (currentUser) {
        try {
          const userAttributes = await fetchUserAttributes();
          console.log('✅ User attributes fetched:', Object.keys(userAttributes));
          
          // Check zoneinfo for applicantId (source of truth)
          const zoneinfoValue = userAttributes.zoneinfo || userAttributes['custom:zoneinfo'];
          console.log('🔍 Zoneinfo value:', zoneinfoValue);
          console.log('🔍 User attributes keys:', Object.keys(userAttributes));
          console.log('🔍 User attributes:', userAttributes);
          
          // Use zoneinfo as the source of truth for applicantId
          const finalApplicantId = zoneinfoValue || generateLppmNumber();
          
          console.log('✅ Final applicantId determined from zoneinfo:', finalApplicantId);
          
          const userState = {
            id: currentUser.username,
            email: userAttributes.email || '',
            username: currentUser.username,
            applicantId: finalApplicantId, // Now uses zoneinfo value
            zoneinfo: zoneinfoValue,
            name: (userAttributes as any).name || '',
            given_name: userAttributes.given_name || '',
            family_name: userAttributes.family_name || '',
            phone_number: userAttributes.phone_number || '',
          };
          
          setUser(userState);
          
          console.log('✅ User state set successfully:', userState);
          console.log('✅ User state set successfully with applicantId:', finalApplicantId);
          console.log('✅ User state set successfully with zoneinfo:', zoneinfoValue);
        } catch (attributesError) {
          console.error('❌ Error fetching user attributes, using fallback:', attributesError);
          // Fallback: set user with basic info and generate applicantId
          const fallbackApplicantId = generateLppmNumber();
          setUser({
            id: currentUser.username,
            email: '',
            username: currentUser.username,
            applicantId: fallbackApplicantId,
          });
          console.log('🔧 Using fallback user state due to attributes error:', fallbackApplicantId);
        }
      } else {
        console.log('❌ No current user found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error checking auth state:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const registerUserInDatabase = async (cognitoUsername: string, email: string, firstName?: string, lastName?: string, phoneNumber?: string) => {
    try {
      console.log('🔧 Attempting to register user in database:', {
        cognitoUsername,
        email,
        firstName,
        lastName,
        phoneNumber
      });

      // First, test server connectivity
      try {
        const healthResponse = await fetch('/api/health');
        console.log('🔧 Server health check status:', healthResponse.status);
        if (!healthResponse.ok) {
                  console.warn('🔧 Server health check failed, using fallback applicantId');
        const fallbackId = generateLppmNumber();
        return fallbackId;
        }
      } catch (healthError) {
        console.warn('🔧 Server health check error, using fallback applicantId:', healthError);
        const fallbackId = generateLppmNumber();
        return fallbackId;
      }

      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cognitoUsername,
          email,
          firstName,
          lastName,
          phoneNumber,
        }),
      });

      console.log('🔧 Register user response status:', response.status);
      console.log('🔧 Register user response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔧 Register user success data:', data);
        return data.user.applicantId;
      } else if (response.status === 409) {
        // User already exists, get the existing applicantId
        const data = await response.json();
        console.log('🔧 User already exists, applicantId:', data.applicantId);
        return data.applicantId;
      } else {
        const errorText = await response.text();
        console.error('🔧 Failed to register user in database:', response.status, errorText);
        // Return a Lppm number when database is not available
        const fallbackId = generateLppmNumber();
        console.log('🔧 Using fallback applicantId:', fallbackId);
        return fallbackId;
      }
    } catch (error) {
      console.error('🔧 Error registering user in database:', error);
      // Return a Lppm number when database is not available
      const fallbackId = generateLppmNumber();
      console.log('🔧 Using fallback applicantId due to error:', fallbackId);
      return fallbackId;
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
      
      // Try to get current user and attributes with enhanced debugging
      try {
        console.log('🔍 Starting enhanced AWS user debugging...');
        
        const debugResult = await getCurrentUserWithDebug();
        
        if (debugResult && debugResult.userAttributes) {
          const { currentUser, userAttributes } = debugResult;
          
          console.log('✅ AWS Debug Results:', {
            currentUser: {
              username: currentUser.username,
              userId: currentUser.userId,
            },
            userAttributes: {
              hasName: userAttributes.hasName,
              hasZoneinfo: userAttributes.hasZoneinfo,
              zoneinfo: userAttributes.zoneinfo,
              name: userAttributes.attributes.name,
              given_name: userAttributes.attributes.given_name,
              family_name: userAttributes.attributes.family_name,
            }
          });
          
          // No longer using database applicantId - only zoneinfo

          // Check if zoneinfo contains the applicantId (temporary mapping)
          const zoneinfoValue = userAttributes.attributes.zoneinfo || userAttributes.attributes['custom:zoneinfo'];
          
          // Use ONLY zoneinfo as applicantId - no fallbacks
          const finalApplicantId = zoneinfoValue;
          
          // Log which source is being used for applicantId
          if (zoneinfoValue) {
            console.log('🎯 Using zoneinfo as applicantId:', zoneinfoValue);
          } else {
            console.log('❌ No zoneinfo available - applicantId will be undefined');
          }
          
          setUser({
            id: currentUser.username,
            email: userAttributes.attributes.email || '',
            username: currentUser.username,
            applicantId: finalApplicantId,
            zoneinfo: zoneinfoValue,
            name: userAttributes.attributes.name,
            given_name: userAttributes.attributes?.given_name || '',
            family_name: userAttributes.attributes?.family_name || '',
            phone_number: userAttributes.attributes?.phone_number || '',
          });
          
          console.log('✅ User logged in with attributes:', {
            id: currentUser.username,
            email: userAttributes.attributes.email,
            zoneinfo: zoneinfoValue,
            name: userAttributes.attributes.name,
            given_name: userAttributes.attributes.given_name,
            family_name: userAttributes.attributes.family_name,
            phone_number: userAttributes.attributes.phone_number,
            finalApplicantId: finalApplicantId,
            applicantIdSource: zoneinfoValue ? 'zoneinfo' : 'none'
          });
          
          // Additional detailed logging for zoneinfo
          console.log('🔍 Detailed zoneinfo analysis:', {
            zoneinfo_standard: userAttributes.attributes.zoneinfo,
            zoneinfo_custom: userAttributes.attributes['custom:zoneinfo'],
            zoneinfo_final: zoneinfoValue,
            all_attributes_keys: Object.keys(userAttributes.attributes),
            custom_attributes: Object.keys(userAttributes.attributes).filter(key => key.startsWith('custom:')),
            final_applicantId: finalApplicantId,
          });
        } else {
          console.log('⚠️ No debug result available, falling back to basic auth');
          // Fallback to basic auth
          const currentUser = await getCurrentUser();
          if (!currentUser) {
            console.error('❌ No current user available in fallback');
            return;
          }
          
          const userAttributes = await fetchUserAttributes();
          
          // Check if zoneinfo contains the applicantId (source of truth)
          const zoneinfoValue = userAttributes.zoneinfo || (userAttributes as any)['custom:zoneinfo'];
          // Use ONLY zoneinfo as applicantId - no fallbacks
          const finalApplicantId = zoneinfoValue;
          
          setUser({
            id: currentUser.username,
            email: (userAttributes as any).email || '',
            username: currentUser.username,
            applicantId: finalApplicantId,
            zoneinfo: zoneinfoValue,
            name: (userAttributes as any).name || '',
            given_name: (userAttributes as any).given_name || '',
            family_name: (userAttributes as any).family_name || '',
            phone_number: (userAttributes as any).phone_number || '',
          });
        }
      } catch (identityError) {
        // If Identity Pool fails, still set the user from sign-in
        console.log('Identity Pool error (non-critical):', identityError);
        // Set user with basic info from sign-in - no applicantId if zoneinfo unavailable
        setUser({
          id: username,
          email: '',
          username: username,
          // No applicantId - only zoneinfo should provide it
        });
        console.log('🔧 No applicantId available due to Identity Pool error - zoneinfo required');
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const handleSignUp = async (username: string, email: string, password: string, userAttributes?: any, firstName?: string, lastName?: string, phoneNumber?: string) => {
    try {
      // Generate LPPM-uincid for zoneinfo
      const lppmUincid = generateLppmUincid();
      console.log('🔧 Generated LPPM-uincid for new user:', lppmUincid);

      const attributes = {
        ...userAttributes,
        email,
        zoneinfo: lppmUincid, // Set the LPPM-uincid as zoneinfo
      };

      console.log('🔧 Signing up user with attributes:', attributes);

      await signUp({
        username,
        password,
        options: {
          userAttributes: attributes,
        },
      });

      console.log('✅ User signed up successfully with LPPM-uincid:', lppmUincid);

      // Register user in database after successful Cognito sign-up
      await registerUserInDatabase(username, email, firstName, lastName, phoneNumber);
    } catch (error: any) {
      console.error('❌ Error signing up:', error);
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

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await updatePassword({ oldPassword, newPassword });
    } catch (error: any) {
      console.error('Error changing password:', error);
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
    changePassword: handleChangePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 