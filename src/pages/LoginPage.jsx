// === Login Page with Supabase Support ===
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Stethoscope, UserRound, Activity, Lock, User, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const { login, signup, isMockMode } = useAuth();
  const navigate = useNavigate();
  
  const [isTherapistMode, setIsTherapistMode] = useState(false);
  const [patientCode, setPatientCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign Up states (for Supabase mode)
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState('therapist');
  const [isLowerLimb, setIsLowerLimb] = useState(true);

  // Forgot / Reset Password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if URL hash indicates a password recovery redirection
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
      setIsResettingPassword(true);
      setError('');
      setMessage('');
    }
  }, []);

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    if (isMockMode) {
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
    } else {
      // In real mode, use email/password login
      handleRealLogin('patient');
    }
  };

  const handleTherapistSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('נא להזין אימייל וסיסמה');
      return;
    }
    setError('');
    
    if (isMockMode) {
      setAnimating(true);
      setTimeout(() => {
        login('therapist');
        navigate('/therapist');
      }, 600);
    } else {
      handleRealLogin('therapist');
    }
  };

  const handleRealLogin = async (intendedRole) => {
    try {
      setAnimating(true);
      const res = await login(email, password);
      if (res.success) {
        // Redirect will happen automatically via AuthContext role change,
        // but let's navigate as a backup once loading finishes
        setTimeout(() => {
          navigate(intendedRole === 'therapist' ? '/therapist' : '/patient');
        }, 100);
      }
    } catch (err) {
      setAnimating(false);
      setError(err.message || 'התחברות נכשלה. אנא בדוק את פרטי הכניסה.');
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!signUpEmail.trim() || !signUpPassword.trim() || !signUpName.trim()) {
      setError('נא למלא את כל השדות');
      return;
    }
    setError('');
    setMessage('');
    
    try {
      setAnimating(true);
      await signup(signUpEmail, signUpPassword, signUpName, signUpRole, isLowerLimb);
      setMessage('הרשמה בוצעה בהצלחה! כעת תוכל להתחבר.');
      setIsSignUp(false);
      setEmail(signUpEmail);
      setAnimating(false);
    } catch (err) {
      setAnimating(false);
      setError(err.message || 'הרשמה נכשלה. נסה שנית.');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('נא להזין כתובת אימייל');
      return;
    }
    setError('');
    setMessage('');
    setAnimating(true);

    if (isMockMode) {
      setTimeout(() => {
        setMessage('נשלח אימייל דמו לאיפוס סיסמה (מצב הדגמה).');
        setAnimating(false);
      }, 1000);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/`
      });

      if (resetError) throw resetError;

      setMessage('נשלחה הודעה לאיפוס סיסמה לתיבת האימייל שלך. אנא בדוק את תיבת הדואר הנכנס.');
      setResetEmail('');
      setIsForgotPassword(false);
    } catch (err) {
      setError(err.message || 'שגיאה בשליחת אימייל לאיפוס סיסמה.');
    } finally {
      setAnimating(false);
    }
  };

  const handleSetNewPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      return;
    }
    setError('');
    setMessage('');
    setAnimating(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setMessage('הסיסמה החדשה עודכנה בהצלחה! כעת תוכל להתחבר.');
      setIsResettingPassword(false);
      setNewPassword('');
      window.location.hash = '';
    } catch (err) {
      setError(err.message || 'שגיאה בעדכון הסיסמה החדשה.');
    } finally {
      setAnimating(false);
    }
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
            {isSignUp 
              ? 'יצירת חשבון משתמש חדש' 
              : (isTherapistMode ? 'מערכת ניהול ובקרה לצוות הרפואי' : 'אפליקציית מעקב ותרגול אישית למטופלים')}
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

        {message && (
          <div 
            style={{ 
              background: 'rgba(16, 185, 129, 0.15)', 
              border: '1px solid var(--color-success)', 
              color: 'var(--color-success-light)', 
              padding: '10px', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '13px', 
              textAlign: 'center',
              marginBottom: '15px'
            }}
          >
            {message}
          </div>
        )}

        {isResettingPassword ? (
          /* Set New Password Form */
          <form onSubmit={handleSetNewPasswordSubmit} className="flex flex-col gap-4 animate-fade-in-up">
            <h2 className="text-md font-bold text-center" style={{ color: 'var(--color-primary-light)' }}>קביעת סיסמה חדשה</h2>
            <p className="text-xs text-secondary text-center">
              הזן את הסיסמה החדשה עבור חשבונך.
            </p>
            <div className="input-group">
              <label className="input-label">סיסמה חדשה (מינימום 6 תווים)</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="הזן סיסמה חדשה..."
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
              עדכן סיסמה והתחבר
            </button>
            <button 
              type="button" 
              className="btn btn-ghost btn-sm mt-4" 
              style={{ border: 'none', fontSize: '11px', color: 'var(--text-secondary)' }}
              onClick={() => {
                setIsResettingPassword(false);
                window.location.hash = '';
              }}
            >
              ביטול
            </button>
          </form>
        ) : isForgotPassword ? (
          /* Forgot Password Form */
          <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4 animate-fade-in-up">
            <h2 className="text-md font-bold text-center" style={{ color: 'var(--color-primary-light)' }}>איפוס סיסמה</h2>
            <p className="text-xs text-secondary text-center">
              הזן את כתובת האימייל שלך ונשלח אליך קישור מאובטח לאיפוס הסיסמה.
            </p>
            <div className="input-group">
              <label className="input-label">כתובת אימייל</label>
              <input
                type="email"
                className="input"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@email.com"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
              שלח קישור לאיפוס
            </button>
            <button 
              type="button" 
              className="btn btn-ghost btn-sm mt-4" 
              style={{ border: 'none', fontSize: '11px', color: 'var(--text-secondary)' }}
              onClick={() => {
                setIsForgotPassword(false);
                setError('');
                setMessage('');
              }}
            >
              חזרה להתחברות
            </button>
          </form>
        ) : isSignUp ? (
          /* Sign Up Form (Only visible in Supabase mode) */
          <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-4 animate-fade-in-up">
            <div className="input-group">
              <label className="input-label">שם מלא</label>
              <input
                type="text"
                className="input"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="ישראל ישראלי"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">כתובת אימייל</label>
              <input
                type="email"
                className="input"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="name@email.com"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">סיסמה</label>
              <input
                type="password"
                className="input"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
              <UserPlus size={18} />
              הרשם עכשיו
            </button>

            <button 
              type="button" 
              className="btn btn-ghost btn-sm mt-4" 
              style={{ border: 'none', fontSize: '11px', color: 'var(--text-secondary)' }}
              onClick={() => setIsSignUp(false)}
            >
              חזרה להתחברות
            </button>
          </form>
        ) : (
          /* Login Forms */
          <>
            {!isTherapistMode ? (
              /* Patient Login Form */
              <form onSubmit={handlePatientSubmit} className="flex flex-col gap-4 animate-fade-in-up stagger-2">
                {isMockMode ? (
                  <div className="input-group">
                    <label className="input-label">קוד כניסה אישי (דמו)</label>
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
                    <div className="flex justify-start">
                      <button
                        type="button"
                        className="login-forgot-link text-xs font-semibold"
                        style={{ marginTop: '4px' }}
                        onClick={() => {
                          setMessage('במצב הדגמה (Mock Mode), קוד הכניסה של המטופל הוא 1234. ניתן למצוא את פרטי המטופל במסך המטפל.');
                          setError('');
                        }}
                      >
                        שכחת קוד?
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="input-group">
                      <label className="input-label">אימייל מטופל</label>
                      <input
                        type="email"
                        className="input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="patient@email.com"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">סיסמה</label>
                      <input
                        type="password"
                        className="input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <div className="flex justify-start">
                        <button
                          type="button"
                          className="login-forgot-link text-xs font-semibold"
                          style={{ marginTop: '4px' }}
                          onClick={() => {
                            setIsForgotPassword(true);
                            setResetEmail(email);
                            setError('');
                            setMessage('');
                          }}
                        >
                          שכחת סיסמה?
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
                  <UserRound size={18} />
                  התחברות כמטופל
                </button>

                <div className="flex flex-col gap-1 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-ghost btn-sm" 
                    style={{ border: 'none', fontSize: '11px', color: 'var(--text-secondary)' }}
                    onClick={() => {
                      setIsTherapistMode(true);
                      setError('');
                    }}
                  >
                    כניסת צוות מטפלים / אדמין 👨‍⚕️
                  </button>
                </div>
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
                      required
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
                      required
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
                  <div className="flex justify-start">
                    <button
                      type="button"
                      className="login-forgot-link text-xs font-semibold"
                      style={{ marginTop: '4px' }}
                      onClick={() => {
                        setIsForgotPassword(true);
                        setResetEmail(email);
                        setError('');
                        setMessage('');
                      }}
                    >
                      שכחת סיסמה?
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
                  <Stethoscope size={18} />
                  התחברות צוות רפואי
                </button>

                <div className="flex flex-col gap-1 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-ghost btn-sm" 
                    style={{ border: 'none', fontSize: '11px', color: 'var(--color-primary-light)' }}
                    onClick={() => {
                      setIsTherapistMode(false);
                      setError('');
                    }}
                  >
                    חזרה להתחברות מטופלים
                  </button>

                  {!isMockMode && (
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm" 
                      style={{ border: 'none', fontSize: '11px', color: 'var(--color-teal)', fontWeight: 'bold' }}
                      onClick={() => {
                        setIsSignUp(true);
                        setSignUpRole('therapist');
                      }}
                    >
                      צור חשבון מטפל חדש 👨‍⚕️
                    </button>
                  )}
                </div>
              </form>
            )}
          </>
        )}

        <p className="login-footer animate-fade-in-up stagger-4">
          גרסת פיילוט • פיזיו-AI © 2026
        </p>
      </div>
    </div>
  );
}
