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
  ClipboardList, Camera, ChevronLeft
} from 'lucide-react';

export default function PatientDashboard() {
  const { user, isMockMode } = useAuth();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(isNotificationEnabled());

  const [todayJournal, setTodayJournal] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [nextSession, setNextSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [therapistNotes, setTherapistNotes] = useState([]);

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
      
      // 1. Fetch Latest Journal Entry (Today)
      const { data: journals, error: jError } = await supabase
        .from('journals')
        .select('*')
        .eq('patient_id', user.id)
        .order('date', { ascending: false });

      if (!jError && journals) {
        if (journals.length > 0) {
          const j = journals[0];
          setTodayJournal({
            painLevel: j.pain_level,
            mood: j.mood,
            activity: j.activity,
            notes: j.notes
          });
        }
        setCompletedCount(journals.filter(j => j.activity !== 'מנוחה').length);
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
        style={{ cursor: 'pointer' }}
        onClick={() => navigate('/patient/journal')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div style={{ fontSize: '3rem' }}>
              {todayJournal ? getPainEmoji(todayJournal.painLevel) : '🤔'}
            </div>
            <div>
              <h3 className="font-semibold">איך אתה מרגיש היום?</h3>
              {todayJournal ? (
                <p className="text-sm text-secondary">
                  דרגת כאב: {todayJournal.painLevel}/10 • מצב רוח: {todayJournal.mood}
                </p>
              ) : (
                <p className="text-sm text-secondary">לחץ כדי לעדכן את המעקב היומי שלך</p>
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
          value={todayJournal?.painLevel || '-'}
          label="דרגת כאב"
          color="#E22279"
        />
        <StatsCard
          icon={Dumbbell}
          value={`${todayJournal ? 1 : 0}/${exercises.length}`}
          label="תרגילים היום"
          color="#10B981"
        />
        <StatsCard
          icon={Calendar}
          value={nextSession ? new Date(nextSession.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : '-'}
          label="פגישה הבאה"
          color="#0891B2"
        />
        <StatsCard
          icon={Smile}
          value={`${completedCount} ימים`}
          label="ימי תרגול"
          color="#8B5CF6"
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
          style={{ cursor: 'pointer', border: 'none', width: '100%' }}
          onClick={() => navigate('/patient/journal')}
        >
          <ClipboardList size={28} style={{ color: 'var(--color-primary-light)', margin: '0 auto var(--space-2)' }} />
          <div className="font-semibold text-sm">עדכון מעקב יומי</div>
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
        <h3 className="section-title" style={{ fontSize: 'var(--font-size-md)' }}>🔔 תזכורות תרגול</h3>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-secondary" style={{ flex: 1, minWidth: 200, lineHeight: 1.4 }}>
            קבל תזכורות יומיות ישירות לטלפון כדי לשמור על רצף התרגול והמעקב הרפואי.
          </p>
          {notificationsEnabled ? (
            <button 
              className="btn btn-teal btn-sm"
              onClick={handleTestNotification}
            >
              שלח תזכורת לבדיקה
            </button>
          ) : (
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleEnableNotifications}
            >
              אפשר תזכורות במכשיר
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

