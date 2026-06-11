// === Daily Journal with Supabase & GPX parser ===
import { useState, useEffect } from 'react';
import { PainScale, BodyMap, PAIN_LOCATION_MAP } from '../../components/SharedComponents';
import { mockJournalEntries } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  Save, Clock, Activity, Moon, Zap, MessageSquare, CheckCircle, Heart, Smartphone, Upload
} from 'lucide-react';

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function DailyJournal() {
  const { user, isMockMode } = useAuth();
  
  const [painLevel, setPainLevel] = useState(4);
  const [selectedArea, setSelectedArea] = useState('knee-r');
  const [mood, setMood] = useState('טוב');
  const [energy, setEnergy] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  // Patient Lower Limb Slider States
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

  // Journal History for charts
  const [journalHistory, setJournalHistory] = useState([]);

  const moods = [
    { label: 'מצוין', emoji: '😊', value: 'מצוין' },
    { label: 'טוב', emoji: '🙂', value: 'טוב' },
    { label: 'בינוני', emoji: '😐', value: 'בינוני' },
    { label: 'לא טוב', emoji: '😞', value: 'לא טוב' },
  ];

  // Load past journals
  useEffect(() => {
    loadJournals();
  }, [user]);

  const loadJournals = async () => {
    if (!user) return;
    
    if (isMockMode) {
      setJournalHistory(mockJournalEntries);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('patient_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setJournalHistory(data || []);
    } catch (err) {
      console.error('Error loading journals:', err);
    }
  };

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

  // Real Garmin GPX File Parser
  const handleGpxUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsConnecting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const gpxText = event.target.result;
        const parser = new DOMParser();
        const gpxDoc = parser.parseFromString(gpxText, 'text/xml');

        const trkpts = gpxDoc.getElementsByTagName('trkpt');
        if (trkpts.length === 0) {
          alert('לא נמצאו נקודות אימון בקובץ ה-GPX שהועלה. אנא ודא שזהו קובץ ריצה תקין מגרמין.');
          setIsConnecting(false);
          return;
        }

        let totalDistance = 0;
        for (let i = 0; i < trkpts.length - 1; i++) {
          const lat1 = parseFloat(trkpts[i].getAttribute('lat'));
          const lon1 = parseFloat(trkpts[i].getAttribute('lon'));
          const lat2 = parseFloat(trkpts[i + 1].getAttribute('lat'));
          const lon2 = parseFloat(trkpts[i + 1].getAttribute('lon'));

          totalDistance += calculateHaversineDistance(lat1, lon1, lat2, lon2);
        }

        // Calculate duration from time stamps
        let durationMinutes = 0;
        const times = gpxDoc.getElementsByTagName('time');
        if (times.length >= 2) {
          const startTime = new Date(times[0].textContent);
          const endTime = new Date(times[times.length - 1].textContent);
          const diffMs = endTime - startTime;
          durationMinutes = Math.round(diffMs / 1000 / 60);
        }

        const distanceRounded = Math.round(totalDistance * 100) / 100;
        // Estimate steps based on running step size (roughly 1000-1100 steps per km)
        const estimatedSteps = Math.round(distanceRounded * 1050);

        // Try to get activity name
        let actName = 'ריצת גרמין';
        const nameTags = gpxDoc.getElementsByTagName('name');
        if (nameTags.length > 0 && nameTags[0].textContent) {
          actName = nameTags[0].textContent;
        }

        setDeviceSynced(true);
        setDeviceType('garmin');
        setStepsCount(estimatedSteps);
        setDistanceKm(distanceRounded);
        setActivity(`${actName} (${distanceRounded} ק״מ, ${durationMinutes} דק׳)`);
      } catch (err) {
        console.error(err);
        alert('שגיאה בקריאת קובץ ה-GPX. ודא שהקובץ תקין ובפורמט XML/GPX.');
      } finally {
        setIsConnecting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    const journalData = {
      date: new Date().toISOString().slice(0, 10),
      pain_level: Number(painLevel),
      mood,
      energy: Number(energy),
      sleep: Number(sleep),
      activity: activity || (deviceSynced ? (deviceType === 'garmin' ? 'ריצה מסונכרנת משעון גרמין' : 'פעילות מסונכרנת מ-Apple Health') : 'מנוחה'),
      notes,
      pain_location: selectedArea,
      ...(isLowerLimb ? {
        walking_score: Number(walking),
        stairs_score: Number(stairs),
        running_score: Number(running)
      } : {}),
      steps_count: stepsCount,
      distance_km: parseFloat(distanceKm),
      device_synced: deviceSynced,
      device_type: deviceType
    };

    if (isMockMode) {
      mockJournalEntries.unshift({ ...journalData, patientId: user.id });
      setSaved(true);
      loadJournals();
      setTimeout(() => setSaved(false), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from('journals')
        .insert([{
          patient_id: user.id,
          ...journalData
        }]);

      if (error) throw error;
      setSaved(true);
      loadJournals();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('שגיאה בשמירת המעקב: ' + err.message);
    }
  };

  const painData = journalHistory.slice(0, 7).reverse().map(entry => ({
    date: new Date(entry.date).toLocaleDateString('he-IL', { weekday: 'short' }),
    pain: entry.pain_level !== undefined ? entry.pain_level : entry.painLevel,
  }));

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
        <div className="flex justify-between items-center mb-3">
          <h3 className="section-title mb-0">מיקום כאב</h3>
          {selectedArea && (
            <span className="badge badge-accent font-semibold text-xs" style={{
              background: 'rgba(226, 34, 121, 0.15)',
              color: 'var(--color-accent-light)',
              border: '1px solid rgba(226, 34, 121, 0.3)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)'
            }}>
              נבחר: {PAIN_LOCATION_MAP[selectedArea] || selectedArea}
            </span>
          )}
        </div>
        <p className="text-xs text-secondary mb-3">לחץ על האזור הכואב בגוף:</p>
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

      {/* Lower Limb Functional Metrics */}
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

      {/* Wearable Device Sync */}
      <div className="card mb-4 animate-fade-in-up" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.02)' }}>
        <h3 className="section-title flex items-center gap-2" style={{ color: '#F59E0B' }}>
          <span>⌚ חיבור שעון גרמין / Garmin Sync</span>
        </h3>
        
        {!deviceSynced ? (
          <div className="text-center py-3">
            <p className="text-xs text-secondary mb-4">בחר קובץ אימון GPX שיוצא מהגרמין שלך כדי לסנכרן מרחק, צעדים ופעילות.</p>
            
            {isConnecting ? (
              <div className="flex flex-col items-center gap-2">
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #F59E0B', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                <span className="text-xs text-secondary">מעבד נתוני GPX...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <label 
                  className="btn btn-sm cursor-pointer"
                  style={{ border: '1px solid #F59E0B', color: '#F59E0B', background: 'transparent', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Upload size={14} />
                  העלה קובץ אימון (GPX)
                  <input
                    type="file"
                    accept=".gpx"
                    onChange={handleGpxUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                
                <span className="text-xxs text-secondary">
                  * תוכל להוריד קובץ .gpx מכל אימון ב-Garmin Connect.
                </span>

                <div className="flex gap-2 justify-center mt-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleConnectDevice('garmin')}
                    style={{ color: '#F59E0B', fontSize: 10 }}
                  >
                    (סימולציה ללא קובץ)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>
                מכשיר מסונכרן: Garmin Fenix / Forerunner
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setDeviceSynced(false); setDeviceType(''); setStepsCount(0); setDistanceKm(0); }}
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
                <div className="text-xs text-secondary">צעדים מחושבים</div>
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
      {painData.length > 0 && (
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
      )}
    </div>
  );
}
