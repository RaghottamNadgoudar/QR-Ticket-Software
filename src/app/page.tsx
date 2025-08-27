'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // One-time check on mount to redirect if already signed in.
    const user = auth.currentUser;
    if (user?.email) {
      const target = user.email === process.env.ADMIN_EMAIL ? '/admin' : '/student';
      router.replace(target);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      
      // Debug logs
      console.log('Login Debug:', {
        attemptEmail: email,
        adminEmail,
        isAdminAttempt: email === adminEmail,
        allowedDomain: process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN
      });
      
      // Check if email domain is allowed for non-admin users
      if (email !== adminEmail && 
          !email.endsWith(`@${process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN}`)) {
        toast.error(`Only ${process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
        setLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Ensure Firebase session is fully ready before navigating
      try {
        await user.reload();
        await user.getIdToken(true);
      } catch {}
      const target = user.email === process.env.ADMIN_EMAIL ? '/admin' : '/student';
      router.replace(target);
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-12 sm:px-6 lg:px-8">
      {/* Corner Logos */}
      <div className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-6">
        <Image
          src="/RVCE%20Corner%20Logo%20BLACK-2%20line.png"
          alt="RVCE logo"
          width={320}
          height={96}
          className="h-16 w-auto sm:h-20"
          priority
        />
      </div>
      <div className="pointer-events-none absolute right-4 top-4 sm:right-6 sm:top-6">
        <Image
          src="/CCLogo_BG_Removed-Black.png"
          alt="CC logo"
          width={320}
          height={96}
          className="h-16 w-auto sm:h-20"
          priority
        />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </h2>
          <p className="mt-2 text-sm text-orange-100">Sign in to access your account</p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-orange-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
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
                  className="relative block w-full rounded-md border-0 bg-orange-50/50 px-4 py-2.5 text-left text-gray-900 placeholder:text-gray-400 ring-1 ring-inset ring-orange-200 focus:z-10 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm [&::placeholder]:text-center"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
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
                  className="relative block w-full rounded-md border-0 bg-orange-50/50 px-4 py-2.5 text-left text-gray-900 placeholder:text-gray-400 ring-1 ring-inset ring-orange-200 focus:z-10 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm [&::placeholder]:text-center"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center">
          <Link href="/register" className="text-sm text-orange-100 underline underline-offset-4 hover:text-white">
            New student? Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
