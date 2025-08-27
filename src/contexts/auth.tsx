'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAttendanceTaker: boolean;
  role: 'admin' | 'attendanceTaker' | 'student' | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isAttendanceTaker: false,
  role: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
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
        
        // Only redirect if this is not the initial load, user just signed in, and we haven't redirected yet
        // Also check if we're not already on a valid user page
        const currentPath = window.location.pathname;
        const isOnValidUserPage = currentPath.startsWith('/student') || currentPath.startsWith('/admin');
        
        if (!initialLoad && !hasRedirected && !isOnValidUserPage) {
          if (isAdmin) {
            router.push('/admin');
          } else {
            router.push('/student');
          }
          setHasRedirected(true);
        }
      } else {
        setUser(null);
        setHasRedirected(false);
        // Clear cookies
        document.cookie = 'token=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'isAdmin=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
        
        // Only redirect to login if user was previously authenticated
        if (!initialLoad && !loading) {
          router.push('/');
        }
      }
      setLoading(false);
      setInitialLoad(false);
    });

    return () => unsubscribe();
  }, [router, initialLoad, loading, hasRedirected]);

  const [role, setRole] = useState<'admin' | 'attendanceTaker' | 'student' | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setRole(null);
        return;
      }

      if (user.email === process.env.ADMIN_EMAIL) {
        setRole('admin');
        return;
      }

      // Check if user is an attendance taker
      const takersRef = collection(db, 'attendanceTakers');
      const q = query(takersRef, where('email', '==', user.email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setRole('attendanceTaker');
      } else {
        setRole('student');
      }
    };

    checkRole();
  }, [user]);

  const value = {
    user,
    loading,
    isAdmin: role === 'admin',
    isAttendanceTaker: role === 'attendanceTaker',
    role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
