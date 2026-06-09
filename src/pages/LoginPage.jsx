// === Login Page ===
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, UserRound, ArrowLeft, Activity, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [isTherapistMode, setIsTherapistMode] = useState(false);
  const [patientCode, setPatientCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState('');

  const handlePatientSubmit = (e) => {
    e.preventDefault();
    if (!patientCode.trim()) {
      setError('נא להזין קוד מטופל');
      return;
    }
    setError('');
    setAnimating(true);
    setTimeout(() => {
      login('patient');
      navigate('/patient');
    }, 600);
  };

  const handleTherapistSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('נא להזין אימייל וסיסמה');
      return;
    }
    setError('');
    setAnimating(true);
    setTimeout(() => {
      login('therapist');
      navigate('/therapist');
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className={`login-container ${animating ? 'login-exit' : ''}`}>
        <div className="login-logo animate-fade-in-up">
          <div className="login-logo-icon">
            <Activity size={36} strokeWidth={2.5} />
          </div>
          <h1 className="login-title">Physio-AI Pro</h1>
          <p className="login-subtitle">
            {isTherapistMode ? 'מערכת ניהול ובקרה לצוות הרפואי' : 'אפליקציית מעקב ותרגול אישית למטופלים'}
          </p>
        </div>

        {error && (
          <div 
            className="animate-shake"
            style={{ 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid var(--color-danger)', 
              color: 'var(--color-danger-light)', 
              padding: '10px', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '13px', 
              textAlign: 'center',
              marginBottom: '15px'
            }}
          >
            {error}
          </div>
        )}

        {!isTherapistMode ? (
          /* Patient Login Form */
          <form onSubmit={handlePatientSubmit} className="flex flex-col gap-4 animate-fade-in-up stagger-2">
            <div className="input-group">
              <label className="input-label">קוד כניסה אישי</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  className="input"
                  style={{ paddingRight: '40px' }}
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="הקלד קוד מטופל (לדוגמה: 1234)"
                  autoFocus
                />
                <Lock 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-tertiary)' 
                  }} 
                />
              </div>
              <span className="text-xs text-muted mt-1">
                הקוד האישי נמצא במידע שקיבלת מהפיזיותרפיסט שלך בקליניקה.
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
              <UserRound size={18} />
              התחברות כמטופל
            </button>

            <button 
              type="button" 
              className="btn btn-ghost btn-sm mt-4" 
              style={{ border: 'none', fontSize: '11px', color: 'var(--text-secondary)' }}
              onClick={() => {
                setIsTherapistMode(true);
                setError('');
              }}
            >
              כניסת צוות מטפלים / אדמין 👨‍⚕️
            </button>
          </form>
        ) : (
          /* Therapist / Admin Login Form */
          <form onSubmit={handleTherapistSubmit} className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
            <div className="input-group">
              <label className="input-label">אימייל מטפל</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input"
                  style={{ paddingRight: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@physioai.com"
                  autoFocus
                />
                <User 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-tertiary)' 
                  }} 
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">סיסמה</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input"
                  style={{ paddingRight: '40px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Lock 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-tertiary)' 
                  }} 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
              <Stethoscope size={18} />
              התחברות צוות רפואי
            </button>

            <button 
              type="button" 
              className="btn btn-ghost btn-sm mt-4" 
              style={{ border: 'none', fontSize: '11px', color: 'var(--color-primary-light)' }}
              onClick={() => {
                setIsTherapistMode(false);
                setError('');
              }}
            >
              חזרה להתחברות מטופלים
            </button>
          </form>
        )}

        <p className="login-footer animate-fade-in-up stagger-4">
          גרסת דמו • פיזיו-AI © 2026
        </p>
      </div>
    </div>
  );
}
