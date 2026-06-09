// === My Exercises ===
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockExercises } from '../../data/mockData';
import { ExerciseCard } from '../../components/SharedComponents';
import { CheckCircle, Trophy } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function MyExercises() {
  const { user } = useAuth();
  const [completedExercises, setCompletedExercises] = useState({});
  const location = useLocation();
  
  // Get exercises from user profile or fallback
  const rawExercises = user?.exercises || mockExercises.slice(0, 3);
  
  // Sort exercises by assignedDate descending so newest are at the top/front
  const exercises = [...rawExercises].sort((a, b) => {
    if (!a.assignedDate) return 1;
    if (!b.assignedDate) return -1;
    return new Date(b.assignedDate) - new Date(a.assignedDate);
  });

  const totalCompleted = Object.values(completedExercises).filter(Boolean).length;
  const allDone = totalCompleted === exercises.length;

  const handleComplete = (exerciseId, isDone) => {
    setCompletedExercises(prev => ({ ...prev, [exerciseId]: isDone }));
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
            />
          </div>
        ))}
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
