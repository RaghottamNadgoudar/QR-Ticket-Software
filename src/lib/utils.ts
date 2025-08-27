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
  let yPos = 30;

  // Add title
  pdf.setFontSize(16);
  pdf.text('Event Tickets', 20, 20);
  pdf.setFontSize(10);

  for (const booking of bookings) {
    const qrDataUrl = await generateQRCode(booking.id);
    
    // Add QR code
    pdf.addImage(qrDataUrl, 'PNG', 20, yPos, 40, 40);
    
    // Add event name with better formatting
    pdf.setFontSize(12);
    pdf.text(`Event: ${booking.eventName}`, 70, yPos + 15);
    
    // Add booking ID with word wrapping
    pdf.setFontSize(8);
    const bookingText = `Booking ID: ${booking.id}`;
    const splitBookingText = pdf.splitTextToSize(bookingText, 120);
    pdf.text(splitBookingText, 70, yPos + 25);
    
    // Add a separator line
    pdf.line(20, yPos + 45, 190, yPos + 45);
    
    yPos += 55;
    
    // Check if we need a new page
    if (yPos > 240) {
      pdf.addPage();
      yPos = 30;
      // Add title on new page
      pdf.setFontSize(16);
      pdf.text('Event Tickets (continued)', 20, 20);
      pdf.setFontSize(10);
    }
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
  } catch (error) {
  // Log FirebaseError details when permission issues occur
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e: any = error;
  console.error('Error creating event:', e.code ?? e.name, e.message ?? e);
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
