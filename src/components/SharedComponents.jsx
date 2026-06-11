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
  const clinicVideos = [...exerciseUploads.filter(item => item.uploadedBy === 'therapist')];

  const exerciseVideoUrl = exercise.videoUrl || exercise.video_url;
  if (exerciseVideoUrl) {
    if (!clinicVideos.some(v => v.persistedUrl === exerciseVideoUrl || v.previewUrl === exerciseVideoUrl)) {
      clinicVideos.unshift({
        id: `db-video-${exercise.id}`,
        type: 'video',
        name: 'exercise_demo.mp4',
        title: 'סרטון הדגמה מצורף',
        exerciseId: exercise.id,
        uploadedBy: 'therapist',
        date: exercise.assignedDate || new Date().toISOString().split('T')[0],
        note: exercise.description || 'הנחיות ביצוע שנקבעו בקליניקה',
        persistedUrl: exerciseVideoUrl,
      });
    }
  }

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

// --- Pain Location Translation Map ---
export const PAIN_LOCATION_MAP = {
  'head': 'ראש',
  'neck': 'צוואר',
  'chest': 'חזה',
  'upper-back': 'גב עליון',
  'lower-back': 'גב תחתון',
  'shoulder-r': 'כתף ימין',
  'shoulder-l': 'כתף שמאל',
  'elbow-r': 'מרפק ימין',
  'elbow-l': 'מרפק שמאל',
  'wrist-r': 'שורש כף יד ימין',
  'wrist-l': 'שורש כף יד שמאל',
  
  // Right Knee sub-locations
  'knee-r': 'ברך ימין (כללי)',
  'knee-r:patella': 'ברך ימין (פיקה קדמית)',
  'knee-r:patellar-tendon': 'ברך ימין (גיד הפיקה - ברך תחתונה)',
  'knee-r:quad-tendon': 'ברך ימין (גיד הארבע ראשי - ברך עליונה)',
  'knee-r:medial-side': 'ברך ימין (צד פנימי - מדיאלי)',
  'knee-r:lateral-side': 'ברך ימין (צד חיצוני - לטרלי)',
  'knee-r:back-knee': 'ברך ימין (קפל הברך - אחורי)',
  
  // Left Knee sub-locations
  'knee-l': 'ברך שמאל (כללי)',
  'knee-l:patella': 'ברך שמאל (פיקה קדמית)',
  'knee-l:patellar-tendon': 'ברך שמאל (גיד הפיקה - ברך תחתונה)',
  'knee-l:quad-tendon': 'ברך שמאל (גיד הארבע ראשי - ברך עליונה)',
  'knee-l:medial-side': 'ברך שמאל (צד פנימי - מדיאלי)',
  'knee-l:lateral-side': 'ברך שמאל (צד חיצוני - לטרלי)',
  'knee-l:back-knee': 'ברך שמאל (קפל הברך - אחורי)',

  // Right Hip sub-locations
  'hip-r': 'ירך ימין (כללי)',
  'hip-r:anterior': 'ירך ימין (קדמי / מפרק הירך)',
  'hip-r:lateral': 'ירך ימין (צד חיצוני / טרוכנטר)',
  'hip-r:posterior': 'ירך ימין (אחורי / ישבן)',
  
  // Left Hip sub-locations
  'hip-l': 'ירך שמאל (כללי)',
  'hip-l:anterior': 'ירך שמאל (קדמי / מפרק הירך)',
  'hip-l:lateral': 'ירך שמאל (צד חיצוני / טרוכנטר)',
  'hip-l:posterior': 'ירך שמאל (אחורי / ישבן)',

  // Right Ankle sub-locations
  'ankle-r': 'קרסול ימין (כללי)',
  'ankle-r:lateral': 'קרסול ימין (צד חיצוני / לטרלי)',
  'ankle-r:medial': 'קרסול ימין (צד פנימי / מדיאלי)',
  'ankle-r:achilles': 'קרסול ימין (גיד אכילס - אחורי)',
  'ankle-r:plantar': 'קרסול ימין (כף הרגל - מלמטה)',

  // Left Ankle sub-locations
  'ankle-l': 'קרסול שמאל (כללי)',
  'ankle-l:lateral': 'קרסול שמאל (צד חיצוני / לטרלי)',
  'ankle-l:medial': 'קרסול שמאל (צד פנימי / מדיאלי)',
  'ankle-l:achilles': 'קרסול שמאל (גיד אכילס - אחורי)',
  'ankle-l:plantar': 'קרסול שמאל (כף הרגל - מלמטה)',
};

// Reusable sub-joint SVG renderers
function renderKneeSVG({ parentArea, subArea, onSelect, isReadOnly = false, size = 150 }) {
  const isRightKnee = parentArea === 'knee-r';
  const leftElementId = isRightKnee ? 'lateral-side' : 'medial-side';
  const rightElementId = isRightKnee ? 'medial-side' : 'lateral-side';

  const glowId = isReadOnly ? 'glow-pain' : 'glow-active';
  const strokeColor = isReadOnly ? '#EF4444' : '#FF3D94';
  const fillColor = isReadOnly ? 'rgba(239, 68, 68, 0.5)' : 'rgba(226, 34, 121, 0.4)';

  const getAreaStyles = (id) => ({
    cursor: isReadOnly ? 'default' : 'pointer',
    transition: 'all 0.2s',
    fill: subArea === id ? fillColor : 'rgba(255, 255, 255, 0.05)',
    stroke: subArea === id ? strokeColor : 'var(--border-color)',
    strokeWidth: subArea === id ? 2.5 : 1.5,
    filter: subArea === id ? `url(#${glowId})` : undefined
  });

  const getBadgeFill = (id) => (subArea === id ? (isReadOnly ? '#EF4444' : 'var(--color-accent)') : 'rgba(15, 23, 42, 0.75)');
  const getBadgeTextFill = (id) => (subArea === id ? 'white' : 'var(--text-primary)');
  const getBadgeStroke = (id) => (subArea === id ? 'white' : 'var(--border-color)');

  return (
    <svg viewBox="0 0 200 240" style={{ width: size, height: size * 1.2, overflow: 'visible' }}>
      <defs>
        <filter id="glow-active" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ff3d94" floodOpacity="0.85" />
        </filter>
        <filter id="glow-pain" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#EF4444" floodOpacity="0.85" />
        </filter>
      </defs>

      {/* Bones */}
      <path d="M85 10 C85 50, 70 70, 70 90 C70 100, 85 110, 95 105 C105 105, 120 100, 130 90 C130 70, 115 50, 115 10" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1.5" />
      <path d="M75 230 C75 180, 80 150, 80 135 C80 125, 120 125, 120 135 C120 150, 125 180, 125 230" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1.5" />
      
      {/* Fibula */}
      {isRightKnee ? (
        <path d="M60 230 C60 190, 65 170, 65 160 C65 155, 75 155, 75 160 C75 170, 70 190, 70 230" fill="var(--bg-tertiary)" style={{ opacity: 0.5 }} stroke="var(--border-color)" strokeWidth="1" />
      ) : (
        <path d="M140 230 C140 190, 135 170, 135 160 C135 155, 125 155, 125 160 C125 170, 130 190, 130 230" fill="var(--bg-tertiary)" style={{ opacity: 0.5 }} stroke="var(--border-color)" strokeWidth="1" />
      )}

      {/* Tendons & Ligaments */}
      <rect x="92" y="32" width="16" height="35" rx="2" style={getAreaStyles('quad-tendon')} onClick={() => !isReadOnly && onSelect('quad-tendon')} />
      <rect x="86" y="72" width="28" height="28" rx="14" style={getAreaStyles('patella')} onClick={() => !isReadOnly && onSelect('patella')} />
      <rect x="94" y="104" width="12" height="30" rx="2" style={getAreaStyles('patellar-tendon')} onClick={() => !isReadOnly && onSelect('patellar-tendon')} />
      <rect x="72" y="62" width="8" height="60" rx="3" style={getAreaStyles(leftElementId)} onClick={() => !isReadOnly && onSelect(leftElementId)} />
      <rect x="120" y="62" width="8" height="60" rx="3" style={getAreaStyles(rightElementId)} onClick={() => !isReadOnly && onSelect(rightElementId)} />
      <rect x="65" y="152" width="70" height="25" rx="5" style={getAreaStyles('back-knee')} onClick={() => !isReadOnly && onSelect('back-knee')} />

      {/* Horizontal Pill Badges */}
      <g onClick={() => !isReadOnly && onSelect('quad-tendon')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="35" y="10" width="130" height="18" rx="9" fill={getBadgeFill('quad-tendon')} stroke={getBadgeStroke('quad-tendon')} strokeWidth="1" />
        <text x="100" y="22" textAnchor="middle" fill={getBadgeTextFill('quad-tendon')} fontSize="8" fontWeight={subArea === 'quad-tendon' ? 'bold' : 'normal'}>מעל הפיקה (ארבע-ראשי)</text>
      </g>

      <g onClick={() => !isReadOnly && onSelect('patella')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="75" y="77" width="50" height="18" rx="9" fill={getBadgeFill('patella')} stroke={getBadgeStroke('patella')} strokeWidth="1" />
        <text x="100" y="89" textAnchor="middle" fill={getBadgeTextFill('patella')} fontSize="8.5" fontWeight="bold">פיקה</text>
      </g>

      <g onClick={() => !isReadOnly && onSelect('patellar-tendon')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="35" y="138" width="130" height="18" rx="9" fill={getBadgeFill('patellar-tendon')} stroke={getBadgeStroke('patellar-tendon')} strokeWidth="1" />
        <text x="100" y="150" textAnchor="middle" fill={getBadgeTextFill('patellar-tendon')} fontSize="8" fontWeight={subArea === 'patellar-tendon' ? 'bold' : 'normal'}>מתחת לפיקה (גיד הפיקה)</text>
      </g>

      <g onClick={() => !isReadOnly && onSelect(leftElementId)} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="5" y="72" width="62" height="26" rx="6" fill={getBadgeFill(leftElementId)} stroke={getBadgeStroke(leftElementId)} strokeWidth="1" />
        <text x="36" y="83" textAnchor="middle" fill={getBadgeTextFill(leftElementId)} fontSize="8" fontWeight={subArea === leftElementId ? 'bold' : 'normal'}>{isRightKnee ? 'צד חיצוני' : 'צד פנימי'}</text>
        <text x="36" y="92" textAnchor="middle" fill={subArea === leftElementId ? 'white' : 'var(--text-secondary)'} fontSize="6.5">{isRightKnee ? '(לטרלי)' : '(מדיאלי)'}</text>
      </g>

      <g onClick={() => !isReadOnly && onSelect(rightElementId)} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="133" y="72" width="62" height="26" rx="6" fill={getBadgeFill(rightElementId)} stroke={getBadgeStroke(rightElementId)} strokeWidth="1" />
        <text x="164" y="83" textAnchor="middle" fill={getBadgeTextFill(rightElementId)} fontSize="8" fontWeight={subArea === rightElementId ? 'bold' : 'normal'}>{isRightKnee ? 'צד פנימי' : 'צד חיצוני'}</text>
        <text x="164" y="92" textAnchor="middle" fill={subArea === rightElementId ? 'white' : 'var(--text-secondary)'} fontSize="6.5">{isRightKnee ? '(מדיאלי)' : '(לטרלי)'}</text>
      </g>

      <g onClick={() => !isReadOnly && onSelect('back-knee')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="50" y="195" width="100" height="18" rx="9" fill={getBadgeFill('back-knee')} stroke={getBadgeStroke('back-knee')} strokeWidth="1" />
        <text x="100" y="207" textAnchor="middle" fill={getBadgeTextFill('back-knee')} fontSize="8" fontWeight={subArea === 'back-knee' ? 'bold' : 'normal'}>מאחורי הברך (קפל)</text>
      </g>
    </svg>
  );
}

function renderHipSVG({ parentArea, subArea, onSelect, isReadOnly = false, size = 150 }) {
  const isRightHip = parentArea === 'hip-r';
  const glowId = isReadOnly ? 'glow-pain' : 'glow-active';
  const strokeColor = isReadOnly ? '#EF4444' : '#FF3D94';
  const fillColor = isReadOnly ? 'rgba(239, 68, 68, 0.5)' : 'rgba(226, 34, 121, 0.4)';

  const getAreaStyles = (id) => ({
    cursor: isReadOnly ? 'default' : 'pointer',
    transition: 'all 0.2s',
    fill: subArea === id ? fillColor : 'rgba(255, 255, 255, 0.05)',
    stroke: subArea === id ? strokeColor : 'var(--border-color)',
    strokeWidth: subArea === id ? 2.5 : 1.5,
    filter: subArea === id ? `url(#${glowId})` : undefined
  });

  const getBadgeFill = (id) => (subArea === id ? (isReadOnly ? '#EF4444' : 'var(--color-accent)') : 'rgba(15, 23, 42, 0.75)');
  const getBadgeTextFill = (id) => (subArea === id ? 'white' : 'var(--text-primary)');
  const getBadgeStroke = (id) => (subArea === id ? 'white' : 'var(--border-color)');

  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, overflow: 'visible' }}>
      <defs>
        <filter id="glow-active" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ff3d94" floodOpacity="0.85" />
        </filter>
        <filter id="glow-pain" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#EF4444" floodOpacity="0.85" />
        </filter>
      </defs>

      <path d="M40 30 Q100 70 160 30 C140 70, 140 90, 100 110 C60 90, 60 70, 40 30" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1.5" />

      <circle cx={isRightHip ? 115 : 85} cy="85" r="22" style={getAreaStyles('anterior')} onClick={() => !isReadOnly && onSelect('anterior')} />
      <circle cx={isRightHip ? 65 : 135} cy="100" r="20" style={getAreaStyles('lateral')} onClick={() => !isReadOnly && onSelect('lateral')} />
      <circle cx={isRightHip ? 145 : 55} cy="115" r="20" style={getAreaStyles('posterior')} onClick={() => !isReadOnly && onSelect('posterior')} />

      <g onClick={() => !isReadOnly && onSelect('anterior')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="45" y="15" width="110" height="18" rx="9" fill={getBadgeFill('anterior')} stroke={getBadgeStroke('anterior')} strokeWidth="1" />
        <text x="100" y="27" textAnchor="middle" fill={getBadgeTextFill('anterior')} fontSize="8" fontWeight={subArea === 'anterior' ? 'bold' : 'normal'}>מפרק הירך (קדמי)</text>
      </g>

      <g onClick={() => !isReadOnly && onSelect('lateral')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x={isRightHip ? 10 : 110} y="145" width="80" height="24" rx="6" fill={getBadgeFill('lateral')} stroke={getBadgeStroke('lateral')} strokeWidth="1" />
        <text x={isRightHip ? 50 : 150} y="156" textAnchor="middle" fill={getBadgeTextFill('lateral')} fontSize="8" fontWeight={subArea === 'lateral' ? 'bold' : 'normal'}>צד חיצוני</text>
        <text x={isRightHip ? 50 : 150} y="165" textAnchor="middle" fill={subArea === 'lateral' ? 'white' : 'var(--text-secondary)'} fontSize="6.5">(טרוכנטר)</text>
      </g>

      <g onClick={() => !isReadOnly && onSelect('posterior')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x={isRightHip ? 110 : 10} y="145" width="80" height="24" rx="6" fill={getBadgeFill('posterior')} stroke={getBadgeStroke('posterior')} strokeWidth="1" />
        <text x={isRightHip ? 150 : 50} y="156" textAnchor="middle" fill={getBadgeTextFill('posterior')} fontSize="8" fontWeight={subArea === 'posterior' ? 'bold' : 'normal'}>אחורי</text>
        <text x={isRightHip ? 150 : 50} y="165" textAnchor="middle" fill={subArea === 'posterior' ? 'white' : 'var(--text-secondary)'} fontSize="6.5">(ישבן)</text>
      </g>
    </svg>
  );
}

function renderAnkleSVG({ parentArea, subArea, onSelect, isReadOnly = false, size = 150 }) {
  const glowId = isReadOnly ? 'glow-pain' : 'glow-active';
  const strokeColor = isReadOnly ? '#EF4444' : '#FF3D94';
  const fillColor = isReadOnly ? 'rgba(239, 68, 68, 0.5)' : 'rgba(226, 34, 121, 0.4)';

  const getAreaStyles = (id) => ({
    cursor: isReadOnly ? 'default' : 'pointer',
    transition: 'all 0.2s',
    fill: subArea === id ? fillColor : 'rgba(255, 255, 255, 0.05)',
    stroke: subArea === id ? strokeColor : 'var(--border-color)',
    strokeWidth: subArea === id ? 2.5 : 1.5,
    filter: subArea === id ? `url(#${glowId})` : undefined
  });

  const getBadgeFill = (id) => (subArea === id ? (isReadOnly ? '#EF4444' : 'var(--color-accent)') : 'rgba(15, 23, 42, 0.75)');
  const getBadgeTextFill = (id) => (subArea === id ? 'white' : 'var(--text-primary)');
  const getBadgeStroke = (id) => (subArea === id ? 'white' : 'var(--border-color)');

  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size, overflow: 'visible' }}>
      <defs>
        <filter id="glow-active" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ff3d94" floodOpacity="0.85" />
        </filter>
        <filter id="glow-pain" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#EF4444" floodOpacity="0.85" />
        </filter>
      </defs>

      <path d="M70 20 L90 20 L95 90 L120 120 L160 145 L180 155 L175 165 L110 165 L60 155 L50 120 L60 90 Z" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1.5" />

      <circle cx="80" cy="105" r="18" style={getAreaStyles('lateral')} onClick={() => !isReadOnly && onSelect('lateral')} />
      <circle cx="102" cy="105" r="18" style={getAreaStyles('medial')} onClick={() => !isReadOnly && onSelect('medial')} />
      <rect x="53" y="75" width="8" height="50" rx="3" style={getAreaStyles('achilles')} onClick={() => !isReadOnly && onSelect('achilles')} />
      <rect x="75" y="157" width="80" height="8" rx="2" style={getAreaStyles('plantar')} onClick={() => !isReadOnly && onSelect('plantar')} />

      <g onClick={() => !isReadOnly && onSelect('achilles')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="5" y="45" width="70" height="24" rx="6" fill={getBadgeFill('achilles')} stroke={getBadgeStroke('achilles')} strokeWidth="1" />
        <text x="40" y="56" textAnchor="middle" fill={getBadgeTextFill('achilles')} fontSize="8" fontWeight={subArea === 'achilles' ? 'bold' : 'normal'}>Achilles</text>
        <text x="40" y="65" textAnchor="middle" fill={subArea === 'achilles' ? 'white' : 'var(--text-secondary)'} fontSize="6.5">(אכילס)</text>
      </g>

      <g onClick={() => !isReadOnly && onSelect('lateral')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="5" y="110" width="65" height="24" rx="6" fill={getBadgeFill('lateral')} stroke={getBadgeStroke('lateral')} strokeWidth="1" />
        <text x="37.5" y="121" textAnchor="middle" fill={getBadgeTextFill('lateral')} fontSize="8" fontWeight={subArea === 'lateral' ? 'bold' : 'normal'}>צד חיצוני</text>
        <text x="37.5" y="130" textAnchor="middle" fill={subArea === 'lateral' ? 'white' : 'var(--text-secondary)'} fontSize="6.5">(לטרלי)</text>
      </g>

      <g onClick={() => !isReadOnly && onSelect('medial')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="130" y="110" width="65" height="24" rx="6" fill={getBadgeFill('medial')} stroke={getBadgeStroke('medial')} strokeWidth="1" />
        <text x="162.5" y="121" textAnchor="middle" fill={getBadgeTextFill('medial')} fontSize="8" fontWeight={subArea === 'medial' ? 'bold' : 'normal'}>צד פנימי</text>
        <text x="162.5" y="130" textAnchor="middle" fill={subArea === 'medial' ? 'white' : 'var(--text-secondary)'} fontSize="6.5">(מדיאלי)</text>
      </g>

      <g onClick={() => !isReadOnly && onSelect('plantar')} style={{ cursor: isReadOnly ? 'default' : 'pointer' }}>
        <rect x="55" y="172" width="90" height="18" rx="9" fill={getBadgeFill('plantar')} stroke={getBadgeStroke('plantar')} strokeWidth="1" />
        <text x="100" y="184" textAnchor="middle" fill={getBadgeTextFill('plantar')} fontSize="8" fontWeight={subArea === 'plantar' ? 'bold' : 'normal'}>כף רגל מלמטה (פלנטר)</text>
      </g>
    </svg>
  );
}

// --- Body Map (Upgraded with detailed joint zoom) ---
export function BodyMap({ selectedArea, onSelectArea }) {
  const [parentArea, subArea] = (selectedArea || '').split(':');
  const [isZoomed, setIsZoomed] = useState(false);

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

  const handleMainAreaClick = (areaId) => {
    onSelectArea?.(areaId);
  };

  const handleSubSelect = (subAreaId) => {
    onSelectArea?.(`${parentArea}:${subAreaId}`);
  };

  const showDetail = parentArea.startsWith('knee') || parentArea.startsWith('hip') || parentArea.startsWith('ankle');
  const jointType = parentArea.startsWith('knee') ? 'knee' : parentArea.startsWith('hip') ? 'hip' : 'ankle';

  let parentLabel = 'מפרק';
  if (parentArea === 'knee-r') parentLabel = 'ברך ימין';
  else if (parentArea === 'knee-l') parentLabel = 'ברך שמאל';
  else if (parentArea === 'hip-r') parentLabel = 'ירך ימין';
  else if (parentArea === 'hip-l') parentLabel = 'ירך שמאל';
  else if (parentArea === 'ankle-r') parentLabel = 'קרסול ימין';
  else if (parentArea === 'ankle-l') parentLabel = 'קרסול שמאל';

  let subList = [];
  if (jointType === 'knee') {
    subList = [
      { id: 'patella', label: 'פיקה קדמית' },
      { id: 'patellar-tendon', label: 'מתחת לפיקה (גיד הפיקה)' },
      { id: 'quad-tendon', label: 'מעל הפיקה (גיד הארבע-ראשי)' },
      { id: 'medial-side', label: 'צד פנימי (מדיאלי)' },
      { id: 'lateral-side', label: 'צד חיצוני (לטרלי)' },
      { id: 'back-knee', label: 'מאחורי הברך (קפל הברך)' }
    ];
  } else if (jointType === 'hip') {
    subList = [
      { id: 'anterior', label: 'מפרק הירך (קדמי)' },
      { id: 'lateral', label: 'צד חיצוני (טרוכנטר)' },
      { id: 'posterior', label: 'אחורי (ישבן)' }
    ];
  } else if (jointType === 'ankle') {
    subList = [
      { id: 'lateral', label: 'צד חיצוני (לטרלי)' },
      { id: 'medial', label: 'צד פנימי (מדיאלי)' },
      { id: 'achilles', label: 'גיד אכילס (אחורי)' },
      { id: 'plantar', label: 'כף רגל מלמטה (פלנטר)' }
    ];
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="body-map-container" style={{ position: 'relative' }}>
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
          {areas.map((area) => {
            const isSelected = parentArea === area.id;
            return (
              <g key={area.id} onClick={() => handleMainAreaClick(area.id)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={area.x}
                  cy={area.y}
                  r={area.r}
                  fill={isSelected ? 'rgba(226, 34, 121, 0.3)' : 'transparent'}
                  stroke={isSelected ? '#E22279' : 'transparent'}
                  strokeWidth="2"
                  className="body-map-area"
                />
                <text
                  x={area.x}
                  y={area.y + 3}
                  textAnchor="middle"
                  fill={isSelected ? '#E22279' : 'var(--text-tertiary)'}
                  fontSize="7.5"
                  fontWeight={isSelected ? '700' : '500'}
                  fontFamily="Heebo"
                  style={{ pointerEvents: 'none', transition: 'all 0.2s' }}
                >
                  {area.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detailed Joint View */}
      {showDetail && (
        <div className="knee-detail-container animate-fade-in" style={{
          marginTop: 'var(--space-2)',
          padding: 'var(--space-5)',
          background: 'var(--bg-secondary)',
          border: '1.5px dashed var(--color-primary-light)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          width: '100%',
        }}>
          <div className="flex justify-between items-center w-full flex-wrap gap-2">
            <h4 className="font-bold text-sm" style={{ color: 'var(--color-primary-light)', margin: 0 }}>
              {parentLabel} • לחץ על האזור הכואב או השתמש בלחצנים למיקוד:
            </h4>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setIsZoomed(true)}
              style={{
                border: '1px solid var(--border-color)',
                background: 'rgba(38,98,137,0.15)',
                color: 'var(--color-primary-light)',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔍 זום / הגדל איור
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full mt-2">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {jointType === 'knee' && renderKneeSVG({ parentArea, subArea, onSelect: handleSubSelect, size: 150 })}
              {jointType === 'hip' && renderHipSVG({ parentArea, subArea, onSelect: handleSubSelect, size: 140 })}
              {jointType === 'ankle' && renderAnkleSVG({ parentArea, subArea, onSelect: handleSubSelect, size: 140 })}
            </div>
            
            {/* Detailed list selection */}
            <div className="flex flex-col gap-1.5 w-full sm:max-w-[190px]">
              {subList.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  className={`btn btn-sm ${subArea === sub.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    fontSize: '11px',
                    textAlign: 'right',
                    justifyContent: 'flex-start',
                    padding: '6px 10px',
                    border: '1px solid var(--border-color)',
                    background: subArea === sub.id ? 'var(--color-accent)' : 'transparent',
                    color: subArea === sub.id ? 'white' : 'var(--text-secondary)'
                  }}
                  onClick={() => handleSubSelect(sub.id)}
                >
                  {subArea === sub.id ? '● ' : '○ '} {sub.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zoom Modal overlay */}
      {isZoomed && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
          direction: 'rtl'
        }}>
          <div className="card animate-scale-in" style={{
            maxWidth: '420px',
            width: '100%',
            background: 'var(--bg-secondary)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-4)',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative',
          }}>
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              style={{
                position: 'absolute',
                top: 'var(--space-4)',
                left: 'var(--space-4)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>

            <h3 className="text-md font-bold text-center" style={{ color: 'var(--color-primary-light)', marginTop: 'var(--space-2)', marginBottom: 0 }}>
              זום מוגדל • {parentLabel}
            </h3>
            <p className="text-xs text-secondary text-center" style={{ margin: 0 }}>
              בחר את אזור הכאב המדויק ישירות מהאיור המוגדל:
            </p>

            <div style={{ margin: 'var(--space-2) 0', display: 'flex', justifyContent: 'center' }}>
              {jointType === 'knee' && renderKneeSVG({ parentArea, subArea, onSelect: handleSubSelect, size: 210 })}
              {jointType === 'hip' && renderHipSVG({ parentArea, subArea, onSelect: handleSubSelect, size: 190 })}
              {jointType === 'ankle' && renderAnkleSVG({ parentArea, subArea, onSelect: handleSubSelect, size: 190 })}
            </div>

            <div className="flex flex-col gap-1.5 w-full max-h-[150px] overflow-y-auto" style={{ padding: '2px' }}>
              {subList.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  className={`btn btn-sm ${subArea === sub.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    fontSize: '11.5px',
                    textAlign: 'right',
                    justifyContent: 'flex-start',
                    padding: '6px 12px',
                    border: '1px solid var(--border-color)',
                    background: subArea === sub.id ? 'var(--color-accent)' : 'transparent',
                    color: subArea === sub.id ? 'white' : 'var(--text-secondary)'
                  }}
                  onClick={() => handleSubSelect(sub.id)}
                >
                  {subArea === sub.id ? '● ' : '○ '} {sub.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary w-full mt-2"
              onClick={() => setIsZoomed(false)}
            >
              אישור וסגירה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Pain Visualizer (Interactive diagram for reports) ---
export function PainVisualizer({ painLocation }) {
  if (!painLocation) return null;

  const [parentArea, subArea] = painLocation.split(':');
  const formattedName = PAIN_LOCATION_MAP[painLocation] || painLocation;

  const isKnee = painLocation.startsWith('knee');
  const isHip = painLocation.startsWith('hip');
  const isAnkle = painLocation.startsWith('ankle');

  return (
    <div className="card text-center flex flex-col items-center gap-3 animate-fade-in-up" style={{ minHeight: 250 }}>
      <div className="text-xs font-semibold text-secondary">מיקום כאב ממוקד (דיווח אחרון)</div>
      <div className="text-md font-bold text-primary" style={{ color: 'var(--color-primary-light)' }}>{formattedName}</div>

      <div style={{ marginTop: 'auto', marginBottom: 'auto', display: 'flex', justifyContent: 'center' }}>
        {isKnee && renderKneeSVG({ parentArea, subArea, onSelect: null, isReadOnly: true, size: 140 })}
        {isHip && renderHipSVG({ parentArea, subArea, onSelect: null, isReadOnly: true, size: 140 })}
        {isAnkle && renderAnkleSVG({ parentArea, subArea, onSelect: null, isReadOnly: true, size: 140 })}
        {!isKnee && !isHip && !isAnkle && (
          /* General Body Map (Read-Only) */
          <svg viewBox="0 0 300 380" style={{ width: 140, height: 165 }}>
            <ellipse cx="150" cy="30" rx="22" ry="26" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1.5" />
            <rect x="135" y="56" width="30" height="20" rx="8" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1.5" />
            <ellipse cx="150" cy="130" rx="45" ry="55" fill="var(--bg-tertiary)" stroke="var(--border-color)" strokeWidth="1.5" />
            <path d="M105 95 Q75 140 70 200" fill="none" stroke="var(--border-color)" strokeWidth="12" strokeLinecap="round" style={{ opacity: 0.2 }} />
            <path d="M195 95 Q225 140 230 200" fill="none" stroke="var(--border-color)" strokeWidth="12" strokeLinecap="round" style={{ opacity: 0.2 }} />
            <path d="M130 185 Q125 250 125 350" fill="none" stroke="var(--border-color)" strokeWidth="14" strokeLinecap="round" style={{ opacity: 0.2 }} />
            <path d="M170 185 Q175 250 175 350" fill="none" stroke="var(--border-color)" strokeWidth="14" strokeLinecap="round" style={{ opacity: 0.2 }} />
            
            {(() => {
              const area = {
                'head': { x: 150, y: 30, r: 25 },
                'neck': { x: 150, y: 70, r: 15 },
                'chest': { x: 150, y: 120, r: 25 },
                'upper-back': { x: 150, y: 130, r: 20 },
                'lower-back': { x: 150, y: 175, r: 22 },
                'shoulder-r': { x: 110, y: 100, r: 20 },
                'shoulder-l': { x: 190, y: 100, r: 20 },
                'elbow-r': { x: 85, y: 155, r: 14 },
                'elbow-l': { x: 215, y: 155, r: 14 },
                'wrist-r': { x: 70, y: 200, r: 12 },
                'wrist-l': { x: 230, y: 200, r: 12 },
                'hip-r': { x: 125, y: 210, r: 18 },
                'hip-l': { x: 175, y: 210, r: 18 },
                'knee-r': { x: 125, y: 275, r: 16 },
                'knee-l': { x: 175, y: 275, r: 16 },
                'ankle-r': { x: 125, y: 345, r: 13 },
                'ankle-l': { x: 175, y: 345, r: 13 },
              }[parentArea];
              
              if (!area) return null;
              return (
                <circle
                  cx={area.x}
                  cy={area.y}
                  r={area.r}
                  fill="rgba(239, 68, 68, 0.5)"
                  stroke="#EF4444"
                  strokeWidth="2"
                />
              );
            })()}
          </svg>
        )}
      </div>
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
