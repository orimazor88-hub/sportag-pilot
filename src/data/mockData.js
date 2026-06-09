// === SPORTAG PRO - Mock Data (Cleared for Real Pilot) ===

export const mockPatients = [];
export const mockSessions = [];
export const mockExercises = [];
export const mockJournalEntries = [];
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
  phone: '',
  email: '',
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
