// === Video Library ===
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mockVideoCategories, mockExercises } from '../../data/mockData';
import { SearchBar } from '../../components/SharedComponents';
import { Play, Heart, Filter, ArrowRight, X } from 'lucide-react';

export default function VideoLibrary() {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || null);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);

  const getExerciseVideoUrl = (exercise) => {
    if (exercise.videoUrl && !exercise.videoUrl.startsWith('/')) {
      return exercise.videoUrl;
    }
    if (exercise.category === 'ברך') {
      return 'https://www.w3schools.com/html/mov_bbb.mp4';
    }
    return 'https://www.w3schools.com/html/movie.mp4';
  };

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  const filteredExercises = mockExercises.filter(ex => {
    const matchSearch = !search || ex.nameHe.includes(search) || ex.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || ex.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🎬 ספריית תרגילים</h1>
          <p className="page-subtitle">וידאו הדרכה לכל סוגי התרגילים</p>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="חיפוש תרגיל..." />

      {/* Categories */}
      {!selectedCategory && (
        <div className="grid-2 mt-6 animate-fade-in">
          {mockVideoCategories.map((cat, i) => (
            <button
              key={cat.id}
              className="card card-hover animate-fade-in-up"
              style={{
                animationDelay: `${i * 80}ms`, cursor: 'pointer',
                border: 'none', textAlign: 'center', width: '100%',
                background: `linear-gradient(135deg, ${cat.color}15, ${cat.color}05)`,
                borderInlineStart: `4px solid ${cat.color}`,
              }}
              onClick={() => setSelectedCategory(cat.name)}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>
                {cat.icon}
              </div>
              <div className="font-bold text-lg">{cat.name}</div>
              <div className="text-xs text-secondary mt-1">{cat.count} תרגילים</div>
            </button>
          ))}
        </div>
      )}

      {/* Exercise List */}
      {selectedCategory && (
        <div className="animate-fade-in mt-6">
          <button
            className="btn btn-ghost btn-sm mb-4"
            onClick={() => setSelectedCategory(null)}
          >
            <ArrowRight size={16} />
            חזרה לקטגוריות
          </button>
          <h2 className="section-title">{selectedCategory}</h2>
          <div className="flex flex-col gap-3">
            {filteredExercises.map((ex, i) => (
              <div
                key={ex.id}
                className="card card-hover animate-fade-in-up"
                onClick={() => setActiveVideo(ex)}
                style={{ animationDelay: `${i * 60}ms`, cursor: 'pointer' }}
              >
                <div className="flex items-center gap-4">
                  {/* Video Thumbnail Placeholder */}
                  <div
                    className="video-thumbnail"
                    style={{
                      width: 100, height: 70,
                      borderRadius: 'var(--radius-md)',
                      background: `linear-gradient(135deg, ${ex.categoryColor}30, ${ex.categoryColor}10)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Play size={18} style={{ color: 'white', marginRight: -2 }} />
                    </div>
                  </div>

                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="font-semibold">{ex.nameHe}</div>
                    <div className="text-xs text-muted">{ex.name}</div>
                    <div className="flex gap-2 mt-2">
                      <span className="badge badge-primary">{ex.sets}×{ex.reps}</span>
                      <span className="badge" style={{
                        background: ex.difficulty === 'קל' ? 'rgba(16,185,129,0.2)' : ex.difficulty === 'בינוני' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                        color: ex.difficulty === 'קל' ? '#10B981' : ex.difficulty === 'בינוני' ? '#F59E0B' : '#EF4444',
                      }}>
                        {ex.difficulty}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-icon btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(ex.id);
                    }}
                    style={{ width: 36, height: 36 }}
                  >
                    <Heart
                      size={18}
                      fill={favorites.includes(ex.id) ? '#E22279' : 'none'}
                      style={{ color: favorites.includes(ex.id) ? '#E22279' : 'var(--text-tertiary)' }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCategory && filteredExercises.length === 0 && (
        <div className="empty-state">
          <Filter size={48} />
          <h3 className="mt-4">לא נמצאו תרגילים</h3>
        </div>
      )}

      {/* Video Lightbox Modal */}
      {activeVideo && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            direction: 'rtl'
          }}
          onClick={() => setActiveVideo(null)}
        >
          <div 
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-color pb-3">
              <div>
                <h3 className="font-bold text-sm text-primary truncate" style={{ maxWidth: '400px' }}>
                  {activeVideo.nameHe} ({activeVideo.name})
                </h3>
                <span className="badge badge-primary text-xs mt-1">
                  קטגוריה: {activeVideo.category}
                </span>
              </div>
              <button 
                className="btn btn-icon btn-ghost" 
                onClick={() => setActiveVideo(null)}
                style={{ width: 32, height: 32 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Player */}
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'black', 
              borderRadius: 'var(--radius-md)', 
              overflow: 'hidden', 
              minHeight: '260px',
              maxHeight: '50vh',
              position: 'relative'
            }}>
              <video 
                src={getExerciseVideoUrl(activeVideo)} 
                controls
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', maxHeight: '50vh', objectFit: 'contain' }}
              />
            </div>

            {/* Exercise details */}
            <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
              <div className="text-xs text-muted font-bold mb-1">הוראות ביצוע:</div>
              <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>{activeVideo.description}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="badge badge-primary">{activeVideo.sets} סטים</span>
                <span className="badge badge-teal">{activeVideo.reps} חזרות</span>
                {activeVideo.holdTime && (
                  <span className="badge badge-warning">החזקה {activeVideo.holdTime} שניות</span>
                )}
                <span className="badge badge-success">דרגת קושי: {activeVideo.difficulty}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
