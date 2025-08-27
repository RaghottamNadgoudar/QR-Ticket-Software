'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface AttendanceTaker {
  id: string;
  email: string;
  name: string;
  clubName: string;
  createdAt: Date;
}

export default function AttendanceTakersPage() {
  const [attendanceTakers, setAttendanceTakers] = useState<AttendanceTaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaker, setNewTaker] = useState({
    email: '',
    password: '',
    name: '',
    clubName: '',
  });

  useEffect(() => {
    fetchAttendanceTakers();
  }, []);

  const fetchAttendanceTakers = async () => {
    try {
      const takersRef = collection(db, 'attendanceTakers');
      const snapshot = await getDocs(takersRef);
      const takers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceTaker[];
      
      setAttendanceTakers(takers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance takers:', error);
      toast.error('Failed to load attendance takers');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newTaker.email,
        newTaker.password
      );

      // Create attendance taker record
      await addDoc(collection(db, 'attendanceTakers'), {
        uid: userCredential.user.uid,
        email: newTaker.email,
        name: newTaker.name,
        clubName: newTaker.clubName,
        createdAt: serverTimestamp(),
      });

      setIsModalOpen(false);
      setNewTaker({ email: '', password: '', name: '', clubName: '' });
      toast.success('Attendance taker created successfully');
      fetchAttendanceTakers();
    } catch (error: any) {
      console.error('Error creating attendance taker:', error);
      toast.error(error.message || 'Failed to create attendance taker');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance taker?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'attendanceTakers', id));
      toast.success('Attendance taker deleted');
      fetchAttendanceTakers();
    } catch (error) {
      console.error('Error deleting attendance taker:', error);
      toast.error('Failed to delete attendance taker');
    }
  };

  if (loading && attendanceTakers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          <p className="text-gray-600 font-orbitron">Loading attendance takers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-orbitron">Attendance Takers</h1>
              <p className="mt-1 text-sm text-gray-600">Manage club attendance takers and their permissions</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors font-orbitron"
              style={{ backgroundColor: '#ED5E4A', borderColor: '#ED5E4A' }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Taker
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {attendanceTakers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.121M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 font-orbitron">No attendance takers found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new attendance taker.</p>
              <div className="mt-6">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors font-orbitron"
                  style={{ backgroundColor: '#ED5E4A', borderColor: '#ED5E4A' }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Taker
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 font-orbitron">
                      Name
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 font-orbitron">
                      Email
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 font-orbitron">
                      Club
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 font-orbitron">
                      Created
                    </th>
                    <th className="relative py-3.5 pl-3 pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {attendanceTakers.map((taker) => (
                    <tr key={taker.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">
                        {taker.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                        {taker.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                        {taker.clubName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                        {new Date(taker.createdAt).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(taker.id)}
                          className="text-red-600 hover:text-red-800 transition-colors font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-6 py-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 font-orbitron">Add New Attendance Taker</h3>
                <p className="mt-1 text-sm text-gray-600">Create login credentials for a new club attendance taker</p>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-orbitron mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={newTaker.name}
                    onChange={(e) => setNewTaker({ ...newTaker, name: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-orbitron mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={newTaker.email}
                    onChange={(e) => setNewTaker({ ...newTaker, email: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-orbitron mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={newTaker.password}
                    onChange={(e) => setNewTaker({ ...newTaker, password: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                    placeholder="Enter secure password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-orbitron mb-2">Club Name</label>
                  <input
                    type="text"
                    required
                    value={newTaker.clubName}
                    onChange={(e) => setNewTaker({ ...newTaker, clubName: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                    placeholder="Enter club name"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="inline-flex justify-center w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors font-orbitron"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center items-center w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-orbitron"
                    style={{ backgroundColor: loading ? '#9CA3AF' : '#ED5E4A', borderColor: loading ? '#9CA3AF' : '#ED5E4A' }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
