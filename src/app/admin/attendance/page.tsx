'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/store';
import { QrScanner } from '@/components/QrScanner';
import { markAttendance } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  userId: string;
  eventId: string;
  attended: boolean;
  timestamp: Date;
  attendanceTime?: Date;
}

interface AttendanceRecord {
  eventId: string;
  eventName: string;
  userId: string;
  attended: boolean;
  attendanceTime?: Date;
}

export default function AttendancePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const querySnapshot = await getDocs(eventsRef);
        const fetchedEvents = querySnapshot.docs.map(doc => ({
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
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedEvent) return;

      try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('eventId', '==', selectedEvent));
        const querySnapshot = await getDocs(q);
        
        const records = querySnapshot.docs.map(doc => {
          const data = doc.data() as Booking;
          const event = events.find(e => e.id === data.eventId);
          
          return {
            eventId: data.eventId,
            eventName: event?.name || 'Unknown Event',
            userId: data.userId,
            attended: data.attended,
            attendanceTime: data.timestamp,
          };
        });

        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast.error('Failed to load attendance records');
      }
    };

    fetchAttendance();
  }, [selectedEvent, events]);

  const handleQRCodeScanned = async (bookingId: string) => {
    try {
      // Check if the QR code belongs to the selected event
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        toast.error('Invalid QR code');
        return;
      }
      
      const bookingData = bookingDoc.data() as Booking;
      if (bookingData.eventId !== selectedEvent) {
        toast.error('This QR code is for a different event');
        return;
      }
      
      if (bookingData.attended) {
        toast.error('Attendance already marked for this booking');
        return;
      }
      
      await markAttendance(bookingId);
      toast.success('Attendance marked successfully!');
      
      // Refresh attendance records
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('eventId', '==', selectedEvent));
      const querySnapshot = await getDocs(q);
      
      const records = querySnapshot.docs.map(doc => {
        const data = doc.data() as Booking;
        const event = events.find(e => e.id === data.eventId);
        
        return {
          eventId: data.eventId,
          eventName: event?.name || 'Unknown Event',
          userId: data.userId,
          attended: data.attended,
          attendanceTime: data.attendanceTime || data.timestamp,
        };
      });

      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const exportToCSV = () => {
    const headers = ['Event ID', 'Event Name', 'User ID', 'Attended', 'Attendance Time'];
    const rows = attendanceRecords.map(record => [
      record.eventId,
      record.eventName,
      record.userId,
      record.attended ? 'Yes' : 'No',
      record.attendanceTime ? new Date(record.attendanceTime).toLocaleString() : ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `attendance-${selectedEvent}.csv`);
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            disabled={!selectedEvent}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Export to CSV
          </button>
        </div>
      </div>

      {selectedEvent && (
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.userId}>
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
                      {record.attendanceTime
                        ? new Date(record.attendanceTime).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h2>
            <QrScanner onScan={handleQRCodeScanned} />
          </div>
        </div>
      )}
    </div>
  );
}
