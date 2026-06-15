// === Patient Dashboard ===
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { mockExercises, mockJournalEntries, mockCalendarEvents } from '../../data/mockData';
import { StatsCard } from '../../components/SharedComponents';
import InstallPwaBanner from '../../components/InstallPwaBanner';
import {
  requestNotificationPermission,
  isNotificationEnabled,
  scheduleMockReminder,
  unlockAudioContext
} from '../../services/notificationService';
import {
  Smile, Dumbbell, Calendar, TrendingDown, ArrowLeft,
  ClipboardList, Camera, ChevronLeft, Target
} from 'lucide-react';

const calculateProgressToGoal = (profile, journalsList) => {
  if (!profile) return 50; // default fallback
  
  const isLowerLimb = profile.is_lower_limb || profile.isLowerLimb || false;
  const list = journalsList || [];
  
  const formattedJournals = list.map(j => ({
    date: j.date,
    painLevel: j.pain_level !== undefined ? j.pain_level : (j.painLevel ?? 4),
    rom: j.rom,
    strength: j.strength,
    walkingScore: j.walking_score !== undefined ? j.walking_score : j.walkingScore,
    stairsScore: j.stairs_score !== undefined ? j.stairs_score : j.stairsScore,
    runningScore: j.running_score !== undefined ? j.running_score : j.runningScore,
  }));

  const targets = profile.targets || {
    targetDate: '2026-06-25',
    painLevel: { intermediate: 3, final: 0 },
    rom: { intermediate: 135, final: 145 },
    strength: { intermediate: 4.5, final: 5, muscle: 'ארבע ראשי' },
    ...(isLowerLimb ? {
      walking: { intermediate: 8, final: 10 },
      stairs: { intermediate: 8, final: 10 },
      running: { intermediate: 7, final: 10 }
    } : {})
  };

  const currentPainVal = formattedJournals.length > 0 ? formattedJournals[0].painLevel : 4;
  const initialPain = formattedJournals.length > 0 ? formattedJournals[formattedJournals.length - 1].painLevel : 7;
  const painTarget = targets.painLevel?.intermediate ?? 3;

  const calcPainProgress = (current, initial, target) => {
    if (initial === undefined || current === undefined || target === undefined || initial === target) return 100;
    const progress = ((initial - current) / (initial - target)) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  const calcMetricProgress = (current, initial, target) => {
    if (initial === undefined || current === undefined || target === undefined || initial === target) return 100;
    const progress = ((current - initial) / (target - initial)) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  const activeMetrics = [];
  activeMetrics.push(calcPainProgress(currentPainVal, initialPain, painTarget));

  // metricsHistory formatting matching ProgressView.jsx exactly
  const metricsHistory = formattedJournals.length > 0 ? formattedJournals.map(j => ({
    rom: j.rom || (isLowerLimb ? 130 : 160),
    strength: j.strength || 4,
    walking: j.walkingScore || 7,
    stairs: j.stairsScore || 7,
    running: j.runningScore || 5
  })).reverse() : [{
    rom: isLowerLimb ? 120 : 150,
    strength: 3,
    walking: 5,
    stairs: 5,
    running: 2
  }];

  const latestMetric = metricsHistory[metricsHistory.length - 1];
  const firstMetric = metricsHistory[0];

  const currentRom = latestMetric?.rom || 120;
  const initRom = firstMetric?.rom || 110;
  const romTarget = targets.rom?.intermediate ?? 130;
  activeMetrics.push(calcMetricProgress(currentRom, initRom, romTarget));

  const currentStr = latestMetric?.strength || 3;
  const initStr = firstMetric?.strength || 3;
  const strTarget = targets.strength?.intermediate ?? 4.5;
  activeMetrics.push(calcMetricProgress(currentStr, initStr, strTarget));

  if (isLowerLimb) {
    const currentWalk = latestMetric?.walking || 5;
    const initWalk = firstMetric?.walking || 5;
    const walkTarget = targets.walking?.intermediate ?? 8;
    activeMetrics.push(calcMetricProgress(currentWalk, initWalk, walkTarget));

    const currentStairs = latestMetric?.stairs || 4;
    const initStairs = firstMetric?.stairs || 4;
    const stairsTarget = targets.stairs?.intermediate ?? 8;
    activeMetrics.push(calcMetricProgress(currentStairs, initStairs, stairsTarget));

    const currentRun = latestMetric?.running || 2;
    const initRun = firstMetric?.running || 2;
    const runTarget = targets.running?.intermediate ?? 6;
    activeMetrics.push(calcMetricProgress(currentRun, initRun, runTarget));
  }

  const avgProgress = activeMetrics.length > 0
    ? Math.round(activeMetrics.reduce((sum, val) => sum + val, 0) / activeMetrics.length)
    : 0;

  return avgProgress;
};

export default function PatientDashboard() {
  const { user, isMockMode } = useAuth();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(isNotificationEnabled());

  const [reminderEnabled, setReminderEnabled] = useState(() => {
    return localStorage.getItem('sportag_reminder_enabled') === 'true';
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem('sportag_reminder_time') || '19:00';
  });

  const [todayJournal, setTodayJournal] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [nextSession, setNextSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [therapistNotes, setTherapistNotes] = useState([]);
  const [progressToGoal, setProgressToGoal] = useState(50);

  useEffect(() => {
    loadDashboardData();
  }, [user, isMockMode]);

  const loadDashboardData = async () => {
    if (!user) return;

    if (isMockMode) {
      setTodayJournal(mockJournalEntries[0]);
      setExercises(mockExercises.slice(0, 3));
      setCompletedCount(2);
      setNextSession(mockCalendarEvents.find(e => e.patientId === 'p1'));
      
      const mockPatient = {
        is_lower_limb: true,
        targets: {
          painLevel: { intermediate: 3, final: 0 },
          rom: { intermediate: 135, final: 145 },
          strength: { intermediate: 4.5, final: 5 },
          walking: { intermediate: 8, final: 10 },
          stairs: { intermediate: 8, final: 10 },
          running: { intermediate: 7, final: 10 }
        }
      };
      setProgressToGoal(calculateProgressToGoal(mockPatient, mockJournalEntries));
      
      const savedNotes = localStorage.getItem('mock_therapist_notes_p1');
      if (savedNotes) {
        setTherapistNotes(JSON.parse(savedNotes));
      } else {
        const defaultNotes = [
          {
            id: 'note-1',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            notes: 'פגישת הערכה ראשונית. המטופל מדווח על כאב ממוקד בגיד הפיקה ברגל ימין במהלך ואחרי ריצה. טווחי תנועה מלאים, כוח שריר 4/5.',
            patient_id: 'p1',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'note-2',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            notes: 'דיווח על שיפור קל לאחר ביצוע תרגילי חיזוק איזומטריים לברך. כאב ירד לדרגה 3 במהלך הליכה.',
            patient_id: 'p1',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setTherapistNotes(defaultNotes);
        localStorage.setItem('mock_therapist_notes_p1', JSON.stringify(defaultNotes));
      }

      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 1. Fetch Profile
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // 2. Fetch Journals
      const { data: journals, error: jError } = await supabase
        .from('journals')
        .select('*')
        .eq('patient_id', user.id)
        .order('date', { ascending: false });

      if (!jError && journals) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayEntry = journals.find(j => {
          const entryDateStr = new Date(j.date).toISOString().slice(0, 10);
          return entryDateStr === todayStr;
        });

        if (todayEntry) {
          setTodayJournal({
            painLevel: todayEntry.pain_level,
            mood: todayEntry.mood,
            activity: todayEntry.activity,
            notes: todayEntry.notes
          });
        } else {
          setTodayJournal(null);
        }
        setCompletedCount(journals.filter(j => j.activity !== 'מנוחה').length);

        if (!pError && profile) {
          setProgressToGoal(calculateProgressToGoal(profile, journals));
        }
      }

      // 2. Fetch Exercises
      const { data: dbExercises, error: exError } = await supabase
        .from('exercises')
        .select('*')
        .eq('patient_id', user.id)
        .order('assigned_date', { ascending: false });

      if (!exError && dbExercises) {
        setExercises(dbExercises.map(e => ({
          id: e.id,
          name: e.name,
          nameHe: e.name_he,
          category: e.category,
          categoryColor: e.category === 'ברך' ? '#06B6D4' : '#8B5CF6',
          description: e.description,
          sets: e.sets,
          reps: e.reps,
          holdTime: e.hold_time,
          frequency: e.frequency,
          difficulty: e.difficulty,
          assignedDate: e.assigned_date
        })));
      }

      // 3. Fetch Next Session
      const { data: dbSessions, error: sError } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', user.id)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(1);

      if (!sError && dbSessions && dbSessions.length > 0) {
        setNextSession({
          date: dbSessions[0].date
        });
      }

      // 4. Fetch Therapist Notes
      let fetchedNotes = [];
      try {
        const { data: dbNotes, error: nError } = await supabase
          .from('therapist_notes')
          .select('*')
          .eq('patient_id', user.id)
          .order('date', { ascending: false });

        if (!nError && dbNotes) {
          fetchedNotes = dbNotes;
        }
      } catch (noteErr) {
        console.warn('Could not fetch therapist notes from DB:', noteErr);
      }
      setTherapistNotes(fetchedNotes);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPainEmoji = (level) => {
    if (level <= 2) return '😊';
    if (level <= 4) return '🙂';
    if (level <= 6) return '😐';
    if (level <= 8) return '😣';
    return '😫';
  };

  const handleEnableNotifications = async () => {
    unlockAudioContext();
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
  };

  const handleTestNotification = () => {
    unlockAudioContext();
    scheduleMockReminder('הגיע הזמן לתרגול היומי שלך! 🏋️‍♂️');
  };

  const handleToggleReminder = (e) => {
    const val = e.target.checked;
    setReminderEnabled(val);
    localStorage.setItem('sportag_reminder_enabled', val ? 'true' : 'false');
    if (val) {
      if (!notificationsEnabled) {
        handleEnableNotifications();
      }
    }
  };

  const handleTimeChange = (e) => {
    const val = e.target.value;
    setReminderTime(val);
    localStorage.setItem('sportag_reminder_time', val);
  };

  const handleGoogleCalendarSync = () => {
    const title = encodeURIComponent('תרגול פיזיותרפיה - Sportag');
    
    let exercisesDesc = 'תוכנית תרגול יומית בפיזיותרפיה.\n\nהתרגילים שלך להיום:\n';
    exercises.forEach((ex, idx) => {
      exercisesDesc += `${idx + 1}. ${ex.nameHe || ex.name} (${ex.sets} סטים x ${ex.reps} חזרות)\n`;
      if (ex.description) {
        exercisesDesc += `   הנחיות: ${ex.description}\n`;
      }
    });
    exercisesDesc += '\nקישור ישיר לאפליקציה: https://sportag-pilot.vercel.app';
    const details = encodeURIComponent(exercisesDesc);
    const recur = encodeURIComponent('RRULE:FREQ=DAILY');
    
    const timeVal = reminderTime || '19:00';
    const [hh, mm] = timeVal.split(':');
    
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hh), parseInt(mm), 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000); 
    
    const formatGCalDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&recur=${recur}`;
    window.open(gCalUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--color-primary-light)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
        <h3 className="text-secondary text-sm">טוען נתונים...</h3>
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div className="page-header">
        <div>
          <h1 className="page-title">שלום, {user?.name?.split(' ')[0] || 'מטופל'} 👋</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* PWA Install Banner */}
      <InstallPwaBanner />

      {/* How are you feeling card */}
      <div
        className="glass-card mb-6 animate-fade-in-up"
        style={{ cursor: 'pointer', border: todayJournal ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)' }}
        onClick={() => navigate('/patient/journal')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div style={{ fontSize: '3rem' }}>
              {todayJournal ? getPainEmoji(todayJournal.painLevel) : '🤔'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold" style={{ margin: 0 }}>איך אתה מרגיש היום?</h3>
                {todayJournal ? (
                  <span className="badge badge-success text-xxs font-bold" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 6px', borderRadius: '4px' }}>מולא ✓</span>
                ) : (
                  <span className="badge badge-warning text-xxs font-bold" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', padding: '2px 6px', borderRadius: '4px' }}>טרם מולא ⚠️</span>
                )}
              </div>
              {todayJournal ? (
                <p className="text-sm text-secondary mt-1" style={{ margin: 0 }}>
                  דרגת כאב: {todayJournal.painLevel}/10 • מצב רוח: {todayJournal.mood}
                </p>
              ) : (
                <p className="text-sm text-secondary mt-1" style={{ margin: 0 }}>לחץ כדי לעדכן את המעקב היומי שלך</p>
              )}
            </div>
          </div>
          <ChevronLeft size={20} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid animate-fade-in-up stagger-2">
        <StatsCard
          icon={TrendingDown}
          value={todayJournal?.painLevel !== undefined ? todayJournal.painLevel : (todayJournal?.pain_level !== undefined ? todayJournal.pain_level : '-')}
          label="דרגת כאב"
          color="#E22279"
          onClick={() => navigate('/patient/progress?scrollTo=pain-section')}
        />
        <StatsCard
          icon={Dumbbell}
          value={`${todayJournal ? 1 : 0}/${exercises.length}`}
          label="תרגילים היום"
          color="#10B981"
          onClick={() => navigate('/patient/exercises')}
        />
        <StatsCard
          icon={Calendar}
          value={nextSession ? new Date(nextSession.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : '-'}
          label="פגישה הבאה"
          color="#0891B2"
          onClick={() => navigate('/patient/journal')}
        />
        <StatsCard
          icon={Target}
          value={`${progressToGoal}%`}
          label="התקדמות ליעד"
          color="#8B5CF6"
          onClick={() => navigate('/patient/progress?scrollTo=targets-section')}
        />
      </div>

      {/* Therapist Notes Card */}
      {therapistNotes.length > 0 && (
        <div className="card mb-6 animate-fade-in-up" style={{ background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.08) 0%, rgba(38, 98, 137, 0.08) 100%)', border: '1px solid rgba(8, 145, 178, 0.25)', direction: 'rtl' }}>
          <h3 className="section-title flex items-center gap-2" style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-primary-light)', marginBottom: 'var(--space-3)' }}>
            <span>💬 הנחיות והערות מעקב מהמטפל</span>
          </h3>
          <div className="flex flex-col gap-3">
            {therapistNotes.slice(0, 2).map((note, idx) => (
              <div 
                key={note.id || idx} 
                style={{ 
                  borderBottom: idx < Math.min(therapistNotes.length, 2) - 1 ? '1px dashed rgba(8, 145, 178, 0.15)' : 'none',
                  paddingBottom: idx < Math.min(therapistNotes.length, 2) - 1 ? 'var(--space-3)' : '0',
                }}
              >
                <div className="flex justify-between items-center mb-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span>📅 {new Date(note.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
                  <span className="badge badge-teal" style={{ fontSize: '9px', padding: '2px 6px' }}>מעקב קליני</span>
                </div>
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {note.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Exercises */}
      <div className="dashboard-section animate-fade-in-up stagger-3">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            <Dumbbell size={20} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} />
            תרגילים להיום
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/patient/exercises')}>
            הצג הכל <ChevronLeft size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {exercises.map((ex, i) => {
            const isNew = ex.assignedDate && 
              (new Date('2026-06-07') - new Date(ex.assignedDate)) / (1000 * 60 * 60 * 24) <= 3;
            return (
              <div
                key={ex.id}
                className="card card-compact card-hover"
                onClick={() => navigate(`/patient/exercises?scrollTo=${ex.id}`)}
                style={{ cursor: 'pointer', animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 4, height: 32, borderRadius: 2,
                      background: ex.categoryColor, flexShrink: 0,
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-sm">{ex.nameHe}</div>
                      {isNew && (
                        <span className="badge badge-success text-xs font-bold" style={{ padding: '2px 5px', fontSize: '9px' }}>
                          חדש!
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      {ex.sets} סטים × {ex.reps} חזרות {ex.assignedDate && `• שויך ב-${new Date(ex.assignedDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}`}
                    </div>
                  </div>
                  <span className="badge badge-teal">{ex.frequency}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid-2 mt-6 animate-fade-in-up stagger-4">
        <button
          className="card card-hover text-center"
          style={{ cursor: 'pointer', border: todayJournal ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)', width: '100%' }}
          onClick={() => navigate('/patient/journal')}
        >
          <ClipboardList size={28} style={{ color: todayJournal ? '#10B981' : 'var(--color-primary-light)', margin: '0 auto var(--space-2)' }} />
          <div className="font-semibold text-sm">
            {todayJournal ? 'עדכון מעקב יומי (✓ מולא)' : 'עדכון מעקב יומי (⚠️ טרם מולא)'}
          </div>
        </button>
        <button
          className="card card-hover text-center"
          style={{ cursor: 'pointer', border: 'none', width: '100%' }}
          onClick={() => navigate('/patient/upload')}
        >
          <Camera size={28} style={{ color: 'var(--color-teal)', margin: '0 auto var(--space-2)' }} />
          <div className="font-semibold text-sm">העלאת מדיה</div>
        </button>
      </div>

      {/* Reminders Testing */}
      <div className="card mt-6 animate-fade-in-up stagger-5">
        <h3 className="section-title flex items-center gap-2" style={{ fontSize: 'var(--font-size-md)' }}>
          <span>🔔 תזכורות תרגול חכמות</span>
        </h3>
        
        <div className="flex flex-col gap-4">
          <p className="text-xs text-secondary mb-1" style={{ lineHeight: 1.4 }}>
            הגדר תזכורת יומית אוטומטית או סנכרן את תוכנית התרגול ישירות ללוח השנה שלך ב-Google.
          </p>

          <div className="flex flex-col gap-3" style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', direction: 'rtl' }}>
            {/* Automatic Reminder Switch */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={handleToggleReminder}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-primary-light)' }}
                />
                <span>הפעל תזכורת יומית אוטומטית</span>
              </label>
              
              {reminderEnabled && (
                <input
                  type="time"
                  className="input input-sm text-xs"
                  style={{ width: '90px', padding: '2px 6px', textAlign: 'center' }}
                  value={reminderTime}
                  onChange={handleTimeChange}
                />
              )}
            </div>

            {/* Google Calendar Sync */}
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px dashed var(--border-color)' }}>
              <span className="text-xs text-secondary font-medium">סנכרון ללוח השנה של גוגל:</span>
              <button
                type="button"
                className="btn btn-teal btn-xs"
                onClick={handleGoogleCalendarSync}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 10px' }}
              >
                📅 חבר ללוח השנה (Google)
              </button>
            </div>
          </div>

          {/* Test reminder */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted">רוצה לבדוק איך נראית התזכורת?</span>
            {notificationsEnabled ? (
              <button 
                className="btn btn-ghost btn-sm"
                onClick={handleTestNotification}
                style={{ border: '1px solid var(--border-color)', fontSize: '11px' }}
              >
                שלח תזכורת לבדיקה (5 שניות)
              </button>
            ) : (
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleEnableNotifications}
                style={{ fontSize: '11px' }}
              >
                אפשר התראות בדפדפן
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

