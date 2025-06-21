import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Firebase auth object:', auth);
      console.log('Attempting to sign in with email:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful, user:', userCredential.user?.email);
      
      return { 
        success: true, 
        user: userCredential.user 
      };
    } catch (error: any) {
      console.error('Firebase auth error:', {
        code: error.code,
        message: error.message,
        email: email
      });
      
      return { 
        success: false, 
        error: error.code || error.message,
        details: error
      };
    }
  };

  const logout = () => signOut(auth);

  return {
    user,
    loading,
    login,
    logout
  };
};