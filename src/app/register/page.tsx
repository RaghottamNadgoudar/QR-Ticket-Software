     'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createUserProfile } from '@/lib/users';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
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
      // Validate password match
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      // Validate email domain
      if (!email.endsWith(`@${process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN}`)) {
        toast.error(`Only ${process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
        return;
      }

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Ensure the ID token is available for Firestore rules evaluation
      try {
        await user.getIdToken(true);
      } catch (tokenErr) {
        console.warn('Could not refresh ID token after signup:', tokenErr);
      }

      // Create user profile in Firestore (name derived from email local-part)
      const name = (user.email || '').split('@')[0];
      try {
        await createUserProfile(user.uid, { email: user.email || email, name });
      } catch (profileErr: any) {
        console.error('Failed to create user profile:', profileErr);
        // Surface Firestore error to the user
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
            Register for {process.env.NEXT_PUBLIC_APP_NAME}
          </h2>
          <p className="mt-2 text-sm text-orange-100">Create your student account</p>
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
                  placeholder="College Email address"
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full rounded-md border-0 bg-orange-50/50 px-4 py-2.5 text-left text-gray-900 placeholder:text-gray-400 ring-1 ring-inset ring-orange-200 focus:z-10 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm [&::placeholder]:text-center"
                  placeholder="Password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="relative block w-full rounded-md border-0 bg-orange-50/50 px-4 py-2.5 text-left text-gray-900 placeholder:text-gray-400 ring-1 ring-inset ring-orange-200 focus:z-10 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm [&::placeholder]:text-center"
                  placeholder="Confirm Password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-60"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-orange-100 underline underline-offset-4 hover:text-white">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
