import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { DbUser } from '@/types/database';

export const createUserProfile = async (
  userId: string,
  data: {
    email: string;
    name: string;
    department?: string;
    studentId?: string;
  }
) => {
  try {
    const userRef = doc(db, 'users', userId);
      // Build payload and remove undefined fields because Firestore rejects undefined values
      const userData: Partial<DbUser> = {
        id: userId,
        email: data.email,
        name: data.name,
        // serverTimestamp returns a sentinel that resolves to a Timestamp on the server.
        // Cast to unknown then Date to satisfy the DbUser shape for now.
        createdAt: serverTimestamp() as unknown as Date,
        lastLoginAt: serverTimestamp() as unknown as Date,
      };

      if (data.department !== undefined) userData.department = data.department;
      if (data.studentId !== undefined) userData.studentId = data.studentId;

      await setDoc(userRef, userData as DbUser);
    return userData;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as DbUser;
    } else {
      throw new Error('User profile not found');
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<Omit<DbUser, 'id' | 'email' | 'createdAt'>>
) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      lastLoginAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const isAttendanceTaker = async (userEmail: string): Promise<{ isAttendanceTaker: boolean; clubName?: string }> => {
  try {
    const attendanceTakersRef = collection(db, 'attendanceTakers');
    const q = query(attendanceTakersRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const takerData = querySnapshot.docs[0].data();
      return {
        isAttendanceTaker: true,
        clubName: takerData.clubName
      };
    }
    
    return { isAttendanceTaker: false };
  } catch (error) {
    console.error('Error checking attendance taker status:', error);
    return { isAttendanceTaker: false };
  }
};
