import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Patient, procedureTypes, timeSlots } from '../../types';

interface AddAppointmentModalProps {
  patients: Patient[];
  blockedDates: string[];
  onClose: () => void;
  onSubmit: (appointmentData: any) => void;
}

const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
  patients,
  blockedDates,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    procedureType: '',
    date: '',
    time: '',
    price: 0,
    notes: '',
    isRecurring: false,
    recurringPattern: 'weekly' as 'weekly' | 'bi-weekly' | 'monthly',
    occurrences: 1
  });

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setFormData({
        ...formData,
        patientId,
        patientName: `${patient.firstName} ${patient.lastName}`
      });
    }
  };

  const handleProcedureChange = (procedureType: string) => {
    const procedure = procedureTypes.find(p => p.name === procedureType);
    setFormData({
      ...formData,
      procedureType,
      price: procedure ? procedure.price : 0
    });
  };

  const getTotalPrice = () => {
    const basePrice = formData.price;
    if (formData.isRecurring) {
      return basePrice * formData.occurrences;
    }
    return basePrice;
  };

  const isDateBlocked = (date: string) => {
    return blockedDates.includes(date);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDateBlocked(formData.date)) {
      alert('Cannot schedule appointment on blocked date');
      return;
    }

    // Format the date consistently
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (formData.isRecurring) {
      const startDate = new Date(formData.date);
      const appointments = [];
      
      for (let i = 0; i < formData.occurrences; i++) {
        const appointmentDate = new Date(startDate);
        
        switch (formData.recurringPattern) {
          case 'weekly':
            appointmentDate.setDate(startDate.getDate() + (i * 7));
            break;
          case 'bi-weekly':
            appointmentDate.setDate(startDate.getDate() + (i * 14));
            break;
          case 'monthly':
            appointmentDate.setMonth(startDate.getMonth() + i);
            break;
        }

        appointments.push({
          ...formData,
          date: formatDate(appointmentDate)
        });
      }
      onSubmit(appointments);
    } else {
      onSubmit({
        ...formData,
        date: formatDate(new Date(formData.date))
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Add Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
            <select
              value={formData.patientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Procedure Type</label>
            <select
              value={formData.procedureType}
              onChange={(e) => handleProcedureChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDateBlocked(formData.date) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {isDateBlocked(formData.date) && (
                <p className="text-red-600 text-sm mt-1">This date is blocked for appointments</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Time</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
  <input
    type="text"
    value={`₱${formData.price.toLocaleString()}`}
    readOnly
    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
  />
</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="text-sm text-gray-600">Base Price</div>
                <div className="text-lg font-semibold text-gray-800">₱{formData.price.toLocaleString()}</div>
              </div>
              {formData.isRecurring && formData.occurrences > 1 && (
                <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg">
                  <div className="text-sm text-blue-600">Total Price ({formData.occurrences} occurrences)</div>
                  <div className="text-lg font-semibold text-blue-800">₱{getTotalPrice().toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          {/* Recurring Appointment Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="isRecurring" className="font-medium text-gray-700">
                Repeat Appointment
              </label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pattern</label>
                  <select
                    value={formData.recurringPattern}
                    onChange={(e) => setFormData({...formData, recurringPattern: e.target.value as any})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Occurrences</label>
                  <input
                    type="number"
                    value={formData.occurrences}
                    onChange={(e) => setFormData({...formData, occurrences: parseInt(e.target.value) || 1})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="52"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDateBlocked(formData.date)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppointmentModal;