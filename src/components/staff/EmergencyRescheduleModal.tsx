import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Appointment } from '../../types';

interface EmergencyRescheduleModalProps {
  appointments: Appointment[];
  onClose: () => void;
  onSubmit: (data: {
    dateRange: { start: string; end: string };
    affectedAppointments: string[];
    message: string;
  }) => void;
}

const EmergencyRescheduleModal: React.FC<EmergencyRescheduleModalProps> = ({
  appointments,
  onClose,
  onSubmit
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if date range is valid
  const isDateRangeValid = startDate && endDate && new Date(endDate) >= new Date(startDate);

  // Filter appointments based on date range and status
  const filteredAppointments = useMemo(() => {
    if (!isDateRangeValid) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return appointments.filter(appointment => {
      // Only include scheduled appointments
      if (appointment.status !== 'scheduled') return false;
      
      // Check if appointment date falls within the selected range
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= start && appointmentDate <= end;
    });
  }, [appointments, startDate, endDate, isDateRangeValid]);

  // Reset selected appointments when date range changes
  useEffect(() => {
    setSelectedAppointments([]);
  }, [startDate, endDate]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // If end date is before new start date, clear it
    if (endDate && new Date(endDate) < new Date(newStartDate)) {
      setEndDate('');
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !message.trim() || selectedAppointments.length === 0) {
      alert('Please fill in all required fields and select at least one appointment');
      return;
    }

    if (!isDateRangeValid) {
      alert('End date must be on or after the start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        dateRange: {
          start: startDate,
          end: endDate
        },
        affectedAppointments: selectedAppointments,
        message: message.trim()
      });
      onClose();
    } catch (error) {
      console.error('Error processing emergency reschedule:', error);
      alert('Failed to process emergency reschedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAppointment = (appointmentId: string) => {
    setSelectedAppointments(prev => 
      prev.includes(appointmentId)
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Emergency Reschedule</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  endDate && !isDateRangeValid ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {endDate && !isDateRangeValid && (
                <p className="text-red-600 text-sm mt-1">End date must be on or after the start date</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Emergency Reschedule
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={4}
              placeholder="Enter the reason for emergency rescheduling..."
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Appointments to Reschedule
              {isDateRangeValid && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredAppointments.length} scheduled appointments found)
                </span>
              )}
            </label>
            {!startDate || !endDate ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 border border-gray-300 rounded-md">
                Please select a date range to see available appointments
              </div>
            ) : !isDateRangeValid ? (
              <div className="p-4 text-center text-red-500 bg-red-50 border border-red-300 rounded-md">
                Please select a valid date range (end date must be on or after start date)
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 border border-gray-300 rounded-md">
                No scheduled appointments found in the selected date range
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                {filteredAppointments.map(appointment => (
                  <div
                    key={appointment.id}
                    className="flex items-center p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      id={`appointment-${appointment.id}`}
                      checked={selectedAppointments.includes(appointment.id)}
                      onChange={() => toggleAppointment(appointment.id)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`appointment-${appointment.id}`}
                      className="ml-3 flex-1 cursor-pointer"
                    >
                      <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim() || !isDateRangeValid || selectedAppointments.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Emergency Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyRescheduleModal;