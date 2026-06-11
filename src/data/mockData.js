// === SPORTAG PRO - Mock Data (Cleared for Real Pilot) ===

export const therapistProfile = {
  name: 'ד"ר אורי שפירא',
  title: 'פיזיותרפיסט ספורט',
  specialization: 'שיקום פציעות ספורט, אורתופדיה',
  clinic: 'פיזיו-AI - מכון פיזיותרפיה',
  avatar: '👨‍⚕️',
  avatarBg: '#266289',
};

export const patientProfile = {
  id: 'p1',
  name: 'מטופל פיילוט',
  age: 30,
  gender: 'male',
  phone: '050-1234567',
  email: 'patient@email.com',
  avatar: '🏃',
  avatarBg: '#8B5CF6',
  sport: 'ריצה',
  condition: 'General Rehab',
  conditionHe: 'שיקום כללי',
  area: 'ברך',
  areaColor: '#06B6D4',
  startDate: new Date().toISOString().slice(0, 10),
  sessionsCount: 0,
  status: 'active',
  painLevel: 4,
  progress: 0,
  isLowerLimb: true,
  exercises: [],
  journalEntries: [],
};

export const mockPatients = [patientProfile];
export const mockSessions = [];
export const mockExercises = [];
export const mockJournalEntries = [
  {
    date: new Date().toISOString().slice(0, 10),
    pain_level: 4,
    painLevel: 4,
    painLocation: 'knee-r:patellar-tendon',
    pain_location: 'knee-r:patellar-tendon',
    mood: 'טוב',
    energy: 7,
    sleep: 8,
    activity: 'הליכה קלה של בוקר',
    notes: 'הרגשתי קצת כאב מתחת לפיקה בסוף ההליכה.',
    exercisesCompleted: true,
    walking_score: 8,
    stairs_score: 8,
    running_score: 5,
    steps_count: 5000,
    distance_km: 2.5,
    device_synced: false,
    device_type: ''
  }
];
export const mockCalendarEvents = [];
export const mockReminders = [];
export const mockAIRecommendations = [];

export const mockVideoCategories = [
  { id: 'knee', name: 'ברך', icon: '🦵', count: 12, color: '#06B6D4' },
  { id: 'shoulder', name: 'כתף', icon: '💪', count: 15, color: '#8B5CF6' },
  { id: 'back', name: 'גב', icon: '🔙', count: 18, color: '#F59E0B' },
  { id: 'neck', name: 'צוואר', icon: '🧣', count: 8, color: '#EC4899' },
  { id: 'hip', name: 'ירך', icon: '🦴', count: 10, color: '#10B981' },
  { id: 'ankle', name: 'קרסול', icon: '🦶', count: 6, color: '#EF4444' },
];
