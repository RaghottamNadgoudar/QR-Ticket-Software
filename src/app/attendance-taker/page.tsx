'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth';
import { QrScanner } from '@/components/QrScanner';
import { markAttendance } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  name: string;
  clubName: string;
  currentBookings: number;
  maxLimit: number;
}

interface AttendanceRecord {
  bookingId: string;
  userId: string;
  eventId: string;
  attended: boolean;
  timestamp: Date;
}

export default function AttendanceTakerPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAttendanceTaker } = useAuth();
  const router = useRouter();

  // Protect the route
  useEffect(() => {
    if (!loading && !isAttendanceTaker) {
      router.push('/');
      toast.error('Access denied. Only attendance takers can access this page.');
    }
  }, [isAttendanceTaker, loading, router]);

  // Fetch club events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        // First get the attendance taker's club
        const takersRef = collection(db, 'attendanceTakers');
        const q = query(takersRef, where('email', '==', user.email));
        const takerSnapshot = await getDocs(q);
        
        if (takerSnapshot.empty) {
          toast.error('Attendance taker profile not found');
          return;
        }

        const takerData = takerSnapshot.docs[0].data();
        const clubName = takerData.clubName;

        // Then get all events for that club
        const eventsRef = collection(db, 'events');
        const eventsQuery = query(eventsRef, where('clubName', '==', clubName));
        const eventsSnapshot = await getDocs(eventsQuery);
        
        const fetchedEvents = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
        
        setEvents(fetchedEvents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  // Fetch attendance records for selected event
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedEvent) return;

      try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('eventId', '==', selectedEvent));
        const snapshot = await getDocs(q);
        
        const records = snapshot.docs.map(doc => ({
          bookingId: doc.id,
          ...doc.data()
        })) as AttendanceRecord[];

        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast.error('Failed to load attendance records');
      }
    };

    fetchAttendance();
  }, [selectedEvent]);

  const handleQRCodeScanned = async (scannedData: string) => {
    try {
      let bookingId;
      try {
        // Parse the QR code data
        const parsedData = JSON.parse(scannedData);
        bookingId = parsedData.bookingId;
        
        if (!bookingId) {
          throw new Error('Invalid QR code format');
        }
      } catch {
        toast.error('Invalid QR code');
        return;
      }

      // Get the booking document
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        toast.error('Invalid booking');
        return;
      }
      
      const bookingData = bookingDoc.data();
      
      // Verify event matches
      if (bookingData.eventId !== selectedEvent) {
        toast.error('This QR code is for a different event');
        return;
      }
      
      // Check if already marked
      if (bookingData.attended) {
        toast.error('Attendance already marked');
        return;
      }
      
      // Mark attendance
      await markAttendance(bookingId);
      toast.success('Attendance marked successfully!');
      
      // Update the local state
      setAttendanceRecords(prev => 
        prev.map(record => 
          record.bookingId === bookingId 
            ? { ...record, attended: true } 
            : record
        )
      );
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast.error('Failed to process QR code');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Event Attendance</h1>
        
        <div className="mt-4 md:mt-0">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full md:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.currentBookings}/{event.maxLimit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedEvent ? (
        <>
          <div className="mt-8">
            <div className="bg-white shadow overflow-hidden rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record.bookingId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          record.attended
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.attended ? 'Present' : 'Not Marked'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.timestamp
                          ? new Date(record.timestamp).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h2>
            <QrScanner onScan={handleQRCodeScanned} />
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Select an event to start marking attendance</p>
        </div>
      )}
    </div>
  );
}
