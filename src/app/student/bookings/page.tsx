'use client';

import { useEffect, useState } from 'react';
import { getStudentBookings, generatePDF } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { Booking } from '@/lib/store';

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userBookings = await getStudentBookings(user.uid);
          setBookings(userBookings);
        } catch (error) {
          console.error('Error fetching bookings:', error);
          toast.error('Failed to load your bookings');
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      const blob = await generatePDF(bookings);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'event-qr-codes.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        {bookings.length > 0 && (
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Download QR Codes
          </button>
        )}
      </div>
      
      {bookings.length === 0 ? (
        <p className="text-gray-600">You haven&apos;t booked any events yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-lg mb-2">{booking.eventName}</h3>
              <img
                src={booking.qrCode}
                alt="Event QR Code"
                className="mx-auto mb-4"
                width={200}
                height={200}
              />
              <div className="text-sm text-gray-600">
                <p>Booking ID: {booking.id}</p>
                <p>Status: {booking.attended ? 'Attended' : 'Not attended'}</p>
                {booking.attendanceTime && (
                  <p>
                    Attendance Time:{' '}
                    {new Date(booking.attendanceTime).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
