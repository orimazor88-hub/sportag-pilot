// === Auth Context ===
import { createContext, useContext, useState } from 'react';
import { therapistProfile, patientProfile } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('sportag_role') || null;
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sportag_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [uploads, setUploadsState] = useState(() => {
    const saved = localStorage.getItem('sportag_uploads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean up temporary blob URLs from previous browser sessions
        return parsed.map(item => {
          if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
            return { ...item, previewUrl: '' };
          }
          return item;
        });
      } catch (e) {
        // fallback
      }
    }
    return [
      { id: 1, type: 'image', name: 'צילום_ברך_01.jpg', title: 'צילום ברך - נפיחות', date: '2026-05-30', note: 'נפיחות קלה אחרי ריצה' },
      { id: 2, type: 'video', name: 'תרגיל_סקוואט.mp4', title: 'תרגיל סקוואט - יציבה', date: '2026-05-28', note: 'האם הביצוע נכון?' },
      { id: 3, type: 'image', name: 'צילום_ברך_02.jpg', title: 'צילום ברך - שיפור', date: '2026-05-25', note: 'השוואה - שיפור' },
    ];
  });

  const setUploads = (newUploads) => {
    setUploadsState(prev => {
      const next = typeof newUploads === 'function' ? newUploads(prev) : newUploads;
      localStorage.setItem('sportag_uploads', JSON.stringify(next));
      return next;
    });
  };

  const login = (selectedRole) => {
    const selectedUser = selectedRole === 'therapist' ? therapistProfile : patientProfile;
    setRole(selectedRole);
    setUser(selectedUser);
    localStorage.setItem('sportag_role', selectedRole);
    localStorage.setItem('sportag_user', JSON.stringify(selectedUser));
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('sportag_role');
    localStorage.removeItem('sportag_user');
  };

  const switchRole = () => {
    const newRole = role === 'therapist' ? 'patient' : 'therapist';
    const selectedUser = newRole === 'therapist' ? therapistProfile : patientProfile;
    setRole(newRole);
    setUser(selectedUser);
    localStorage.setItem('sportag_role', newRole);
    localStorage.setItem('sportag_user', JSON.stringify(selectedUser));
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, switchRole, uploads, setUploads }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

