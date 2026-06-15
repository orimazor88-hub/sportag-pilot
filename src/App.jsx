// === App.jsx - Main Application ===
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';

// Pages
import LoginPage from './pages/LoginPage';
import TherapistDashboard from './pages/therapist/TherapistDashboard';
import PatientList from './pages/therapist/PatientList';
import PatientProfile from './pages/therapist/PatientProfile';
import SessionRecorder from './pages/therapist/SessionRecorder';
import CalendarView from './pages/therapist/CalendarView';
import AIRecommendations from './pages/therapist/AIRecommendations';
import VideoLibrary from './pages/shared/VideoLibrary';
import PatientDashboard from './pages/patient/PatientDashboard';
import DailyJournal from './pages/patient/DailyJournal';
import MyExercises from './pages/patient/MyExercises';
import MediaUpload from './pages/patient/MediaUpload';
import ProgressView from './pages/patient/ProgressView';

import { useState, useEffect } from 'react';
import { Bell, X, Dumbbell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Protected Layout with Navbar
function AppLayout() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [inAppNotification, setInAppNotification] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleNotification = (e) => {
      const { title, body } = e.detail;
      setInAppNotification({ title, body });
    };

    window.addEventListener('sportag-in-app-notify', handleNotification);
    return () => {
      window.removeEventListener('sportag-in-app-notify', handleNotification);
    };
  }, []);

  // Background timer to check for daily reminder
  useEffect(() => {
    const checkReminder = () => {
      const enabled = localStorage.getItem('sportag_reminder_enabled') === 'true';
      if (!enabled) return;

      const timeVal = localStorage.getItem('sportag_reminder_time') || '19:00';
      const [hh, mm] = timeVal.split(':');
      
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      
      if (currentH === parseInt(hh) && currentM === parseInt(mm)) {
        const todayDateStr = now.toDateString();
        const lastFired = localStorage.getItem('sportag_last_reminder_fired');
        
        if (lastFired !== todayDateStr) {
          localStorage.setItem('sportag_last_reminder_fired', todayDateStr);
          // Trigger the PWA local notification
          import('./services/notificationService').then(({ showLocalNotification }) => {
            showLocalNotification('Physio-AI Pro - תזכורת תרגול', {
              body: 'הגיע הזמן לתרגול היומי שלך! 💪',
              tag: 'workout-reminder'
            });
          });
        }
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!role) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-layout has-sidebar">
      <Navbar />

      {/* Mobile Top Header with Logout */}
      <header className="mobile-header hide-desktop">
        <div className="mobile-header-logo">
          <span style={{ fontSize: '1.2rem' }}>💪</span>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Physio-AI Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={handleLogout}
            style={{ 
              padding: '6px 10px', 
              fontSize: '11px', 
              color: 'var(--color-danger-light)',
              border: '1px solid var(--color-danger-light)',
              background: 'var(--bg-glass)'
            }}
          >
            <LogOut size={12} />
            יציאה
          </button>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Fullscreen Popup Modal Notification (HTTPS Fallback) */}
      {inAppNotification && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            direction: 'rtl'
          }}
        >
          <div 
            className="animate-slide-up"
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--color-primary-light)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-8)',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative'
            }}
          >
            {/* Bell/Notification Ringing Effect */}
            <div 
              className="animate-float"
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(38, 98, 137, 0.2) 0%, rgba(8, 145, 178, 0.2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-6)',
                color: 'var(--color-primary-light)',
                border: '1px solid rgba(38, 98, 137, 0.3)'
              }}
            >
              <Bell size={36} className="animate-pulse" />
            </div>

            <h3 className="font-bold text-xl text-primary mb-2">
              {inAppNotification.title}
            </h3>
            
            <p className="text-sm text-secondary mb-6" style={{ lineHeight: 1.6 }}>
              {inAppNotification.body}
            </p>

            <div className="flex flex-col gap-2">
              <button 
                className="btn btn-primary w-full"
                onClick={() => {
                  setInAppNotification(null);
                  navigate('/patient/exercises');
                }}
              >
                <Dumbbell size={16} />
                התחל תרגול עכשיו
              </button>
              <button 
                className="btn btn-ghost w-full"
                onClick={() => setInAppNotification(null)}
              >
                סגור תזכורת
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Route Guard
function RequireAuth({ children }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { role } = useAuth();

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/"
        element={role ? <Navigate to={role === 'therapist' ? '/therapist' : '/patient'} replace /> : <LoginPage />}
      />

      {/* Therapist Routes */}
      <Route element={<AppLayout />}>
        <Route path="/therapist" element={<TherapistDashboard />} />
        <Route path="/therapist/patients" element={<PatientList />} />
        <Route path="/therapist/patients/:id" element={<PatientProfile />} />
        <Route path="/therapist/record" element={<SessionRecorder />} />
        <Route path="/therapist/calendar" element={<CalendarView />} />
        <Route path="/therapist/ai" element={<AIRecommendations />} />
        <Route path="/therapist/videos" element={<VideoLibrary />} />
      </Route>

      {/* Patient Routes */}
      <Route element={<AppLayout />}>
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/journal" element={<DailyJournal />} />
        <Route path="/patient/exercises" element={<MyExercises />} />
        <Route path="/patient/upload" element={<MediaUpload />} />
        <Route path="/patient/progress" element={<ProgressView />} />
        <Route path="/patient/videos" element={<VideoLibrary />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
