"use client";

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const { user, isAdmin, isAttendanceTaker } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <span className="sr-only">Open user menu</span>
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">S</span>
          </div>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-2 text-xs text-gray-500 border-b">
            Signed in as<br />
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>

          {isAdmin && (
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/admin"
                  className={`block px-4 py-2 text-sm text-gray-700 w-full text-left ${
                    active ? 'bg-gray-100' : ''
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}
            </Menu.Item>
          )}

          {isAttendanceTaker && (
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/attendance-taker"
                  className={`block px-4 py-2 text-sm text-gray-700 w-full text-left ${
                    active ? 'bg-gray-100' : ''
                  }`}
                >
                  Take Attendance
                </Link>
              )}
            </Menu.Item>
          )}

          {!isAdmin && !isAttendanceTaker && (
            <>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/student"
                    className={`block px-4 py-2 text-sm text-gray-700 w-full text-left ${
                      active ? 'bg-gray-100' : ''
                    }`}
                  >
                    Book Events
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/student/bookings"
                    className={`block px-4 py-2 text-sm text-gray-700 w-full text-left ${
                      active ? 'bg-gray-100' : ''
                    }`}
                  >
                    My Bookings
                  </Link>
                )}
              </Menu.Item>
            </>
          )}

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleSignOut}
                className={`block px-4 py-2 text-sm text-gray-700 w-full text-left border-t ${
                  active ? 'bg-gray-100' : ''
                }`}
              >
                Sign out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
