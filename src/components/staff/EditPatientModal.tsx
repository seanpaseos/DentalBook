import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Patient } from '../../types';

interface EditPatientModalProps {
  patient: Patient;
  onClose: () => void;
  onSubmit: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  sex: 'male' | 'female';
  contactName: string;
  status: 'active' | 'inactive';
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({ patient, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    sex: 'male',
    contactName: '',
    status: 'active'
  });
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    // Ensure patient object exists and has required properties
    if (!patient) {
      console.error('EditPatientModal: patient prop is undefined or null');
      return;
    }

    // Use firstName and lastName directly from patient object
    // Fallback to splitting name if firstName/lastName are not available
    let firstName = patient.firstName || '';
    let lastName = patient.lastName || '';
    
    // If firstName/lastName are empty but name exists, try to split it
    if ((!firstName || !lastName) && patient.name && typeof patient.name === 'string') {
      const nameParts = patient.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    setFormData({
      firstName,
      lastName,
      email: patient.email || '',
      phone: patient.phone || '',
      age: patient.age ? patient.age.toString() : '',
      sex: patient.sex || 'male',
      contactName: patient.contactName || '',
      status: patient.status || 'active'
    });
  }, [patient]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numbers
    const numbersOnly = value.replace(/\D/g, '');
    
    // Limit to 11 digits
    const limitedValue = numbersOnly.slice(0, 11);
    
    setFormData({ ...formData, phone: limitedValue });
    
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handlePhoneBlur = () => {
    // Validate phone number when user leaves the field
    if (formData.phone) {
      validatePhone(formData.phone);
    }
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (phone.length !== 11) {
      setPhoneError('Phone number must be exactly 11 digits');
      return false;
    }
    if (!phone.startsWith('09')) {
      setPhoneError('Phone number must start with 09');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before submitting
    if (!validatePhone(formData.phone)) {
      return;
    }
    
    onSubmit({
      ...formData,
      age: parseInt(formData.age),
      name: `${formData.firstName} ${formData.lastName}`,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600">
            Edit Patient
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 group"
          >
            <X className="w-6 h-6 text-gray-600 group-hover:text-teal-600 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter contact name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 ${
                    phoneError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter 11-digit phone number (e.g., 09123456789)"
                  maxLength={11}
                  required
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {phoneError}
                  </p>
                )}
                {!phoneError && formData.phone && (
                  <p className={`text-sm mt-1 ${
                    formData.phone.length === 11 && formData.phone.startsWith('09') 
                      ? 'text-green-600' 
                      : 'text-gray-500'
                  }`}>
                    {formData.phone.length}/11 digits
                    {formData.phone.length === 11 && !formData.phone.startsWith('09') && (
                      <span className="text-red-500 ml-2">• Must start with 09</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter age"
                  min="0"
                  max="150"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sex *</label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData({...formData, sex: e.target.value as 'male' | 'female'})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Update Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatientModal; 