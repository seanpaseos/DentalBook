import React, { useState, useEffect } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { Appointment } from '../../types';
import { getAppointmentsByStatus, updateAppointment } from '../../services/firestore';

const AppointmentRequestsPage: React.FC = () => {
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    loadPendingAppointments();
  }, []);

  const loadPendingAppointments = async () => {
    try {
      const appointments = await getAppointmentsByStatus('pending');
      setPendingAppointments(appointments);
    } catch (error) {
      console.error('Error loading pending appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      await updateAppointment(appointmentId, { status: 'scheduled' });
      await loadPendingAppointments();
      alert('Appointment approved successfully');
    } catch (error) {
      console.error('Error approving appointment:', error);
      alert('Error approving appointment');
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      await updateAppointment(appointmentId, { status: 'cancelled' });
      await loadPendingAppointments();
      alert('Appointment rejected');
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Error rejecting appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-yellow-100 text-yellow-800';
      case 'rescheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Appointment Requests</h1>
        <p className="text-gray-600">Review and approve pending appointment requests</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {pendingAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending appointment requests</h3>
            <p className="text-gray-500 text-center max-w-sm">
              All appointment requests have been processed. New requests from patients will appear here for your review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Procedure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.patientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.procedureType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(appointment.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{appointment.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₱{appointment.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        Pending Approval
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApproveAppointment(appointment.id)}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectAppointment(appointment.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Appointment Request Details</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                  <p className="mt-1 text-lg text-gray-900">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Procedure Type</label>
                  <p className="mt-1 text-lg text-gray-900">{selectedAppointment.procedureType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="mt-1 text-lg text-gray-900">
                    {new Date(selectedAppointment.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <p className="mt-1 text-lg text-gray-900">{selectedAppointment.time}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <p className="mt-1 text-lg font-semibold text-green-600">
                    ₱{selectedAppointment.price.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                    Pending Approval
                  </span>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleApproveAppointment(selectedAppointment.id);
                    setSelectedAppointment(null);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    handleRejectAppointment(selectedAppointment.id);
                    setSelectedAppointment(null);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentRequestsPage;