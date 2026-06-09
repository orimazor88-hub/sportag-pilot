// === Calendar View ===
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCalendarEvents } from '../../data/mockData';
import { ChevronRight, ChevronLeft, Plus, Clock } from 'lucide-react';

export default function CalendarView() {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date('2026-06-01');
    d.setDate(d.getDate() - d.getDay());
    return d;
  });
  const [view, setView] = useState('week'); // week / list

  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = getDaysOfWeek();
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const getEventsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockCalendarEvents.filter(e => e.date === dateStr);
  };

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const formatWeekRange = () => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return `${currentWeekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 לוח טיפולים</h1>
          <p className="page-subtitle">ניהול פגישות ותזכורות</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} />
          <span className="hide-mobile">פגישה חדשה</span>
        </button>
      </div>

      {/* Week Navigation */}
      <div className="glass-card mb-6">
        <div className="flex justify-between items-center">
          <button className="btn btn-ghost btn-icon" onClick={prevWeek}>
            <ChevronRight size={20} />
          </button>
          <span className="font-semibold">{formatWeekRange()}</span>
          <button className="btn btn-ghost btn-icon" onClick={nextWeek}>
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="tabs mb-6">
        <button className={`tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>
          שבועי
        </button>
        <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
          רשימה
        </button>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div className="calendar-week animate-fade-in">
          {days.map((day, i) => {
            const events = getEventsForDay(day);
            const isToday = day.toDateString() === new Date('2026-06-03').toDateString();

            return (
              <div key={i} className={`calendar-day ${isToday ? 'calendar-day-today' : ''}`}>
                <div className="calendar-day-header">
                  <span className="calendar-day-name">{dayNames[day.getDay()]}</span>
                  <span className={`calendar-day-number ${isToday ? 'today' : ''}`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="calendar-day-events">
                  {events.map(event => (
                    <div
                      key={event.id}
                      className="calendar-event"
                      style={{ borderInlineStartColor: event.color, background: `${event.color}10` }}
                      onClick={() => navigate(`/therapist/patients/${event.patientId}`)}
                    >
                      <div className="text-xs font-semibold" style={{ color: event.color }}>
                        {event.time}
                      </div>
                      <div className="text-sm font-medium">{event.patientName}</div>
                      <div className="text-xs text-muted">{event.type} • {event.duration}′</div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-xs text-muted text-center p-4" style={{ opacity: 0.5 }}>—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="animate-fade-in">
          {mockCalendarEvents.map((event, i) => (
            <div
              key={event.id}
              className="card card-compact card-hover mb-3 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms`, cursor: 'pointer' }}
              onClick={() => navigate(`/therapist/patients/${event.patientId}`)}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 4, height: 40, borderRadius: 2,
                    background: event.color, flexShrink: 0
                  }}
                />
                <div className="flex-1">
                  <div className="font-semibold">{event.patientName}</div>
                  <div className="text-xs text-secondary">
                    {new Date(event.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-semibold text-sm" style={{ color: event.color }}>{event.time}</div>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Clock size={12} />
                    {event.duration} דק'
                  </div>
                </div>
                <span className="badge" style={{ background: `${event.color}20`, color: event.color }}>
                  {event.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Google Calendar Integration Note */}
      <div className="card mt-6 text-center" style={{ borderStyle: 'dashed', opacity: 0.7 }}>
        <p className="text-sm text-secondary">
          🔗 אינטגרציה עם Google Calendar • בגרסת ה-Production
        </p>
      </div>
    </div>
  );
}
