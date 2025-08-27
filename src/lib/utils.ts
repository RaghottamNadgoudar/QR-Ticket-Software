import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Event, Booking } from './store';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data);
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};

export const generatePDF = async (bookings: Booking[]): Promise<Blob> => {
  const pdf = new jsPDF();
  // 2x2 grid per page
  const perPage = 4;
  const marginX = 20;
  const marginY = 30;
  const gapX = 20;
  const gapY = 20;
  const qrSize = 70;

  pdf.setFont('helvetica', 'bold');

  for (let i = 0; i < bookings.length; i++) {
    const pageIndex = Math.floor(i / perPage);
    const indexOnPage = i % perPage;

    if (indexOnPage === 0 && i !== 0) {
      pdf.addPage();
    }

    // Add page title
    pdf.setFontSize(20);
    pdf.setTextColor(237, 94, 74);
    pdf.text('EVENT TICKETS', marginX, 20 + pageIndex * 0);

    const col = indexOnPage % 2;
    const row = Math.floor(indexOnPage / 2);

    const x = marginX + col * (qrSize + gapX + 60);
    const y = marginY + row * (qrSize + gapY + 40);

    const booking = bookings[i];
    const qrDataUrl = await generateQRCode(booking.id);

    // Add QR code
    pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);

    // Event name
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(237, 94, 74);
    pdf.text(`EVENT: ${booking.eventName}`, x + qrSize + 8, y + 18);

    // Booking ID
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    const bookingText = `Booking ID: ${booking.id}`;
    const splitBookingText = pdf.splitTextToSize(bookingText, 80);
    pdf.text(splitBookingText, x + qrSize + 8, y + 34);
  }

  return pdf.output('blob');
};

export const createEvent = async (eventData: Omit<Event, 'id' | 'currentBookings'>) => {
  try {
    const eventsRef = collection(db, 'events');
    const docRef = await addDoc(eventsRef, {
      ...eventData,
      currentBookings: 0,
    }); 
    return docRef.id;
  } catch (error: unknown) {
    // Log FirebaseError details when permission issues occur
    if (error instanceof Error) {
      const eAny = error as unknown as { code?: string };
      console.error('Error creating event:', eAny.code ?? error.name, error.message ?? String(error));
    } else {
      console.error('Error creating event:', String(error));
    }
    throw error;
  }
};

export const createBooking = async (userId: string, events: Event[]) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const bookings: Booking[] = [];

    for (const event of events) {
      // Create a deterministic document ID using userId and eventId
      const bookingId = `${userId}_${event.id}`;
      const bookingRef = doc(bookingsRef, bookingId);

      // Check if booking already exists
      const existingBooking = await getDoc(bookingRef);
      if (existingBooking.exists()) {
        throw new Error(`You have already booked event: ${event.name}`);
      }

      const bookingData = {
        userId,
        eventId: event.id,
        eventName: event.name,
        attended: false,
        timestamp: serverTimestamp(),
      };

      const qrCode = await generateQRCode(bookingId);

      await setDoc(bookingRef, {
        ...bookingData,
        qrCode,
      });

      bookings.push({
        id: bookingId,
        ...bookingData,
        qrCode,
        timestamp: new Date(), // Convert serverTimestamp to Date for local use
      });

      // Update event currentBookings while preserving other fields
      const eventRef = doc(db, 'events', event.id);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        // Create a new document with all existing fields plus updated currentBookings
        await setDoc(eventRef, {
          ...eventData,
          currentBookings: (eventData.currentBookings || 0) + 1
        });
      }
    }

    return bookings;
  } catch (error) {
    console.error('Error creating bookings:', error);
    throw error;
  }
};

export const markAttendance = async (bookingId: string) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      attended: true,
      attendanceTime: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

export const getStudentBookings = async (userId: string) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];
  } catch (error) {
    console.error('Error getting student bookings:', error);
    throw error;
  }
};
