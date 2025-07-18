import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { Appointment, Patient, procedureTypes, timeSlots } from '../../types';

interface EditAppointmentModalProps {
  appointment?: Appointment;
  patients: Patient[];
  blockedDates: string[];
  onClose: () => void;
  onSubmit: (appointmentData: Omit<Appointment, 'id'>) => Promise<void>;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  appointment,
  patients,
  blockedDates,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: appointment?.patientName || '',
    patientPhone: appointment?.patientPhone || '',
    procedureType: appointment?.procedureType || '',
    procedurePrice: appointment?.procedurePrice || 0,
    price: appointment?.price || 0,
    date: appointment?.date || '',
    time: appointment?.time || '',
    status: appointment?.status || 'scheduled',
    notes: appointment?.notes || '',
    isRecurring: appointment?.isRecurring || false,
    occurrences: appointment?.occurrences || 1,
    createdAt: appointment?.createdAt || new Date(),
    updatedAt: appointment?.updatedAt || new Date()
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set initial patientId when appointment is loaded
  useEffect(() => {
    if (appointment && patients.length > 0) {
      console.log('Setting up appointment data:', {
        appointmentPatientName: appointment.patientName,
        patientsCount: patients.length
      });
      
      // Try to find patient by exact name match first
      let patient = patients.find(p => 
        `${p.firstName} ${p.lastName}` === appointment.patientName
      );
      
      // If not found, try partial match
      if (!patient) {
        patient = patients.find(p => 
          appointment.patientName.includes(p.firstName) || 
          appointment.patientName.includes(p.lastName)
        );
      }
      
      if (patient) {
        console.log('Found patient:', patient);
        setFormData(prev => ({
          ...prev,
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientPhone: patient.phone
        }));
      } else {
        console.log('Patient not found, keeping original data');
        // Keep the original patient data if we can't find a match
        setFormData(prev => ({
          ...prev,
          patientName: appointment.patientName,
          patientPhone: appointment.patientPhone
        }));
      }
    }
  }, [appointment, patients]);

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setFormData({
        ...formData,
        patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone
      });
    }
  };

  const handleProcedureChange = (procedureType: string) => {
    const procedure = procedureTypes.find(p => p.name === procedureType);
    const price = procedure ? procedure.price : 0;
    setFormData({
      ...formData,
      procedureType,
      procedurePrice: price,
      price: price
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting appointment with data:', formData);
    
    // Check for blocked date before submitting
    if (isDateBlocked(formData.date)) {
      setError('Sorry but the doctor isnt available to this day please pick another date');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Clean the data before sending - remove fields that shouldn't be updated by client
      // and filter out undefined values
      const cleanData = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        procedureType: formData.procedureType,
        procedurePrice: formData.procedurePrice,
        price: formData.price,
        date: formData.date,
        time: formData.time,
        status: formData.status,
        notes: formData.notes,
        isRecurring: formData.isRecurring,
        occurrences: formData.occurrences
      };
      
      // Remove undefined values
      const filteredData = Object.fromEntries(
        Object.entries(cleanData).filter(([_, value]) => value !== undefined && value !== null)
      );
      
      console.log('Calling onSubmit with cleaned appointment data:', filteredData);
      await onSubmit(filteredData);
      console.log('Appointment updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'date') {
      // Ensure date is stored in YYYY-MM-DD format without timezone influence
      try {
        if (value) {
          const [year, month, day] = value.split('-').map(Number);
          if (year && month && day) {
            const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            console.log('Date changed to:', formattedDate);
            setFormData(prev => ({
              ...prev,
              [name]: formattedDate
            }));
          }
        } else {
          setFormData(prev => ({
            ...prev,
            [name]: value
          }));
        }
      } catch (error) {
        console.error('Error formatting date:', error);
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const isDateBlocked = (date: string) => {
    return blockedDates.includes(date);
  };

  const isTimeSlotAvailable = (date: string, time: string) => {
    // This would need to be passed from the parent component
    // For now, we'll assume all time slots are available
    return true;
  };

  const isFormValid = () => {
    const hasPatient = formData.patientId || formData.patientName;
    const hasProcedure = formData.procedureType;
    const hasDate = formData.date;
    const hasTime = formData.time;
    const isDateValid = !isDateBlocked(formData.date);
    
    console.log('Form validation:', {
      hasPatient,
      hasProcedure,
      hasDate,
      hasTime,
      isDateValid,
      patientId: formData.patientId,
      patientName: formData.patientName
    });
    
    return hasPatient && hasProcedure && hasDate && hasTime && isDateValid;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full transform hover:scale-[1.01] transition-transform duration-300">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-100 rounded-full">
                <Calendar className="w-6 h-6 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Edit Appointment</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h3>
                <div>
                <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                  Patient
                  </label>
                <select
                  id="patientId"
                  name="patientId"
                  value={formData.patientId}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                      required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} - {patient.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="procedureType" className="block text-sm font-medium text-gray-700 mb-2">
                    Procedure Type
                  </label>
                  <select
                    id="procedureType"
                    name="procedureType"
                    value={formData.procedureType}
                    onChange={(e) => handleProcedureChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                    required
                  >
                    <option value="">Select Procedure</option>
                    {procedureTypes.map(procedure => (
                      <option key={procedure.name} value={procedure.name}>
                        {procedure.name} - ₱{procedure.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                    <input
                    type="text"
                    id="price"
                    value={`₱${formData.price.toLocaleString()}`}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      min={formData.status === 'completed' ? undefined : new Date().toISOString().split('T')[0]}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 ${
                        isDateBlocked(formData.date) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                  {isDateBlocked(formData.date) && (
                    <p className="text-red-600 text-sm mt-1">Sorry but the doctor isnt available to this day please pick another date</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.status === 'completed' 
                      ? 'Select any date that is not blocked' 
                      : 'Select any future date that is not blocked'
                    }
                  </p>
                  {formData.date && formData.time && !isDateBlocked(formData.date) && (
                    <p className="text-xs text-green-600 mt-1">✓ Date and time are available</p>
                  )}
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                      required
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                    required
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 min-h-[100px] resize-none"
                    placeholder="Add any additional notes about the appointment..."
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      name="isRecurring"
                      checked={formData.isRecurring}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                    />
                    <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">
                      Recurring Appointment
                    </label>
                  </div>
                  {formData.isRecurring && (
                    <div className="flex items-center">
                      <label htmlFor="occurrences" className="text-sm text-gray-700 mr-2">
                        Number of Occurrences:
                      </label>
                      <input
                        type="number"
                        id="occurrences"
                        name="occurrences"
                        value={formData.occurrences}
                        onChange={handleInputChange}
                        min="1"
                        className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Form Validation Status */}
            {!isFormValid() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Please complete the following:</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {!formData.patientId && !formData.patientName && (
                    <li>• Select a patient</li>
                  )}
                  {!formData.procedureType && (
                    <li>• Select a procedure type</li>
                  )}
                  {!formData.date && (
                    <li>• Select a date</li>
                  )}
                  {!formData.time && (
                    <li>• Select a time</li>
                  )}
                  {isDateBlocked(formData.date) && (
                    <li>• Choose a date that is not blocked</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Appointment'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAppointmentModal;