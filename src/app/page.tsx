'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DotGrid from '@/components/DotGrid';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // router intentionally unused here; AuthProvider handles redirects

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) return;
    
    setLoading(true);

    try {
      // Just sign in - let the AuthProvider handle the redirect
      await signInWithEmailAndPassword(auth, email, password);
      
    } catch (error: unknown) {
      console.error('Error signing in:', error);
      if (error instanceof Error) {
        // firebase error objects have code property but TypeScript can't rely on it
        const errAny = error as unknown as { code?: string };
        if (errAny.code === 'auth/user-not-found' || errAny.code === 'auth/wrong-password') {
          toast.error('Invalid email or password');
        } else if (errAny.code === 'auth/invalid-email') {
          toast.error('Please enter a valid email address');
        } else if (errAny.code === 'auth/too-many-requests') {
          toast.error('Too many failed attempts. Please try again later.');
        } else {
          toast.error('Sign in failed. Please try again.');
        }
      } else {
        toast.error('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#F8FAFC' }}>
      {/* DotGrid Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
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
      
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md space-y-8 bg-white/95 backdrop-blur-sm rounded-2xl p-10 shadow-xl border border-gray-200">
        {/* Logos Section */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <img 
            src="/RVCE_Logo_Black_Text-1-line.png" 
            alt="RVCE Logo" 
            className="h-16 w-auto object-contain"
          />
          <img 
            src="/CCLogo_BG_Removed-Black.png" 
            alt="CC Logo" 
            className="h-16 w-auto object-contain"
          />
        </div>
        
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 font-orbitron">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600 font-orbitron">
            Sign in to access your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
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
                className="relative block w-full rounded-md border-0 px-4 py-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 bg-white/70 font-orbitron"
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
                className="relative block w-full rounded-md border-0 px-4 py-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 bg-white/70 font-orbitron"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-orange-600 px-4 py-4 text-sm font-semibold text-white hover:bg-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 font-orbitron transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
          <Link href="/register" className="text-sm text-orange-600 hover:text-brand-primary font-medium font-orbitron">
            New student? Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
