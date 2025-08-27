'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isAttendanceTaker } from '@/lib/users';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAttendanceTaker: boolean;
  clubName?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isAttendanceTaker: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [attendanceTakerInfo, setAttendanceTakerInfo] = useState<{ isAttendanceTaker: boolean; clubName?: string }>({
    isAttendanceTaker: false
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        
        const adminEmail = process.env.ADMIN_EMAIL;
        const isAdmin = user.email === adminEmail;
        
        // Check if user is an attendance taker
        const attendanceTakerStatus = await isAttendanceTaker(user.email || '');
        setAttendanceTakerInfo(attendanceTakerStatus);
        
        // Force token refresh to ensure we have latest claims
        await user.getIdToken(true);
        const token = await user.getIdToken();

        console.log('Auth Debug:', {
          userEmail: user.email,
          adminEmail,
          isAdmin,
          isAttendanceTaker: attendanceTakerStatus.isAttendanceTaker,
          clubName: attendanceTakerStatus.clubName,
          token: token.substring(0, 10) + '...' // Log part of token for debugging
        });

        // Set cookies with secure parameters
        document.cookie = `token=${token};path=/;max-age=3600;samesite=strict;secure`;
        document.cookie = `isAdmin=${isAdmin};path=/;max-age=3600;samesite=strict;secure`;
        document.cookie = `isAttendanceTaker=${attendanceTakerStatus.isAttendanceTaker};path=/;max-age=3600;samesite=strict;secure`;
        if (attendanceTakerStatus.clubName) {
          document.cookie = `clubName=${attendanceTakerStatus.clubName};path=/;max-age=3600;samesite=strict;secure`;
        }
        
        // Only redirect if this is not the initial load, user just signed in, and we haven't redirected yet
        // Also check if we're not already on a valid user page
        const currentPath = window.location.pathname;
        const isOnValidUserPage = currentPath.startsWith('/student') || currentPath.startsWith('/admin') || currentPath.startsWith('/attendance-taker');
        
        if (!initialLoad && !hasRedirected && !isOnValidUserPage) {
          if (isAdmin || attendanceTakerStatus.isAttendanceTaker) {
            router.push('/admin');
          } else {
            router.push('/student');
          }
          setHasRedirected(true);
        }
      } else {
        setUser(null);
        setAttendanceTakerInfo({ isAttendanceTaker: false });
        setHasRedirected(false);
        // Clear cookies
        document.cookie = 'token=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'isAdmin=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'isAttendanceTaker=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'clubName=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
        
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

  const value = {
    user,
    loading,
    isAdmin: user?.email === process.env.ADMIN_EMAIL,
    isAttendanceTaker: attendanceTakerInfo.isAttendanceTaker,
    clubName: attendanceTakerInfo.clubName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
