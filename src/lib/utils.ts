import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  setDoc, 
  serverTimestamp, 
  getDoc, 
  runTransaction, 
  Transaction,
  DocumentReference,
  DocumentData
} from 'firebase/firestore';
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
  let yPos = 20;

  for (const booking of bookings) {
    const qrDataUrl = await generateQRCode(booking.id);
    
    pdf.addImage(qrDataUrl, 'PNG', 20, yPos, 50, 50);
    pdf.text(`Event ID: ${booking.eventId}`, 80, yPos + 20);
    pdf.text(`Booking ID: ${booking.id}`, 80, yPos + 30);
    
    yPos += 60;
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
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

export const createBooking = async (userId: string, events: Event[]): Promise<Booking[]> => {
  const bookings: Booking[] = [];
  
  try {
    await runTransaction(db, async (transaction: Transaction) => {
      for (const event of events) {
        if (!event.id || !event.name) {
          throw new Error('Invalid event data');
        }
        const bookingId = `${userId}_${event.id}`;
        const bookingRef = doc(db, 'bookings', bookingId);
        const eventRef = doc(db, 'events', event.id);

        // Check event exists and has capacity within transaction
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) {
          throw new Error(`Event ${event.name} no longer exists`);
        }

        const eventData = eventDoc.data();
        if (!eventData) {
          throw new Error(`Invalid event data for ${event.name}`);
        }

        // Check capacity
        const currentBookings = eventData.currentBookings || 0;
        if (currentBookings >= eventData.maxLimit) {
          throw new Error(`Event ${event.name} has reached its maximum capacity`);
        }

        // Check for existing booking
        const existingBooking = await transaction.get(bookingRef);
        if (existingBooking.exists()) {
          throw new Error(`You have already booked event: ${event.name}`);
        }

        // Generate QR code with encrypted data
        const qrCodeData = {
          bookingId,
          userId,
          eventId: event.id,
          timestamp: Date.now()
        };
        const qrCode = await generateQRCode(JSON.stringify(qrCodeData));

        const bookingData = {
          userId,
          eventId: event.id,
          eventName: event.name,
          attended: false,
          timestamp: serverTimestamp(),
          qrCode,
          maxLimit: eventData.maxLimit,
          currentBookings: currentBookings + 1
        };

        // Update both documents atomically
        transaction.set(bookingRef, bookingData);
        transaction.update(eventRef, {
          currentBookings: currentBookings + 1
        });

        bookings.push({
          id: bookingId,
          ...bookingData,
          timestamp: new Date(),
        } as Booking);
      }
    });

    return bookings;
  } catch (error) {
    console.error('Error creating bookings:', error);
    throw error;
  }

      for (const event of events) {
        // Create a deterministic document ID using userId and eventId
        const bookingId = `${userId}_${event.id}`;
        const bookingRef = doc(bookingsRef, bookingId);
        const eventRef = doc(db, 'events', event.id);

        // Get the latest event data within the transaction
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) {
          throw new Error(`Event ${event.name} no longer exists`);
        }

        const currentEvent = { id: eventDoc.id, ...eventDoc.data() } as Event;
        if (currentEvent.currentBookings >= currentEvent.maxLimit) {
          throw new Error(`Event ${event.name} has reached its maximum capacity`);
        }

        // Check if booking already exists within the transaction
        const existingBooking = await transaction.get(bookingRef);
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

        // Set booking data within transaction
        transaction.set(bookingRef, {
          ...bookingData,
          qrCode,
        });

        // Update event capacity within transaction
        transaction.update(eventRef, {
          currentBookings: currentEvent.currentBookings + 1
        });

        bookings.push({
          id: bookingId,
          ...bookingData,
          qrCode,
          timestamp: new Date(),
        });
      }
    });

    return bookings;
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
