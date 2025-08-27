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
  let yPos = 40;

  // Set font to a more modern/tech-like font
  pdf.setFont('helvetica', 'bold');
  
  // Add title with larger font and orange color
  pdf.setFontSize(24);
  pdf.setTextColor(237, 94, 74); // Orange color (#ED5E4A)
  pdf.text('EVENT TICKETS', 20, 25);
  
  for (const booking of bookings) {
    const qrDataUrl = await generateQRCode(booking.id);
    
    // Add QR code (slightly larger)
    pdf.addImage(qrDataUrl, 'PNG', 20, yPos, 50, 50);
    
    // Add event name with bigger, bold formatting and orange color
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(237, 94, 74); // Orange color (#ED5E4A)
    pdf.text(`EVENT: ${booking.eventName.toUpperCase()}`, 80, yPos + 20);
    
    // Add booking ID with medium size and orange color
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(237, 94, 74); // Orange color (#ED5E4A)
    const bookingText = `Booking ID: ${booking.id}`;
    const splitBookingText = pdf.splitTextToSize(bookingText, 110);
    pdf.text(splitBookingText, 80, yPos + 35);
    
    // Add a thicker separator line (keep line in default black)
    pdf.setDrawColor(0, 0, 0); // Black color for lines
    pdf.setLineWidth(0.5);
    pdf.line(20, yPos + 55, 190, yPos + 55);
    
    yPos += 70;
    
    // Check if we need a new page
    if (yPos > 220) {
      pdf.addPage();
      yPos = 40;
      // Add title on new page with orange color
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.setTextColor(237, 94, 74); // Orange color (#ED5E4A)
      pdf.text('EVENT TICKETS (CONTINUED)', 20, 25);
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
