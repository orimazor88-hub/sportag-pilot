// === Daily Journal ===
import { useState } from 'react';
import { PainScale, BodyMap } from '../../components/SharedComponents';
import { mockJournalEntries } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  Save, Clock, Activity, Moon, Zap, MessageSquare, CheckCircle, Heart, Smartphone
} from 'lucide-react';

export default function DailyJournal() {
  const { user } = useAuth();
  const [painLevel, setPainLevel] = useState(4);
  const [selectedArea, setSelectedArea] = useState('knee-r');
  const [mood, setMood] = useState('טוב');
  const [energy, setEnergy] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  // Patient Lower Limb Slider States (Yuval has isLowerLimb = true)
  const isLowerLimb = user?.isLowerLimb || false;
  const [walking, setWalking] = useState(8);
  const [stairs, setStairs] = useState(7);
  const [running, setRunning] = useState(5);

  // Synced Wearable Device States
  const [deviceSynced, setDeviceSynced] = useState(false);
  const [deviceType, setDeviceType] = useState(''); // 'garmin' or 'apple_health'
  const [stepsCount, setStepsCount] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const moods = [
    { label: 'מצוין', emoji: '😊', value: 'מצוין' },
    { label: 'טוב', emoji: '🙂', value: 'טוב' },
    { label: 'בינוני', emoji: '😐', value: 'בינוני' },
    { label: 'לא טוב', emoji: '😞', value: 'לא טוב' },
  ];

  const painData = mockJournalEntries.slice(0, 7).reverse().map(entry => ({
    date: new Date(entry.date).toLocaleDateString('he-IL', { weekday: 'short' }),
    pain: entry.painLevel,
  }));

  const handleConnectDevice = (type) => {
    setIsConnecting(true);
    setTimeout(() => {
      setDeviceSynced(true);
      setDeviceType(type);
      setStepsCount(type === 'garmin' ? 10450 : 8900);
      setDistanceKm(type === 'garmin' ? 5.2 : 0);
      setActivity(type === 'garmin' ? 'ריצה מסונכרנת משעון גרמין (5.2 ק״מ)' : 'הליכה יומית מסונכרנת מ-Apple Health');
      setIsConnecting(false);
    }, 1500);
  };

  const handleSave = () => {
    const newEntry = {
      date: new Date().toISOString().slice(0, 10),
      painLevel: Number(painLevel),
      mood,
      energy: Number(energy),
      sleep: Number(sleep),
      activity: activity || (deviceSynced ? (deviceType === 'garmin' ? 'ריצה מסונכרנת משעון גרמין' : 'פעילות מסונכרנת מ-Apple Health') : 'מנוחה'),
      notes,
      exercisesCompleted: true,
      ...(isLowerLimb ? {
        walkingScore: Number(walking),
        stairsScore: Number(stairs),
        runningScore: Number(running)
      } : {}),
      ...(deviceSynced ? {
        stepsCount,
        distanceKm,
        deviceSynced: true,
        deviceType
      } : { deviceSynced: false })
    };
    mockJournalEntries.unshift(newEntry);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 מעקב יומי</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Toast */}
      {saved && (
        <div className="toast toast-success">
          <CheckCircle size={18} />
          המעקב היומי נשמר בהצלחה!
        </div>
      )}

      {/* Pain Level */}
      <div className="card mb-4 animate-fade-in-up">
        <h3 className="section-title">דרגת כאב</h3>
        <PainScale value={painLevel} onChange={setPainLevel} />
      </div>

      {/* Body Map */}
      <div className="card mb-4 animate-fade-in-up stagger-2">
        <h3 className="section-title">מיקום כאב</h3>
        <p className="text-xs text-secondary mb-3">לחץ על האזור הכואב</p>
        <BodyMap selectedArea={selectedArea} onSelectArea={setSelectedArea} />
      </div>

      {/* Mood */}
      <div className="card mb-4 animate-fade-in-up stagger-3">
        <h3 className="section-title">מצב רוח</h3>
        <div className="flex gap-3 justify-center">
          {moods.map(m => (
            <button
              key={m.value}
              className={`mood-btn ${mood === m.value ? 'active' : ''}`}
              onClick={() => setMood(m.value)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: 'var(--space-3) var(--space-4)',
                border: `2px solid ${mood === m.value ? 'var(--color-primary-light)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-lg)', background: mood === m.value ? 'rgba(38,98,137,0.15)' : 'var(--bg-tertiary)',
                cursor: 'pointer', transition: 'all var(--transition-base)',
                fontFamily: 'var(--font-family)', color: 'var(--text-primary)',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{m.emoji}</span>
              <span className="text-xs">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy & Sleep */}
      <div className="grid-2 mb-4 animate-fade-in-up stagger-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} style={{ color: '#F59E0B' }} />
            <span className="font-semibold text-sm">אנרגיה</span>
          </div>
          <input
            type="range" min="1" max="10" value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: '#F59E0B' }}
          />
          <div className="text-center text-sm font-bold mt-1" style={{ color: '#F59E0B' }}>
            {energy}/10
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Moon size={16} style={{ color: '#8B5CF6' }} />
            <span className="font-semibold text-sm">שינה (שעות)</span>
          </div>
          <input
            type="range" min="3" max="12" value={sleep}
            onChange={(e) => setSleep(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: '#8B5CF6' }}
          />
          <div className="text-center text-sm font-bold mt-1" style={{ color: '#8B5CF6' }}>
            {sleep} שעות
          </div>
        </div>
      </div>

      {/* Lower Limb Functional Metrics (Yuval/Noa) */}
      {isLowerLimb && (
        <div className="card mb-4 animate-fade-in-up">
          <h3 className="section-title" style={{ color: '#10B981' }}>מדדי תפקוד גפה תחתונה</h3>
          <p className="text-xs text-secondary mb-4">כיצד אתה מעריך את התפקוד שלך היום במדדים הבאים?</p>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="flex justify-between text-sm font-semibold mb-1">
                <span>איכות הליכה</span>
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>{walking}/10</span>
              </label>
              <input
                type="range" min="0" max="10" value={walking}
                onChange={(e) => setWalking(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: '#10B981' }}
              />
            </div>
            
            <div>
              <label className="flex justify-between text-sm font-semibold mb-1">
                <span>עליית/ירידת מדרגות</span>
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>{stairs}/10</span>
              </label>
              <input
                type="range" min="0" max="10" value={stairs}
                onChange={(e) => setStairs(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: '#10B981' }}
              />
            </div>
            
            <div>
              <label className="flex justify-between text-sm font-semibold mb-1">
                <span>ריצה</span>
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>{running}/10</span>
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

      {/* Synced Device Integration */}
      <div className="card mb-4 animate-fade-in-up" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.02)' }}>
        <h3 className="section-title flex items-center gap-2" style={{ color: '#F59E0B' }}>
          <span>⌚ חיבור שעון / התקן לביש</span>
        </h3>
        
        {!deviceSynced ? (
          <div className="text-center py-3">
            <p className="text-xs text-secondary mb-4">חבר את שעון הריצה או את ה-iPhone שלך כדי לסנכרן צעדים ואימונים למעקב היומי באופן אוטומטי.</p>
            
            {isConnecting ? (
              <div className="flex flex-col items-center gap-2">
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #F59E0B', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                <span className="text-xs text-secondary">מתחבר למכשיר...</span>
              </div>
            ) : (
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ border: '1px solid #F59E0B', color: '#F59E0B', background: 'transparent' }}
                  onClick={() => handleConnectDevice('garmin')}
                >
                  חבר Garmin ⌚
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ border: '1px solid #0891B2', color: '#0891B2', background: 'transparent' }}
                  onClick={() => handleConnectDevice('apple_health')}
                >
                  חבר Apple Health 📱
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>
                מכשיר מחובר: {deviceType === 'garmin' ? 'Garmin Fenix 7' : 'Apple Watch / Health'}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setDeviceSynced(false); setDeviceType(''); }}
                style={{ color: 'var(--text-tertiary)', fontSize: 11, padding: 0 }}
              >
                נתק
              </button>
            </div>
            
            <div className="grid-2 text-center" style={{ gap: 'var(--space-2)' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {stepsCount.toLocaleString()}
                </div>
                <div className="text-xs text-secondary">צעדים היום</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {distanceKm} ק״מ
                </div>
                <div className="text-xs text-secondary">מרחק ריצה</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity */}
      <div className="card mb-4 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} style={{ color: 'var(--color-teal)' }} />
          <span className="font-semibold text-sm">פעילות משמעותית היום</span>
        </div>
        <input
          type="text"
          className="input"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="למשל: ריצה 20 דקות, אימון חדר כושר, יום מנוחה..."
        />
      </div>

      {/* Notes */}
      <div className="card mb-4 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} style={{ color: 'var(--color-primary-light)' }} />
          <span className="font-semibold text-sm">הערות נוספות</span>
        </div>
        <textarea
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="משהו שחשוב לשתף עם המטפל..."
          rows={3}
        />
      </div>

      {/* Save */}
      <button className="btn btn-primary btn-lg w-full mb-6" onClick={handleSave}>
        <Save size={18} />
        שמור מעקב יומי
      </button>

      {/* Weekly Trend */}
      <div className="card animate-fade-in-up">
        <h3 className="section-title">מגמת כאב שבועית</h3>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <AreaChart data={painData}>
              <defs>
                <linearGradient id="painGradJournal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E22279" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E22279" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
              <YAxis domain={[0, 10]} stroke="var(--text-tertiary)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  borderRadius: 8, color: 'var(--text-primary)', direction: 'rtl',
                }}
              />
              <Area type="monotone" dataKey="pain" stroke="#E22279" fill="url(#painGradJournal)" strokeWidth={2} name="כאב" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
