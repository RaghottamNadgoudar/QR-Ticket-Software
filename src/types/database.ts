export interface DbEvent {
  id: string;
  name: string;
  venue: string;
  clubName: string;
  eventSlot: number;
  maxLimit: number;
  description?: string;
  currentBookings: number;
}

export interface DbBooking {
  id: string;
  userId: string;
  eventId: string;
  eventName: string;
  attended: boolean;
  timestamp: Date;
  qrCode: string;
  attendanceTime?: Date;
}

export interface DbUser {
  id: string;
  email: string;
  name: string;
  department?: string;
  studentId?: string;
  createdAt: Date;
  lastLoginAt: Date;
}
