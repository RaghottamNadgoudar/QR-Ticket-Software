'use client';

import { useAuth } from '@/contexts/auth';
import { useRouter } from 'next/navigation';

export default function AttendanceTakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAttendanceTaker, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAttendanceTaker) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
