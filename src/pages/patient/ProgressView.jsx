// === Progress View ===
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { mockJournalEntries, mockPatients } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import { TrendingDown, TrendingUp, Award, Target, Info } from 'lucide-react';

export default function ProgressView() {
  const { user, isMockMode } = useAuth();
  const location = useLocation();
  const [patient, setPatient] = useState(null);
  const [journalHistory, setJournalHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [user, isMockMode]);

  useEffect(() => {
    if (!loading) {
      const params = new URLSearchParams(location.search);
      const scrollToId = params.get('scrollTo');
      if (scrollToId) {
        setTimeout(() => {
          document.getElementById(scrollToId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  }, [loading, location.search]);

  const loadProgressData = async () => {
    if (!user) return;

    if (isMockMode) {
      const p = mockPatients.find(x => x.id === user.id) || mockPatients[0];
      setPatient(p);
      
      const updatedHistory = mockJournalEntries.map(j => {
        const entryDateStr = new Date(j.date).toISOString().slice(0, 10);
        const savedDone = localStorage.getItem(`sportag_completed_exercises_${user.id}_${entryDateStr}`);
        let completed = j.exercisesCompleted;
        if (savedDone) {
          try {
            completed = Object.values(JSON.parse(savedDone)).some(Boolean);
          } catch (e) {}
        }
        return { ...j, exercisesCompleted: completed };
      });
      
      setJournalHistory(updatedHistory);
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

      if (pError) throw pError;

      // 2. Fetch Journals
      const { data: dbJournals, error: jError } = await supabase
        .from('journals')
        .select('*')
        .eq('patient_id', user.id)
        .order('date', { ascending: false });

      if (jError) throw jError;

      const formattedJournals = (dbJournals || []).map(j => {
        const entryDateStr = new Date(j.date).toISOString().slice(0, 10);
        const savedDone = localStorage.getItem(`sportag_completed_exercises_${user.id}_${entryDateStr}`);
        let completed = false;
        if (savedDone) {
          try {
            completed = Object.values(JSON.parse(savedDone)).some(Boolean);
          } catch (e) {}
        } else {
          completed = j.activity && j.activity !== 'מנוחה';
        }

        return {
          id: j.id,
          date: j.date,
          painLevel: j.pain_level,
          mood: j.mood,
          energy: j.energy,
          sleep: j.sleep,
          activity: j.activity,
          notes: j.notes,
          exercisesCompleted: completed,
          walkingScore: j.walking_score,
          stairsScore: j.stairs_score,
          runningScore: j.running_score,
          stepsCount: j.steps_count,
          distanceKm: j.distance_km,
          deviceSynced: j.device_synced,
          deviceType: j.device_type,
          rom: j.rom,
          strength: j.strength
        };
      });

      const formattedPatient = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || 'לא עודכן',
        avatar: profile.avatar || '🏃',
        avatarBg: '#8B5CF6',
        sport: profile.sport || 'פיילוט פעיל',
        conditionHe: profile.condition_name || 'שיקום פיזיותרפיה',
        condition: 'Active Rehab Profile',
        area: profile.is_lower_limb ? 'גפה תחתונה' : 'גפה עליונה',
        areaColor: profile.is_lower_limb ? '#06B6D4' : '#8B5CF6',
        startDate: profile.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        painLevel: formattedJournals.length > 0 ? formattedJournals[0].painLevel : 4,
        progress: 50,
        isLowerLimb: profile.is_lower_limb,
        initialPainLevel: formattedJournals.length > 0 ? formattedJournals[formattedJournals.length - 1].painLevel : 7,
        targets: profile.targets || {
          targetDate: '2026-06-25',
          painLevel: { intermediate: 3, final: 0 },
          rom: { intermediate: 135, final: 145 },
          strength: { intermediate: 4.5, final: 5, muscle: 'ארבע ראשי' },
          ...(profile.is_lower_limb ? {
            walking: { intermediate: 8, final: 10 },
            stairs: { intermediate: 8, final: 10 },
            running: { intermediate: 7, final: 10 }
          } : {})
        },
        metricsHistory: formattedJournals.length > 0 ? formattedJournals.map(j => ({
          date: j.date,
          rom: j.rom || null,
          strength: j.strength || null,
          walking: j.walkingScore || null,
          stairs: j.stairsScore || null,
          running: j.runningScore || null
        })).reverse() : [{
          date: new Date().toISOString().slice(0, 10),
          rom: profile.is_lower_limb ? 120 : 150,
          strength: 3,
          walking: 5,
          stairs: 5,
          running: 2
        }]
      };

      setPatient(formattedPatient);
      setJournalHistory(formattedJournals);
    } catch (err) {
      console.error('Error loading patient progress details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !patient) {
    return (
      <div className="empty-state">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--color-primary-light)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
        <h3>טוען נתוני התקדמות...</h3>
      </div>
    );
  }

  const entries = journalHistory.slice().reverse();

  // Unique Pain Data by date label to prevent repeats on the X-axis
  const uniquePainDataMap = new Map();
  entries.forEach(e => {
    const dateLabel = new Date(e.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
    uniquePainDataMap.set(dateLabel, {
      date: dateLabel,
      pain: e.painLevel,
      energy: e.energy,
    });
  });
  const painData = Array.from(uniquePainDataMap.values());

  const weeklyAvg = (data, key) => {
    if (data.length === 0) return '0.0';
    const sum = data.reduce((acc, d) => acc + (d[key] || 0), 0);
    return (sum / data.length).toFixed(1);
  };

  // Unique Exercise Compliance by date label
  const uniqueExerciseMap = new Map();
  entries.forEach(e => {
    const dateLabel = new Date(e.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
    uniqueExerciseMap.set(dateLabel, {
      date: dateLabel,
      completed: e.exercisesCompleted ? 1 : 0,
    });
  });
  const exerciseData = Array.from(uniqueExerciseMap.values());

  // Unique Device Steps by date label
  const uniqueDeviceMap = new Map();
  entries.forEach(e => {
    if (e.stepsCount > 0) {
      const dateLabel = new Date(e.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
      uniqueDeviceMap.set(dateLabel, {
        date: dateLabel,
        steps: e.stepsCount || 0,
        distance: e.distanceKm || 0,
      });
    }
  });
  const deviceData = Array.from(uniqueDeviceMap.values());

  // Unique Therapist Evaluation Clinical Metrics by date label
  const uniqueMetricsMap = new Map();
  (patient.metricsHistory || []).forEach(m => {
    const dateLabel = new Date(m.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
    uniqueMetricsMap.set(dateLabel, {
      date: dateLabel,
      rom: m.rom,
      strength: m.strength,
      walking: m.walking,
      stairs: m.stairs,
      running: m.running,
    });
  });
  const metricsData = Array.from(uniqueMetricsMap.values());

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

  const getFirstNonNull = (history, key, fallback) => {
    if (!history) return fallback;
    const entry = history.find(m => m[key] !== null && m[key] !== undefined);
    return entry ? entry[key] : fallback;
  };

  const getLatestNonNull = (history, key, fallback) => {
    if (!history) return fallback;
    const entry = [...history].reverse().find(m => m[key] !== null && m[key] !== undefined);
    return entry ? entry[key] : fallback;
  };

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

  const initRom = getFirstNonNull(patient.metricsHistory, 'rom', 110);
  const currentRom = getLatestNonNull(patient.metricsHistory, 'rom', initRom);
  const romTarget = targets.rom?.intermediate ?? 130;

  activeMetrics.push({
    name: 'טווח תנועה (ROM)',
    current: currentRom,
    initial: initRom,
    target: romTarget,
    progress: calcMetricProgress(currentRom, initRom, romTarget),
    key: 'rom'
  });

  const initStr = getFirstNonNull(patient.metricsHistory, 'strength', 3);
  const currentStr = getLatestNonNull(patient.metricsHistory, 'strength', initStr);
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
    const initWalk = getFirstNonNull(patient.metricsHistory, 'walking', 5);
    const currentWalk = getLatestNonNull(patient.metricsHistory, 'walking', initWalk);
    const walkTarget = targets.walking?.intermediate ?? 8;
    activeMetrics.push({
      name: 'הליכה',
      current: currentWalk,
      initial: initWalk,
      target: walkTarget,
      progress: calcMetricProgress(currentWalk, initWalk, walkTarget),
      key: 'walking'
    });

    const initStairs = getFirstNonNull(patient.metricsHistory, 'stairs', 4);
    const currentStairs = getLatestNonNull(patient.metricsHistory, 'stairs', initStairs);
    const stairsTarget = targets.stairs?.intermediate ?? 8;
    activeMetrics.push({
      name: 'מדרגות',
      current: currentStairs,
      initial: initStairs,
      target: stairsTarget,
      progress: calcMetricProgress(currentStairs, initStairs, stairsTarget),
      key: 'stairs'
    });

    const initRun = getFirstNonNull(patient.metricsHistory, 'running', 2);
    const currentRun = getLatestNonNull(patient.metricsHistory, 'running', initRun);
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
          <h1 className="page-title">📈 ההתקדמות שלי נכון לתאריך: {new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })}</h1>
          <p className="page-subtitle">מעקב לאורך זמן</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid animate-fade-in-up mb-6" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div 
          className="stat-card card-hover" 
          onClick={() => document.getElementById('compliance-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}>
            <Award size={22} />
          </div>
          <div className="stat-value" style={{ color: '#10B981' }}>
            {complianceScore}%
          </div>
          <div className="stat-label">התמדה בתרגילים</div>
        </div>
        <div 
          className="stat-card card-hover" 
          onClick={() => document.getElementById('targets-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          style={{ cursor: 'pointer' }}
        >
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
        <div 
          className="stat-card card-hover" 
          onClick={() => document.getElementById('pain-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>
            <TrendingDown size={22} />
          </div>
          <div className="stat-value">{currentPainVal}/10</div>
          <div className="stat-label">דרגת כאב נוכחית</div>
        </div>
      </div>

      {/* Explanation Box */}
      <div className="card mb-6 animate-fade-in-up stagger-1" style={{ border: '1px solid rgba(38, 98, 137, 0.25)', background: 'linear-gradient(135deg, rgba(38, 98, 137, 0.05) 0%, rgba(8, 145, 178, 0.05) 100%)', direction: 'rtl' }}>
        <div className="flex gap-2 items-start mb-3">
          <Info className="text-primary-light mt-0.5 flex-shrink-0" size={20} />
          <h4 className="font-bold text-sm text-primary-light" style={{ margin: 0 }}>הסבר על מדדי ההתקדמות והחישובים במערכת</h4>
        </div>
        
        <div className="flex flex-col gap-4 text-xs text-secondary" style={{ lineHeight: 1.6 }}>
          {/* Consistency */}
          <div style={{ borderRight: '3px solid #10B981', paddingRight: '10px' }}>
            <strong className="text-sm" style={{ color: '#10B981' }}>📊 מדד התמדה ({complianceScore}%)</strong>
            <p className="mt-0.5" style={{ margin: 0 }}>
              <strong>מה זה אומר?</strong> מידת העקביות שלך בביצוע התרגילים הביתיים שהוקצו לך.
              <br />
              <strong>כיצד מחושב?</strong> אחוז הימים שבהם סימנת שביצעת את התרגילים מתוך סך הימים שבהם מילאת מעקב יומי. מומלץ לשמור על התמדה של מעל 80% להשגת תוצאות שיקום מרביות.
            </p>
          </div>

          {/* Progress */}
          <div style={{ borderRight: '3px solid #06B6D4', paddingRight: '10px' }}>
            <strong className="text-sm" style={{ color: '#06B6D4' }}>🎯 מדד התקדמות ({avgProgress}%)</strong>
            <p className="mt-0.5" style={{ margin: 0 }}>
              <strong>מה זה אומר?</strong> ההתקדמות הכללית שלך לעומת יעדי הטיפול שהוגדרו.
              <br />
              <strong>כיצד מחושב?</strong> הממוצע של אחוזי השיפור בכל המדדים הפעילים שלך (רמת הכאב, טווח התנועה, כוח השריר, ומדדי התפקוד של גפה תחתונה כמו הליכה, מדרגות וריצה) יחסית לנקודת ההתחלה (בסרגל של 0% עד 100% הגעה ליעד).
            </p>
          </div>

          {/* Pain Level */}
          <div style={{ borderRight: '3px solid #E22279', paddingRight: '10px' }}>
            <strong className="text-sm" style={{ color: '#E22279' }}>⚡ דרגת כאב נוכחית ({currentPainVal}/10)</strong>
            <p className="mt-0.5" style={{ margin: 0 }}>
              <strong>מה זה אומר?</strong> עוצמת הכאב הנוכחית באזור הפגוע.
              <br />
              <strong>כיצד מחושב?</strong> ציון הכאב האחרון שדיווחת עליו במעקב היומי בסולם VAS (בין 0 ל-10). ציון 0 פירושו ללא כאב כלל, וציון 10 פירושו כאב עז ביותר.
            </p>
          </div>
        </div>
      </div>

      {/* Target Checklist */}
      <div id="targets-section" className="card mb-6 animate-fade-in-up stagger-1">
        <h3 className="section-title">היעדים שהגדיר לי המטפל שלי</h3>
        <div style={{ position: 'relative' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse', textAlign: 'right', minWidth: '550px' }}>
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
                {/* קבוצה 1: מדידות קליניות */}
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
                  <td colSpan="5" style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 'bold', color: 'var(--color-primary-light)' }}>
                    מדידות קליניות מהמטפל
                  </td>
                </tr>
                {activeMetrics.filter(m => m.key === 'rom' || m.key === 'strength').map((m, idx) => {
                  const status = getStatus(m);
                  return (
                    <tr key={`clinical-${idx}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 600, paddingRight: 'var(--space-6)' }}>{m.name}</td>
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

                {/* קבוצה 2: מדדי תפקוד יומיים */}
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
                  <td colSpan="5" style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 'bold', color: 'var(--color-teal-light)' }}>
                    מדדי תפקוד יומיים שלי
                  </td>
                </tr>
                {activeMetrics.filter(m => m.key !== 'rom' && m.key !== 'strength').map((m, idx) => {
                  const status = getStatus(m);
                  return (
                    <tr key={`daily-${idx}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 600, paddingRight: 'var(--space-6)' }}>{m.name}</td>
                      <td style={{ padding: 'var(--space-3)' }}>{m.initial}</td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--text-primary)', fontWeight: 600 }}>{m.current}</td>
                      <td style={{ padding: 'var(--space-3)', color: '#06B6D4' }}>{m.target}</td>
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
          {/* Horizontal Scroll indicator on small screens */}
          <div className="hide-desktop animate-pulse" style={{
            position: 'absolute',
            left: '8px',
            bottom: '8px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(4px)',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            fontSize: '9px',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>⬅️ החלק לצדדים לצפייה בטבלה</span>
          </div>
        </div>
      </div>

      {/* Pain Chart */}
      <div id="pain-section" className="card mb-4 animate-fade-in-up stagger-2">
        <h3 className="section-title">מגמת כאב ואנרגיה - דיווח יומי</h3>
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
            <h3 className="section-title text-sm" style={{ color: '#06B6D4' }}>טווח תנועה (ROM) - מדידה קלינית</h3>
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
                  <Line type="monotone" dataKey="rom" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4 }} name="ROM" connectNulls={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Muscle Strength Progress */}
          <div className="card">
            <h3 className="section-title text-sm" style={{ color: '#8B5CF6' }}>כוח שריר (MRC) - מדידה קלינית</h3>
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
                  <Line type="monotone" dataKey="strength" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4 }} name="כוח שריר" connectNulls={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Lower Limb Clinical Metrics Progress */}
      {patient.isLowerLimb && metricsData.length > 0 && (
        <div className="card mb-4 animate-fade-in-up stagger-3">
          <h3 className="section-title" style={{ color: '#10B981' }}>מדדי תפקוד גפה תחתונה (0-10) - דיווח יומי</h3>
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
      <div id="compliance-section" className="card mb-4 animate-fade-in-up stagger-3">
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

