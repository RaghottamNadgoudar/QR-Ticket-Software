'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        
        const adminEmail = process.env.ADMIN_EMAIL;
        const isAdmin = user.email === adminEmail;
        
        // Force token refresh to ensure we have latest claims
        await user.getIdToken(true);
        const token = await user.getIdToken();

        console.log('Auth Debug:', {
          userEmail: user.email,
          adminEmail,
          isAdmin,
          token: token.substring(0, 10) + '...' // Log part of token for debugging
        });

        // Set cookies with secure parameters
        document.cookie = `token=${token};path=/;max-age=3600;samesite=strict;secure`;
        document.cookie = `isAdmin=${isAdmin};path=/;max-age=3600;samesite=strict;secure`;
      } else {
        setUser(null);
        // Clear cookies
        document.cookie = 'token=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'isAdmin=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const value = {
    user,
    loading,
    isAdmin: user?.email === process.env.ADMIN_EMAIL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
