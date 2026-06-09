// === Patient List Page ===
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockPatients } from '../../data/mockData';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { PatientCard, SearchBar } from '../../components/SharedComponents';
import { UserPlus, Filter, X, Info } from 'lucide-react';

export default function PatientList() {
  const { isMockMode } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sport, setSport] = useState('');
  const [condition, setCondition] = useState('');
  const [conditionHe, setConditionHe] = useState('');
  const [area, setArea] = useState('ברך');
  const [isLowerLimb, setIsLowerLimb] = useState(true);

  // Targets & Baselines State
  const [initialPain, setInitialPain] = useState(7);
  const [interPain, setInterPain] = useState(3);

  const [initialRom, setInitialRom] = useState(110);
  const [interRom, setInterRom] = useState(130);

  const [initialStrength, setInitialStrength] = useState(3);
  const [interStrength, setInterStrength] = useState(4.5);

  // Lower Limb specific
  const [initialWalking, setInitialWalking] = useState(5);
  const [interWalking, setInterWalking] = useState(8);

  const [initialStairs, setInitialStairs] = useState(4);
  const [interStairs, setInterStairs] = useState(8);

  const [initialRunning, setInitialRunning] = useState(2);
  const [interRunning, setInterRunning] = useState(6);

  const [targetDate, setTargetDate] = useState('2026-06-20');
  const [strengthMuscle, setStrengthMuscle] = useState('ארבע ראשי');

  // Fetch patients on load
  useEffect(() => {
    loadPatients();
  }, [isMockMode]);

  const loadPatients = async () => {
    if (isMockMode) {
      setPatients(mockPatients);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('name', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone || 'לא עודכן',
        avatar: p.avatar || '🏃',
        avatarBg: '#8B5CF6',
        sport: 'פיילוט פעיל',
        conditionHe: p.condition_name || 'שיקום פיזיותרפיה',
        condition: 'Active Rehab Profile',
        area: p.is_lower_limb ? 'ברך' : 'כתף',
        areaColor: p.is_lower_limb ? '#06B6D4' : '#8B5CF6',
        startDate: p.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        sessionsCount: 0,
        painLevel: 4,
        progress: 50,
        isLowerLimb: p.is_lower_limb
      }));

      setPatients(formatted);
    } catch (err) {
      console.error('Error loading patients from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPatientClick = () => {
    if (!isMockMode) {
      alert('עבור הפיילוט, יש לרשום את המטופל דרך מסך ההרשמה (Sign Up) בדף הכניסה של האפליקציה בטלפון שלו. המטופל יופיע כאן ברשימה באופן מיידי לאחר מכן!');
      return;
    }
    setShowModal(true);
  };

  const areas = ['all', ...new Set(patients.map(p => p.area))];

  const handleAreaChange = (newArea) => {
    setArea(newArea);
    const lowerLimbAreas = ['ברך', 'ירך', 'קרסול'];
    setIsLowerLimb(lowerLimbAreas.includes(newArea));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name || !conditionHe) {
      alert('נא למלא שם מטופל ואבחנה בעברית');
      return;
    }

    const newId = `p${mockPatients.length + 1}`;
    const newPatient = {
      id: newId,
      name,
      age: parseInt(age) || 30,
      gender,
      phone: phone || 'טרם עודכן',
      email: email || '',
      avatar: area === 'ברך' ? '🦵' : area === 'כתף' ? '💪' : area === 'גב' ? '🔙' : area === 'צוואר' ? '🧣' : area === 'ירך' ? '🦴' : area === 'קרסול' ? '🦶' : '🏃',
      avatarBg: gender === 'female' ? '#EC4899' : '#8B5CF6',
      sport: sport || 'כללי',
      condition: condition || 'Orthopedic Rehabilitation',
      conditionHe,
      icd10: 'M76.51',
      area,
      areaColor: area === 'ברך' ? '#06B6D4' : area === 'כתף' ? '#8B5CF6' : area === 'גב' ? '#F59E0B' : area === 'צוואר' ? '#EC4899' : area === 'ירך' ? '#10B981' : '#EF4444',
      startDate: new Date().toISOString().split('T')[0],
      nextSession: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      sessionsCount: 0,
      status: 'active',
      painLevel: initialPain,
      progress: 0,
      notes: 'פתיחת כרטיס מטופל חדש במערכת.',
      isLowerLimb,
      initialPainLevel: initialPain,
      targets: {
        targetDate,
        painLevel: { intermediate: interPain, final: interPain },
        rom: { intermediate: interRom, final: interRom },
        strength: { intermediate: interStrength, final: interStrength, muscle: strengthMuscle },
        ...(isLowerLimb ? {
          walking: { intermediate: interWalking, final: interWalking },
          stairs: { intermediate: interStairs, final: interStairs },
          running: { intermediate: interRunning, final: interRunning }
        } : {})
      },
      metricsHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          rom: initialRom,
          strength: initialStrength,
          ...(isLowerLimb ? {
            walking: initialWalking,
            stairs: initialStairs,
            running: initialRunning
          } : {})
        }
      ]
    };

    mockPatients.push(newPatient);
    setShowModal(false);
    resetForm();
    navigate(`/therapist/patients/${newId}`);
  };

  const resetForm = () => {
    setName('');
    setAge('');
    setGender('male');
    setPhone('');
    setEmail('');
    setSport('');
    setCondition('');
    setConditionHe('');
    setArea('ברך');
    setIsLowerLimb(true);
    setInitialPain(7);
    setInterPain(3);
    setInitialRom(110);
    setInterRom(130);
    setInitialStrength(3);
    setInterStrength(4.5);
    setInitialWalking(5);
    setInterWalking(8);
    setInitialStairs(4);
    setInterStairs(8);
    setInitialRunning(2);
    setInterRunning(6);
    setTargetDate('2026-06-20');
    setStrengthMuscle('ארבע ראשי');
  };

  const filtered = patients.filter(p => {
    const matchSearch = p.name.includes(search) || p.conditionHe.includes(search);
    const matchArea = filterArea === 'all' || p.area === filterArea;
    return matchSearch && matchArea;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">מטופלים</h1>
          <p className="page-subtitle">{patients.length} מטופלים פעילים</p>
        </div>
        <button className="btn btn-primary" onClick={handleNewPatientClick}>
          <UserPlus size={18} />
          <span>מטופל חדש</span>
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="חיפוש לפי שם או אבחנה..." />

      <div className="tabs mt-4 mb-6">
        {areas.map(areaItem => (
          <button
            key={areaItem}
            className={`tab ${filterArea === areaItem ? 'active' : ''}`}
            onClick={() => setFilterArea(areaItem)}
          >
            {areaItem === 'all' ? 'הכל' : areaItem}
          </button>
        ))}
      </div>

      <div className="patients-grid">
        {filtered.map((patient, i) => (
          <div key={patient.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
            <PatientCard
              patient={patient}
              onClick={() => navigate(`/therapist/patients/${patient.id}`)}
            />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <Filter size={48} />
          <h3 className="mt-4">לא נמצאו מטופלים</h3>
          <p className="text-sm">נסה לשנות את החיפוש או הסינון</p>
        </div>
      )}

      {/* New Patient Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px', width: '95%' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserPlus size={22} className="text-primary-light" />
                <span>פתיחת כרטיס מטופל והגדרת יעדים</span>
              </h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {/* Personal Details */}
              <div>
                <h3 className="section-title text-sm border-b pb-1 border-color" style={{ color: 'var(--color-primary-light)' }}>
                  פרטים אישיים ואבחנה
                </h3>
                <div className="grid-2 mt-3" style={{ gap: 'var(--space-4)' }}>
                  <div className="input-group">
                    <label className="input-label">שם מלא *</label>
                    <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">גיל</label>
                    <input type="number" className="input" value={age} onChange={e => setAge(e.target.value)} placeholder="30" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">מגדר</label>
                    <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                      <option value="male">זכר</option>
                      <option value="female">נקבה</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">ענף ספורט / תחביב</label>
                    <input type="text" className="input" value={sport} onChange={e => setSport(e.target.value)} placeholder="ריצה, כדורגל, יוגה..." />
                  </div>
                  <div className="input-group">
                    <label className="input-label">טלפון</label>
                    <input type="text" className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="050-0000000" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">אימייל</label>
                    <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">אזור פגיעה</label>
                    <select className="input" value={area} onChange={e => handleAreaChange(e.target.value)}>
                      <option value="ברך">ברך</option>
                      <option value="כתף">כתף</option>
                      <option value="גב">גב</option>
                      <option value="צוואר">צוואר</option>
                      <option value="מרפק">מרפק</option>
                      <option value="ירך">ירך</option>
                      <option value="קרסול">קרסול</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 mt-6">
                    <input
                      type="checkbox"
                      id="isLowerLimb"
                      checked={isLowerLimb}
                      onChange={e => setIsLowerLimb(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <label htmlFor="isLowerLimb" className="input-label" style={{ cursor: 'pointer', margin: 0 }}>
                      פגיעת גפה תחתונה (טווח תנועה, כוח + הליכה, מדרגות, ריצה)
                    </label>
                  </div>
                  <div className="input-group">
                    <label className="input-label">אבחנה קלינית (עברית) *</label>
                    <input type="text" className="input" value={conditionHe} onChange={e => setConditionHe(e.target.value)} placeholder="למשל: שיקום שחזור ACL" required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">אבחנה קלינית באנגלית (ICD-10/מונח רפואי)</label>
                    <input type="text" className="input" value={condition} onChange={e => setCondition(e.target.value)} placeholder="Post ACL-R Rehab Phase IV" />
                  </div>
                </div>
              </div>

              {/* Distinction info box */}
              <div className="card card-compact" style={{ background: 'rgba(38, 98, 137, 0.05)', border: '1px solid rgba(38, 98, 137, 0.2)' }}>
                <div className="flex items-start gap-2">
                  <Info className="text-primary-light flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <strong className="text-xs text-primary-light">הפרדה קלינית של מדדי התקדמות במערכת:</strong>
                    <p className="text-xs text-secondary mt-1">
                      המדד הכולל יחושב משני ערוצים נפרדים:
                      <br />
                      1. <strong>התמדה בתרגול (Compliance):</strong> אחוז מילוי התרגילים שקיבל לבית מתוך המעקב היומי של המטופל.
                      <br />
                      2. <strong>יעד קליני (Clinical Outcome):</strong> השיפור במדדים הפיזיולוגיים מתוך ערכי הבסיס אל עבר יעדי הטיפול שיוגדרו להלן.
                    </p>
                  </div>
                </div>
              </div>

              {/* Goals & Targets Section */}
              <div>
                <h3 className="section-title text-sm border-b pb-1 border-color" style={{ color: 'var(--color-accent-light)' }}>
                  הגדרת ערכי בסיס ויעדי טיפול
                </h3>

                <div className="input-group mb-4 mt-3">
                  <label className="input-label">תאריך יעד להשגת יעדי הביניים</label>
                  <input type="date" className="input" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                </div>

                {/* Pain Level VAS */}
                <div className="mt-4 p-4 rounded-lg border border-color" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-accent-light)' }}>רמת כאב (VAS 0-10) - ירידה היא שיפור</h4>
                  <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label">כאב התחלתי ({initialPain})</label>
                      <input type="range" min="0" max="10" step="1" className="w-full" value={initialPain} onChange={e => setInitialPain(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">יעד כאב ({interPain}) {targetDate ? `עד ל-${new Date(targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                      <input type="range" min="0" max="10" step="1" className="w-full" value={interPain} onChange={e => setInterPain(Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                {/* Range of Motion ROM */}
                <div className="mt-4 p-4 rounded-lg border border-color" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <h4 className="text-sm font-semibold mb-3 text-teal-light" style={{ color: 'var(--color-teal-light)' }}>טווח תנועה (ROM מעלות) - עלייה היא שיפור</h4>
                  <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label">ROM התחלתי (מעלות)</label>
                      <input type="number" className="input" value={initialRom} onChange={e => setInitialRom(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">יעד ROM (מעלות) {targetDate ? `עד ל-${new Date(targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                      <input type="number" className="input" value={interRom} onChange={e => setInterRom(Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                {/* Muscle Strength MRC */}
                <div className="mt-4 p-4 rounded-lg border border-color" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: '#8B5CF6' }}>כוח שריר (MRC 0-5) - עלייה היא שיפור</h4>
                  
                  <div className="input-group mb-4">
                    <label className="input-label">שריר מטרה (למשל: ארבע ראשי, מסובבי כתף)</label>
                    <input type="text" className="input" value={strengthMuscle} onChange={e => setStrengthMuscle(e.target.value)} placeholder="שם השריר הנבדק..." />
                  </div>

                  <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                    <div className="input-group">
                      <label className="input-label">כוח התחלתי ({initialStrength})</label>
                      <input type="range" min="0" max="5" step="0.5" className="w-full" value={initialStrength} onChange={e => setInitialStrength(Number(e.target.value))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">יעד כוח ({interStrength}) {targetDate ? `עד ל-${new Date(targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                      <input type="range" min="0" max="5" step="0.5" className="w-full" value={interStrength} onChange={e => setInterStrength(Number(e.target.value))} />
                    </div>
                  </div>
                </div>

                {/* Lower Limb Specific Metrics */}
                {isLowerLimb && (
                  <div className="mt-4 p-4 rounded-lg border border-success border-opacity-20" style={{ background: 'rgba(16, 185, 129, 0.02)' }}>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-success-light)' }}>מדדי תפקוד גפה תחתונה (0-10)</h4>

                    {/* Walking */}
                    <div className="mb-4">
                      <h5 className="text-xs font-semibold mb-2 text-secondary">יכולת הליכה</h5>
                      <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                        <div className="input-group">
                          <label className="input-label">הליכה התחלתית ({initialWalking})</label>
                          <input type="range" min="0" max="10" step="1" className="w-full" value={initialWalking} onChange={e => setInitialWalking(Number(e.target.value))} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">יעד הליכה ({interWalking}) {targetDate ? `עד ל-${new Date(targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                          <input type="range" min="0" max="10" step="1" className="w-full" value={interWalking} onChange={e => setInterWalking(Number(e.target.value))} />
                        </div>
                      </div>
                    </div>

                    {/* Stairs */}
                    <div className="mb-4">
                      <h5 className="text-xs font-semibold mb-2 text-secondary">עליית/ירידת מדרגות</h5>
                      <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                        <div className="input-group">
                          <label className="input-label">מדרגות התחלתי ({initialStairs})</label>
                          <input type="range" min="0" max="10" step="1" className="w-full" value={initialStairs} onChange={e => setInitialStairs(Number(e.target.value))} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">יעד מדרגות ({interStairs}) {targetDate ? `עד ל-${new Date(targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                          <input type="range" min="0" max="10" step="1" className="w-full" value={interStairs} onChange={e => setInterStairs(Number(e.target.value))} />
                        </div>
                      </div>
                    </div>

                    {/* Running */}
                    <div>
                      <h5 className="text-xs font-semibold mb-2 text-secondary">יכולת ריצה</h5>
                      <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                        <div className="input-group">
                          <label className="input-label">ריצה התחלתית ({initialRunning})</label>
                          <input type="range" min="0" max="10" step="1" className="w-full" value={initialRunning} onChange={e => setInitialRunning(Number(e.target.value))} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">יעד ריצה ({interRunning}) {targetDate ? `עד ל-${new Date(targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                          <input type="range" min="0" max="10" step="1" className="w-full" value={interRunning} onChange={e => setInterRunning(Number(e.target.value))} />
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  שמור ופתח כרטיס
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

