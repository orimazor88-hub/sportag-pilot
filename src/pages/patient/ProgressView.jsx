// === Progress View ===
import { mockJournalEntries, mockPatients } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import { TrendingDown, TrendingUp, Award, Target, Info } from 'lucide-react';

export default function ProgressView() {
  const { user } = useAuth();
  const entries = mockJournalEntries.slice().reverse();

  const patient = mockPatients.find(p => p.id === user?.id) || mockPatients[0];

  const painData = entries.map(e => ({
    date: new Date(e.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }),
    pain: e.painLevel,
    energy: e.energy,
  }));

  const weeklyAvg = (data, key) => {
    const sum = data.reduce((acc, d) => acc + d[key], 0);
    return (sum / data.length).toFixed(1);
  };

  const exerciseData = entries.map(e => ({
    date: new Date(e.date).toLocaleDateString('he-IL', { day: 'numeric' }),
    completed: e.exercisesCompleted ? 1 : 0,
  }));

  // Synced Device Steps / Distance Data
  const deviceData = entries.map(e => ({
    date: new Date(e.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }),
    steps: e.stepsCount || 0,
    distance: e.distanceKm || 0,
  })).filter(d => d.steps > 0);

  // Clinical & Functional Metrics Data (from Therapist)
  const metricsData = patient.metricsHistory?.map(m => ({
    date: new Date(m.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }),
    rom: m.rom,
    strength: m.strength,
    walking: m.walking,
    stairs: m.stairs,
    running: m.running,
  })) || [];

  // Dynamic Targets & Progress Calculations
  const targets = patient.targets || {
    painLevel: { intermediate: 3, final: 0 },
    rom: { intermediate: 130, final: 140 },
    strength: { intermediate: 4, final: 5 }
  };
  const initialPain = patient.initialPainLevel || 8;

  const latestMetric = patient.metricsHistory && patient.metricsHistory.length > 0
    ? patient.metricsHistory[patient.metricsHistory.length - 1]
    : null;
  const firstMetric = patient.metricsHistory && patient.metricsHistory.length > 0
    ? patient.metricsHistory[0]
    : null;

  const calcMetricProgress = (current, initial, target) => {
    if (initial === undefined || current === undefined || target === undefined || initial === target) return 100;
    const progress = ((current - initial) / (target - initial)) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  const calcPainProgress = (current, initial, target) => {
    if (initial === undefined || current === undefined || target === undefined || initial === target) return 100;
    const progress = ((initial - current) / (initial - target)) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  };

  const activeMetrics = [];
  const currentPainVal = patient.painLevel;
  const initPainVal = initialPain;
  const painTarget = targets.painLevel?.intermediate ?? 3;

  activeMetrics.push({
    name: 'כאב (VAS)',
    current: currentPainVal,
    initial: initPainVal,
    target: painTarget,
    progress: calcPainProgress(currentPainVal, initPainVal, painTarget),
    key: 'pain'
  });

  const currentRom = latestMetric?.rom || 120;
  const initRom = firstMetric?.rom || 110;
  const romTarget = targets.rom?.intermediate ?? 130;

  activeMetrics.push({
    name: 'טווח תנועה (ROM)',
    current: currentRom,
    initial: initRom,
    target: romTarget,
    progress: calcMetricProgress(currentRom, initRom, romTarget),
    key: 'rom'
  });

  const currentStr = latestMetric?.strength || 3;
  const initStr = firstMetric?.strength || 3;
  const strTarget = targets.strength?.intermediate ?? 4.5;

  activeMetrics.push({
    name: `כוח שריר (${targets.strength?.muscle || 'כללי'})`,
    current: currentStr,
    initial: initStr,
    target: strTarget,
    progress: calcMetricProgress(currentStr, initStr, strTarget),
    key: 'strength'
  });

  if (patient.isLowerLimb) {
    const currentWalk = latestMetric?.walking || 5;
    const initWalk = firstMetric?.walking || 5;
    const walkTarget = targets.walking?.intermediate ?? 8;
    activeMetrics.push({
      name: 'הליכה',
      current: currentWalk,
      initial: initWalk,
      target: walkTarget,
      progress: calcMetricProgress(currentWalk, initWalk, walkTarget),
      key: 'walking'
    });

    const currentStairs = latestMetric?.stairs || 4;
    const initStairs = firstMetric?.stairs || 4;
    const stairsTarget = targets.stairs?.intermediate ?? 8;
    activeMetrics.push({
      name: 'מדרגות',
      current: currentStairs,
      initial: initStairs,
      target: stairsTarget,
      progress: calcMetricProgress(currentStairs, initStairs, stairsTarget),
      key: 'stairs'
    });

    const currentRun = latestMetric?.running || 2;
    const initRun = firstMetric?.running || 2;
    const runTarget = targets.running?.intermediate ?? 6;
    activeMetrics.push({
      name: 'ריצה',
      current: currentRun,
      initial: initRun,
      target: runTarget,
      progress: calcMetricProgress(currentRun, initRun, runTarget),
      key: 'running'
    });
  }

  const totalExerciseDays = entries.filter(e => e.exercisesCompleted).length;
  const totalJournalDays = entries.length;
  const complianceScore = totalJournalDays > 0 ? Math.round((totalExerciseDays / totalJournalDays) * 100) : 0;

  const avgProgress = activeMetrics.length > 0
    ? Math.round(activeMetrics.reduce((sum, m) => sum + m.progress, 0) / activeMetrics.length)
    : 0;

  const getStatus = (metric) => {
    const { current, initial, target, key } = metric;
    if (key === 'pain') {
      if (current <= target) return { label: 'יעד הושג', badgeClass: 'badge-success', dot: '🟢' };
      if (current < initial) return { label: 'בשיפור', badgeClass: 'badge-warning', dot: '🟡' };
      return { label: 'ללא שיפור', badgeClass: 'badge-danger', dot: '🔴' };
    } else {
      if (current >= target) return { label: 'יעד הושג', badgeClass: 'badge-success', dot: '🟢' };
      if (current > initial) return { label: 'בשיפור', badgeClass: 'badge-warning', dot: '🟡' };
      return { label: 'ללא שיפור', badgeClass: 'badge-danger', dot: '🔴' };
    }
  };

  const milestones = [
    { label: 'התחלת טיפול', date: '15/04', achieved: true },
    { label: 'ירידה בכאב (יעד)', date: '05/05', achieved: true },
    { label: 'השגת טווח תנועה (יעד)', date: '12/05', achieved: true },
    { label: 'חזרה לריצה קלה (יעד)', date: '25/05', achieved: true },
    { label: 'עמידה ביעד טיפול (שחרור מטיפול)', date: '—', achieved: false },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 ההתקדמות שלי</h1>
          <p className="page-subtitle">מעקב לאורך זמן</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid animate-fade-in-up mb-6" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}>
            <Award size={22} />
          </div>
          <div className="stat-value" style={{ color: '#10B981' }}>
            {complianceScore}%
          </div>
          <div className="stat-label">התמדה בתרגילים</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.2)', color: '#06B6D4' }}>
            <Target size={22} />
          </div>
          <div className="stat-value" style={{ color: '#06B6D4' }}>
            {avgProgress}%
          </div>
          <div className="stat-label">
            התקדמות ליעד ({targets.targetDate ? `עד ל-${new Date(targets.targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric', year: 'numeric'})}` : 'פגישה הבאה'})
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>
            <TrendingDown size={22} />
          </div>
          <div className="stat-value">{currentPainVal}/10</div>
          <div className="stat-label">דרגת כאב נוכחית</div>
        </div>
      </div>

      {/* Explanation Box */}
      <div className="card mb-6 animate-fade-in-up stagger-1" style={{ border: '1px solid rgba(38, 98, 137, 0.2)', background: 'rgba(38, 98, 137, 0.03)' }}>
        <div className="flex gap-2 items-start">
          <Info className="text-primary-light mt-1 flex-shrink-0" size={18} />
          <div>
            <strong className="text-sm text-primary-light">כיצד נקבעים מדדי ההתקדמות שלי?</strong>
            <p className="text-xs text-secondary mt-1" style={{ lineHeight: 1.7 }}>
              הפיזיותרפיסט שלך הגדיר עבורך ערכי בסיס (מצב התחלתי) ויעד טיפול עם תאריך יעד ברור.
              <br />
              ההתקדמות שלך מורכבת מ<strong>ציון התמדה בתרגול</strong> (מבוסס על דיווחי התרגול הביתיומיים שלך) ומ<strong>ציונים קליניים</strong> המודדים כמה השתפרו המדדים הפיזיולוגיים (כאב, כוח וטווחי תנועה) בפועל.
            </p>
          </div>
        </div>
      </div>

      {/* Target Checklist */}
      <div className="card mb-6 animate-fade-in-up stagger-1">
        <h3 className="section-title">היעדים שהגדיר לי המטפל שלי</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>מדד קליני</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>ערך התחלתי</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>מצב נוכחי</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>
                  יעד ({targets.targetDate ? `עד ל-${new Date(targets.targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric', year: 'numeric'})}` : 'פגישה הבאה'})
                </th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {activeMetrics.map((m, idx) => {
                const status = getStatus(m);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{m.name}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{m.initial}{m.key === 'rom' ? '°' : m.key === 'strength' ? '/5' : ''}</td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--text-primary)', fontWeight: 600 }}>{m.current}{m.key === 'rom' ? '°' : m.key === 'strength' ? '/5' : ''}</td>
                    <td style={{ padding: 'var(--space-3)', color: '#06B6D4' }}>{m.target}{m.key === 'rom' ? '°' : m.key === 'strength' ? '/5' : ''}</td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span className={`badge ${status.badgeClass}`}>
                        <span style={{ marginLeft: 4 }}>{status.dot}</span>
                        <span>{status.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pain Chart */}
      <div className="card mb-4 animate-fade-in-up stagger-2">
        <h3 className="section-title">מגמת כאב</h3>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={painData}>
              <defs>
                <linearGradient id="painGradProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E22279" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E22279" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="energyGradProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
              <YAxis domain={[0, 10]} stroke="var(--text-tertiary)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  borderRadius: 8, color: 'var(--text-primary)', direction: 'rtl',
                }}
              />
              <Area type="monotone" dataKey="pain" stroke="#E22279" fill="url(#painGradProgress)" strokeWidth={2} name="כאב" />
              <Area type="monotone" dataKey="energy" stroke="#F59E0B" fill="url(#energyGradProgress)" strokeWidth={2} name="אנרגיה" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div style={{ width: 12, height: 3, background: '#E22279', borderRadius: 2 }} />
            <span className="text-secondary">כאב</span>
          </div>
          <div className="flex items-center gap-1">
            <div style={{ width: 12, height: 3, background: '#F59E0B', borderRadius: 2 }} />
            <span className="text-secondary">אנרגיה</span>
          </div>
        </div>
      </div>

      {/* Clinical Metrics Progress (Therapist Evaluations) */}
      {metricsData.length > 0 && (
        <div className="grid-2 mb-4 animate-fade-in-up stagger-3">
          {/* ROM Progress */}
          <div className="card">
            <h3 className="section-title text-sm" style={{ color: '#06B6D4' }}>טווח תנועה (ROM)</h3>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer>
                <LineChart data={metricsData}>
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={9} />
                  <YAxis domain={['auto', 'auto']} stroke="var(--text-tertiary)" fontSize={10} unit="°" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                      borderRadius: 8, color: 'var(--text-primary)', direction: 'rtl',
                    }}
                  />
                  <Line type="monotone" dataKey="rom" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4 }} name="ROM" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Muscle Strength Progress */}
          <div className="card">
            <h3 className="section-title text-sm" style={{ color: '#8B5CF6' }}>כוח שריר</h3>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer>
                <LineChart data={metricsData}>
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={9} />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke="var(--text-tertiary)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                      borderRadius: 8, color: 'var(--text-primary)', direction: 'rtl',
                    }}
                  />
                  <Line type="monotone" dataKey="strength" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4 }} name="כוח שריר" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Lower Limb Clinical Metrics Progress */}
      {patient.isLowerLimb && metricsData.length > 0 && (
        <div className="card mb-4 animate-fade-in-up stagger-3">
          <h3 className="section-title" style={{ color: '#10B981' }}>מדדי תפקוד גפה תחתונה (הערכת מטפל)</h3>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={metricsData}>
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={9} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke="var(--text-tertiary)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: 8, color: 'var(--text-primary)', direction: 'rtl',
                  }}
                />
                <Line type="monotone" dataKey="walking" stroke="#10B981" strokeWidth={2} name="הליכה" />
                <Line type="monotone" dataKey="stairs" stroke="#F59E0B" strokeWidth={2} name="מדרגות" />
                <Line type="monotone" dataKey="running" stroke="#EC4899" strokeWidth={2} name="ריצה" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-xs">
            <span style={{ color: '#10B981' }}>● הליכה</span>
            <span style={{ color: '#F59E0B' }}>● מדרגות</span>
            <span style={{ color: '#EC4899' }}>● ריצה</span>
          </div>
        </div>
      )}

      {/* Garmin / Wearable Activity Progress Chart */}
      {deviceData.length > 0 && (
        <div className="card mb-4 animate-fade-in-up stagger-3">
          <h3 className="section-title" style={{ color: '#F59E0B' }}>צעדים יומיים מסונכרנים משעון/מכשיר לביש</h3>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              <BarChart data={deviceData}>
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={9} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: 8, color: 'var(--text-primary)', direction: 'rtl',
                  }}
                  formatter={(v) => [v.toLocaleString(), 'צעדים']}
                />
                <Bar dataKey="steps" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Exercise Compliance */}
      <div className="card mb-4 animate-fade-in-up stagger-3">
        <h3 className="section-title">עמידה בתרגילים</h3>
        <div style={{ width: '100%', height: 150 }}>
          <ResponsiveContainer>
            <BarChart data={exerciseData}>
              <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
              <YAxis domain={[0, 1]} ticks={[0, 1]} stroke="var(--text-tertiary)" fontSize={11}
                tickFormatter={(v) => v === 1 ? '✓' : '✗'}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  borderRadius: 8, color: 'var(--text-primary)', direction: 'rtl',
                }}
                formatter={(v) => [v === 1 ? 'בוצע' : 'לא בוצע', 'תרגילים']}
              />
              <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Milestones */}
      <div className="card animate-fade-in-up stagger-4">
        <h3 className="section-title">🏆 אבני דרך</h3>
        <div className="milestones-list">
          {milestones.map((m, i) => (
            <div key={i} className="milestone-item flex items-center gap-3" style={{ padding: 'var(--space-3) 0' }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: m.achieved ? '#10B981' : 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: 'white', fontWeight: 700, flexShrink: 0,
                }}
              >
                {m.achieved ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <span className={`text-sm ${m.achieved ? 'font-semibold' : 'text-muted'}`}>
                  {m.label}
                </span>
              </div>
              <span className="text-xs text-muted">{m.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

