// === Session Recorder Page ===
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConsentModal, WaveformAnimation, LoadingSpinner } from '../../components/SharedComponents';
import { simulateTranscription } from '../../services/mockAIService';
import { mockPatients } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import {
  Mic, MicOff, Square, Pause, Play, CheckCircle,
  Copy, Download, ArrowRight, User, Clock, FileText, Sparkles, Activity
} from 'lucide-react';

export default function SessionRecorder() {
  const navigate = useNavigate();
  const { user, isMockMode } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [step, setStep] = useState('select'); // select, consent, recording, processing, result
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showConsent, setShowConsent] = useState(false);
  const [summary, setSummary] = useState(null);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef(null);

  // Live Web Speech transcription
  const [transcriptionText, setTranscriptionText] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [recognitionError, setRecognitionError] = useState('');
  const recognitionRef = useRef(null);

  // Clinical & Functional Metrics States
  const [rom, setRom] = useState(120);
  const [strength, setStrength] = useState(4);
  const [walking, setWalking] = useState(7);
  const [stairs, setStairs] = useState(6);
  const [running, setRunning] = useState(4);

  useEffect(() => {
    loadPatients();
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setIsSpeechSupported(false);
    }
  }, [isMockMode]);

  const loadPatients = async () => {
    if (isMockMode) {
      setPatients(mockPatients);
      setLoadingPatients(false);
      return;
    }
    try {
      setLoadingPatients(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient');
      if (error) throw error;
      
      setPatients((data || []).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone || 'לא עודכן',
        avatar: p.avatar || '🏃',
        avatarBg: '#8B5CF6',
        sport: 'פיילוט פעיל',
        conditionHe: p.condition_name || 'שיקום פיזיותרפיה',
        condition: 'Active Rehab Profile',
        area: p.is_lower_limb ? 'גפה תחתונה' : 'גפה עליונה',
        areaColor: p.is_lower_limb ? '#06B6D4' : '#8B5CF6',
        isLowerLimb: p.is_lower_limb
      })));
    } catch (err) {
      console.error('Error loading patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRecording, isPaused]);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    if (isRecording && !isPaused) {
      setRecognitionError('');
      
      if (!recognitionRef.current) {
        const rec = new Recognition();
        rec.lang = 'he-IL';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscriptionText(finalTranscript + interimTranscript);
        };

        rec.onerror = (e) => {
          console.error('Speech recognition error:', e);
          if (e.error === 'not-allowed') {
            setRecognitionError('הגישה למיקרופון נחסמה. נא לאפשר גישה למיקרופון בהגדרות הדפדפן.');
          } else {
            setRecognitionError(`שגיאת תמלול: ${e.error}`);
          }
        };

        rec.onend = () => {
          // Automatically restart if we're still recording
          if (isRecording && !isPaused) {
            try {
              rec.start();
            } catch (err) {
              console.error('Failed to restart speech recognition:', err);
            }
          }
        };

        recognitionRef.current = rec;
      }

      try {
        recognitionRef.current.start();
      } catch (err) {
        // Already started
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Already stopped
        }
      }
    }

    return () => {
      // Cleanup on unmount
    };
  }, [isRecording, isPaused]);

  // Set default values based on patient
  useEffect(() => {
    if (selectedPatient) {
      if (selectedPatient.id === 'p1') {
        setRom(135);
        setStrength(4);
        setWalking(8);
        setStairs(7);
        setRunning(5);
      } else if (selectedPatient.id === 'p4') {
        setRom(130);
        setStrength(4);
        setWalking(8);
        setStairs(8);
        setRunning(6);
      } else {
        setRom(120);
        setStrength(4);
      }
    }
  }, [selectedPatient]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setShowConsent(true);
  };

  const handleConsentAccept = () => {
    setShowConsent(false);
    setTranscriptionText('');
    setStep('recording');
    setIsRecording(true);
  };

  const handleConsentDecline = () => {
    setShowConsent(false);
    setSelectedPatient(null);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsPaused(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setStep('processing');

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (transcriptionText.trim()) {
      const formattedSummary = `סיכום ביקור פיזיותרפיה (תמלול קולי)

מטופל: ${selectedPatient?.name || 'פיילוט'}
תאריך הטיפול: ${new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
אופן התיעוד: הקלטת קול ותמלול אוטומטי בזמן אמת

סיכום המפגש הקליני:
"${transcriptionText.trim()}"

הערות והנחיות המשך:
המדדים עודכנו בהצלחה במערכת בהתאם לקביעת הפיזיותרפיסט.`;
      setSummary(formattedSummary);
    } else {
      const result = await simulateTranscription();
      // Customize the mock result to show the selected patient name rather than Yuval/Michal!
      const customizedSummary = result.summary
        .replace(/יובל כהן/g, selectedPatient?.name || 'יובל כהן')
        .replace(/מיכל לוי/g, selectedPatient?.name || 'מיכל לוי')
        .replace(/אלון ברק/g, selectedPatient?.name || 'אלון ברק');
      setSummary(customizedSummary);
    }
    
    setStep('result');
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (selectedPatient) {
      if (isMockMode) {
        const patient = mockPatients.find(p => p.id === selectedPatient.id);
        if (patient) {
          if (!patient.metricsHistory) {
            patient.metricsHistory = [];
          }
          const newMetric = {
            date: new Date().toISOString().slice(0, 10),
            rom: Number(rom),
            strength: Number(strength),
            ...(patient.isLowerLimb ? {
              walking: Number(walking),
              stairs: Number(stairs),
              running: Number(running)
            } : {})
          };
          patient.metricsHistory.push(newMetric);
        }
      } else {
        try {
          // 1. Insert session record
          const { error: sessError } = await supabase
            .from('sessions')
            .insert({
              patient_id: selectedPatient.id,
              therapist_id: user?.id || selectedPatient.id, // fallback
              date: new Date().toISOString(),
              duration: Math.ceil(timer / 60) || 45,
              type: 'הקלטת AI',
              summary: summary,
              recorded: true
            });
          if (sessError) throw sessError;

          // 2. Insert metrics inside journals table
          const { error: journError } = await supabase
            .from('journals')
            .insert({
              patient_id: selectedPatient.id,
              date: new Date().toISOString().slice(0, 10),
              pain_level: 4, // Default/fallback
              activity: 'טיפול פיזיותרפיה (AI)',
              notes: `מדדים קליניים שנמדדו: ROM: ${rom}°, כוח שריר: ${strength}/5.` + 
                (selectedPatient.isLowerLimb ? ` הליכה: ${walking}/10, מדרגות: ${stairs}/10, ריצה: ${running}/10.` : ''),
              walking_score: selectedPatient.isLowerLimb ? Number(walking) : null,
              stairs_score: selectedPatient.isLowerLimb ? Number(stairs) : null,
              running_score: selectedPatient.isLowerLimb ? Number(running) : null,
            });
          if (journError) throw journError;

          alert('הטיפול והמדדים נשמרו בהצלחה במערכת!');
        } catch (err) {
          console.error('Error saving recorded session:', err);
          alert('שגיאה בשמירת הטיפול: ' + err.message);
        }
      }
    }
    navigate(`/therapist/patients/${selectedPatient?.id || 'p1'}`);
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/therapist')}>
        <ArrowRight size={18} /> חזרה לדשבורד
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Mic size={28} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} />
            הקלטת טיפול
          </h1>
          <p className="page-subtitle">
            {step === 'select' && 'בחר מטופל להתחלת הקלטה'}
            {step === 'recording' && 'ההקלטה פעילה'}
            {step === 'processing' && 'מעבד את ההקלטה...'}
            {step === 'result' && 'סיכום הטיפול מוכן'}
          </p>
        </div>
      </div>

      {/* Step 1: Select Patient */}
      {step === 'select' && (
        <div className="animate-fade-in-up">
          <h2 className="section-title">בחר מטופל</h2>
          {loadingPatients ? (
            <div className="empty-state py-12">
              <LoadingSpinner />
              <p className="text-secondary mt-2">טוען רשימת מטופלים...</p>
            </div>
          ) : patients.length > 0 ? (
            <div className="patients-grid">
              {patients.map((patient, i) => (
                <button
                  key={patient.id}
                  className="card card-hover card-compact animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms`, cursor: 'pointer', border: 'none', textAlign: 'start', width: '100%' }}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar" style={{ background: patient.avatarBg }}>
                      {patient.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{patient.name}</div>
                      <div className="text-xs text-secondary">{patient.conditionHe}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state py-12">
              <p className="text-secondary">אין מטופלים רשומים כרגע במערכת.</p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Recording */}
      {step === 'recording' && (
        <div className="recording-screen animate-fade-in-up">
          <div className="glass-card text-center" style={{ padding: 'var(--space-10)' }}>
            {/* Patient info */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="avatar avatar-lg" style={{ background: selectedPatient?.avatarBg }}>
                {selectedPatient?.avatar}
              </div>
              <div className="text-start">
                <div className="text-lg font-bold">{selectedPatient?.name}</div>
                <div className="text-sm text-secondary">{selectedPatient?.conditionHe}</div>
              </div>
            </div>

            {/* Recording indicator */}
            <div className="recording-status mb-6">
              <div className="flex items-center justify-center gap-3">
                {isRecording && !isPaused && <div className="recording-indicator" />}
                <span className="text-sm font-medium" style={{ color: isRecording && !isPaused ? '#EF4444' : 'var(--text-secondary)' }}>
                  {isPaused ? 'מושהה' : 'מקליט'}
                </span>
              </div>
            </div>

            {/* Timer */}
            <div className="recording-timer text-4xl font-bold mb-6" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.1em' }}>
              {formatTime(timer)}
            </div>

            {/* Waveform */}
            <div className="mb-8">
              <WaveformAnimation isActive={isRecording && !isPaused} barCount={24} />
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <button
                className="btn btn-round btn-ghost"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play size={24} /> : <Pause size={24} />}
              </button>
              <button
                className="btn btn-round btn-danger"
                onClick={handleStopRecording}
                style={{ width: 72, height: 72 }}
              >
                <Square size={28} />
              </button>
            </div>

            <p className="text-xs text-muted mt-6">
              לחץ על הכפתור האדום לסיום ההקלטה ויצירת סיכום אוטומטי
            </p>

            {/* Real-time transcription preview */}
            {!isSpeechSupported && (
              <div 
                style={{ 
                  background: 'rgba(245, 158, 11, 0.08)', 
                  border: '1px solid rgba(245, 158, 11, 0.2)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: 'var(--space-3)', 
                  marginTop: 'var(--space-5)', 
                  textAlign: 'right',
                  fontSize: '13px',
                  color: '#F59E0B',
                  lineHeight: 1.5,
                  direction: 'rtl'
                }}
              >
                ⚠️ הדפדפן הנוכחי אינו תומך בתמלול קולי חי בזמן אמת (נתמך ב-Chrome, Safari, Edge). המערכת תסמלץ סיכום טיפול אוטומטי בסיום ההקלטה.
              </div>
            )}

            {recognitionError && (
              <div 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.08)', 
                  border: '1px solid rgba(239, 68, 68, 0.2)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: 'var(--space-3)', 
                  marginTop: 'var(--space-5)', 
                  textAlign: 'right',
                  fontSize: '13px',
                  color: '#EF4444',
                  lineHeight: 1.5,
                  direction: 'rtl'
                }}
              >
                ⚠️ {recognitionError}
              </div>
            )}

            {transcriptionText && (
              <div 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: 'var(--space-3)', 
                  marginTop: 'var(--space-5)', 
                  textAlign: 'right',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  direction: 'rtl'
                }}
              >
                <div className="font-bold text-xs text-muted mb-1" style={{ color: 'var(--color-primary-light)' }}>
                  🎙️ תמלול בזמן אמת (דיבור לקול):
                </div>
                <div>{transcriptionText}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Processing */}
      {step === 'processing' && (
        <div className="processing-screen animate-fade-in text-center" style={{ padding: 'var(--space-16) 0' }}>
          <div className="animate-float mb-6">
            <Sparkles size={48} style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <h2 className="text-xl font-bold mb-2">מעבד את ההקלטה</h2>
          <p className="text-secondary mb-6">
            מתמלל וממצא מונחים רפואיים...
          </p>
          <LoadingSpinner size={48} />
          <div className="processing-steps mt-8">
            <div className="processing-step completed">
              <CheckCircle size={16} style={{ color: '#10B981' }} />
              <span className="text-sm">העלאת הקלטה</span>
            </div>
            <div className="processing-step active">
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--color-primary-light)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              <span className="text-sm">תמלול (Whisper AI)</span>
            </div>
            <div className="processing-step">
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
              <span className="text-sm text-muted">סיכום מקצועי (GPT-4)</span>
            </div>
            <div className="processing-step">
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
              <span className="text-sm text-muted">זיהוי מונחים רפואיים</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 'result' && summary && (
        <div className="result-screen animate-fade-in-up">
          <div className="card mb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} style={{ color: 'var(--color-primary-light)' }} />
                <h2 className="section-title" style={{ marginBottom: 0 }}>סיכום טיפול (AI)</h2>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                  <Copy size={14} />
                  {copied ? 'הועתק!' : 'העתק'}
                </button>
                <button className="btn btn-ghost btn-sm">
                  <Download size={14} />
                  ייצוא
                </button>
              </div>
            </div>
            <pre className="session-summary">{summary}</pre>
          </div>

          {/* Clinical & Functional Metrics Card */}
          <div className="card mb-4">
            <h3 className="section-title flex items-center gap-2">
              <Activity size={18} style={{ color: 'var(--color-primary-light)' }} />
              מדדי הערכה קליניים למפגש זה
            </h3>
            
            <div className="flex flex-col gap-4 mt-4">
              {/* ROM */}
              <div>
                <label className="flex justify-between text-sm font-semibold mb-1">
                  <span>טווחי תנועה (ROM)</span>
                  <span style={{ color: '#06B6D4' }}>{rom}°</span>
                </label>
                <input
                  type="range" min="0" max="180" value={rom}
                  onChange={(e) => setRom(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: '#06B6D4' }}
                />
              </div>

              {/* Muscle Strength */}
              <div>
                <label className="flex justify-between text-sm font-semibold mb-2">
                  <span>כוח שריר (סולם MRC 0-5)</span>
                  <span style={{ color: '#8B5CF6' }}>{strength}/5</span>
                </label>
                <div className="flex gap-2 justify-between">
                  {[0, 1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`btn btn-sm ${strength === val ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setStrength(val)}
                      style={{
                        flex: 1,
                        background: strength === val ? '#8B5CF6' : undefined,
                        borderColor: strength === val ? '#8B5CF6' : undefined,
                        color: strength === val ? 'white' : undefined,
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lower limb section if applicable */}
              {selectedPatient?.isLowerLimb && (
                <div className="border-t pt-4 mt-2" style={{ borderColor: 'var(--border-color)' }}>
                  <h4 className="text-sm font-bold mb-3" style={{ color: '#10B981' }}>מדדי גפה תחתונה</h4>
                  
                  <div className="flex flex-col gap-3">
                    {/* Walking */}
                    <div>
                      <label className="flex justify-between text-xs text-secondary mb-1">
                        <span>איכות הליכה</span>
                        <span>{walking}/10</span>
                      </label>
                      <input
                        type="range" min="0" max="10" value={walking}
                        onChange={(e) => setWalking(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: '#10B981' }}
                      />
                    </div>

                    {/* Stairs */}
                    <div>
                      <label className="flex justify-between text-xs text-secondary mb-1">
                        <span>עליית/ירידת מדרגות</span>
                        <span>{stairs}/10</span>
                      </label>
                      <input
                        type="range" min="0" max="10" value={stairs}
                        onChange={(e) => setStairs(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: '#10B981' }}
                      />
                    </div>

                    {/* Running */}
                    <div>
                      <label className="flex justify-between text-xs text-secondary mb-1">
                        <span>יכולת ריצה</span>
                        <span>{running}/10</span>
                      </label>
                      <input
                        type="range" min="0" max="10" value={running}
                        onChange={(e) => setRunning(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: '#10B981' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn btn-primary btn-lg w-full" onClick={handleSave}>
              <FileText size={18} />
              שמור ועבור לפרופיל
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => {
              setStep('select');
              setTimer(0);
              setSummary(null);
              setSelectedPatient(null);
            }}>
              הקלטה חדשה
            </button>
          </div>
        </div>
      )}

      {/* Consent Modal */}
      <ConsentModal
        isOpen={showConsent}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </div>
  );
}
