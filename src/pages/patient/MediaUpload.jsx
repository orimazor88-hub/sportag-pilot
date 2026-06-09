// === Media Upload ===
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockExercises } from '../../data/mockData';
import {
  Camera, Upload, Video, Image, X, Plus, MessageSquare, Trash2, ArrowUpDown, Play, Pencil
} from 'lucide-react';

// Helper to generate a canvas video thumbnail (Base64)
const generateVideoThumbnail = (file) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    const url = URL.createObjectURL(file);
    video.src = url;
    
    video.onloadedmetadata = () => {
      // Seek to 0.5s to get a good frame
      video.currentTime = 0.5;
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        // Scale down to keep size small for localStorage
        const scale = 0.25; 
        canvas.width = video.videoWidth * scale || 160;
        canvas.height = video.videoHeight * scale || 120;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
};

export default function MediaUpload() {
  const [searchParams] = useSearchParams();
  const exerciseIdFromUrl = searchParams.get('exerciseId');

  const { uploads, setUploads } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [associatedExerciseId, setAssociatedExerciseId] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [activeMedia, setActiveMedia] = useState(null); // Selected media for modal preview
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editExerciseId, setEditExerciseId] = useState('');

  useEffect(() => {
    if (exerciseIdFromUrl) {
      setAssociatedExerciseId(exerciseIdFromUrl);
      setShowUpload(true);
      
      const ex = mockExercises.find(e => e.id === exerciseIdFromUrl);
      if (ex) {
        setTitle(`תרגיל: ${ex.nameHe}`);
      }
    }
  }, [exerciseIdFromUrl]);

  // Refs for hidden inputs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const triggerFileSelect = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();
  const triggerVideo = () => videoInputRef.current?.click();

  const handleFileChange = async (event, forceType) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newUploads = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Detect type
      let fileType = 'image';
      if (forceType) {
        fileType = forceType;
      } else if (file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov')) {
        fileType = 'video';
      }

      // Temporary blob URL for instant preview in current session
      const previewUrl = URL.createObjectURL(file);
      
      // Generate canvas thumbnail if it's a video
      let thumbnailUrl = '';
      if (fileType === 'video') {
        thumbnailUrl = await generateVideoThumbnail(file);
      }

      // High-quality public domain clinical fallbacks for persistence (prevents localStorage quota crash)
      const persistedUrl = fileType === 'image'
        ? 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80'
        : 'https://www.w3schools.com/html/mov_bbb.mp4';

      newUploads.push({
        id: Date.now() + i,
        type: fileType,
        name: file.name || (fileType === 'image' ? `photo_${i}.jpg` : `video_${i}.mp4`),
        title: title.trim() || (fileType === 'image' ? 'תמונת תרגיל' : 'סרטון תרגיל'),
        exerciseId: associatedExerciseId,
        date: new Date().toISOString().split('T')[0],
        note: note.trim() || 'קובץ שהועלה מהנייד',
        previewUrl,
        thumbnailUrl,
        persistedUrl,
      });
    }

    setUploads(prev => [...newUploads, ...prev]);
    setShowUpload(false);
    setNote('');
    setTitle('');
    setAssociatedExerciseId('');
  };

  const handleDelete = (id, e) => {
    e.stopPropagation(); // Prevent opening the modal
    if (window.confirm('האם אתה בטוח שברצונך למחוק קובץ זה מהרשימה?')) {
      setUploads(prev => prev.filter(item => item.id !== id));
      if (activeMedia && activeMedia.id === id) {
        setActiveMedia(null);
      }
    }
  };

  const handleEditClick = (file, e) => {
    e.stopPropagation(); // Prevent opening the modal normally
    setEditTitle(file.title || file.name);
    setEditNote(file.note || '');
    setEditExerciseId(file.exerciseId || '');
    setIsEditing(true);
    setActiveMedia(file);
  };

  const handleSaveEdit = () => {
    setUploads(prev => prev.map(item => {
      if (item.id === activeMedia.id) {
        return {
          ...item,
          title: editTitle.trim(),
          note: editNote.trim(),
          exerciseId: editExerciseId
        };
      }
      return item;
    }));
    setActiveMedia(prev => ({
      ...prev,
      title: editTitle.trim(),
      note: editNote.trim(),
      exerciseId: editExerciseId
    }));
    setIsEditing(false);
  };

  const sortedUploads = [...uploads].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Helper to determine media source URL
  const getMediaSrc = (file) => {
    if (file.previewUrl) return file.previewUrl;
    if (file.persistedUrl) return file.persistedUrl;
    
    // Fallbacks for default mock data
    if (file.id === 1 || file.id === 3) {
      return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80';
    }
    if (file.id === 2) {
      return 'https://www.w3schools.com/html/mov_bbb.mp4';
    }
    return '';
  };

  const renderThumbnail = (file) => {
    const src = getMediaSrc(file);
    
    if (file.type === 'image') {
      return (
        <img 
          src={src} 
          alt={file.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.style.background = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
          }}
        />
      );
    } else {
      if (file.thumbnailUrl) {
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <img 
              src={file.thumbnailUrl} 
              alt={file.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Play size={24} style={{ color: 'white' }} />
            </div>
          </div>
        );
      }

      const videoSrc = src.startsWith('blob:') ? src : `${src}#t=0.1`;
      return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <video 
            src={videoSrc} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            preload="auto"
            muted 
            playsInline
          />
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Play size={24} style={{ color: 'white' }} />
          </div>
        </div>
      );
    }
  };

  return (
    <div>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleFileChange(e)}
      />
      <input
        type="file"
        ref={cameraInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileChange(e, 'image')}
      />
      <input
        type="file"
        ref={videoInputRef}
        style={{ display: 'none' }}
        accept="video/*"
        capture="environment"
        onChange={(e) => handleFileChange(e, 'video')}
      />

      <div className="page-header">
        <div>
          <h1 className="page-title">📸 מדיה</h1>
          <p className="page-subtitle">העלאת קבצים חריגים או מיוחדים לפי צורך (שיתוף נפיחות, פציעה מיוחדת או כאב חריג)</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? <X size={18} /> : <Plus size={18} />}
          <span className="hide-mobile">{showUpload ? 'סגור' : 'העלאה חדשה'}</span>
        </button>
      </div>

      {/* Upload Area */}
      {showUpload && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="section-title">העלאת קובץ חדש</h3>
          
          <div 
            className="mb-4 p-3 rounded-lg border text-xs flex items-center gap-2" 
            style={{ 
              borderColor: 'rgba(239, 68, 68, 0.2)', 
              background: 'rgba(239, 68, 68, 0.03)', 
              color: '#EF4444' 
            }}
          >
            <span>⚠️ <strong>שים לב:</strong> העלאה זו מיועדת לדיווח חריג (כמו נפיחות, הגבלת תנועה פתאומית או כאב חריג) ולא לתיעוד שגרתי של ביצוע התרגילים בבית.</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="input-group">
              <label className="input-label">שם התרגיל / כותרת</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="למשל: סקוואט, שיווי משקל"
              />
            </div>
            <div className="input-group">
              <label className="input-label">שיוך לתרגיל</label>
              <select
                className="input"
                value={associatedExerciseId}
                onChange={(e) => {
                  setAssociatedExerciseId(e.target.value);
                  if (!title || title.startsWith('תרגיל: ')) {
                    const ex = mockExercises.find(x => x.id === e.target.value);
                    if (ex) {
                      setTitle(`תרגיל: ${ex.nameHe}`);
                    }
                  }
                }}
                style={{ appearance: 'auto' }}
              >
                <option value="">-- ללא תרגיל (מדיה כללית) --</option>
                {mockExercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.nameHe} ({ex.category})</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">תיאור / הערה למטפל</label>
              <input
                type="text"
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="למשל: האם הנפיחות נראית תקינה?"
              />
            </div>
          </div>

          <div
            className="upload-dropzone"
            onClick={triggerFileSelect}
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-10)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              background: 'var(--bg-tertiary)',
            }}
          >
            <Upload size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto var(--space-3)' }} />
            <p className="font-semibold mb-1">לחץ לבחירת קובץ מהגלריה (ניתן לבחור מספר קבצים)</p>
            <p className="text-xs text-muted">תמונות (JPG, PNG) או וידאו (MP4) עד 50MB</p>
          </div>

          <div className="grid-2 mt-4">
            <button className="btn btn-teal w-full" onClick={triggerCamera}>
              <Camera size={18} />
              צלם תמונה מהנייד
            </button>
            <button className="btn btn-primary w-full" onClick={triggerVideo}>
              <Video size={18} />
              צלם וידאו מהנייד
            </button>
          </div>
        </div>
      )}

      {/* Gallery Header and Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="section-title" style={{ marginBottom: 0 }}>קבצים שהועלו</h2>
        <div className="flex items-center gap-1 bg-tertiary p-1 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
          <ArrowUpDown size={14} style={{ color: 'var(--text-secondary)', marginInline: '4px' }} />
          <button 
            type="button"
            className={`btn btn-xs ${sortOrder === 'newest' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSortOrder('newest')}
            style={{ padding: '2px 8px', fontSize: '11px', border: 'none' }}
          >
            הכי חדש
          </button>
          <button 
            type="button"
            className={`btn btn-xs ${sortOrder === 'oldest' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSortOrder('oldest')}
            style={{ padding: '2px 8px', fontSize: '11px', border: 'none' }}
          >
            הכי ישן
          </button>
        </div>
      </div>

      {/* Scrollable Gallery Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
          gap: 'var(--space-4)',
          maxHeight: '65vh', 
          overflowY: 'auto',
          padding: 'var(--space-1) var(--space-1) var(--space-4) var(--space-1)',
          direction: 'rtl'
        }}
        className="custom-scrollbar"
      >
        {sortedUploads.map((file, i) => (
          <div
            key={file.id}
            className="card card-compact card-hover animate-fade-in-up"
            onClick={() => setActiveMedia(file)}
            style={{ 
              animationDelay: `${i * 60}ms`,
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              height: '240px',
              cursor: 'pointer'
            }}
          >
            {/* Thumbnail Box */}
            <div style={{ width: '100%', height: '120px', overflow: 'hidden', position: 'relative', background: 'var(--bg-tertiary)' }}>
              {renderThumbnail(file)}
              
              {/* Type Badge */}
              <span className="badge" style={{
                position: 'absolute',
                bottom: 'var(--space-2)',
                left: 'var(--space-2)',
                background: file.type === 'image' ? 'rgba(8,145,178,0.9)' : 'rgba(139,92,246,0.9)',
                color: 'white',
                fontSize: '10px',
                padding: '2px 6px',
                zIndex: 1
              }}>
                {file.type === 'image' ? 'תמונה' : 'וידאו'}
              </span>

              {/* Action Edit Button */}
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                onClick={(e) => handleEditClick(file, e)}
                style={{
                  position: 'absolute',
                  top: 'var(--space-2)',
                  right: 'calc(var(--space-2) + 32px)',
                  width: 28,
                  height: 28,
                  background: 'rgba(2, 132, 199, 0.95)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  zIndex: 2
                }}
                title="ערוך פרטים"
              >
                <Pencil size={12} />
              </button>

              {/* Action Delete Button */}
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                onClick={(e) => handleDelete(file.id, e)}
                style={{
                  position: 'absolute',
                  top: 'var(--space-2)',
                  right: 'var(--space-2)',
                  width: 28,
                  height: 28,
                  background: 'rgba(239, 68, 68, 0.95)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  zIndex: 2
                }}
                title="מחק קובץ"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Info details */}
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
              <div style={{ minWidth: 0 }}>
                <div className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{file.title || file.name}</div>
                
                {/* Exercise Association Badge */}
                {file.exerciseId && (() => {
                  const ex = mockExercises.find(e => e.id === file.exerciseId);
                  return ex ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'rgba(13,148,136,0.1)', color: 'var(--color-teal-light)', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                      👟 {ex.nameHe}
                    </div>
                  ) : null;
                })()}

                <div className="text-secondary truncate mt-1" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {file.note ? (
                    <>
                      <MessageSquare size={10} style={{ flexShrink: 0 }} />
                      <span className="truncate">{file.note}</span>
                    </>
                  ) : (
                    <span className="italic text-muted">אין הערה</span>
                  )}
                </div>
              </div>
              <div className="text-muted text-right" style={{ fontSize: '10px', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                {new Date(file.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Media Viewer Lightbox Modal */}
      {activeMedia && (
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
          onClick={() => setActiveMedia(null)}
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
            onClick={(e) => e.stopPropagation()} // Stop closing on content click
          >
            {/* Header info */}
            <div className="flex justify-between items-center mb-4 border-b border-color pb-3">
              <div className="flex-1" style={{ minWidth: 0 }}>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                      <label className="input-label text-xs">שם התרגיל / כותרת</label>
                      <input 
                        type="text" 
                        className="input input-sm" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="שם התרגיל / כותרת"
                        style={{ fontSize: '13px', padding: '4px 8px', width: '100%' }}
                      />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                      <label className="input-label text-xs">שיוך לתרגיל</label>
                      <select 
                        className="input input-sm" 
                        value={editExerciseId} 
                        onChange={(e) => setEditExerciseId(e.target.value)}
                        style={{ fontSize: '13px', padding: '4px 8px', width: '100%', appearance: 'auto' }}
                      >
                        <option value="">-- ללא תרגיל --</option>
                        {mockExercises.map(ex => (
                          <option key={ex.id} value={ex.id}>{ex.nameHe}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-sm text-primary truncate" style={{ maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {activeMedia.title || activeMedia.name}
                      <button 
                        type="button" 
                        className="btn btn-ghost" 
                        onClick={() => {
                          setEditTitle(activeMedia.title || activeMedia.name);
                          setEditNote(activeMedia.note || '');
                          setEditExerciseId(activeMedia.exerciseId || '');
                          setIsEditing(true);
                        }}
                        style={{ padding: 4, width: 24, height: 24, minHeight: 'auto', border: 'none' }}
                        title="ערוך פרטים"
                      >
                        <Pencil size={12} style={{ color: 'var(--text-secondary)' }} />
                      </button>
                    </h3>
                    <div className="flex gap-2 items-center mt-1 flex-wrap">
                      <span className="text-xs text-muted">
                        {new Date(activeMedia.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {activeMedia.exerciseId && (() => {
                        const ex = mockExercises.find(e => e.id === activeMedia.exerciseId);
                        return ex ? (
                          <span className="badge badge-teal text-xs" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            👟 {ex.nameHe}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </>
                )}
              </div>
              <button 
                className="btn btn-icon btn-ghost" 
                onClick={() => {
                  setActiveMedia(null);
                  setIsEditing(false);
                }}
                style={{ width: 32, height: 32 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Media Content */}
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
              {activeMedia.type === 'image' ? (
                <img 
                  src={getMediaSrc(activeMedia)} 
                  alt={activeMedia.name} 
                  style={{ width: '100%', height: '100%', maxHeight: '50vh', objectFit: 'contain' }} 
                />
              ) : (
                /* Video Player */
                <video 
                  src={getMediaSrc(activeMedia)} 
                  controls
                  style={{ width: '100%', height: '100%', maxHeight: '50vh', objectFit: 'contain' }}
                />
              )}
            </div>

            {/* Note info */}
            {isEditing ? (
              <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label text-xs font-bold mb-1">תיאור / הערה למטפל:</label>
                  <textarea 
                    className="input text-xs" 
                    value={editNote} 
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="הערה למטפל..."
                    rows={2}
                    style={{ resize: 'none', padding: 'var(--space-2)' }}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button type="button" className="btn btn-xs btn-ghost" onClick={() => setIsEditing(false)}>
                    ביטול
                  </button>
                  <button type="button" className="btn btn-xs btn-primary" onClick={handleSaveEdit}>
                    שמור
                  </button>
                </div>
              </div>
            ) : (
              activeMedia.note && (
                <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
                  <div className="flex gap-2 items-start">
                    <MessageSquare size={16} style={{ color: 'var(--color-primary-light)', flexShrink: 0, marginTop: '2px' }} />
                    <div className="flex-1">
                      <div className="text-xs text-muted font-bold mb-1">הערת המטופל:</div>
                      <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>{activeMedia.note}</p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="card mt-6" style={{ borderInlineStart: '4px solid var(--color-primary)' }}>
        <p className="text-xs text-secondary" style={{ lineHeight: 1.6 }}>
          📌 <strong>תיעוד חריג:</strong> לשונית זו מיועדת לעדכונים מיוחדים או חריגים בלבד (כגון שיתוף תמונה של נפיחות יוצאת דופן, הגבלת תנועה פתאומית, או כאב חריג). אין צורך לתעד את תרגול השגרה בבית באופן שוטף, מכיוון שהתוכנית מתבססת על סרטוני ההדרכה שצולמו בקליניקה.
        </p>
      </div>
    </div>
  );
}
