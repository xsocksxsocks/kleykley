import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole } from '@/types/shop';
import { logError, logDebug } from '@/lib/errorLogger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isApproved: boolean;
  isBlocked: boolean;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    companyName?: string,
    phone?: string,
    address?: string,
    city?: string,
    postalCode?: string,
    country?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        logError('AuthContext:fetchProfile', profileError);
        return;
      }

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        logError('AuthContext:fetchRole', roleError);
        return;
      }

      setIsAdmin(!!roleData);
    } catch (error) {
      logError('AuthContext:fetchProfile', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for realtime changes to user's profile (e.g., being blocked)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newProfile = payload.new as Profile;
          
          // If user was blocked, sign them out immediately
          if (newProfile.is_blocked && !profile?.is_blocked) {
            signOut();
          } else {
            // Update profile with new data
            setProfile(newProfile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.is_blocked]);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    companyName?: string,
    phone?: string,
    address?: string,
    city?: string,
    postalCode?: string,
    country?: string
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          company_name: companyName,
          phone: phone,
          address: address,
          city: city,
          postal_code: postalCode,
          country: country,
        },
      },
    });

    // Update profile with additional data after signup
    if (!error && data.user) {
      await supabase
        .from('profiles')
        .update({
          company_name: companyName,
          phone: phone,
          address: address,
          city: city,
          postal_code: postalCode,
          country: country,
        })
        .eq('id', data.user.id);

      // NOTE: Welcome email is NOT sent here anymore!
      // It will be sent when the account is approved (manually or via auto-approval)
      logDebug('AuthContext', 'Account created - welcome email will be sent upon approval');
    }
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If login successful, check if user is blocked
    if (!error && data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_blocked, deletion_scheduled_at')
        .eq('id', data.user.id)
        .maybeSingle();

      // If user is blocked, sign them out immediately
      if (profileData?.is_blocked) {
        await supabase.auth.signOut();
        return { 
          error: new Error('Ihr Konto wurde gesperrt. Bitte kontaktieren Sie den Support.') 
        };
      }

      // If login successful, check and cancel any pending deletion
      if (profileData?.deletion_scheduled_at) {
        // Cancel the deletion request
        await supabase.rpc('cancel_account_deletion', {
          user_id: data.user.id,
        });
      }
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const isApproved = profile?.approval_status === 'approved';
  const isBlocked = profile?.is_blocked === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isApproved,
        isBlocked,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
