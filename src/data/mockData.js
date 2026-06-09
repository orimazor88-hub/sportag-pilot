// === SPORTAG PRO - Mock Data ===
// Comprehensive clinical mock data for the physiotherapy management demo
// Language: Professional physiotherapy + orthopedic terminology
// Coding: ICD-10-CM, CPT codes, clinical outcome measures

export const mockPatients = [
  {
    id: 'p1',
    name: 'יובל כהן',
    age: 28,
    gender: 'male',
    phone: '052-1234567',
    email: 'yuval@email.com',
    avatar: '🏃',
    avatarBg: '#8B5CF6',
    sport: 'ריצה תחרותית (30-40 ק"מ/שבוע)',
    condition: 'Patellar Tendinopathy (M76.51)',
    conditionHe: 'טנדינופתיה של גיד הפיקה',
    icd10: 'M76.51',
    area: 'ברך',
    areaColor: '#06B6D4',
    startDate: '2026-04-15',
    nextSession: '2026-06-03T10:00',
    sessionsCount: 8,
    status: 'active',
    painLevel: 4,
    progress: 65,
    visaP: 62,
    notes: 'VISA-P (שאלון תפקוד גיד הפיקה): 62/100. פער כוח מרחיקי ירך (hip abductors) ירד מ-13.3% ל-6.7%. מגיב היטב לפרוטוקול תרגילים אקסצנטריים + גלי הלם (ESWT). MRI: סיגנל דלקתי בגיד הפיקה (T2 hyperintensity).',
    isLowerLimb: true,
    initialPainLevel: 8,
    targets: {
      targetDate: '2026-06-20',
      painLevel: { intermediate: 3, final: 0 },
      rom: { intermediate: 130, final: 140 },
      strength: { intermediate: 4.5, final: 5, muscle: 'ארבע ראשי (Quadriceps)' },
      walking: { intermediate: 8, final: 10 },
      stairs: { intermediate: 8, final: 10 },
      running: { intermediate: 6, final: 10 }
    },
    metricsHistory: [
      { date: '2026-05-14', rom: 115, strength: 3.5, walking: 5, stairs: 4, running: 2 },
      { date: '2026-05-21', rom: 122, strength: 4, walking: 6, stairs: 5, running: 3 },
      { date: '2026-05-28', rom: 130, strength: 4, walking: 8, stairs: 6, running: 4 },
      { date: '2026-06-03', rom: 135, strength: 4.5, walking: 9, stairs: 8, running: 6 }
    ],
  },
  {
    id: 'p2',
    name: 'מיכל לוי',
    age: 35,
    gender: 'female',
    phone: '054-7654321',
    email: 'michal@email.com',
    avatar: '🏊',
    avatarBg: '#EC4899',
    sport: 'שחייה תחרותית (4×/שבוע)',
    condition: 'Subacromial Impingement (M75.12)',
    conditionHe: 'Impingement תת-אקרומיאלי + טנדינופתיה RC',
    icd10: 'M75.12',
    area: 'כתף',
    areaColor: '#8B5CF6',
    startDate: '2026-03-20',
    nextSession: '2026-06-03T14:00',
    sessionsCount: 12,
    status: 'active',
    painLevel: 3,
    progress: 78,
    notes: 'DASH (שאלון תפקוד גפה עליונה): 28/100 — שיפור מ-42. טווח תנועה כמעט מלא. סיבוב חיצוני (ER) חסר 10° לעומת צד שני. תנועתיות לקויה של השכמה (scapular dyskinesis Type II) בשיפור. כוח טרפזיוס תחתון (lower trap) עלה מ-3+/5 ל-4/5. Painful Arc (קשת כאב) נעלמה. Hawkins-Kennedy עכשיו שלילי. מוכנה לחזרה לשחייה שלב 2 — freestyle עם Pull-buoy.',
    isLowerLimb: false,
    initialPainLevel: 7,
    targets: {
      targetDate: '2026-06-25',
      painLevel: { intermediate: 3, final: 0 },
      rom: { intermediate: 160, final: 180 },
      strength: { intermediate: 4, final: 5, muscle: 'טרפזיוס תחתון (Lower Trap)' }
    },
    metricsHistory: [
      { date: '2026-05-10', rom: 140, strength: 3 },
      { date: '2026-05-17', rom: 150, strength: 3.5 },
      { date: '2026-05-24', rom: 160, strength: 4 },
      { date: '2026-06-03', rom: 165, strength: 4 }
    ],
  },
  {
    id: 'p3',
    name: 'אלון ברק',
    age: 42,
    gender: 'male',
    phone: '050-9876543',
    email: 'alon@email.com',
    avatar: '🚴',
    avatarBg: '#F59E0B',
    sport: 'רכיבת אופניים תחרותית',
    condition: 'Lumbar Disc Herniation L4-L5 (M51.16)',
    conditionHe: 'פריצת דיסק L4-L5 + רדיקולופתיה L5',
    icd10: 'M51.16',
    area: 'גב',
    areaColor: '#F59E0B',
    startDate: '2026-05-01',
    nextSession: '2026-06-04T09:00',
    sessionsCount: 5,
    status: 'active',
    painLevel: 6,
    progress: 35,
    odi: 48,
    notes: 'ODI (שאלון מוגבלות): 48% — מוגבלות חמורה. MRI: פריצת דיסק L4-L5 בצד ימין, עם לחץ על שורש עצב L5. SLR (הרמת רגל ישרה) חיובי ב-45° ימין (שיפור מ-30°). כוח מושט בוהן (EHL): 4/5 ימין — חולשה נמשכת בשורש L5. הושגה centralization (הכאב חזר מהרגל לגב) עם תרגילי מקנזי. FABQ (שאלון פחד מפעילות) גבוה: 18/24 — מטפלים בהתנהגות הימנעות. סימני אזהרה (red flags) שליליים.',
    isLowerLimb: false,
    initialPainLevel: 8,
    targets: {
      targetDate: '2026-06-18',
      painLevel: { intermediate: 4, final: 1 },
      rom: { intermediate: 75, final: 90 },
      strength: { intermediate: 4, final: 5, muscle: 'מושט בוהן (EHL)' }
    },
    metricsHistory: [
      { date: '2026-05-15', rom: 60, strength: 3.5 },
      { date: '2026-05-22', rom: 65, strength: 4 },
      { date: '2026-05-29', rom: 75, strength: 4 },
      { date: '2026-06-04', rom: 80, strength: 4 }
    ],
  },
  {
    id: 'p4',
    name: 'נועה שמיר',
    age: 22,
    gender: 'female',
    phone: '053-1112233',
    email: 'noa@email.com',
    avatar: '⚽',
    avatarBg: '#10B981',
    sport: 'כדורגל (ליגת נשים)',
    condition: 'Post ACL-R Rehab Phase IV (S83.511A)',
    conditionHe: 'שיקום שחזור ACL — שלב 4 (Return to Sport)',
    icd10: 'S83.511A',
    area: 'ברך',
    areaColor: '#06B6D4',
    startDate: '2026-02-10',
    nextSession: '2026-06-05T11:00',
    sessionsCount: 20,
    status: 'active',
    painLevel: 2,
    progress: 85,
    lsi: 90,
    notes: `אחרי שחזור צלב קדמי (ACL-R, שתל BTB) — 16 שבועות. כוח ארבע ראשי (quadriceps) הגיע ל-90% מהצד הבריא (LSI 90%). מבחני קפיצה (hop tests): בודדת 88%, משולשת 85%, מצלבת 82%. שאלון מוכנות פסיכולוגית לחזרה לספורט (ACL-RSI): 62/100 — בינוני. תפקוד יום-יומי (KOS-ADLS): 88/100. מוכנה לשלב 4 — תרגולי זריזות (אג'יליטי) ותרגול ספציפי לספורט. Y-Balance Test: הבדל בין הצדדים פחות מ-4 ס"מ.`,
    isLowerLimb: true,
    initialPainLevel: 6,
    targets: {
      targetDate: '2026-06-15',
      painLevel: { intermediate: 2, final: 0 },
      rom: { intermediate: 135, final: 140 },
      strength: { intermediate: 4.5, final: 5, muscle: 'ארבע ראשי (Quadriceps)' },
      walking: { intermediate: 9, final: 10 },
      stairs: { intermediate: 8, final: 10 },
      running: { intermediate: 7, final: 10 }
    },
    metricsHistory: [
      { date: '2026-05-08', rom: 120, strength: 4, walking: 7, stairs: 6, running: 4 },
      { date: '2026-05-15', rom: 125, strength: 4, walking: 8, stairs: 7, running: 5 },
      { date: '2026-05-22', rom: 130, strength: 4.5, walking: 8, stairs: 8, running: 6 },
      { date: '2026-05-29', rom: 135, strength: 4.5, walking: 9, stairs: 8, running: 7 },
      { date: '2026-06-05', rom: 140, strength: 4.5, walking: 9, stairs: 9, running: 8 }
    ],
  },
  {
    id: 'p5',
    name: 'דני אברהם',
    age: 55,
    gender: 'male',
    phone: '058-4445566',
    email: 'dani@email.com',
    avatar: '🎾',
    avatarBg: '#EF4444',
    sport: 'טניס (3×/שבוע)',
    condition: 'Lateral Epicondylitis (M77.11)',
    conditionHe: 'אפיקונדיליטיס לטרלי — מרפק טניס',
    icd10: 'M77.11',
    area: 'מרפק',
    areaColor: '#6366F1',
    startDate: '2026-05-10',
    nextSession: '2026-06-03T16:00',
    sessionsCount: 4,
    status: 'active',
    painLevel: 5,
    progress: 40,
    prtee: 54,
    notes: 'PRTEE (שאלון תפקוד מרפק): 54/100. כוח אחיזה (grip strength): ימין 28 ק"ג לעומת 38 ק"ג בשמאל — פער 26%. מבחנים חיוביים: Cozen (יישור כף יד נגד התנגדות), Mill, Maudsley. אולטרסאונד (US): עיבוי גיד המיישרים (common extensor tendon) עם שינויים דלקתיים. 4 טיפולים — תגובה חלקית לפרוטוקול Tyler (תרגילי אקסצנטריים). שקול גלי הלם (ESWT). הפחתת טניס לפעם אחת בשבוע.',
    isLowerLimb: false,
    initialPainLevel: 7,
    targets: {
      targetDate: '2026-06-22',
      painLevel: { intermediate: 4, final: 1 },
      rom: { intermediate: 145, final: 150 },
      strength: { intermediate: 4, final: 5, muscle: 'מיישרי כף היד (Extensors)' }
    },
    metricsHistory: [
      { date: '2026-05-12', rom: 135, strength: 3.5 },
      { date: '2026-05-19', rom: 140, strength: 3.5 },
      { date: '2026-05-26', rom: 145, strength: 4 },
      { date: '2026-06-03', rom: 145, strength: 4 }
    ],
  },
  {
    id: 'p6',
    name: 'שירה גולד',
    age: 30,
    gender: 'female',
    phone: '052-7778899',
    email: 'shira@email.com',
    avatar: '🧘',
    avatarBg: '#6366F1',
    sport: 'יוגה (5×/שבוע)',
    condition: 'Cervical Radiculopathy C5-C6 (M54.12)',
    conditionHe: 'רדיקולופתיה צווארית C5-C6',
    icd10: 'M54.12',
    area: 'צוואר',
    areaColor: '#EC4899',
    startDate: '2026-04-01',
    nextSession: '2026-06-06T13:00',
    sessionsCount: 9,
    status: 'active',
    painLevel: 3,
    progress: 70,
    ndi: 32,
    notes: 'NDI (שאלון מוגבלות צוואר): 32% — מוגבלות בינונית, שיפור מ-48%. MRI: בליטת דיסק (disc protrusion) C5-C6 עם היצרות החלון הימני. מבחן Spurling (לחיצת צוואר): היה חיובי, עכשיו שלילי. רפלקס ביספס: חזר לתקין. כוח דלטואיד: 4+/5 (שיפור מ-4/5). בדיקת עצב (ULTT1 - עצב מדיאן): שלילית בשני הצדדים. סיבולת שרירי צוואר עמוקים (deep cervical flexors): 22 שניות (שיפור מ-8 שניות). מגיבה היטב לתרגילי כיפוף צוואר + סיבולת שרירי צוואר עמוקים.',
    isLowerLimb: false,
    initialPainLevel: 7,
    targets: {
      targetDate: '2026-06-24',
      painLevel: { intermediate: 3, final: 1 },
      rom: { intermediate: 55, final: 70 },
      strength: { intermediate: 4.5, final: 5, muscle: 'מכופפי צוואר עמוקים (DNF)' }
    },
    metricsHistory: [
      { date: '2026-04-15', rom: 40, strength: 3.5 },
      { date: '2026-04-29', rom: 45, strength: 4 },
      { date: '2026-05-13', rom: 50, strength: 4 },
      { date: '2026-05-27', rom: 55, strength: 4.5 },
      { date: '2026-06-06', rom: 60, strength: 4.5 }
    ],
  },
];

export const mockSessions = [
  {
    id: 's1',
    patientId: 'p1',
    date: '2026-05-28T10:00',
    duration: 45,
    type: 'טיפול ידני + תרגילים',
    summary: `סיכום טיפול פיזיותרפי — יובל כהן | 28/05/2026

אבחנה: טנדינופתיה של גיד הפיקה (Patellar Tendinopathy) — ברך ימין
ICD-10: M76.51

ממצאים:
• כאב: 4/10 בפעילות (ירידה מ-6/10 בטיפול הקודם)
• טווח תנועה ברך: כפיפה (flexion) 140° תקין, יישור (extension) 0° מלא
• כוח שריר עם דינמומטר — ארבע ראשי (quadriceps): 13.5 ק"ג בשני הצדדים
• מרחיקי ירך (hip abductors): ימין 14 ק"ג, שמאל 15 ק"ג — פער 6.7% (שיפור מ-13.3%)
• SLS (עמידה על רגל אחת): קריסה פנימה (valgus) פחתה אך עדיין קיימת ימין > שמאל
• סקוואט על משטח נטוי (decline squat): כאב 3/10 ימין (היה 5/10)
• VISA-P (שאלון תפקוד גיד פיקה): 62/100 (היה 52 — שיפור משמעותי קלינית)

טיפול שניתן:
1. שחרור רקמות רכות (IASTM) — גיד הפיקה ו-vastus lateralis
2. מוביליזציה פטלו-פמורלית (patellofemoral mobilization)
3. גלי הלם (ESWT) — 2000 אימפולסים, 2.0 בר, לאזור proximal patellar tendon
4. תרגילי חיזוק אקסצנטריים — סקוואט ספרדי, Single Leg RDL עם 4 ק"ג
5. תרגולי יציבות ירך (hip stabilization) — SLS, Step-down מבוקר

תוכנית המשך:
• מעבר לפרוטוקול HSR (התנגדויות כבדות איטיות) — 3 פעמים בשבוע
• המשך גלי הלם פעם בשבוע × 2 טיפולים נוספים
• תחילת תכנית חזרה לריצה אם כאב מתחת 3/10 בטיפול הבא
• תרגילים לבית: Single Leg RDL עם 4 ק"ג, גומיה להרחקת ירך, סקוואט איזומטרי ב-70°`,
    exercises: ['ex1', 'ex2', 'ex3'],
    recorded: true,
  },
  {
    id: 's2',
    patientId: 'p2',
    date: '2026-05-27T14:00',
    duration: 50,
    type: 'טיפול שיקומי כתף',
    summary: `סיכום טיפול פיזיותרפי — מיכל לוי | 27/05/2026

אבחנה: תסמונת אימפינג'מנט תת-אקרומיאלית (Subacromial Impingement) — כתף שמאל
ICD-10: M75.12

ממצאים:
• כאב: 3/10 (ירידה מ-5/10). כאב לילי נעלם — ישנה על הצד השמאלי ללא בעיה
• טווחי תנועה: הרמה קדמית (flexion) 170°, הרחקה (abduction) 165°
  סיבוב חיצוני (ER): 80° — חסר 5° לעומת צד ימין (היה 10°)
• Painful Arc (קשת כאב בטווח 70-120°): מינימלי — רק ב-90-100°
• כוח שריר: על-שוקית (supraspinatus) 4/5, תת-שוקית (infraspinatus) 4+/5
  טרפזיוס תחתון (lower trap): 4/5 — שיפור מ-3+/5!
• Hawkins-Kennedy (מבחן אימפינג'מנט): שלילי (היה חיובי!)
• תנועתיות שכמה (scapular dyskinesis): בשיפור, Type II עדיין קיימת אך פחות בולטת
• DASH (שאלון תפקוד גפה עליונה): 28/100 (היה 42 — שיפור משמעותי)

טיפול שניתן:
1. אולטרסאונד טיפולי (US) — מתמשך, 1MHz, 1.5W/cm², 8 דקות
   לאזור גיד העל-שוקית (supraspinatus)
2. טיפול ידני — מוביליזציה של מפרק הכתף (glenohumeral mobilization)
   דרגה III-IV, כיוון קדמי-אחורי ותחתוני
3. שחרור רקמות רכות: שריר חזה קטן (Pec Minor), טרפזיוס עליון (Upper Trap)
4. תרגילי חיזוק:
   • סיבוב חיצוני אקסצנטרי עם גומיה (eccentric ER) — 4 שניות בירידה, 3×10
   • Y's ו-T's בשכיבה על הבטן — הפעלת טרפזיוס תחתון (lower trap)
   • Push-up Plus על הקיר — לחיזוק סראטוס אנטריור (serratus anterior)
5. PNF — דפוסי תנועה אלכסוניים (D2) עם התנגדות ידנית

תוכנית המשך:
• מעבר לשלב 2 בחזרה לשחייה: freestyle עם Pull-buoy, 30 דקות
• הגדלת עומס בתרגילי טרפזיוס תחתון
• תרגילים לבית: סיבוב חיצוני אקסצנטרי, כיווץ שכמות, Wall Slides, מתיחת קפסולה אחורית`,
    exercises: ['ex4', 'ex5', 'ex6'],
    recorded: true,
  },
  {
    id: 's3',
    patientId: 'p3',
    date: '2026-05-29T09:00',
    duration: 55,
    type: 'טיפול + הדרכה',
    summary: `סיכום טיפול - אלון ברק | 29/05/2026

אבחנה: Lumbar Disc Herniation L4-L5 (פריצת דיסק מותני)

ממצאים:
• VAS: 6/10 (ללא שינוי מהטיפול הקודם)
• SLR: חיובי ב-45° (שיפור מ-30°)
• כוח Tibialis Anterior: 4/5 (הירידה שומרת)
• רפלקס אכילס: תקין
• הרגשת נימול בכף רגל ימין - ללא שינוי

טיפול שניתן:
1. McKenzie Protocol - Extension in Lying (centralization הושגה)
2. טרקציה מותנית ידנית
3. Neural Mobilization - Sciatic Nerve Slider
4. Core stabilization - Bracing ו-Dead Bug progression
5. הדרכת ארגונומיה - ישיבה, הרמת משאות

תוכנית המשך:
• הקפדה על Extension exercises 6-8 פעמים ביום
• הימנעות מכפיפת גב מתחת 30°
• הפניה ל-MRI עדכני - לשקול עם האורתופד
• מעקב צמוד - טיפול פעמיים בשבוע`,
    exercises: ['ex7', 'ex8', 'ex9'],
    recorded: true,
  },
];

export const mockExercises = [
  {
    id: 'ex1',
    name: 'Spanish Squat',
    nameHe: 'סקוואט ספרדי',
    category: 'ברך',
    categoryColor: '#06B6D4',
    description: 'סקוואט עם רצועה מאחורי הברכיים. לרדת ל-60° כפיפת ברך, להחזיק 5 שניות.',
    sets: 3,
    reps: 12,
    holdTime: 5,
    frequency: 'פעמיים ביום',
    videoUrl: '/therapist/videos?category=ברך',
    difficulty: 'בינוני',
    assignedDate: '2026-06-01',
  },
  {
    id: 'ex2',
    name: 'Single Leg Bridge',
    nameHe: 'גשר רגל אחת',
    category: 'ברך',
    categoryColor: '#06B6D4',
    description: 'שכיבה על הגב, הרמת אגן עם רגל אחת. להחזיק 3 שניות למעלה.',
    sets: 3,
    reps: 10,
    holdTime: 3,
    frequency: 'פעם ביום',
    videoUrl: '/therapist/videos?category=ברך',
    difficulty: 'בינוני',
    assignedDate: '2026-06-03',
  },
  {
    id: 'ex3',
    name: 'Terminal Knee Extension',
    nameHe: 'יישור ברך סופי',
    category: 'ברך',
    categoryColor: '#06B6D4',
    description: 'יישור ברך עם רצועה גומי מאחורי הברך. תנועה מ-30° כפיפה ליישור מלא.',
    sets: 3,
    reps: 15,
    holdTime: null,
    frequency: 'פעמיים ביום',
    videoUrl: '/therapist/videos?category=ברך',
    difficulty: 'קל',
    assignedDate: '2026-06-06',
  },
  {
    id: 'ex4',
    name: 'Eccentric External Rotation',
    nameHe: 'סיבוב חיצוני אקסצנטרי',
    category: 'כתף',
    categoryColor: '#8B5CF6',
    description: 'עם גומייה, סיבוב חיצוני איטי. להתמקד בשלב האקסצנטרי (חזרה פנימה) - 4 שניות.',
    sets: 3,
    reps: 10,
    holdTime: null,
    frequency: 'פעם ביום',
    videoUrl: '/therapist/videos?category=כתף',
    difficulty: 'בינוני',
    assignedDate: '2026-06-02',
  },
  {
    id: 'ex5',
    name: 'Scapular Retraction',
    nameHe: 'כיווץ שכמות',
    category: 'כתף',
    categoryColor: '#8B5CF6',
    description: 'משיכת שכמות לאחור ולמטה. להחזיק 5 שניות.',
    sets: 3,
    reps: 15,
    holdTime: 5,
    frequency: '3 פעמים ביום',
    videoUrl: '/therapist/videos?category=כתף',
    difficulty: 'קל',
    assignedDate: '2026-06-04',
  },
  {
    id: 'ex6',
    name: 'Wall Slides',
    nameHe: 'החלקת ידיים על הקיר',
    category: 'כתף',
    categoryColor: '#8B5CF6',
    description: 'עמידה עם גב לקיר, החלקת ידיים למעלה תוך שמירה על מגע עם הקיר.',
    sets: 3,
    reps: 10,
    holdTime: 3,
    frequency: 'פעמיים ביום',
    videoUrl: '/therapist/videos?category=כתף',
    difficulty: 'בינוני',
    assignedDate: '2026-06-07',
  },
  {
    id: 'ex7',
    name: 'Prone Press-Up (McKenzie)',
    nameHe: 'שכיבת סמיכה מקנזי',
    category: 'גב',
    categoryColor: '#F59E0B',
    description: 'שכיבה על הבטן, הרמת גוף עליון תוך שמירת אגן על המזרן. להחזיק 2 שניות.',
    sets: 10,
    reps: 1,
    holdTime: 2,
    frequency: '6-8 פעמים ביום',
    videoUrl: '/therapist/videos?category=גב',
    difficulty: 'קל',
    assignedDate: '2026-06-01',
  },
  {
    id: 'ex8',
    name: 'Dead Bug',
    nameHe: 'חיפושית מתה',
    category: 'גב',
    categoryColor: '#F59E0B',
    description: 'שכיבה על הגב, הורדה מבוקרת של יד ורגל נגדיות תוך שמירת גב תחתון צמוד לרצפה.',
    sets: 3,
    reps: 8,
    holdTime: 3,
    frequency: 'פעמיים ביום',
    videoUrl: '/therapist/videos?category=גב',
    difficulty: 'בינוני',
    assignedDate: '2026-06-05',
  },
  {
    id: 'ex9',
    name: 'Bird Dog',
    nameHe: 'כלב ציד',
    category: 'גב',
    categoryColor: '#F59E0B',
    description: 'על ארבע, הרמת יד ורגל נגדיות בו-זמנית. להחזיק 5 שניות.',
    sets: 3,
    reps: 10,
    holdTime: 5,
    frequency: 'פעם ביום',
    videoUrl: '/therapist/videos?category=גב',
    difficulty: 'בינוני',
    assignedDate: '2026-06-06',
  },
];

export const mockJournalEntries = [
  { date: '2026-06-02', painLevel: 4, mood: 'טוב', energy: 7, sleep: 7, activity: 'ריצה קלה 20 דקות', notes: 'הרגשתי טוב אחרי הריצה, כאב קל בלבד', exercisesCompleted: true, walkingScore: 8, stairsScore: 8, runningScore: 5, stepsCount: 11420, distanceKm: 4.8, deviceSynced: true, deviceType: 'garmin' },
  { date: '2026-06-01', painLevel: 5, mood: 'בינוני', energy: 6, sleep: 6, activity: 'יום עבודה, ישיבה ממושכת', notes: 'כאב עלה אחרי ישיבה ארוכה', exercisesCompleted: true, walkingScore: 7, stairsScore: 7, runningScore: 4, stepsCount: 6200, distanceKm: 0, deviceSynced: true, deviceType: 'apple_health' },
  { date: '2026-05-31', painLevel: 3, mood: 'מצוין', energy: 8, sleep: 8, activity: 'הליכה 30 דקות + תרגילים', notes: 'יום טוב! כמעט ללא כאב', exercisesCompleted: true, walkingScore: 8, stairsScore: 7, runningScore: 5, stepsCount: 12100, distanceKm: 2.1, deviceSynced: true, deviceType: 'garmin' },
  { date: '2026-05-30', painLevel: 6, mood: 'לא טוב', energy: 4, sleep: 5, activity: 'מנוחה', notes: 'כאב חזק בבוקר, השתפר במהלך היום', exercisesCompleted: false, walkingScore: 5, stairsScore: 5, runningScore: 2, stepsCount: 2300, distanceKm: 0, deviceSynced: false },
  { date: '2026-05-29', painLevel: 4, mood: 'טוב', energy: 7, sleep: 7, activity: 'שחייה 30 דקות', notes: 'שחייה עזרה להקל', exercisesCompleted: true, walkingScore: 7, stairsScore: 6, runningScore: 4, stepsCount: 9800, distanceKm: 0, deviceSynced: true, deviceType: 'apple_health' },
  { date: '2026-05-28', painLevel: 5, mood: 'בינוני', energy: 6, sleep: 6, activity: 'טיפול פיזיותרפיה', notes: 'אחרי הטיפול הרגשתי שחרור', exercisesCompleted: true, walkingScore: 8, stairsScore: 6, runningScore: 4, stepsCount: 8100, distanceKm: 0, deviceSynced: true, deviceType: 'garmin' },
  { date: '2026-05-27', painLevel: 4, mood: 'טוב', energy: 7, sleep: 7, activity: 'הליכה + תרגילים', notes: '', exercisesCompleted: true, walkingScore: 7, stairsScore: 6, runningScore: 3, stepsCount: 10400, distanceKm: 1.5, deviceSynced: true, deviceType: 'garmin' },
  { date: '2026-05-26', painLevel: 5, mood: 'בינוני', energy: 5, sleep: 6, activity: 'יום עבודה', notes: 'עומס בעבודה, שכחתי לעשות תרגילים', exercisesCompleted: false, walkingScore: 6, stairsScore: 5, runningScore: 3, stepsCount: 5100, distanceKm: 0, deviceSynced: false },
  { date: '2026-05-25', painLevel: 3, mood: 'מצוין', energy: 8, sleep: 8, activity: 'אימון חדר כושר (קל)', notes: 'אימון ללא כאב!', exercisesCompleted: true, walkingScore: 8, stairsScore: 7, runningScore: 4, stepsCount: 11100, distanceKm: 0, deviceSynced: true, deviceType: 'apple_health' },
  { date: '2026-05-24', painLevel: 4, mood: 'טוב', energy: 7, sleep: 7, activity: 'הליכה 45 דקות', notes: '', exercisesCompleted: true, walkingScore: 7, stairsScore: 6, runningScore: 3, stepsCount: 13400, distanceKm: 3.5, deviceSynced: true, deviceType: 'garmin' },
  { date: '2026-05-23', painLevel: 5, mood: 'בינוני', energy: 6, sleep: 5, activity: 'מנוחה', notes: 'לילה קשה, כאבים הפריעו לשינה', exercisesCompleted: true, walkingScore: 6, stairsScore: 5, runningScore: 2, stepsCount: 3400, distanceKm: 0, deviceSynced: false },
  { date: '2026-05-22', painLevel: 6, mood: 'לא טוב', energy: 5, sleep: 5, activity: 'טיפול פיזיותרפיה', notes: 'החמרה אחרי אתמול', exercisesCompleted: true, walkingScore: 6, stairsScore: 5, runningScore: 2, stepsCount: 7900, distanceKm: 0, deviceSynced: true, deviceType: 'garmin' },
  { date: '2026-05-21', painLevel: 7, mood: 'לא טוב', energy: 4, sleep: 4, activity: 'ריצה (הפרזה)', notes: 'רצתי יותר מדי - טעות', exercisesCompleted: false, walkingScore: 5, stairsScore: 4, runningScore: 2, stepsCount: 14500, distanceKm: 8.2, deviceSynced: true, deviceType: 'garmin' },
  { date: '2026-05-20', painLevel: 4, mood: 'טוב', energy: 7, sleep: 7, activity: 'תרגילים בלבד', notes: 'יום שגרתי', exercisesCompleted: true, walkingScore: 7, stairsScore: 6, runningScore: 3, stepsCount: 8900, distanceKm: 0, deviceSynced: true, deviceType: 'apple_health' },
];

export const mockCalendarEvents = [
  { id: 'e1', patientId: 'p1', patientName: 'יובל כהן', date: '2026-06-03', time: '10:00', duration: 45, type: 'טיפול', color: '#06B6D4' },
  { id: 'e2', patientId: 'p2', patientName: 'מיכל לוי', date: '2026-06-03', time: '14:00', duration: 50, type: 'טיפול', color: '#8B5CF6' },
  { id: 'e3', patientId: 'p5', patientName: 'דני אברהם', date: '2026-06-03', time: '16:00', duration: 40, type: 'הערכה', color: '#EF4444' },
  { id: 'e4', patientId: 'p3', patientName: 'אלון ברק', date: '2026-06-04', time: '09:00', duration: 55, type: 'טיפול', color: '#F59E0B' },
  { id: 'e5', patientId: 'p4', patientName: 'נועה שמיר', date: '2026-06-05', time: '11:00', duration: 50, type: 'טיפול', color: '#10B981' },
  { id: 'e6', patientId: 'p6', patientName: 'שירה גולד', date: '2026-06-06', time: '13:00', duration: 45, type: 'טיפול', color: '#EC4899' },
  { id: 'e7', patientId: 'p1', patientName: 'יובל כהן', date: '2026-06-08', time: '10:00', duration: 45, type: 'מעקב', color: '#06B6D4' },
  { id: 'e8', patientId: 'p2', patientName: 'מיכל לוי', date: '2026-06-10', time: '14:00', duration: 50, type: 'טיפול', color: '#8B5CF6' },
];

export const mockReminders = [
  { id: 'r1', patientId: 'p1', patientName: 'יובל כהן', type: 'exercises', message: 'תזכורת: הגיע הזמן לתרגילי ברך 🦵', time: '08:00', status: 'completed', date: '2026-06-02' },
  { id: 'r2', patientId: 'p1', patientName: 'יובל כהן', type: 'exercises', message: 'תזכורת ערב: תרגילי ברך לפני השינה', time: '20:00', status: 'pending', date: '2026-06-02' },
  { id: 'r3', patientId: 'p2', patientName: 'מיכל לוי', type: 'session', message: 'תזכורת: פגישה מחר ב-14:00', time: '18:00', status: 'sent', date: '2026-06-02' },
  { id: 'r4', patientId: 'p3', patientName: 'אלון ברק', type: 'exercises', message: 'תזכורת: תרגילי מקנזי (6-8 פעמים היום!)', time: '07:00', status: 'read', date: '2026-06-02' },
  { id: 'r5', patientId: 'p4', patientName: 'נועה שמיר', type: 'journal', message: 'מלא/י את המעקב היומי להיום', time: '21:00', status: 'pending', date: '2026-06-02' },
];

export const mockAIRecommendations = [
  {
    patientId: 'p1',
    patientName: 'יובל כהן',
    type: 'progress',
    severity: 'positive',
    title: 'שיפור ב-VISA-P — מוכן למעבר לפרוטוקול HSR',
    description: 'VISA-P (שאלון תפקוד גיד הפיקה) עלה מ-52 ל-62/100 ב-8 טיפולים. פער כוח מרחיקי ירך (hip abductors) ירד ל-6.7%. כאב בסקוואט על משטח נטוי (decline squat) ירד ל-3/10. לפי המחקרים, המטופל עומד בקריטריונים למעבר מתרגילי אקסצנטריים לפרוטוקול HSR (התנגדויות כבדות איטיות). מומלץ גם לשקול תחילת תכנית חזרה לריצה (אם כאב מתחת 3/10 בפעילות).',
    actionItems: [
      'מעבר לפרוטוקול HSR (התנגדויות כבדות איטיות) — 3 פעמים בשבוע',
      'תחילת תכנית חזרה לריצה: שבוע 1 — 2 ק"מ פעמיים בשבוע, אינטרוואלים 2 דק ריצה / 2 דק הליכה',
      'הערכת VISA-P חוזרת בעוד 4 שבועות (יעד ≥75/100)',
      'הפחתת תדירות טיפולים לפעם בשבוע',
    ],
    evidence: 'Kongsgaard et al. BJSM 2009; Silbernagel & Crossley, JOSPT 2015',
  },
  {
    patientId: 'p3',
    patientName: 'אלון ברק',
    type: 'alert',
    severity: 'warning',
    title: '⚠️ מוגבלות (ODI) לא משתפרת — שקול הסלמה',
    description: 'שאלון מוגבלות (ODI) נשאר על 48% (מוגבלות חמורה) לאורך 5 טיפולים, למרות שהושגה centralization (הכאב חזר מהרגל לגב) עם תרגילי מקנזי. SLR (הרמת רגל ישרה) השתפר (30°→45°) אך הכאב לא ירד (6/10). חולשת מושט בוהן (EHL) נמשכת 4/5 — מעורר דאגה ללחץ מתמשך על שורש עצב L5. שאלון פחד מפעילות (FABQ) גבוה: 18/24 — מצביע על התנהגות הימנעות שעלולה לעכב החלמה. אם אין שיפור משמעותי תוך 6 שבועות — שקול הסלמה.',
    actionItems: [
      'הפניה לחוות דעת אורתופדית — שקול דעת ניתוחית אם אין שיפור',
      'שקול MRI חוזר — לבדוק ספיגת דיסק (disc resorption)',
      'שקול הזרקה אפידורלית (epidural steroid injection) ל-L4-L5',
      'הגברת חינוך לכאב (Pain Neuroscience Education) + חשיפה הדרגתית (graded exposure)',
      'מעקב נוירולוגי שבועי: כוח מושט בוהן (EHL), טיביאליס, תחושה L5',
    ],
    evidence: 'NICE NG59; Donelson et al., Spine 2012; Lurie et al. SPORT Trial, JAMA 2014',
  },
  {
    patientId: 'p4',
    patientName: 'נועה שמיר',
    type: 'milestone',
    severity: 'positive',
    title: '🏆 עומדת בקריטריונים לשלב 4 — חזרה לספורט',
    description: `אחרי שחזור צלב קדמי (ACL-R, שתל BTB) — 16 שבועות. כוח ארבע ראשי (quadriceps) הגיע ל-90% מהצד הבריא (LSI, יעד: ≥90% ✓). מבחני קפיצה (hop tests): בודדת 88%, משולשת 85%, מצלבת 82% (יעד: ≥85% בלפחות 3 מבחנים ✓). תפקוד יום-יומי (KOS-ADLS) 88/100. שאלון מוכנות פסיכולוגית לחזרה (ACL-RSI) 62/100 — בינוני, דורש מעקב. מוכנה לשלב 4 — תרגולי זריזות (אג'יליטי) ותרגול ספציפי לספורט. אישור סופי למשחק תחרותי רק בחודש 9.`,
    actionItems: [
      'תחילת תרגולי זריזות (סולם, חתכים, פיבוטים)',
      'השלמת מבחני קפיצה מלאים (hop test battery) — כל 4 המבחנים לתיעוד',
      'טיפול במוכנות פסיכולוגית: ACL-RSI 62 → יעד ≥80/100',
      'חזרה הדרגתית לאימון קבוצתי — ללא מגע 4 שבועות',
      'אישור סופי למשחק תחרותי רק בחודש 9 — רק עם Hop LSI ≥90%',
    ],
    evidence: 'Grindem et al. BJSM 2016; Myer et al., AJSM 2012; Ardern et al. BJSM 2014',
  },
  {
    patientId: 'p5',
    patientName: 'דני אברהם',
    type: 'suggestion',
    severity: 'info',
    title: 'שקול גלי הלם (ESWT) — מרפק טניס עמיד',
    description: 'PRTEE (שאלון תפקוד מרפק) 54/100. פער כוח אחיזה (grip strength) 26% בין ימין לשמאל. 4 טיפולים של פרוטוקול Tyler (תרגילי אקסצנטריים ליישור כף יד) עם תגובה חלקית. לפי המחקרים, גלי הלם (ESWT) יעילים במרפק טניס עמיד (מעל 6 שבועות ללא תגובה לתרגילי אקסצנטריים).',
    actionItems: [
      'פרוטוקול גלי הלם (ESWT): 2000 אימפולסים, 2.5 בר, פעם בשבוע × 3 טיפולים',
      'המשך תרגילי אקסצנטריים (פרוטוקול Tyler) בין הטיפולים',
      'הפחתת טניס לפעם אחת בשבוע, ללא מכות בקהנד (backhand) × 4 שבועות',
      'ברכית מרפק (epicondylar strap / counterforce brace) בפעילות ובטניס',
      'הערכת PRTEE בעוד 6 שבועות — אם מעל 40 → הפניה לאורתופד לשקול PRP (הזרקת פלזמה עשירת טסיות)',
    ],
    evidence: 'Rompe et al. JBJS 2004; Cacchio et al. AJSM 2011; Coombes et al. Lancet 2010',
  },
  {
    patientId: 'p6',
    patientName: 'שירה גולד',
    type: 'progress',
    severity: 'positive',
    title: 'שיפור ב-NDI + החלמה נוירולוגית',
    description: 'שאלון מוגבלות צוואר (NDI) ירד מ-48% ל-32% (מוגבלות בינונית). מבחן Spurling (לחיצת צוואר) הפך מחיובי לשלילי. רפלקס ביספס חזר לתקין. כוח דלטואיד עלה מ-4/5 ל-4+/5. סיבולת שרירי צוואר עמוקים (deep cervical flexors): 8→22 שניות (יעד ≥30 שניות). בדיקת עצב (ULTT1 - עצב מדיאן) עכשיו שלילית בשני הצדדים. מגיבה היטב לתרגילי כיפוף צוואר + סיבולת שרירי צוואר עמוקים. להמשיך עם הגדלת עומס הדרגתית.',
    actionItems: [
      'המשך חיזוק שרירי צוואר עמוקים (DNF) — יעד 30 שניות החזקה',
      'שקול הוספת טרקציה צווארית (משיכה לסירוגין) אם ה-NDI לא ממשיך לרדת',
      'חזרה הדרגתית ליוגה — להימנע מתנוחות יישור צוואר קיצוניות (extension) × 4 שבועות',
      'הערכת NDI + בדיקה נוירולוגית בעוד 3 שבועות — יעד NDI מתחת 20%',
    ],
    evidence: 'Jull et al. Spine 2002; Fritz & Wainner, Spine 2002; Young et al. JOSPT 2009',
  },
];

export const mockVideoCategories = [
  { id: 'knee', name: 'ברך', icon: '🦵', count: 12, color: '#06B6D4' },
  { id: 'shoulder', name: 'כתף', icon: '💪', count: 15, color: '#8B5CF6' },
  { id: 'back', name: 'גב', icon: '🔙', count: 18, color: '#F59E0B' },
  { id: 'neck', name: 'צוואר', icon: '🧣', count: 8, color: '#EC4899' },
  { id: 'hip', name: 'ירך', icon: '🦴', count: 10, color: '#10B981' },
  { id: 'ankle', name: 'קרסול', icon: '🦶', count: 6, color: '#EF4444' },
];

export const therapistProfile = {
  name: 'ד"ר אורי שפירא',
  title: 'פיזיותרפיסט ספורט',
  specialization: 'שיקום פציעות ספורט, אורתופדיה',
  clinic: 'פיזיו-AI - מכון פיזיותרפיה',
  avatar: '👨‍⚕️',
  avatarBg: '#266289',
};

export const patientProfile = {
  ...mockPatients[0],
  exercises: mockExercises.slice(0, 3),
  journalEntries: mockJournalEntries,
};
