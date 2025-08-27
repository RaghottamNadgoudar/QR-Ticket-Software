'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createUserProfile } from '@/lib/users';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import DotGrid from '@/components/DotGrid';
import Image from 'next/image';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (!email.endsWith(`@${process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN}`)) {
        toast.error(`Only ${process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        await user.getIdToken(true);
      } catch (tokenErr) {
        console.warn('Could not refresh ID token after signup:', tokenErr);
      }

      const name = (user.email || '').split('@')[0];
      try {
        await createUserProfile(user.uid, { email: user.email || email, name });
      } catch (profileErr: any) {
        console.error('Failed to create user profile:', profileErr);
        toast.error(profileErr.message || 'Registration succeeded but failed to create profile.');
        setLoading(false);
        return;
      }

      toast.success('Registration successful!');
      router.push('/student');
    } catch (error: any) {
      console.error('Error registering:', error);
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-500 to-orange-600">
      {/* Background Option 1: DotGrid */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={8}
          gap={25}
          baseColor="#CBD5E1"
          activeColor="#F97316"
          proximity={120}
          shockRadius={200}
          shockStrength={3}
          resistance={800}
          returnDuration={1.2}
        />
      </div>

      {/* Corner Logos (Option 2) */}
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

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md space-y-8 bg-white/95 backdrop-blur-sm rounded-2xl p-10 shadow-xl border border-gray-200">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 font-orbitron">
            Register for {process.env.NEXT_PUBLIC_APP_NAME}
          </h2>
          <p className="mt-3 text-sm text-gray-600 font-orbitron">
            Create your student account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-md border-0 px-4 py-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 bg-white/70 font-orbitron"
                placeholder="College Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-md border-0 px-4 py-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 bg-white/70 font-orbitron"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="relative block w-full rounded-md border-0 px-4 py-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 bg-white/70 font-orbitron"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-orange-600 px-4 py-4 text-sm font-semibold text-white hover:bg-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 font-orbitron transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-orange-600 hover:text-brand-primary font-medium font-orbitron">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
