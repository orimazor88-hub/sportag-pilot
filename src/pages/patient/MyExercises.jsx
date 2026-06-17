// === My Exercises ===
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockExercises, mockJournalEntries } from '../../data/mockData';
import { ExerciseCard } from '../../components/SharedComponents';
import { CheckCircle, Trophy, Save } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

export default function MyExercises() {
  const { user, isMockMode } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [mediaUploads, setMediaUploads] = useState([]);
  const [completedExercises, setCompletedExercises] = useState({});
  const [exerciseNotes, setExerciseNotes] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    loadExercises();
  }, [user, isMockMode]);

  const loadExercises = async () => {
    if (!user) return;

    if (isMockMode) {
      setExercises(mockExercises.slice(0, 3));
      const saved = localStorage.getItem('sportag_uploads');
      let mockMedia = [];
      if (saved) {
        try {
          mockMedia = JSON.parse(saved);
        } catch (e) {}
      }
      setMediaUploads(mockMedia);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: dbExercises, error: exErr } = await supabase
        .from('exercises')
        .select('*')
        .eq('patient_id', user.id)
        .order('assigned_date', { ascending: false });

      if (exErr) throw exErr;

      const { data: dbMedia, error: mErr } = await supabase
        .from('media_uploads')
        .select('*')
        .eq('patient_id', user.id);

      if (mErr) console.warn('Could not fetch media uploads:', mErr);

      setExercises((dbExercises || []).map(e => ({
        id: e.id,
        patientId: e.patient_id,
        name: e.name,
        nameHe: e.name_he,
        category: e.category,
        categoryColor: e.category === 'ברך' || e.category === 'knee' ? '#06B6D4' : '#8B5CF6',
        description: e.description,
        sets: e.sets,
        reps: e.reps,
        holdTime: e.hold_time,
        frequency: e.frequency,
        difficulty: e.difficulty,
        assignedDate: e.assigned_date,
        videoUrl: e.video_url,
        therapistNote: e.therapist_note
      })));

      setMediaUploads((dbMedia || []).map(item => ({
        id: item.id,
        type: item.type,
        name: item.file_name,
        title: item.title,
        exerciseId: item.exercise_id,
        date: item.date,
        note: item.note,
        persistedUrl: item.file_url,
        thumbnailUrl: item.thumbnail_url,
        uploadedBy: item.title && item.title.includes('הנחיית מטפל') ? 'therapist' : 'patient'
      })));
    } catch (err) {
      console.error('Error loading exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCompleted = Object.values(completedExercises).filter(Boolean).length;
  const allDone = totalCompleted === exercises.length;

  // Load from localStorage on user change
  useEffect(() => {
    if (user) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const savedDone = localStorage.getItem(`sportag_completed_exercises_${user.id}_${todayStr}`);
      if (savedDone) {
        try {
          setCompletedExercises(JSON.parse(savedDone));
        } catch (e) {}
      } else {
        setCompletedExercises({});
      }

      const savedNotes = localStorage.getItem(`sportag_exercise_notes_${user.id}_${todayStr}`);
      if (savedNotes) {
        try {
          setExerciseNotes(JSON.parse(savedNotes));
        } catch (e) {}
      } else {
        setExerciseNotes({});
      }
    }
  }, [user]);

  const handleComplete = (exerciseId, isDone) => {
    setCompletedExercises(prev => ({ ...prev, [exerciseId]: isDone }));
  };

  const handleNoteChange = (exerciseId, newNote) => {
    setExerciseNotes(prev => ({ ...prev, [exerciseId]: newNote }));
  };

  const syncExerciseLogsToDatabase = async (updatedCompleted, updatedNotes) => {
    if (!user) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Build formatted lines
    const exerciseLines = [];
    const allKeys = new Set([...Object.keys(updatedCompleted), ...Object.keys(updatedNotes)]);
    
    allKeys.forEach(exId => {
      const exObj = exercises.find(e => e.id === exId || e.id.toString() === exId.toString());
      const exName = exObj ? exObj.nameHe || exObj.name_he || exObj.name : `תרגיל ${exId}`;
      const isDone = updatedCompleted[exId] === true;
      const exNote = updatedNotes[exId];
      if (isDone || exNote) {
        exerciseLines.push(`• ${exName}: ${isDone ? 'בוצע' : 'לא בוצע'}${exNote ? ` (הערה: ${exNote})` : ''}`);
      }
    });
    
    const exerciseLogsBlock = exerciseLines.length > 0
      ? `[מעקב תרגילים יומי]:\n${exerciseLines.join('\n')}`
      : '';

    if (isMockMode) {
      const existingIdx = mockJournalEntries.findIndex(e => e.date === todayStr && e.patientId === user.id);
      if (existingIdx !== -1) {
        let cleanNotes = mockJournalEntries[existingIdx].notes || '';
        const marker = '[מעקב תרגילים יומי]:';
        const markerIdx = cleanNotes.indexOf(marker);
        if (markerIdx !== -1) cleanNotes = cleanNotes.substring(0, markerIdx).trim();
        
        mockJournalEntries[existingIdx].notes = cleanNotes + (exerciseLogsBlock ? (cleanNotes ? '\n\n' : '') + exerciseLogsBlock : '');
      } else {
        mockJournalEntries.unshift({
          id: Date.now().toString(),
          patientId: user.id,
          date: todayStr,
          painLevel: 4,
          mood: 'טוב',
          energy: 7,
          sleep: 7,
          activity: 'תרגול ביתי',
          notes: exerciseLogsBlock,
          painLocation: 'knee-r'
        });
      }
      return;
    }

    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('journals')
        .select('*')
        .eq('patient_id', user.id)
        .eq('date', todayStr)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existing) {
        let cleanNotes = existing.notes || '';
        const marker = '[מעקב תרגילים יומי]:';
        const markerIdx = cleanNotes.indexOf(marker);
        if (markerIdx !== -1) cleanNotes = cleanNotes.substring(0, markerIdx).trim();
        
        const finalNotes = cleanNotes + (exerciseLogsBlock ? (cleanNotes ? '\n\n' : '') + exerciseLogsBlock : '');
        
        await supabase
          .from('journals')
          .update({ notes: finalNotes })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('journals')
          .insert([{
            patient_id: user.id,
            date: todayStr,
            pain_level: 4,
            mood: 'טוב',
            energy: 7,
            sleep: 7,
            activity: 'תרגול ביתי',
            notes: exerciseLogsBlock,
            pain_location: 'knee-r'
          }]);
      }
    } catch (err) {
      console.error('Error syncing exercise logs to database:', err);
    }
  };

  const handleSaveSingle = (exerciseId, isDone, noteText) => {
    if (!user) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    
    const updatedCompleted = { ...completedExercises, [exerciseId]: isDone };
    const updatedNotes = { ...exerciseNotes, [exerciseId]: noteText || '' };

    setCompletedExercises(updatedCompleted);
    localStorage.setItem(`sportag_completed_exercises_${user.id}_${todayStr}`, JSON.stringify(updatedCompleted));

    setExerciseNotes(updatedNotes);
    localStorage.setItem(`sportag_exercise_notes_${user.id}_${todayStr}`, JSON.stringify(updatedNotes));

    // Sync to Supabase/Mock database
    syncExerciseLogsToDatabase(updatedCompleted, updatedNotes);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSave = () => {
    if (!user) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`sportag_completed_exercises_${user.id}_${todayStr}`, JSON.stringify(completedExercises));
    localStorage.setItem(`sportag_exercise_notes_${user.id}_${todayStr}`, JSON.stringify(exerciseNotes));
    
    // Sync to Supabase/Mock database
    syncExerciseLogsToDatabase(completedExercises, exerciseNotes);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const scrollToId = searchParams.get('scrollTo');
    if (scrollToId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`exercise-${scrollToId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.transition = 'all 0.5s ease';
          element.style.boxShadow = '0 0 0 3px var(--color-primary-light)';
          element.style.borderRadius = 'var(--radius-xl)';
          
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 2000);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const todayFormatted = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="empty-state">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--color-primary-light)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
        <h3>טוען תרגילים...</h3>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title">💪 תרגילים להיום</h1>
          <p className="page-subtitle">{todayFormatted}</p>
        </div>
      </div>

      {/* Sticky Progress Indicator */}
      <div 
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--bg-primary)',
          paddingTop: 'var(--space-2)',
          paddingBottom: 'var(--space-4)',
          marginInline: 'calc(-1 * var(--space-4))',
          paddingInline: 'var(--space-4)',
          borderBottom: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1)',
        }}
        className="mb-6"
      >
        <div className="glass-card" style={{ margin: 0 }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm">התקדמות יומית</span>
            <span className="font-bold text-base" style={{ color: allDone ? '#10B981' : 'var(--color-primary-light)' }}>
              {totalCompleted}/{exercises.length}
            </span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div
              className="progress-fill"
              style={{
                width: `${(totalCompleted / exercises.length) * 100}%`,
                background: allDone ? 'linear-gradient(90deg, #10B981, #34D399)' : undefined,
              }}
            />
          </div>
          {allDone && (
            <div className="flex items-center justify-center gap-2 mt-3 animate-bounce-in" style={{ color: '#10B981' }}>
              <Trophy size={20} />
              <span className="font-bold text-sm">מצוין! סיימת את כל התרגילים להיום! 🎉</span>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {saved && (
        <div className="toast toast-success" style={{ zIndex: 1100 }}>
          <CheckCircle size={18} />
          הביצוע וההערות נשמרו בהצלחה!
        </div>
      )}

      {/* Exercises */}
      <div className="flex flex-col gap-4">
        {exercises.map((exercise, i) => (
          <div 
            key={exercise.id} 
            id={`exercise-${exercise.id}`}
            className="animate-fade-in-up" 
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <ExerciseCard
              exercise={exercise}
              completed={completedExercises[exercise.id] || false}
              onComplete={(isDone) => handleComplete(exercise.id, isDone)}
              customUploads={mediaUploads}
              exerciseNote={exerciseNotes[exercise.id] || ''}
              onNoteChange={(newNote) => handleNoteChange(exercise.id, newNote)}
              onSave={(isDoneVal, noteVal) => handleSaveSingle(exercise.id, isDoneVal, noteVal)}
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-6 mb-6">
        <button 
          className="btn btn-primary btn-lg w-full" 
          onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--shadow-md)' }}
        >
          <Save size={18} />
          שמור ביצוע והערות להיום
        </button>
      </div>

      {/* Tip */}
      <div className="card mt-6" style={{ borderInlineStart: '4px solid var(--color-teal)' }}>
        <div className="flex items-start gap-3">
          <span style={{ fontSize: '1.5rem' }}>💡</span>
          <div>
            <div className="font-semibold text-sm">טיפ</div>
            <p className="text-xs text-secondary mt-1" style={{ lineHeight: 1.6 }}>
              בצע את התרגילים בהתאם להנחיות המטפל. אם מרגיש כאב חד או חריג - עצור ודווח במעקב היומי.
              תרגילים לפי כאב - ברכית / טייפינג בזמן האימונים.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
