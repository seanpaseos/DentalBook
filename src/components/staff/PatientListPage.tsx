import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Plus, Search, Users } from 'lucide-react';
import { Patient } from '../../types';
import { getPatients, updatePatient, deletePatient, addPatient } from '../../services/firestore';
import AddPatientModal from './AddPatientModal';
import EditPatientModal from './EditPatientModal';

const PatientListPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const fetchedPatients = await getPatients();
        setPatients(fetchedPatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleAddPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPatient = await addPatient({
        ...patientData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setPatients([...patients, newPatient]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const handleEditPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedPatient) return;
    
    try {
      const updatedPatient = await updatePatient(selectedPatient.id, {
        ...patientData,
        updatedAt: new Date().toISOString()
      });
      setPatients(patients.map(p => p.id === selectedPatient.id ? updatedPatient : p));
      setShowEditModal(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    
    try {
      await deletePatient(patientId);
      setPatients(patients.filter(p => p.id !== patientId));
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const filteredPatients = patients
    .filter(patient => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchLower) ||
        (patient.email?.toLowerCase().includes(searchLower) || false) ||
        (patient.phone?.toLowerCase().includes(searchLower) || false);
      
      // Handle status filtering - treat undefined/null as 'inactive'
      const patientStatus = patient.status || 'inactive';
      const matchesStatus = statusFilter === 'all' || !statusFilter || patientStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = `${a.firstName || ''} ${a.lastName || ''}`;
          const nameB = `${b.firstName || ''} ${b.lastName || ''}`;
          return nameA.localeCompare(nameB);
        case 'age':
          return (a.age || 0) - (b.age || 0);
        case 'lastVisit':
          return (a.lastVisit || '').localeCompare(b.lastVisit || '');
        default:
          return 0;
      }
    });

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Patients</h2>
          <p className="text-sm text-gray-600">Manage patient records and information</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Patient</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : filteredPatients.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-teal-600">
                          {(patient.firstName || patient.lastName || '').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {`${patient.firstName || ''} ${patient.lastName || ''}`}
                        </div>
                        <div className="text-xs text-gray-500">ID: {patient.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                        <div className="text-sm text-gray-900">{patient.phone || 'No phone number'}</div>
                      <div className="text-xs text-gray-500">{patient.email || 'No email address'}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      patient.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status || 'inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    {patient.lastVisit || 'No visits yet'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-gray-500 hover:text-teal-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient.id)}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === 'all' 
                  ? 'No patients found' 
                  : `No ${statusFilter.toUpperCase()} patients found`
                }
              </h3>
              <p className="text-gray-500 text-center max-w-sm">
                {statusFilter === 'all' 
                  ? 'There are no patients in the system yet. Add your first patient to get started.'
                  : `There are no ${statusFilter} patients in the system. Try changing your filter or add a new patient.`
                }
              </p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
                >
                  View all patients
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddPatient}
        />
      )}

      {showEditModal && selectedPatient && (
        <EditPatientModal
          patient={selectedPatient}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPatient(null);
          }}
          onSubmit={handleEditPatient}
        />
      )}
    </div>
  );
};

export default PatientListPage;