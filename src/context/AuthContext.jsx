// === Auth Context with Supabase and Mock Fallback ===
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { therapistProfile, patientProfile } from '../data/mockData';

const AuthContext = createContext(null);

const IS_MOCK_MODE = !import.meta.env.VITE_SUPABASE_URL || 
                     import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploadsState] = useState([]);

  // Load uploads from local storage (useful for offline patient uploads)
  useEffect(() => {
    const saved = localStorage.getItem('sportag_uploads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUploadsState(parsed.map(item => {
          if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
            return { ...item, previewUrl: '' };
          }
          return item;
        }));
      } catch (e) {
        // fallback
      }
    } else {
      setUploadsState([
        { id: 1, type: 'image', name: 'צילום_ברך_01.jpg', title: 'צילום ברך - נפיחות', date: '2026-05-30', note: 'נפיחות קלה אחרי ריצה' },
        { id: 2, type: 'video', name: 'תרגיל_סקוואט.mp4', title: 'תרגיל סקוואט - יציבה', date: '2026-05-28', note: 'האם הביצוע נכון?' },
        { id: 3, type: 'image', name: 'צילום_ברך_02.jpg', title: 'צילום ברך - שיפור', date: '2026-05-25', note: 'השוואה - שיפור' },
      ]);
    }
  }, []);

  const setUploads = (newUploads) => {
    setUploadsState(prev => {
      const next = typeof newUploads === 'function' ? newUploads(prev) : newUploads;
      localStorage.setItem('sportag_uploads', JSON.stringify(next));
      return next;
    });
  };

  // Auth Initialization
  useEffect(() => {
    if (IS_MOCK_MODE) {
      console.log('Sportag is running in MOCK auth mode (local storage).');
      const savedRole = localStorage.getItem('sportag_role');
      const savedUser = localStorage.getItem('sportag_user');
      if (savedRole && savedUser) {
        setRole(savedRole);
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
      return;
    }

    console.log('Sportag is running in REAL Supabase auth mode.');

    // 1. Check current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (supabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          isLowerLimb: data.is_lower_limb,
          phone: data.phone,
          avatar: data.avatar || '🏃',
        });
        setRole(data.role);
      }
    } catch (err) {
      console.error('Error fetching user profile from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrRole, password = '') => {
    if (IS_MOCK_MODE) {
      // In mock mode, the first parameter is the role
      const selectedRole = emailOrRole;
      const selectedUser = selectedRole === 'therapist' ? therapistProfile : patientProfile;
      setRole(selectedRole);
      setUser(selectedUser);
      localStorage.setItem('sportag_role', selectedRole);
      localStorage.setItem('sportag_user', JSON.stringify(selectedUser));
      return { success: true };
    }

    // Real login with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailOrRole,
      password: password,
    });

    if (error) {
      throw error;
    }
    return { success: true, user: data.user };
  };

  const signup = async (email, password, name, roleSelected, isLowerLimb = false) => {
    if (IS_MOCK_MODE) {
      return { success: true, message: 'Signup is simulated in mock mode' };
    }

    // 1. Sign up user in Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // 2. Insert into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email,
            name,
            role: roleSelected,
            is_lower_limb: isLowerLimb,
            avatar: roleSelected === 'therapist' ? '👨‍⚕️' : '🏃',
          }
        ]);

      if (profileError) throw profileError;
    }

    return { success: true };
  };

  const logout = async () => {
    if (IS_MOCK_MODE) {
      setUser(null);
      setRole(null);
      localStorage.removeItem('sportag_role');
      localStorage.removeItem('sportag_user');
      return;
    }

    await supabase.auth.signOut();
  };

  const switchRole = () => {
    // Role switching is only allowed/relevant in mock mode for previewing
    if (!IS_MOCK_MODE) return;
    const newRole = role === 'therapist' ? 'patient' : 'therapist';
    const selectedUser = newRole === 'therapist' ? therapistProfile : patientProfile;
    setRole(newRole);
    setUser(selectedUser);
    localStorage.setItem('sportag_role', newRole);
    localStorage.setItem('sportag_user', JSON.stringify(selectedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      loading, 
      login, 
      signup, 
      logout, 
      switchRole, 
      uploads, 
      setUploads,
      isMockMode: IS_MOCK_MODE
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
