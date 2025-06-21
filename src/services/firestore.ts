import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Patient, Appointment, EmergencyReschedule } from '../types';

// Patients
export const addPatient = async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
  const docRef = await addDoc(collection(db, 'patients'), {
    ...patientData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return { ...patientData, id: docRef.id } as Patient;
};

export const getPatients = async (): Promise<Patient[]> => {
  const querySnapshot = await getDocs(collection(db, 'patients'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Patient));
};

export const updatePatient = async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
  const docRef = doc(db, 'patients', id);
  await updateDoc(docRef, {
    ...patientData,
    updatedAt: new Date().toISOString()
  });
  const updatedDoc = await getDoc(docRef);
  return { id, ...updatedDoc.data() } as Patient;
};

export const deletePatient = async (id: string) => {
  await deleteDoc(doc(db, 'patients', id));
};

// Appointments
export const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
  // Ensure the date is stored as a string in YYYY-MM-DD format
  const appointmentData = {
    ...appointment,
    date: appointment.date.split('T')[0], // Ensure we only store the date part
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
  return docRef.id;
};

export const getAppointments = async (): Promise<Appointment[]> => {
  const querySnapshot = await getDocs(
    query(collection(db, 'appointments'), orderBy('date', 'asc'))
  );
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      procedurePrice: data.procedurePrice ?? data.price ?? 0,
      // Ensure dates are properly formatted when retrieved
      date: data.date.split('T')[0],
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    } as Appointment;
  });
};

export const updateAppointment = async (id: string, data: Partial<Appointment>) => {
  const updateData = {
    ...data,
    // If date is being updated, ensure it's in the correct format
    ...(data.date && { date: data.date.split('T')[0] }),
    updatedAt: new Date().toISOString()
  };
  await updateDoc(doc(db, 'appointments', id), updateData);
};

export const deleteAppointment = async (id: string) => {
  await deleteDoc(doc(db, 'appointments', id));
};

export const getAppointmentsByStatus = async (status: string): Promise<Appointment[]> => {
  const q = query(collection(db, 'appointments'), where('status', '==', status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Appointment));
};

export const getAppointmentsByPatient = async (patientId: string): Promise<Appointment[]> => {
  const q = query(collection(db, 'appointments'), where('patientId', '==', patientId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Appointment));
};

// Blocked Dates
export const addBlockedDates = async (dates: string[]) => {
  try {
    const docRef = await addDoc(collection(db, 'blockedDates'), {
      dates,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding blocked dates:', error);
    throw error;
  }
};

export const getBlockedDates = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'blockedDates'));
    const allDates: string[] = [];
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.dates && Array.isArray(data.dates)) {
        allDates.push(...data.dates);
      }
    });
    return [...new Set(allDates)]; // Remove duplicates
  } catch (error) {
    console.error('Error getting blocked dates:', error);
    return [];
  }
};

// Emergency Reschedule
export const addEmergencyReschedule = async (reschedule: Omit<EmergencyReschedule, 'id'>) => {
  try {
    console.log('Attempting to add emergency reschedule:', reschedule);
    
    // Validate the data structure
    if (!reschedule.dateRange?.start || !reschedule.dateRange?.end) {
      throw new Error('Invalid date range');
    }
    if (!Array.isArray(reschedule.affectedAppointments)) {
      throw new Error('Invalid affected appointments');
    }
    if (!reschedule.message) {
      throw new Error('Message is required');
    }

    // Create the document data
    const docData = {
      dateRange: {
        start: reschedule.dateRange.start,
        end: reschedule.dateRange.end
      },
      affectedAppointments: reschedule.affectedAppointments,
      message: reschedule.message,
      createdAt: new Date()
    };

    console.log('Creating document with data:', docData);
    
    // Add the document to the collection
    const docRef = await addDoc(collection(db, 'emergencyReschedules'), docData);
    console.log('Emergency reschedule added successfully with ID:', docRef.id);

    // Generate blocked dates
    const startDate = new Date(reschedule.dateRange.start);
    const endDate = new Date(reschedule.dateRange.end);
    const blockedDatesList: string[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      blockedDatesList.push(d.toISOString().split('T')[0]);
    }

    // Save blocked dates
    await addBlockedDates(blockedDatesList);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding emergency reschedule:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

export const getEmergencyReschedules = async (): Promise<EmergencyReschedule[]> => {
  const querySnapshot = await getDocs(collection(db, 'emergencyReschedules'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as EmergencyReschedule));
};

export const fixAppointmentDates = async () => {
  try {
    const appointments = await getAppointments();
    const batch = writeBatch(db);
    
    for (const appointment of appointments) {
      // Parse the date and create a new local date
      const [year, month, day] = appointment.date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      const correctedDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
      
      // Only update if the date needs correction
      if (correctedDate !== appointment.date) {
        const appointmentRef = doc(db, 'appointments', appointment.id);
        batch.update(appointmentRef, { 
          date: correctedDate,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error fixing appointment dates:', error);
    return false;
  }
};