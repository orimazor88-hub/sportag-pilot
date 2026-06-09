// === Therapist Dashboard ===
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatsCard, PatientCard, SearchBar } from '../../components/SharedComponents';
import { mockPatients, mockCalendarEvents, mockReminders } from '../../data/mockData';
import {
  Users, CalendarDays, AlertCircle, TrendingUp,
  Clock, Bell, ChevronLeft, Mic
} from 'lucide-react';

export default function TherapistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const todayEvents = mockCalendarEvents.filter(e => e.date === '2026-06-03');
  const pendingReminders = mockReminders.filter(r => r.status === 'pending');

  const filteredPatients = mockPatients.filter(p =>
    p.name.includes(search) || p.conditionHe.includes(search) || p.area.includes(search)
  );

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">שלום, {user?.name?.split(' ')[1] || 'מטפל'} 👋</h1>
          <p className="page-subtitle">הנה סקירה של היום שלך</p>
        </div>
        <button
          className="btn btn-accent"
          onClick={() => navigate('/therapist/record')}
        >
          <Mic size={18} />
          הקלטת טיפול
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid animate-fade-in-up">
        <StatsCard
          icon={Users}
          value={mockPatients.length}
          label="מטופלים פעילים"
          color="#266289"
        />
        <StatsCard
          icon={CalendarDays}
          value={todayEvents.length}
          label="טיפולים היום"
          color="#0891B2"
        />
        <StatsCard
          icon={AlertCircle}
          value={2}
          label="דורשים תשומת לב"
          color="#E22279"
        />
        <StatsCard
          icon={TrendingUp}
          value="78%"
          label="ממוצע התקדמות"
          color="#10B981"
          trend={12}
        />
      </div>

      {/* Today's Schedule */}
      <div className="dashboard-section animate-fade-in-up stagger-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            <Clock size={20} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} />
            לוח זמנים להיום
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/therapist/calendar')}>
            צפה בלוח הזמנים <ChevronLeft size={16} />
          </button>
        </div>
        <div className="schedule-list">
          {todayEvents.length > 0 ? todayEvents.map((event, i) => (
            <div key={event.id} className="schedule-item glass-card" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="schedule-time" style={{ borderColor: event.color }}>
                {event.time}
              </div>
              <div className="schedule-info">
                <div className="font-semibold">{event.patientName}</div>
                <div className="text-xs text-secondary">{event.type} • {event.duration} דקות</div>
              </div>
              <div
                className="schedule-dot"
                style={{ background: event.color }}
              />
            </div>
          )) : (
            <div className="card text-center p-6 text-secondary">
              אין טיפולים מתוכננים להיום
            </div>
          )}
        </div>
      </div>

      {/* Reminders & Alerts */}
      {pendingReminders.length > 0 && (
        <div className="dashboard-section animate-fade-in-up stagger-3">
          <h2 className="section-title">
            <Bell size={20} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} />
            תזכורות ממתינות
          </h2>
          <div className="reminders-list">
            {pendingReminders.map((reminder) => (
              <div key={reminder.id} className="reminder-item card card-compact">
                <div className="flex items-center gap-3">
                  <Bell size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{reminder.patientName}</div>
                    <div className="text-xs text-secondary">{reminder.message}</div>
                  </div>
                  <span className="badge badge-warning">{reminder.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patients */}
      <div className="dashboard-section animate-fade-in-up stagger-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title" style={{ marginBottom: 0 }}>מטופלים</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/therapist/patients')}>
            הצג הכל <ChevronLeft size={16} />
          </button>
        </div>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="חיפוש מטופל, אבחנה, אזור..."
        />
        <div className="patients-grid mt-4">
          {filteredPatients.slice(0, 4).map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => navigate(`/therapist/patients/${patient.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
