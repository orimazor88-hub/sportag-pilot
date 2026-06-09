// === Patient Dashboard ===
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(isNotificationEnabled());

  const today = mockJournalEntries[0];
  
  // Get exercises from user profile or fallback
  const rawExercises = user?.exercises || mockExercises.slice(0, 3);
  
  // Sort exercises by assignedDate descending so newest are first
  const exercisesForToday = [...rawExercises].sort((a, b) => {
    if (!a.assignedDate) return 1;
    if (!b.assignedDate) return -1;
    return new Date(b.assignedDate) - new Date(a.assignedDate);
  });
  const completedToday = exercisesForToday.filter(() => Math.random() > 0.3).length;
  const nextSession = mockCalendarEvents.find(e => e.patientId === 'p1');

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
              {today ? getPainEmoji(today.painLevel) : '🤔'}
            </div>
            <div>
              <h3 className="font-semibold">איך אתה מרגיש היום?</h3>
              {today ? (
                <p className="text-sm text-secondary">
                  דרגת כאב: {today.painLevel}/10 • מצב רוח: {today.mood}
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
          value={today?.painLevel || '-'}
          label="דרגת כאב"
          color="#E22279"
        />
        <StatsCard
          icon={Dumbbell}
          value={`${completedToday}/${exercisesForToday.length}`}
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
          value={`${mockJournalEntries.filter(e => e.exercisesCompleted).length}/${mockJournalEntries.length}`}
          label="ימי תרגול"
          color="#8B5CF6"
        />
      </div>

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
          {exercisesForToday.map((ex, i) => {
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

