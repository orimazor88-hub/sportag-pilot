// === Shared UI Components ===
import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Mic, X, CheckCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Search, Play, Camera, Video
} from 'lucide-react';

// --- Pain Scale ---
export function PainScale({ value, onChange, size = 'default' }) {
  const getColor = (level) => {
    if (level <= 2) return '#10B981';
    if (level <= 4) return '#22D3EE';
    if (level <= 6) return '#F59E0B';
    if (level <= 8) return '#EF4444';
    return '#DC2626';
  };

  const getEmoji = (level) => {
    if (level === 0) return '😊';
    if (level <= 2) return '🙂';
    if (level <= 4) return '😐';
    if (level <= 6) return '😣';
    if (level <= 8) return '😫';
    return '😭';
  };

  const sizeClass = size === 'small' ? 'pain-level-sm' : '';

  return (
    <div className="pain-scale-wrapper">
      <div className="pain-scale">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
          <button
            key={level}
            className={`pain-level ${sizeClass} ${value === level ? 'selected' : ''}`}
            style={{
              borderColor: value === level ? getColor(level) : undefined,
              background: value === level ? `${getColor(level)}20` : undefined,
              color: value === level ? getColor(level) : undefined,
            }}
            onClick={() => onChange?.(level)}
          >
            {level}
          </button>
        ))}
      </div>
      {value !== null && value !== undefined && (
        <div className="pain-scale-label" style={{ color: getColor(value) }}>
          <span className="pain-emoji">{getEmoji(value)}</span>
          <span>{value}/10</span>
        </div>
      )}
    </div>
  );
}

// --- Stats Card ---
export function StatsCard({ icon: Icon, value, label, color, trend, className = '' }) {
  return (
    <div className={`stat-card ${className}`}>
      <div
        className="stat-icon"
        style={{ background: `${color}20`, color: color }}
      >
        <Icon size={22} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {trend && (
        <div
          className="stat-trend"
          style={{ color: trend > 0 ? '#10B981' : '#EF4444' }}
        >
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

// --- Patient Card ---
export function PatientCard({ patient, onClick, compact = false }) {
  return (
    <div
      className={`card card-hover patient-card ${compact ? 'card-compact' : ''}`}
      onClick={() => onClick?.(patient)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex items-center gap-3">
        <div
          className={compact ? 'avatar avatar-sm' : 'avatar'}
          style={{ background: patient.avatarBg }}
        >
          {patient.avatar}
        </div>
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="font-semibold truncate">{patient.name}</div>
          <div className="text-xs text-secondary">{patient.conditionHe}</div>
        </div>
        <div className="flex flex-col items-center gap-1" style={{ alignItems: 'flex-end' }}>
          <span
            className="badge"
            style={{
              background: `${patient.areaColor}20`,
              color: patient.areaColor,
            }}
          >
            {patient.area}
          </span>
          {!compact && (
            <div className="text-xs text-muted">VAS: {patient.painLevel}/10</div>
          )}
        </div>
      </div>
      {!compact && (
        <>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-secondary">התקדמות</span>
              <span className="font-semibold" style={{ color: '#10B981' }}>
                {patient.progress}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${patient.progress}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Exercise Card ---
export function ExerciseCard({ exercise, onComplete, completed = false }) {
  const { uploads, setUploads } = useAuth();
  const [isDone, setIsDone] = useState(completed);
  const [activeMedia, setActiveMedia] = useState(null);
  const [showTherapistUpload, setShowTherapistUpload] = useState(false);
  const [therapistNote, setTherapistNote] = useState('');
  
  const therapistFileInputRef = useRef(null);

  const handleComplete = () => {
    setIsDone(!isDone);
    onComplete?.(!isDone);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const isPatient = location.pathname.startsWith('/patient');

  const handleTherapistUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Temporary blob URL for instant preview in current session
    const previewUrl = URL.createObjectURL(file);
    
    // Fallback URL for persistence
    const persistedUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';

    const newUpload = {
      id: Date.now(),
      type: 'video',
      name: file.name || 'visit_video.mp4',
      title: `הדגמת ביקור - ${exercise.nameHe}`,
      exerciseId: exercise.id,
      uploadedBy: 'therapist',
      date: new Date().toISOString().split('T')[0],
      note: therapistNote.trim() || 'הנחיות ביצוע שנקבעו בקליניקה',
      previewUrl,
      persistedUrl,
    };

    setUploads(prev => [newUpload, ...prev]);
    setShowTherapistUpload(false);
    setTherapistNote('');
  };

  const exerciseUploads = (uploads || []).filter(item => item.exerciseId === exercise.id);
  const clinicVideos = exerciseUploads.filter(item => item.uploadedBy === 'therapist');
  const latestClinicVideo = clinicVideos[0]; // The most recent therapist video

  const getMediaSrc = (file) => {
    if (file.previewUrl) return file.previewUrl;
    if (file.persistedUrl) return file.persistedUrl;
    if (file.id === 1 || file.id === 3) {
      return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80';
    }
    if (file.id === 2) {
      return 'https://www.w3schools.com/html/mov_bbb.mp4';
    }
    return '';
  };

  const isNew = exercise.assignedDate && 
    (new Date('2026-06-07') - new Date(exercise.assignedDate)) / (1000 * 60 * 60 * 24) <= 3;

  return (
    <div className={`card card-compact exercise-card ${isDone ? 'exercise-done' : ''}`}>
      <input
        type="file"
        ref={therapistFileInputRef}
        style={{ display: 'none' }}
        accept="video/*"
        onChange={handleTherapistUpload}
      />

      <div className="flex items-center gap-3">
        <div
          className="exercise-indicator"
          style={{ background: exercise.categoryColor }}
        />
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{exercise.nameHe}</span>
            {isNew && (
              <span className="badge badge-success text-xs font-bold" style={{ padding: '2px 6px', fontSize: '10px' }}>
                חדש!
              </span>
            )}
          </div>
          <div className="text-xs text-muted">
            {exercise.name} {exercise.assignedDate && `• שויך ב-${new Date(exercise.assignedDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}`}
          </div>
        </div>
      </div>
      <div className="exercise-details mt-3">
        <span className="badge badge-primary">{exercise.sets} סטים</span>
        <span className="badge badge-teal">{exercise.reps} חזרות</span>
        {exercise.holdTime && (
          <span className="badge badge-warning">החזקה {exercise.holdTime}״</span>
        )}
        <span className="badge" style={{ background: 'rgba(148,163,184,0.1)', color: 'var(--text-secondary)' }}>
          {exercise.frequency}
        </span>
      </div>
      <p className="text-xs text-secondary mt-2" style={{ lineHeight: 1.6 }}>
        {exercise.description}
      </p>

      {/* Clinic Visit Videos (Demonstrations from therapist) */}
      {clinicVideos.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="text-xs font-bold text-secondary">
            📹 סרטוני הדגמה והנחיות מהקליניקה:
          </div>
          {clinicVideos.map((video) => (
            <div 
              key={video.id}
              onClick={() => setActiveMedia(video)}
              className="card card-compact card-hover flex-row items-center gap-3 animate-fade-in"
              style={{ 
                padding: 'var(--space-2)', 
                background: 'var(--bg-tertiary)', 
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                margin: 0
              }}
            >
              <div style={{ width: 60, height: 45, borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt="visit preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={14} style={{ color: 'white' }} />
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={10} style={{ color: 'white' }} />
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="font-bold text-xs" style={{ color: 'var(--color-primary-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>סרטון הדגמה מהביקור</span>
                  <span className="text-muted" style={{ fontSize: '9px', fontWeight: 'normal' }}>{new Date(video.date).toLocaleDateString('he-IL')}</span>
                </div>
                <div className="text-secondary text-xs truncate" style={{ fontSize: '10px' }} title={video.note}>
                  דגשים: {video.note}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button for therapist */}
      {!isPatient && (
        <div className="mt-3">
          {showTherapistUpload ? (
            <div className="card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: 'var(--space-3)' }}>
              <div className="input-group mb-3">
                <label className="input-label text-xs font-bold mb-1">הנחיות ודגשים למטופל (יופיעו לצד הוידאו בבית):</label>
                <input 
                  type="text"
                  className="input input-sm text-xs"
                  value={therapistNote}
                  onChange={(e) => setTherapistNote(e.target.value)}
                  placeholder="למשל: לרדת לאט, לשמור על יציבה ישרה..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn btn-xs btn-ghost" onClick={() => setShowTherapistUpload(false)}>
                  ביטול
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-primary"
                  onClick={() => therapistFileInputRef.current?.click()}
                  disabled={!therapistNote.trim()}
                >
                  בחר/צלם וידאו והעלה
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => setShowTherapistUpload(true)}
              style={{
                border: '1px dashed var(--border-color)',
                color: 'var(--color-primary-light)',
                padding: 'var(--space-2) var(--space-3)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              <Camera size={14} />
              ➕ צלם/העלה וידאו ביקור מהקליניקה
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          className={`btn ${isDone ? 'btn-success' : 'btn-ghost'} flex-1`}
          onClick={handleComplete}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            border: isDone ? 'none' : '2px solid var(--color-success)',
            color: isDone ? 'white' : 'var(--color-success)',
          }}
        >
          <CheckCircle size={18} />
          {isDone ? 'בוצע! ✓' : 'סמן כבוצע'}
        </button>

        {latestClinicVideo && (
          <button
            className="btn flex-1"
            onClick={() => setActiveMedia(latestClinicVideo)}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-teal) 100%)',
              color: 'white',
              border: 'none',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Play size={16} />
            הפעל סרטון תרגול
          </button>
        )}
      </div>

      {/* Lightbox Media Viewer Modal inside ExerciseCard */}
      {activeMedia && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            direction: 'rtl'
          }}
          onClick={() => setActiveMedia(null)}
        >
          <div 
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 border-b border-color pb-2">
              <div>
                <h4 className="font-bold text-sm text-primary truncate" style={{ maxWidth: '350px' }}>
                  {activeMedia.title || activeMedia.name}
                </h4>
                <span className="text-xs text-muted">
                  הועלה ב-{new Date(activeMedia.date).toLocaleDateString('he-IL')}
                </span>
              </div>
              <button 
                className="btn btn-icon btn-ghost" 
                onClick={() => setActiveMedia(null)}
                style={{ width: 28, height: 28 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'black', 
              borderRadius: 'var(--radius-md)', 
              overflow: 'hidden', 
              minHeight: '220px',
              maxHeight: '40vh',
              position: 'relative'
            }}>
              {activeMedia.type === 'image' ? (
                <img 
                  src={getMediaSrc(activeMedia)} 
                  alt={activeMedia.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
              ) : (
                <video 
                  src={getMediaSrc(activeMedia)} 
                  controls
                  autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>

            {activeMedia.note && (
              <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-3)' }}>
                <div className="text-xs text-muted font-bold mb-1">
                  {activeMedia.uploadedBy === 'therapist' ? 'הנחיית המטפל:' : 'הערת מטופל:'}
                </div>
                <p className="text-xs text-secondary" style={{ lineHeight: 1.4 }}>{activeMedia.note}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Consent Modal ---
export function ConsentModal({ isOpen, onAccept, onDecline }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onDecline}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="consent-icon">
          <Shield size={36} />
        </div>
        <h2 className="text-xl font-bold text-center mb-4">הסכמה להקלטת טיפול</h2>
        <div className="consent-text">
          <p className="text-sm text-secondary mb-4" style={{ lineHeight: 1.8 }}>
            הטיפול עומד להיות מוקלט לצורך תיעוד מקצועי וסיכום אוטומטי.
          </p>
          <div className="consent-points">
            <div className="consent-point">
              <CheckCircle size={16} style={{ color: '#10B981', flexShrink: 0 }} />
              <span className="text-sm">ההקלטה תשמש אך ורק לסיכום הטיפול</span>
            </div>
            <div className="consent-point">
              <CheckCircle size={16} style={{ color: '#10B981', flexShrink: 0 }} />
              <span className="text-sm">ההקלטה תימחק לאחר העיבוד</span>
            </div>
            <div className="consent-point">
              <CheckCircle size={16} style={{ color: '#10B981', flexShrink: 0 }} />
              <span className="text-sm">ניתן לעצור את ההקלטה בכל רגע</span>
            </div>
            <div className="consent-point">
              <AlertTriangle size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <span className="text-sm">נדרשת הסכמת המטופל לפני ההקלטה</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="btn btn-primary btn-lg w-full" onClick={onAccept}>
            <Mic size={18} />
            אישור והתחלת הקלטה
          </button>
          <button className="btn btn-ghost btn-lg" onClick={onDecline}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Waveform Animation ---
export function WaveformAnimation({ isActive = true, barCount = 20 }) {
  return (
    <div className="waveform">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            height: isActive ? `${12 + Math.random() * 36}px` : '4px',
            animationDelay: `${i * 0.08}s`,
            animationDuration: `${0.6 + Math.random() * 0.8}s`,
            opacity: isActive ? 1 : 0.3,
            transition: 'height 0.3s, opacity 0.3s',
          }}
        />
      ))}
    </div>
  );
}

// --- Role Switcher (Demo) ---
export function RoleSwitcher({ currentRole, onSwitch }) {
  return (
    <button
      className="role-switcher btn btn-ghost btn-sm"
      onClick={onSwitch}
      title="החלף תצוגה (דמו)"
    >
      <span className="role-switcher-icon">
        {currentRole === 'therapist' ? '👨‍⚕️' : '🏃'}
      </span>
      <span className="hide-mobile">
        {currentRole === 'therapist' ? 'עבור למטופל' : 'עבור למטפל'}
      </span>
    </button>
  );
}

// --- Search Bar ---
export function SearchBar({ value, onChange, placeholder = 'חיפוש...' }) {
  return (
    <div className="search-bar">
      <Search />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// --- Body Map (Simplified SVG) ---
export function BodyMap({ selectedArea, onSelectArea }) {
  const areas = [
    { id: 'head', label: 'ראש', x: 150, y: 30, r: 25 },
    { id: 'neck', label: 'צוואר', x: 150, y: 70, r: 15 },
    { id: 'shoulder-r', label: 'כתף ימין', x: 110, y: 100, r: 20 },
    { id: 'shoulder-l', label: 'כתף שמאל', x: 190, y: 100, r: 20 },
    { id: 'chest', label: 'חזה', x: 150, y: 120, r: 25 },
    { id: 'upper-back', label: 'גב עליון', x: 150, y: 130, r: 20 },
    { id: 'elbow-r', label: 'מרפק ימין', x: 85, y: 155, r: 14 },
    { id: 'elbow-l', label: 'מרפק שמאל', x: 215, y: 155, r: 14 },
    { id: 'lower-back', label: 'גב תחתון', x: 150, y: 175, r: 22 },
    { id: 'hip-r', label: 'ירך ימין', x: 125, y: 210, r: 18 },
    { id: 'hip-l', label: 'ירך שמאל', x: 175, y: 210, r: 18 },
    { id: 'wrist-r', label: 'שורש כף יד ימין', x: 70, y: 200, r: 12 },
    { id: 'wrist-l', label: 'שורש כף יד שמאל', x: 230, y: 200, r: 12 },
    { id: 'knee-r', label: 'ברך ימין', x: 125, y: 275, r: 16 },
    { id: 'knee-l', label: 'ברך שמאל', x: 175, y: 275, r: 16 },
    { id: 'ankle-r', label: 'קרסול ימין', x: 125, y: 345, r: 13 },
    { id: 'ankle-l', label: 'קרסול שמאל', x: 175, y: 345, r: 13 },
  ];

  return (
    <div className="body-map-container">
      <svg viewBox="0 0 300 380" className="body-map-svg">
        {/* Body outline */}
        <ellipse cx="150" cy="30" rx="22" ry="26" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1.5" />
        <rect x="135" y="56" width="30" height="20" rx="8" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1.5" />
        <ellipse cx="150" cy="130" rx="45" ry="55" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1.5" />
        {/* Arms */}
        <path d="M105 95 Q75 140 70 200" fill="none" stroke="var(--border-color)" strokeWidth="12" strokeLinecap="round" style={{ opacity: 0.3 }} />
        <path d="M195 95 Q225 140 230 200" fill="none" stroke="var(--border-color)" strokeWidth="12" strokeLinecap="round" style={{ opacity: 0.3 }} />
        {/* Legs */}
        <path d="M130 185 Q125 250 125 350" fill="none" stroke="var(--border-color)" strokeWidth="14" strokeLinecap="round" style={{ opacity: 0.3 }} />
        <path d="M170 185 Q175 250 175 350" fill="none" stroke="var(--border-color)" strokeWidth="14" strokeLinecap="round" style={{ opacity: 0.3 }} />

        {/* Clickable areas */}
        {areas.map((area) => (
          <g key={area.id} onClick={() => onSelectArea?.(area.id)} style={{ cursor: 'pointer' }}>
            <circle
              cx={area.x}
              cy={area.y}
              r={area.r}
              fill={selectedArea === area.id ? 'rgba(226, 34, 121, 0.3)' : 'transparent'}
              stroke={selectedArea === area.id ? '#E22279' : 'transparent'}
              strokeWidth="2"
              className="body-map-area"
            />
            {selectedArea === area.id && (
              <text
                x={area.x}
                y={area.y + 4}
                textAnchor="middle"
                fill="#E22279"
                fontSize="10"
                fontWeight="600"
                fontFamily="Heebo"
              >
                {area.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// --- Loading Spinner ---
export function LoadingSpinner({ size = 40, color = 'var(--color-primary-light)' }) {
  return (
    <div className="flex justify-center items-center p-6">
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid var(--border-color)`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}
