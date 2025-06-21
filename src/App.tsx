import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import SelectionPage from './components/SelectionPage';
import BookingForm from './components/patient/BookingForm';
import StaffDashboard from './components/staff/StaffDashboard';
import { getBlockedDates } from './services/firestore';

function App() {
  const [currentView, setCurrentView] = useState<'selection' | 'booking' | 'staff-dashboard'>('selection');
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      setCurrentView('staff-dashboard');
    }
  }, [user]);

  useEffect(() => {
    const loadBlockedDates = async () => {
      try {
        const dates = await getBlockedDates();
        setBlockedDates(dates);
      } catch (error) {
        console.error('Error loading blocked dates:', error);
      }
    };

    loadBlockedDates();
  }, []);

  const handleRoleSelect = (role: 'patient' | 'staff') => {
    if (role === 'patient') {
      setCurrentView('booking');
    } else if (!user) {
      // This will be handled by the modal in SelectionPage
      return;
    }
  };

  const handleBackToSelection = () => {
    setCurrentView('selection');
  };

  const handleLogout = () => {
    setCurrentView('selection');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {currentView === 'selection' && (
        <SelectionPage onRoleSelect={handleRoleSelect} />
      )}
      
      {currentView === 'booking' && (
        <BookingForm onClose={handleBackToSelection} blockedDates={blockedDates} />
      )}
      
      {/* Staff login is now handled by the modal in SelectionPage */}
      
      {currentView === 'staff-dashboard' && user && (
        <StaffDashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;