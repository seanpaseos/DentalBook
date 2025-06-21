import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { procedureTypes, timeSlots, Patient, Appointment } from '../../types';
import { addPatient, addAppointment } from '../../services/firestore';

interface BookingFormProps {
  onClose: () => void;
  blockedDates?: string[];
}

interface ContactInfo {
  contactName: string;
  email: string;
  phone: string;
}

interface PatientInfo {
  firstName: string;
  lastName: string;
  age: number;
  sex: 'male' | 'female';
}

interface AppointmentDetails {
  procedureType: string;
  date: string;
  time: string;
  notes: string;
}

const BookingForm: React.FC<BookingFormProps> = ({ onClose, blockedDates = [] }) => {
  const [step, setStep] = useState(1);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    contactName: '',
    email: '',
    phone: ''
  });
  const [showPhoneError, setShowPhoneError] = useState(false);
  const [showEmailError, setShowEmailError] = useState(false);
  const [patients, setPatients] = useState<PatientInfo[]>([{
    firstName: '',
    lastName: '',
    age: 0,
    sex: 'male'
  }]);
  const [appointments, setAppointments] = useState<AppointmentDetails[]>([{
    procedureType: '',
    date: '',
    time: '',
    notes: ''
  }]);
  const [loading, setLoading] = useState(false);

  const addPatientForm = () => {
    setPatients([...patients, { firstName: '', lastName: '', age: 0, sex: 'male' }]);
    setAppointments([...appointments, { procedureType: '', date: '', time: '', notes: '' }]);
  };

  const removePatientForm = (index: number) => {
    if (patients.length > 1) {
      setPatients(patients.filter((_, i) => i !== index));
      setAppointments(appointments.filter((_, i) => i !== index));
    }
  };

  const updatePatient = (index: number, field: keyof PatientInfo, value: any) => {
    const updated = [...patients];
    if (field === 'firstName' || field === 'lastName') {
      // Only allow letters and spaces
      value = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (field === 'age') {
      // Limit age to 100
      value = Math.min(Math.max(parseInt(value) || 0, 0), 100);
    }
    updated[index] = { ...updated[index], [field]: value };
    setPatients(updated);
  };

  const updateAppointment = (index: number, field: keyof AppointmentDetails, value: any) => {
    const updated = [...appointments];
    updated[index] = { ...updated[index], [field]: value };
    setAppointments(updated);
  };

  const getPrice = (procedureType: string) => {
    const procedure = procedureTypes.find(p => p.name === procedureType);
    return procedure ? procedure.price : 0;
  };

  const isDateBlocked = (date: string) => {
    return blockedDates.includes(date);
  };

  const isTimeSlotTaken = (date: string, time: string, currentIndex: number) => {
    return appointments.some((apt, index) => 
      index !== currentIndex && 
      apt.date === date && 
      apt.time === time
    );
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|hotmail)\.com$/;
    return emailRegex.test(email);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 11)}`;
  };

  const isValidPhoneNumber = (phone: string) => {
    // Remove formatting for validation
    const digits = phone.replace(/\D/g, '');
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(digits);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow free typing without any validation
    setContactInfo({...contactInfo, phone: e.target.value});
  };

  const handlePhoneBlur = () => {
    // Only validate after user has finished typing
    if (contactInfo.phone) {
      setShowPhoneError(!isValidPhoneNumber(contactInfo.phone));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo({...contactInfo, email: e.target.value});
    // Only show error if user has finished typing (on blur)
    if (showEmailError) {
      setShowEmailError(!isValidEmail(e.target.value));
    }
  };

  const handleEmailBlur = () => {
    setShowEmailError(true);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Check for blocked dates
      const hasBlockedDate = appointments.some(apt => isDateBlocked(apt.date));
      if (hasBlockedDate) {
        alert('Sorry but the doctor isnt available to this day please pick another date');
        setLoading(false);
        return;
      }

      // Check for duplicate time slots
      const hasDuplicateTime = appointments.some((apt, index) => 
        isTimeSlotTaken(apt.date, apt.time, index)
      );
      if (hasDuplicateTime) {
        alert('Cannot book multiple appointments at the same time slot. Please choose different times.');
        setLoading(false);
        return;
      }

      for (let i = 0; i < patients.length; i++) {
        const patientData = {
          ...patients[i],
          ...contactInfo,
          name: `${patients[i].firstName} ${patients[i].lastName}`,
          status: 'active' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const newPatient = await addPatient(patientData);
        const patientId = newPatient.id;

        const formatDate = (dateStr: string) => {
          // Ensure we're working with local date without timezone conversion
          const [year, month, day] = dateStr.split('-').map(Number);
          const localDate = new Date(year, month - 1, day);
          return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
        };

        const appointmentData: Omit<Appointment, 'id'> = {
          patientId,
          patientName: `${patients[i].firstName} ${patients[i].lastName}`,
          patientPhone: contactInfo.phone,
          procedureType: appointments[i].procedureType,
          procedurePrice: getPrice(appointments[i].procedureType),
          date: formatDate(appointments[i].date),
          time: appointments[i].time,
          price: getPrice(appointments[i].procedureType),
          notes: appointments[i].notes,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await addAppointment(appointmentData);
      }

      alert('Appointment requests submitted successfully! Please wait for staff approval.');
      onClose();
    } catch (error) {
      console.error('Error booking appointments:', error);
      alert('Error submitting appointment requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!contactInfo.contactName || !contactInfo.email || !contactInfo.phone) {
      return false;
    }
    
    // Only show validation errors when trying to proceed
    const isEmailValid = isValidEmail(contactInfo.email);
    const isPhoneValid = isValidPhoneNumber(contactInfo.phone);
    
    if (!isEmailValid) {
      alert('Please enter a valid email address (only Gmail, Yahoo, or Hotmail addresses are accepted)');
      return false;
    }
    if (!isPhoneValid) {
      alert('Please enter a valid phone number (must start with 09 and be exactly 11 digits)');
      return false;
    }
    return true;
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return contactInfo.contactName && contactInfo.email && contactInfo.phone;
      case 2:
        return patients.every(p => 
          p.firstName && 
          p.lastName && 
          p.age > 0 && 
          p.age <= 100 && 
          /^[a-zA-Z\s]+$/.test(p.firstName) && 
          /^[a-zA-Z\s]+$/.test(p.lastName)
        );
      case 3:
        return appointments.every(a => 
          a.procedureType && 
          a.date && 
          a.time && 
          !isDateBlocked(a.date)
        );
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Check phone number validation before proceeding
      if (!isValidPhoneNumber(contactInfo.phone)) {
        setShowPhoneError(true);
        alert('Please enter a valid phone number (must start with 09 and be exactly 11 digits)');
        return;
      }
      setStep(step + 1);
    } else if (step === 2) {
      // Check for blocked dates before proceeding to step 3
      const hasBlockedDate = appointments.some(apt => isDateBlocked(apt.date));
      if (hasBlockedDate) {
        alert('Sorry but the doctor isnt available to this day please pick another date');
        return;
      }
      setStep(step + 1);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0">
        <img 
          src="/photos/DentalOffice.jpg" 
          alt="Dental Office" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-70"></div>
      </div>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Book Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                Contact Info
              </span>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                Patient Info
              </span>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                Appointment Details
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Contact Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={contactInfo.contactName}
                    onChange={(e) => setContactInfo({...contactInfo, contactName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter contact name"
                  />
                  {contactInfo.contactName && (
                    <button
                      onClick={() => handleCopyToClipboard(contactInfo.contactName)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      showEmailError && contactInfo.email && !isValidEmail(contactInfo.email) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address (Gmail, Yahoo, or Hotmail only)"
                  />
                  {contactInfo.email && (
                    <button
                      onClick={() => handleCopyToClipboard(contactInfo.email)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                  )}
                </div>
                {showEmailError && contactInfo.email && !isValidEmail(contactInfo.email) && (
                  <p className="text-red-600 text-sm mt-1">Please enter a valid Gmail, Yahoo, or Hotmail address</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={handlePhoneNumberChange}
                    onBlur={handlePhoneBlur}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      showPhoneError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number (must start with 09)"
                    maxLength={13}
                  />
                  {contactInfo.phone && (
                    <button
                      onClick={() => handleCopyToClipboard(contactInfo.phone)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                  )}
                </div>
                {showPhoneError && (
                  <p className="text-red-600 text-sm mt-1">Phone number must start with 09 and be exactly 11 digits</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Patient Info */}
          {step === 2 && (
            <div className="space-y-6">
              {patients.map((patient, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Patient {index + 1}</h3>
                    {patients.length > 1 && (
                      <button
                        onClick={() => removePatientForm(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={patient.firstName}
                        onChange={(e) => updatePatient(index, 'firstName', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={patient.lastName}
                        onChange={(e) => updatePatient(index, 'lastName', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Last name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                      <input
                        type="number"
                        value={patient.age || ''}
                        onChange={(e) => updatePatient(index, 'age', parseInt(e.target.value) || 0)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Age"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                      <select
                        value={patient.sex}
                        onChange={(e) => updatePatient(index, 'sex', e.target.value as 'male' | 'female')}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addPatientForm}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Patient</span>
              </button>
            </div>
          )}

          {/* Step 3: Appointment Details */}
          {step === 3 && (
            <div className="space-y-6">
              {appointments.map((appointment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Appointment for {patients[index]?.firstName} {patients[index]?.lastName}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Type</label>
                      <select
                        value={appointment.procedureType}
                        onChange={(e) => updateAppointment(index, 'procedureType', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select procedure</option>
                        {procedureTypes.map((procedure) => (
                          <option key={procedure.name} value={procedure.name}>
                            {procedure.name} - ₱{procedure.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={appointment.date}
                        onChange={(e) => updateAppointment(index, 'date', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDateBlocked(appointment.date) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {isDateBlocked(appointment.date) && (
                        <p className="text-red-600 text-sm mt-1">Sorry but the doctor isnt available to this day please pick another date</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <select
                        value={appointment.time}
                        onChange={(e) => updateAppointment(index, 'time', e.target.value)}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isTimeSlotTaken(appointment.date, appointment.time, index) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select time</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      {isTimeSlotTaken(appointment.date, appointment.time, index) && (
                        <p className="text-red-600 text-sm mt-1">This time slot is already taken. Please choose a different time.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Price</label>
                      <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-lg font-semibold text-green-600">
                        ₱{getPrice(appointment.procedureType).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      value={appointment.notes}
                      onChange={(e) => updateAppointment(index, 'notes', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Any additional notes or special requests..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                disabled={!isStepValid()}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid() || loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Appointment Request'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;