import { useState } from 'react';
import { Calendar, UserCheck, X, Lock, Mail, AlertCircle, Stethoscope } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SelectionPageProps {
  onRoleSelect: (role: 'patient' | 'staff') => void;
}

const SelectionPage: React.FC<SelectionPageProps> = ({ onRoleSelect }) => {
  const { login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    console.log('Attempting login with:', { email });
    
    try {
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, redirecting to staff dashboard');
        onRoleSelect('staff');
      } else {
        console.error('Login failed:', result.error);
        // More specific error messages based on error code
        if (result.error?.includes('auth/invalid-credential')) {
          setError('Invalid email or password. Please try again.');
        } else if (result.error?.includes('auth/too-many-requests')) {
          setError('Too many failed attempts. Please try again later.');
        } else {
          setError('Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openStaffLogin = () => {
    setShowLoginModal(true);
    setError('');
    setEmail('');
    setPassword('');
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="/photos/DentalOffice.jpg" 
          alt="Dental Office" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      <div className="max-w-xl w-full relative z-10 px-4">
        <div className="text-center mb-10">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="mb-4">
              <img 
                src="/photos/DentalLogo.png" 
                alt="DentalBook Logo" 
                className="w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-[0_4px_12px_rgba(0,74,173,0.3)]"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-[#004aad] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
              DentalBook
            </h1>
          </div>
          <p className="text-xl text-white">Welcome! Please select your role to continue</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onRoleSelect('patient')}
            className="w-full bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-300 rounded-xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="flex items-center justify-center mb-3">
              <Calendar className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">Book an Appointment</h3>
            <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Schedule your dental appointment online</p>
          </button>

          <button
            onClick={openStaffLogin}
            className="w-full bg-white hover:bg-teal-50 border-2 border-teal-200 hover:border-teal-300 rounded-xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/10 to-teal-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="flex items-center justify-center mb-3">
              <div className="bg-teal-100 p-3 rounded-full group-hover:bg-teal-200 transition-colors duration-300">
                <UserCheck className="w-8 h-8 text-teal-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors duration-300">Dental Staff Login</h3>
            <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Access staff dashboard and manage appointments</p>
          </button>

          {/* Login Modal */}
          {showLoginModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                      Staff Portal Sign In
                    </h2>
                    <button
                      onClick={() => setShowLoginModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-2"
                      aria-label="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          placeholder="Enter your email"
                          required
                          autoComplete="username"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          placeholder="Enter your password"
                          required
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          isLoading ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                          </>
                        ) : (
                          'Sign in to your account'
                        )}
                      </button>
                    </div>
                    

                  </form>
                </div>
                

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectionPage;