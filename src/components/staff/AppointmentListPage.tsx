import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Clock, User, AlertCircle, CheckCircle2, XCircle, Clock as ClockIcon } from 'lucide-react';
import { Appointment, Patient } from '../../types';
import { getAppointments, updateAppointment, deleteAppointment, getPatients } from '../../services/firestore';
import EditAppointmentModal from './EditAppointmentModal';
import AddAppointmentModal from './AddAppointmentModal';

const AppointmentListPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const [appointmentsData, patientsData] = await Promise.all([
        getAppointments(),
        getPatients()
      ]);
      setAppointments(appointmentsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowEditModal(true);
  };

  const handleDeleteAppointment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await deleteAppointment(id);
        setAppointments(appointments.filter(a => a.id !== id));
      } catch (error) {
        console.error('Error deleting appointment:', error);
        setError('Failed to delete appointment. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <ClockIcon className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'no-show':
        return <AlertCircle className="w-4 h-4" />;
      case 'rescheduled':
        return <Calendar className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredAppointments = appointments
    .filter(appointment => {
      const matchesSearch = (
        appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.procedureType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesStatus = !statusFilter || appointment.status === statusFilter;
      const matchesDate = !dateFilter || appointment.date === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Appointments</h2>
          <p className="text-sm text-gray-600">Manage and track all appointments</p>
        </div>
        <button
          onClick={() => patients.length > 0 && setShowAddModal(true)}
          className={`px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center space-x-2 text-sm ${patients.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={patients.length === 0}
        >
          <Calendar className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {patients.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg p-3 mb-3">
          No patients found. Please add a patient before creating an appointment.
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-2 mb-3">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 appearance-none text-sm"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
              <Filter className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            </div>
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-sm"
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto h-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Procedure
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map(appointment => (
                <tr key={appointment.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-7 w-7">
                        <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-teal-600" />
                        </div>
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patientName}
                        </div>
                        <div className="text-xs text-gray-500">{appointment.patientPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{appointment.procedureType}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-900">{appointment.date}</span>
                      <Clock className="w-3.5 h-3.5 text-gray-400 ml-1" />
                      <span className="text-sm text-gray-900">{appointment.time}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span className={`px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-0.5">{appointment.status}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900">₱{typeof appointment.procedurePrice === 'number' ? appointment.procedurePrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditAppointment(appointment)}
                      className="text-teal-600 hover:text-teal-900 mr-2 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddAppointmentModal
          patients={patients}
          blockedDates={[]}
          onClose={() => setShowAddModal(false)}
          onSubmit={async (appointmentData) => {
            try {
              await getAppointments();
              setShowAddModal(false);
              await fetchAppointments();
            } catch (error) {
              setError('Failed to add appointment. Please try again.');
            }
          }}
        />
      )}

      {showEditModal && selectedAppointment && (
        <EditAppointmentModal
          appointment={selectedAppointment}
          patients={patients}
          blockedDates={[]}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAppointment(null);
          }}
          onSubmit={async (appointmentData) => {
            try {
              await updateAppointment(selectedAppointment.id, appointmentData);
              await fetchAppointments();
              setShowEditModal(false);
              setSelectedAppointment(null);
            } catch (error) {
              setError('Failed to save appointment. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
};

export default AppointmentListPage;