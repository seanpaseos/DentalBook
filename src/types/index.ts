export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  sex: 'male' | 'female';
  status: 'active' | 'inactive';
  lastVisit?: string;
  contactName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  procedureType: string;
  procedurePrice: number;
  date: string;
  time: string;
  price: number;
  notes: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
  createdAt: Date;
  updatedAt: Date;
  isRecurring?: boolean;
  recurringPattern?: 'weekly' | 'bi-weekly' | 'monthly';
  occurrences?: number;
}

export interface EmergencyReschedule {
  id: string;
  dateRange: {
    start: string;
    end: string;
  };
  affectedAppointments: string[];
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';

export const procedureTypes = [
  { name: 'Cleaning', price: 2500 },
  { name: 'Filling', price: 3500 },
  { name: 'Root Canal', price: 8000 },
  { name: 'Extraction', price: 2000 },
  { name: 'Crown', price: 15000 },
  { name: 'Whitening', price: 5000 },
  { name: 'Braces Consultation', price: 1500 },
  { name: 'Oral Surgery', price: 12000 },
];

export const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
];

// Utility function to calculate total price for appointments
export const getAppointmentTotalPrice = (appointment: Appointment): number => {
  const basePrice = appointment.price;
  if (appointment.isRecurring && appointment.occurrences && appointment.occurrences > 1) {
    return basePrice * appointment.occurrences;
  }
  return basePrice;
};