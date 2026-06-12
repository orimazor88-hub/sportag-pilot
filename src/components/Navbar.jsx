import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, Users, Mic, Calendar, Video, Brain,
  ClipboardList, Dumbbell, Camera, TrendingUp,
  LogOut, Moon, Sun, ArrowLeftRight
} from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { role, user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'light' : 'dark');
  };

  const therapistLinks = [
    { to: '/therapist', icon: Home, label: 'ראשי' },
    { to: '/therapist/patients', icon: Users, label: 'מטופלים' },
    { to: '/therapist/record', icon: Mic, label: 'הקלטה' },
    { to: '/therapist/calendar', icon: Calendar, label: 'יומן טיפולים' },
    { to: '/therapist/videos', icon: Video, label: 'וידאו' },
  ];

  const patientLinks = [
    { to: '/patient', icon: Home, label: 'ראשי' },
    { to: '/patient/journal', icon: ClipboardList, label: 'מעקב יומי' },
    { to: '/patient/exercises', icon: Dumbbell, label: 'תרגילים' },
    { to: '/patient/upload', icon: Camera, label: 'מדיה' },
    { to: '/patient/progress', icon: TrendingUp, label: 'התקדמות' },
  ];

  const links = role === 'therapist' ? therapistLinks : patientLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar hide-mobile">
        <div className="sidebar-logo">
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #266289, #0891B2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px'
          }}>
            💪
          </div>
          <h2>Physio-AI Pro</h2>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/therapist' || link.to === '/patient'}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <link.icon size={20} />
              {link.label}
            </NavLink>
          ))}

          {role === 'therapist' && (
            <NavLink
              to="/therapist/ai"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Brain size={20} />
              המלצות AI
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {user?.canSwitchRole && (
            <button 
              className="sidebar-item" 
              onClick={() => { switchRole(); navigate(role === 'therapist' ? '/patient' : '/therapist'); }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'start', color: 'var(--color-accent)' }}
            >
              <ArrowLeftRight size={20} />
              {role === 'patient' ? 'מבט מטפל' : 'מבט מטופל'}
            </button>
          )}
          <button className="sidebar-item" onClick={toggleTheme} style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'start' }}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {darkMode ? 'מצב בהיר' : 'מצב כהה'}
          </button>
          <button className="sidebar-item" onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'start', color: 'var(--color-danger)' }}>
            <LogOut size={20} />
            יציאה
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav hide-desktop">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/therapist' || link.to === '/patient'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <link.icon size={22} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
