import React, { useState } from 'react';
import { X, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { Appointment, Patient } from '../../types';

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
    patientId: appointment?.patientId || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
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
      const [year, month, day] = value.split('-').map(Number);
      setFormData(prev => ({
        ...prev,
        [name]: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }));
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="patientName"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="patientPhone"
                      name="patientPhone"
                      value={formData.patientPhone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
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
                  <input
                    type="text"
                    id="procedureType"
                    name="procedureType"
                    value={formData.procedureType}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="procedurePrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Procedure Price
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="procedurePrice"
                      name="procedurePrice"
                      value={formData.procedurePrice}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₱</span>
                  </div>
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                    <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
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
                disabled={loading}
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