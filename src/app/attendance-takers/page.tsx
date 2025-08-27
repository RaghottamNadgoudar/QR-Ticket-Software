'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/store';
import { QrScanner } from '@/components/QrScanner';
import { markAttendance } from '@/lib/utils';
import { getUserProfile } from '@/lib/users';
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
  username: string;
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
        
        const records = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data() as Booking;
            const event = events.find(e => e.id === data.eventId);
            
            // Fetch username from users collection
            let username = 'Unknown User';
            try {
              const userProfile = await getUserProfile(data.userId);
              username = userProfile.name;
            } catch (error) {
              console.error('Error fetching user profile for', data.userId, error);
            }
            
            return {
              eventId: data.eventId,
              eventName: event?.name || 'Unknown Event',
              userId: data.userId,
              username,
              attended: data.attended,
              attendanceTime: data.timestamp,
            };
          })
        );

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
      
      const records = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data() as Booking;
          const event = events.find(e => e.id === data.eventId);
          
          // Fetch username from users collection
          let username = 'Unknown User';
          try {
            const userProfile = await getUserProfile(data.userId);
            username = userProfile.name;
          } catch (error) {
            console.error('Error fetching user profile for', data.userId, error);
          }
          
          return {
            eventId: data.eventId,
            eventName: event?.name || 'Unknown Event',
            userId: data.userId,
            username,
            attended: data.attended,
            attendanceTime: data.attendanceTime || data.timestamp,
          };
        })
      );

      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const exportToCSV = () => {
    const headers = ['Event ID', 'Event Name', 'User ID', 'Username', 'Attended', 'Attendance Time'];
    const rows = attendanceRecords.map(record => [
      record.eventId,
      record.eventName,
      record.userId,
      record.username,
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

  const exportAllEventsToSegmentedCSV = async () => {
    if (events.length === 0) {
      toast.error('No events available to export');
      return;
    }

    try {
      const csvRows: string[] = [];
      
      // Add header
      csvRows.push('ATTENDANCE REPORT - ALL EVENTS');
      csvRows.push(`Generated on: ${new Date().toLocaleString()}`);
      csvRows.push(''); // Empty row for spacing
      
      let totalBookings = 0;
      let totalPresent = 0;

      // Process each event
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        
        // Add event header
        csvRows.push(`EVENT ${i + 1}: ${event.name.toUpperCase()}`);
        csvRows.push(`Venue: ${event.venue || 'N/A'}`);
        csvRows.push(`Club: ${event.clubName || 'N/A'}`);
        csvRows.push(`Max Limit: ${event.maxLimit || 'N/A'}`);
        csvRows.push(''); // Empty row
        
        // Fetch attendance records for this event
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, where('eventId', '==', event.id));
        const querySnapshot = await getDocs(q);
        
        const eventRecords = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data() as Booking;
            
            // Fetch username from users collection
            let username = 'Unknown User';
            try {
              const userProfile = await getUserProfile(data.userId);
              username = userProfile.name;
            } catch (error) {
              console.error('Error fetching user profile for', data.userId, error);
            }
            
            return {
              eventId: data.eventId,
              eventName: event.name,
              userId: data.userId,
              username,
              attended: data.attended,
              attendanceTime: data.attendanceTime || data.timestamp,
            };
          })
        );

        // Add attendance table headers
        csvRows.push('User ID,Username,Status,Attendance Time');
        
        // Add attendance records
        eventRecords.forEach(record => {
          const attendanceTimeStr = record.attendanceTime 
            ? new Date(record.attendanceTime).toLocaleString() 
            : '-';
          csvRows.push(`${record.userId},${record.username},${record.attended ? 'Present' : 'Absent'},${attendanceTimeStr}`);
        });
        
        // Calculate and add event statistics
        const eventBookings = eventRecords.length;
        const eventPresent = eventRecords.filter(r => r.attended).length;
        const eventAbsent = eventBookings - eventPresent;
        const attendanceRate = eventBookings > 0 ? ((eventPresent / eventBookings) * 100).toFixed(1) : '0';
        
        csvRows.push(''); // Empty row
        csvRows.push('EVENT STATISTICS:');
        csvRows.push(`Total Bookings: ${eventBookings}`);
        csvRows.push(`Present: ${eventPresent}`);
        csvRows.push(`Absent: ${eventAbsent}`);
        csvRows.push(`Attendance Rate: ${attendanceRate}%`);
        
        // Add separator between events (except for last event)
        if (i < events.length - 1) {
          csvRows.push('');
          csvRows.push('========================================');
          csvRows.push('');
        }
        
        totalBookings += eventBookings;
        totalPresent += eventPresent;
      }
      
      // Add overall summary at the end
      csvRows.push('');
      csvRows.push('========================================');
      csvRows.push('OVERALL SUMMARY');
      csvRows.push('========================================');
      csvRows.push(`Total Events: ${events.length}`);
      csvRows.push(`Total Bookings: ${totalBookings}`);
      csvRows.push(`Total Present: ${totalPresent}`);
      csvRows.push(`Total Absent: ${totalBookings - totalPresent}`);
      csvRows.push(`Overall Attendance Rate: ${totalBookings > 0 ? ((totalPresent / totalBookings) * 100).toFixed(1) : '0'}%`);

      // Create and download CSV
      const csv = csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `segmented-attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
      a.click();
      
      toast.success(`Exported segmented report for ${events.length} events!`);
    } catch (error) {
      console.error('Error exporting segmented CSV:', error);
      toast.error('Failed to export segmented CSV file');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-gray-600 font-orbitron">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-orbitron">Attendance Management</h1>
              <p className="mt-1 text-sm text-gray-600">Track and manage event attendance with QR code scanning</p>
            </div>
            
            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-full sm:w-auto sm:min-w-[240px]">
                <label htmlFor="event-select" className="block text-sm font-medium text-gray-700 font-orbitron mb-2">
                  Select Event
                </label>
                <div className="relative">
                  <select
                    id="event-select"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-900 shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 cursor-pointer"
                  >
                    <option value="">Choose an event...</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-6">
                <button
                  onClick={exportToCSV}
                  disabled={!selectedEvent}
                  className="inline-flex items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-orbitron"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Event
                </button>

                <button
                  onClick={exportAllEventsToSegmentedCSV}
                  disabled={events.length === 0}
                  className="inline-flex items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-orbitron"
                  style={{ backgroundColor: '#ED5E4A', borderColor: '#ED5E4A' }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedEvent ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 font-orbitron">Select an Event</h3>
            <p className="mt-1 text-sm text-gray-500">Choose an event from the dropdown to view attendance records and scan QR codes.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Attendance Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 font-orbitron">
                  Attendance Records
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {attendanceRecords.length} total bookings for this event
                </p>
              </div>

              {attendanceRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.121M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 font-orbitron">No bookings found</h3>
                  <p className="mt-1 text-sm text-gray-500">There are no bookings for this event yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-orbitron">
                          User ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-orbitron">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-orbitron">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-orbitron">
                          Attendance Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceRecords.map((record) => (
                        <tr key={record.userId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.userId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.username}
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
              )}
            </div>

            {/* QR Scanner Section */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 font-orbitron">QR Code Scanner</h2>
                <p className="mt-1 text-sm text-gray-600">Scan student QR codes to mark attendance</p>
              </div>
              <div className="px-6 py-6">
                <QrScanner onScan={handleQRCodeScanned} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
