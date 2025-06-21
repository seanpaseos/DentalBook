import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Appointment, Patient, procedureTypes, timeSlots, AppointmentStatus } from '../../types';
import { 
  getAppointments, 
  getPatients, 
  addAppointment, 
  updateAppointment, 
  addEmergencyReschedule,
  getBlockedDates
} from '../../services/firestore';
import { auth } from '../../firebase/config';
import AddAppointmentModal from './AddAppointmentModal';
import EditAppointmentModal from './EditAppointmentModal';
import EmergencyRescheduleModal from './EmergencyRescheduleModal';

interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
}

const CalendarPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const statusColors = {
    pending: 'bg-orange-500',
    scheduled: 'bg-blue-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
    'no-show': 'bg-yellow-500',
    rescheduled: 'bg-purple-500'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appointmentsData, patientsData, blockedDatesData] = await Promise.all([
        getAppointments(),
        getPatients(),
        getBlockedDates()
      ]);
      // Include all appointments except completed ones in the calendar view
      const visibleAppointments = appointmentsData.filter(apt => apt.status !== 'completed');
      setAppointments(visibleAppointments);
      setPatients(patientsData);
      setBlockedDates(blockedDatesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: CalendarDay[] = [];
    
    // Add days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      days.push({
        date: formattedDate,
        dayOfMonth: date.getDate(),
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      days.push({
        date: formattedDate,
        dayOfMonth: i,
        isCurrentMonth: true
      });
    }
    
    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      days.push({
        date: formattedDate,
        dayOfMonth: date.getDate(),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    // Format the date as YYYY-MM-DD using local date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Filter appointments that match the exact date string
    return appointments.filter(apt => {
      // Ensure we're comparing just the date part
      const aptDate = apt.date.split('T')[0];
      return aptDate === dateString;
    });
  };

  const isDateBlocked = (date: Date) => {
    // Format the date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return blockedDates.includes(dateString);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddAppointment = async (appointmentData: any) => {
    try {
      if (appointmentData.isRecurring) {
        const appointments = [];
        const startDate = new Date(appointmentData.date);
        
        for (let i = 0; i < appointmentData.occurrences; i++) {
          const appointmentDate = new Date(startDate);
          
          switch (appointmentData.recurringPattern) {
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

          const newAppointment = {
            ...appointmentData,
            date: appointmentDate.toISOString().split('T')[0],
            status: 'scheduled' as AppointmentStatus,
            createdAt: new Date()
          };
          
          await addAppointment(newAppointment);
        }
      } else {
        const newAppointment = {
          ...appointmentData,
          status: 'scheduled' as AppointmentStatus,
          createdAt: new Date()
        };
        await addAppointment(newAppointment);
      }
      
      await loadData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding appointment:', error);
      alert('Error adding appointment');
    }
  };

  const handleEditAppointment = async (appointmentData: any) => {
    if (!selectedAppointment) return;
    
    try {
      await updateAppointment(selectedAppointment.id, appointmentData);
      await loadData();
      setShowEditModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Error updating appointment');
    }
  };

  const handleEmergencyReschedule = async (rescheduleData: {
    dateRange: { start: string; end: string };
    affectedAppointments: string[];
    message: string;
  }) => {
    try {
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user found');
        alert('You must be logged in to perform emergency rescheduling');
        return;
      }

      console.log('Starting emergency reschedule with data:', rescheduleData);
      
      // Validate the data structure
      if (!rescheduleData.dateRange?.start || !rescheduleData.dateRange?.end) {
        throw new Error('Invalid date range provided');
      }
      if (!Array.isArray(rescheduleData.affectedAppointments)) {
        throw new Error('Invalid appointments data provided');
      }
      if (!rescheduleData.message?.trim()) {
        throw new Error('Message is required');
      }

      // First, add the emergency reschedule record
      console.log('Adding emergency reschedule record...');
      try {
        const emergencyRescheduleData = {
          dateRange: {
            start: rescheduleData.dateRange.start,
            end: rescheduleData.dateRange.end
          },
          affectedAppointments: rescheduleData.affectedAppointments,
          message: rescheduleData.message.trim(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('Emergency reschedule data to be saved:', emergencyRescheduleData);
        await addEmergencyReschedule(emergencyRescheduleData);
        console.log('Emergency reschedule record added successfully');
      } catch (error) {
        console.error('Failed to add emergency reschedule record:', error);
        if (error instanceof Error) {
          if (error.message.includes('permission-denied')) {
            alert('Permission denied: Unable to create emergency reschedule. Please check your Firebase security rules.');
          } else {
            alert(`Failed to create emergency reschedule: ${error.message}`);
          }
        } else {
          alert('Failed to create emergency reschedule record. Please try again.');
        }
        return;
      }
      
      // Then update all affected appointments
      console.log('Updating affected appointments...');
      if (rescheduleData.affectedAppointments.length > 0) {
        try {
          const updatePromises = rescheduleData.affectedAppointments.map(async (appointmentId: string) => {
            const appointment = appointments.find(apt => apt.id === appointmentId);
            if (appointment && appointment.status !== 'completed') {
              return updateAppointment(appointmentId, { 
                status: 'rescheduled' as AppointmentStatus,
                notes: `Emergency rescheduled: ${rescheduleData.message.trim()}`
              });
            }
          });
          
          await Promise.all(updatePromises.filter(Boolean));
          console.log('All appointments updated successfully');
        } catch (error) {
          console.error('Failed to update appointments:', error);
          alert('Failed to update affected appointments. Please try again.');
          return;
        }
      } else {
        console.log('No appointments selected for rescheduling - only blocking dates');
      }
      
      // Refresh the appointments list and blocked dates
      await loadData();
      console.log('Data refreshed successfully');
      
      // Close the modal
      setShowEmergencyModal(false);
      
      // Show success message
      if (rescheduleData.affectedAppointments.length > 0) {
        alert('Emergency reschedule completed successfully');
      } else {
        alert('Date range blocked successfully');
      }
    } catch (error) {
      console.error('Error processing emergency reschedule:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      alert('Error processing emergency reschedule. Please check the console for details.');
    }
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const days = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  if (!isNaN(selectedDate.getTime())) {
                    setCurrentDate(selectedDate);
                  }
                }}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
            >
              <AlertTriangle className="inline-block mr-2" />
              Emergency Reschedule
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus className="inline-block mr-2" />
            Add Appointment
          </button>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 transform hover:scale-[1.01] transition-transform duration-300">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 group"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-teal-600 group-hover:scale-110 transition-transform" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 group"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-teal-600 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isToday = day.date === new Date().toISOString().split('T')[0];
          const isBlocked = blockedDates.includes(day.date);
          const dayAppointments = appointments.filter(apt => apt.date === day.date);
          
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border rounded-lg ${
                day.isCurrentMonth
                  ? isBlocked
                    ? 'bg-red-100 border-red-200'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                  : 'bg-gray-50 border-gray-100'
              } ${isToday ? 'ring-2 ring-teal-500 ring-opacity-50' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${
                day.isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {day.dayOfMonth}
              </div>
              {isBlocked && (
                <div className="text-xs font-medium text-red-600 bg-red-100 rounded px-2 py-1 mb-1">
                  BLOCKED
                </div>
              )}
              <div className="space-y-1">
                {dayAppointments.map(appointment => (
                  <div
                    key={appointment.id}
                    onClick={() => openEditModal(appointment)}
                    className={`p-2 rounded text-sm cursor-pointer transition-all duration-200 hover:scale-105 ${
                      statusColors[appointment.status] || 'bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{appointment.patientName}</div>
                    <div className="text-xs opacity-75">{appointment.time}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Legend */}
      <div className="bg-white rounded-lg shadow-md p-4 mt-6 transform hover:scale-[1.01] transition-transform duration-300">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center space-x-2 group">
              <div className={`w-4 h-4 rounded transition-transform duration-300 group-hover:scale-110 ${color}`}></div>
              <span className="text-sm text-gray-700 capitalize group-hover:text-teal-600 transition-colors">
                {status === 'no-show' ? 'No Show' : status}
              </span>
            </div>
          ))}
          <div className="flex items-center space-x-2 group">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300 transition-transform duration-300 group-hover:scale-110"></div>
            <span className="text-sm text-gray-700 group-hover:text-teal-600 transition-colors">Blocked Date</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddAppointmentModal
          patients={patients}
          blockedDates={blockedDates}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddAppointment}
        />
      )}

      {showEditModal && selectedAppointment && (
        <EditAppointmentModal
          appointment={selectedAppointment}
          patients={patients}
          blockedDates={blockedDates}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAppointment(null);
          }}
          onSubmit={handleEditAppointment}
        />
      )}

      {showEmergencyModal && (
        <EmergencyRescheduleModal
          appointments={appointments.filter(apt => apt.status !== 'completed')}
          onClose={() => setShowEmergencyModal(false)}
          onSubmit={handleEmergencyReschedule}
        />
      )}
    </div>
  );
};

export default CalendarPage;