 'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createUserProfile } from '@/lib/users';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import DotGrid from '@/components/DotGrid';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const departments = [
    'Artificial Intelligence and Machine Learning',
    'Computer Science & Engineering',
    'Computer Science & Engineering (Data Science)',
    'Computer Science & Engineering (Cyber Security)',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Electronics & Telecommunication Engineering',
    'Mechanical Engineering',
    'Aerospace Engineering',
    'Chemical Engineering',
    'Civil Engineering',
    'Biotechnology',
    'Industrial Engineering & Management',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password match
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
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
      try {
        await createUserProfile(user.uid, { email: user.email || email, name, department });
      } catch (profileErr: unknown) {
        console.error('Failed to create user profile:', profileErr);
        const message = profileErr instanceof Error ? profileErr.message : String(profileErr);
        // Surface Firestore error to the user
        toast.error(message || 'Registration succeeded but failed to create profile.');
        setLoading(false);
        return;
      }

      toast.success('Registration successful!');
      router.push('/student');
    } catch (error: unknown) {
      console.error('Error registering:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || 'Failed to register');
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
            Register for {process.env.NEXT_PUBLIC_APP_NAME}
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600 font-orbitron">
            Create your student account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="relative block w-full rounded-md border-0 px-4 py-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 bg-white/70 font-orbitron"
                placeholder="Full Name"
              />
            </div>
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
                placeholder="College Email address"
              />
            </div>
            <div>
              <label htmlFor="department" className="sr-only">
                Department
              </label>
              <select
                id="department"
                name="department"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="relative block w-full rounded-md border-0 px-4 py-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 bg-white/70 font-orbitron"
              >
                <option value="" disabled>
                  Select your department
                </option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
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
                className="relative block w-full rounded-md border-0 px-4 py-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 bg-white/70 font-orbitron"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
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
