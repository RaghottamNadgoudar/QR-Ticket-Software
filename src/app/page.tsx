'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async (user: any) => {
      if (!user) return;

      if (user.email === process.env.ADMIN_EMAIL) {
        router.push('/admin');
        return;
      }

      // Check if user is an attendance taker
      const takersRef = collection(db, 'attendanceTakers');
      const q = query(takersRef, where('email', '==', user.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        router.push('/attendance-taker');
      } else {
        router.push('/student');
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkUserRole(user);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      
      // Check if email domain is allowed for non-admin users
      if (email !== adminEmail && 
          !email.endsWith(`@${process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN}`)) {
        toast.error(`Only ${process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
        setLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.email === process.env.ADMIN_EMAIL) {
        router.push('/admin');
        return;
      }

      // Check if user is an attendance taker
      const takersRef = collection(db, 'attendanceTakers');
      const q = query(takersRef, where('email', '==', user.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        router.push('/attendance-taker');
      } else {
        router.push('/student');
      }

      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          <Link href="/register" className="text-sm text-blue-600 hover:text-blue-500">
            New student? Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
