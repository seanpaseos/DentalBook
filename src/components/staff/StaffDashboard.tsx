import React, { useState } from 'react';
import { Calendar, Users, ClipboardList, FileText, BarChart3, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import CalendarPage from './CalendarPage';
import AppointmentRequestsPage from './AppointmentRequestsPage';
import AppointmentListPage from './AppointmentListPage';
import PatientListPage from './PatientListPage';
import ReportsPage from './ReportsPage';

interface StaffDashboardProps {
  onLogout: () => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState('calendar');
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const menuItems = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'requests', label: 'Appointment Requests', icon: ClipboardList },
    { id: 'appointments', label: 'Appointment List', icon: FileText },
    { id: 'patients', label: 'Patient List', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'calendar':
        return <CalendarPage />;
      case 'requests':
        return <AppointmentRequestsPage />;
      case 'appointments':
        return <AppointmentListPage />;
      case 'patients':
        return <PatientListPage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <CalendarPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg relative z-10">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-teal-600 to-teal-700">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Staff Portal</h2>
              <p className="text-xs text-teal-100">DentalBook</p>
            </div>
          </div>
        </div>

        <nav className="p-3">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-left ${
                      currentPage === item.id
                        ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'
                    }`}
                  >
                    <Icon 
                      className={`flex-shrink-0 w-5 h-5 transition-transform duration-300 ${
                        currentPage === item.id ? 'scale-110' : ''
                      }`} 
                    />
                    <span className="font-medium whitespace-nowrap overflow-hidden overflow-ellipsis">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full p-3 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0d9488 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative z-10 h-full">
          {renderCurrentPage()}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;