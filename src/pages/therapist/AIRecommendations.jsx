// === AI Recommendations Page ===
import { useState } from 'react';
import { mockAIRecommendations, mockPatients } from '../../data/mockData';
import {
  Brain, TrendingUp, AlertTriangle, Lightbulb, Trophy,
  ChevronLeft, CheckCircle, BookOpen, FileText
} from 'lucide-react';

export default function AIRecommendations() {
  const getIcon = (type) => {
    switch (type) {
      case 'progress': return TrendingUp;
      case 'alert': return AlertTriangle;
      case 'suggestion': return Lightbulb;
      case 'milestone': return Trophy;
      default: return Brain;
    }
  };

  const [recommendations, setRecommendations] = useState(mockAIRecommendations);
  const [selectedPatientId, setSelectedPatientId] = useState(mockPatients[0]?.id || '');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!uploadedFile) {
      alert('נא לבחור קובץ פרוטוקול/סיכום ניתוח תחילה');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress('קורא את קובץ ה-PDF...');

    setTimeout(() => {
      setAnalysisProgress('מחלץ אבחנה קלינית והנחיות מנתח...');
      setTimeout(() => {
        setAnalysisProgress('בונה המלצות לשגרת התרגילים והטיפולים...');
        setTimeout(() => {
          const patient = mockPatients.find(p => p.id === selectedPatientId) || mockPatients[0];
          
          let newRec = {
            patientId: patient.id,
            patientName: patient.name,
            type: 'milestone',
            severity: 'info',
            title: `📋 התאמת פרוטוקול ניתוחי לשגרת שיקום: ${uploadedFile.name}`,
            evidence: 'מבוסס הנחיות שיקום מנתח (Surgeon CPGs 2026)',
          };

          if (patient.id === 'p1' || patient.area === 'ברך') {
            newRec.title = `📋 התאמת פרוטוקול ניתוחי: שחזור ACL ותפירת מניסקוס`;
            newRec.description = `נמצא סיכום ניתוחי מתאריך ${new Date().toLocaleDateString('he-IL')}. אבחנה: ACL Tear + Lateral Meniscus Tear. בוצע שחזור ACL באמצעות שתל גיד הפיקה ותפירת מניסקוס (2 תפרים). הגבלות מנתח שחולצו: דריכה חלקית עם קביים למשך 4 שבועות, הגבלת כפיפת ברך ל-90 מעלות. מנוע ה-AI התאים את שגרת התרגילים למגבלות אלו.`;
            newRec.actionItems = [
              'תרגול Straight Leg Raise (SLR) בסד יישור נעול למניעת Quad Lag (10 חזרות, 3 סטים, פעמיים ביום)',
              'הפעלת גלוטאוס וירך אחורית באמצעות גשר אגן דו-צדדי (ללא עומס סיבובי)',
              'מוביליזציה פטלארית פסיבית בכיוון עליון ותחתון למניעת הידבקויות',
              'הימנעות מוחלטת מכפיפת ברך מעבר ל-90° (יש לנעול את הסד בטווח 0-90°)',
              'קירור וחבישת לחץ (Cryotherapy) להפחתת נפיחות בברך (20 דקות אחרי כל תרגול)'
            ];
          } else if (patient.id === 'p2' || patient.area === 'כתף') {
            newRec.title = `📋 התאמת פרוטוקול ניתוחי: Rotator Cuff Repair`;
            newRec.description = `נמצא סיכום ניתוחי מתאריך ${new Date().toLocaleDateString('he-IL')}. אבחנה: Supraspinatus Tendon Tear. בוצע תיקון ארתרוסקופי של גיד השרוול המסובב. הגבלות מנתח שחולצו: שימוש במתלה כתף ל-6 שבועות. ללא הפעלה אקטיבית של שרירי הכתף. מותר תרגול פסיבי בלבד (Passive ROM). מנוע ה-AI התאים את שגרת התרגילים למגבלות אלו.`;
            newRec.actionItems = [
              'תרגילי מטוטלת (Codman Pendulum) להרפיית מתח במפרק הכתף (2 דקות, 3 פעמים ביום)',
              'תרגול פסיבי מבוקר (Passive ROM) בעזרת גלגלת או יד בריאה - כיפוף עד 120 מעלות, סיבוב חיצוני עד 30 מעלות',
              'חיזוק שכמות סטטי (Scapular Retraction) ללא הפעלת מפרק הכתף',
              'שימור תנועתיות מפרקי כף יד ומרפק (תרגילי תנועתיות אקטיביים חופשיים)',
              'הימנעות מוחלטת מכיפוף או הרחקה אקטיבית של הכתף הפגועה'
            ];
          } else {
            newRec.title = `📋 התאמת פרוטוקול ניתוחי: שיקום לאחר ניתוח אורתופדי`;
            newRec.description = `נמצא סיכום ניתוחי מתאריך ${new Date().toLocaleDateString('he-IL')}. בוצע ניתוח באזור ה-${patient.area}. מנוע ה-AI ניתח את מסמך הפרוטוקול והתאים המלצות לשגרת התרגילים הביתית והקלינית.`;
            newRec.actionItems = [
              `התאמת תרגילי חיזוק ספציפיים לאזור ה-${patient.area} תוך שמירה על הגבלות העומס`,
              'מעקב קפדני ויומיומי אחרי רמת כאב ונפיחות',
              'שילוב מוביליזציה מוקדמת מונחית כאב בטווחים בטוחים',
              'תרגול יציבות וקורדינציה פרוקסימלית ודיסטלית'
            ];
          }

          setRecommendations([newRec, ...recommendations]);
          setIsAnalyzing(false);
          setUploadedFile(null);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const getColor = (severity) => {
    switch (severity) {
      case 'positive': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'info': return '#0891B2';
      default: return '#266289';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Brain size={28} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} />
            המלצות AI
          </h1>
          <p className="page-subtitle">ניתוח חכם של נתוני מטופלים</p>
        </div>
      </div>

      <div className="glass-card mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #266289, #0891B2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Brain size={24} color="white" />
          </div>
          <div>
            <h3 className="font-semibold">מנוע תמיכה בהחלטות קליניות (Clinical Decision Support)</h3>
            <p className="text-xs text-secondary">
              מנתח Outcome Measures (VISA-P, ODI, DASH, NDI), מגמות VAS/NPRS, Dynamometry, ונתוני Compliance.
              המלצות מבוססות Evidence-Based Practice עם ציטוט מקורות (Level I-II).
            </p>
          </div>
        </div>
      </div>

      {/* Upload and Analyze Surgical Protocol Panel */}
      <div className="card mb-6 animate-fade-in-up stagger-1" style={{ border: '1px dashed var(--color-primary-light)', background: 'rgba(38, 98, 137, 0.02)' }}>
        <h3 className="section-title flex items-center gap-2" style={{ color: 'var(--color-primary-light)', marginBottom: 'var(--space-2)' }}>
          <Brain size={18} />
          <span>ניתוח סיכום ופרוטוקול ניתוחי ב-AI</span>
        </h3>
        <p className="text-xs text-secondary mb-4">
          העלה קובץ סיכום ניתוח או פרוטוקול שיקום (PDF/Word). מנוע ה-AI ינתח את מסמכי המנתח, יחלץ מגבלות דריכה, טווחי תנועה מותרים והנחיות מיוחדות, ויפיק המלצות קליניות לשילוב בשגרת התרגילים והטיפול של המטופל.
        </p>

        {isAnalyzing ? (
          <div className="text-center py-6 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary-light)', borderRadius: '50%' }} />
            <div className="text-sm font-semibold text-primary-light animate-pulse">{analysisProgress}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
              <div className="input-group">
                <label className="input-label">בחר מטופל להתאמה</label>
                <select className="input" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
                  {mockPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.conditionHe})</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">בחר קובץ פרוטוקול / סיכום ניתוח</label>
                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block', width: '100%' }}>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  />
                  <button type="button" className="btn btn-ghost w-full" style={{ border: '1px solid var(--border-color)', justifyContent: 'center', height: 'var(--input-height)' }}>
                    {uploadedFile ? `📎 ${uploadedFile.name}` : '📁 בחר קובץ (סיכום ניתוח / פרוטוקול)'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4 border-color">
              {uploadedFile && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setUploadedFile(null)}>
                  נקה קובץ
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAnalyze}
                disabled={!uploadedFile}
              >
                נתח פרוטוקול ב-AI ⚡
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {recommendations.map((rec, i) => {
          const Icon = getIcon(rec.type);
          const color = getColor(rec.severity);

          return (
            <div
              key={i}
              className="card animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms`, borderInlineStart: `4px solid ${color}` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                  background: `${color}20`, color: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{rec.title}</div>
                  <div className="text-xs text-secondary">{rec.patientName}</div>
                </div>
                <span className="badge" style={{ background: `${color}20`, color }}>
                  {rec.type === 'progress' ? 'התקדמות' :
                   rec.type === 'alert' ? 'התראה' :
                   rec.type === 'milestone' ? 'אבן דרך' : 'המלצה'}
                </span>
              </div>

              <p className="text-sm text-secondary mb-4" style={{ lineHeight: 1.8 }}>
                {rec.description}
              </p>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted">פעולות קליניות מומלצות:</span>
                {rec.actionItems.map((item, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <CheckCircle size={14} style={{ color: color, flexShrink: 0, marginTop: 3 }} />
                    <span className="text-sm" style={{ lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>

              {rec.evidence && (
                <div className="mt-4" style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderInlineStart: '3px solid var(--color-primary-light)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={12} style={{ color: 'var(--color-primary-light)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-primary-light)' }}>מבוסס מחקר (Evidence Base)</span>
                  </div>
                  <span className="text-xs text-muted" style={{ lineHeight: 1.6 }}>{rec.evidence}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card mt-6" style={{ borderStyle: 'dashed', opacity: 0.7, borderInlineStart: '4px solid var(--color-primary)' }}>
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} style={{ color: 'var(--color-primary-light)' }} />
          <span className="text-sm font-semibold">תמיכה בהחלטות קליניות — הצהרה (Clinical Decision Support Disclaimer)</span>
        </div>
        <p className="text-xs text-secondary" style={{ lineHeight: 1.6 }}>
          🤖 המלצות מבוססות על ניתוח AI של Outcome Measures, Clinical Data, ו-Evidence-Based CPGs.
          כל ההמלצות מצוטטות עם רמות עדות (Level I-IV) ומקורות. המלצות אלו אינן מחליפות שיקול דעת קליני.
          ICD-10 / CPT coding suggestions should be verified by a qualified coder.
        </p>
      </div>
    </div>
  );
}
