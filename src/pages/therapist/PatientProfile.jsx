// === Patient Profile Page ===
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockPatients, mockSessions, mockExercises, mockJournalEntries } from '../../data/mockData';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../services/supabaseClient';
import { ExerciseCard, PainVisualizer, PAIN_LOCATION_MAP } from '../../components/SharedComponents';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import {
  ArrowRight, Calendar, FileText, Dumbbell, TrendingUp,
  Clock, Activity, Brain, ChevronLeft, Target, Sliders,
  Camera, Image, Video, MessageSquare, X, Play, Edit, Trash2
} from 'lucide-react';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeMedia, setActiveMedia] = useState(null);

  // Helper to determine media source URL for therapist view
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

  const { user, uploads, isMockMode } = useAuth();
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [journalHistory, setJournalHistory] = useState([]);
  const [patientMedia, setPatientMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit targets states
  const [editedTargets, setEditedTargets] = useState(null);
  const [editedInitialPain, setEditedInitialPain] = useState(null);
  const [editedFirstMetric, setEditedFirstMetric] = useState(null);
  const [editedTargetDate, setEditedTargetDate] = useState(null);
  const [editedStrengthMuscle, setEditedStrengthMuscle] = useState(null);

  // Add exercise modal states
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exNameHe, setExNameHe] = useState('');
  const [exNameEn, setExNameEn] = useState('');
  const [exCategory, setExCategory] = useState('knee');
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState(10);
  const [exHoldTime, setExHoldTime] = useState('');
  const [exFrequency, setExFrequency] = useState('פעם ביום');
  const [exDifficulty, setExDifficulty] = useState('בינוני');
  const [exDescription, setExDescription] = useState('');
  const [savingExercise, setSavingExercise] = useState(false);
  const [exVideoFile, setExVideoFile] = useState(null);
  const [exUploadProgress, setExUploadProgress] = useState(0);

  // Add session modal states
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [sessDate, setSessDate] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM
  const [sessDuration, setSessDuration] = useState(45);
  const [sessType, setSessType] = useState('פיזיותרפיה');
  const [sessSummary, setSessSummary] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  // Therapist notes states
  const [therapistNotes, setTherapistNotes] = useState([]);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);


  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'knee':
      case 'ברך': return '#06B6D4';
      case 'shoulder':
      case 'כתף': return '#8B5CF6';
      case 'back':
      case 'גב': return '#F59E0B';
      case 'neck':
      case 'צוואר': return '#EC4899';
      case 'hip':
      case 'ירך': return '#10B981';
      case 'ankle':
      case 'קרסול': return '#EF4444';
      default: return '#8B5CF6';
    }
  };

  const handleAddExercise = async (e) => {
    e.preventDefault();
    if (!exNameHe) {
      alert('נא להזין שם תרגיל בעברית');
      return;
    }

    setSavingExercise(true);

    try {
      let uploadedVideoUrl = null;

      // Handle video upload if file is selected
      if (exVideoFile) {
        const maxVideoSize = 500 * 1024 * 1024; // 500MB
        if (exVideoFile.size > maxVideoSize) {
          alert('שגיאה: קובץ הוידאו גדול מדי. הגודל המרבי המותר להעלאה הוא 500MB.');
          setSavingExercise(false);
          return;
        }

        if (isMockMode) {
          // Generate a mock blob preview URL
          uploadedVideoUrl = URL.createObjectURL(exVideoFile);
        } else {
          // Upload to Supabase Storage with XMLHttpRequest for progress tracking
          const fileName = `exercise_${Date.now()}_${exVideoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const storagePath = `exercises/${fileName}`;

          setExUploadProgress(1); // start progress at 1%
          
          const uploadPromise = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const uploadUrl = `${supabaseUrl}/storage/v1/object/patient-media/${storagePath}`;
            
            xhr.open('POST', uploadUrl, true);
            xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
            xhr.setRequestHeader('apikey', supabaseAnonKey);
            xhr.setRequestHeader('Content-Type', exVideoFile.type || 'application/octet-stream');
            
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setExUploadProgress(percent);
              }
            };
            
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                try {
                  const res = JSON.parse(xhr.responseText);
                  reject(new Error(res.message || xhr.statusText || 'שגיאה בהעלאה'));
                } catch (e) {
                  reject(new Error(xhr.responseText || `שגיאה (קוד ${xhr.status})`));
                }
              }
            };
            
            xhr.onerror = () => reject(new Error('שגיאת תקשורת ברשת'));
            xhr.send(exVideoFile);
          });

          await uploadPromise;

          // Get Public URL
          const { data: { publicUrl } } = supabase.storage
            .from('patient-media')
            .getPublicUrl(storagePath);

          uploadedVideoUrl = publicUrl;
        }
      }

      const newEx = {
        id: isMockMode ? `ex-${Date.now()}` : undefined,
        name: exNameEn || exNameHe,
        nameHe: exNameHe,
        category: exCategory,
        categoryColor: getCategoryColor(exCategory),
        description: exDescription,
        sets: Number(exSets),
        reps: Number(exReps),
        holdTime: exHoldTime ? Number(exHoldTime) : null,
        frequency: exFrequency,
        difficulty: exDifficulty,
        videoUrl: uploadedVideoUrl,
        assignedDate: new Date().toISOString().slice(0, 10)
      };

      if (isMockMode) {
        setExercises(prev => [newEx, ...prev]);
        setShowAddExerciseModal(false);
        // Reset form
        setExNameHe('');
        setExNameEn('');
        setExCategory('knee');
        setExSets(3);
        setExReps(10);
        setExHoldTime('');
        setExFrequency('פעם ביום');
        setExDifficulty('בינוני');
        setExDescription('');
        setExVideoFile(null);
        setExUploadProgress(0);
        alert('התרגיל התווסף בהצלחה (מצב הדגמה)!');
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert({
            patient_id: id,
            name: exNameEn || exNameHe,
            name_he: exNameHe,
            category: exCategory,
            description: exDescription,
            sets: Number(exSets),
            reps: Number(exReps),
            hold_time: exHoldTime ? Number(exHoldTime) : null,
            frequency: exFrequency,
            difficulty: exDifficulty,
            video_url: uploadedVideoUrl
          });

        if (error) throw error;

        await loadPatientData();
        setShowAddExerciseModal(false);
        // Reset form
        setExNameHe('');
        setExNameEn('');
        setExCategory('knee');
        setExSets(3);
        setExReps(10);
        setExHoldTime('');
        setExFrequency('פעם ביום');
        setExDifficulty('בינוני');
        setExDescription('');
        setExVideoFile(null);
        setExUploadProgress(0);
        alert('התרגיל שויך בהצלחה למטופל!');
      }
    } catch (err) {
      console.error('Error adding exercise:', err);
      alert('שגיאה בשמירת התרגיל: ' + err.message);
    } finally {
      setSavingExercise(false);
      setExUploadProgress(0);
    }
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!sessSummary) {
      alert('נא להזין סיכום טיפול');
      return;
    }

    setSavingSession(true);

    try {
      const newSess = {
        id: isMockMode ? `sess-${Date.now()}` : undefined,
        patientId: id,
        date: new Date(sessDate).toISOString(),
        duration: Number(sessDuration),
        type: sessType,
        summary: sessSummary,
        recorded: false
      };

      if (isMockMode) {
        setSessions(prev => [newSess, ...prev]);
        setShowAddSessionModal(false);
        // Reset form
        setSessDate(new Date().toISOString().slice(0, 16));
        setSessDuration(45);
        setSessType('פיזיותרפיה');
        setSessSummary('');
        alert('הטיפול התווסף בהצלחה (מצב הדגמה)!');
      } else {
        const { data: authData } = await supabase.auth.getUser();
        const activeTherapistId = authData?.user?.id || user?.id;

        if (!activeTherapistId) {
          throw new Error('לא נמצא מזהה מטפל מחובר. אנא התחבר מחדש.');
        }

        const { error } = await supabase
          .from('sessions')
          .insert({
            patient_id: id,
            therapist_id: activeTherapistId,
            date: new Date(sessDate).toISOString(),
            duration: Number(sessDuration),
            type: sessType,
            summary: sessSummary,
            recorded: false
          });

        if (error) throw error;

        await loadPatientData();
        setShowAddSessionModal(false);
        // Reset form
        setSessDate(new Date().toISOString().slice(0, 16));
        setSessDuration(45);
        setSessType('פיזיותרפיה');
        setSessSummary('');
        alert('הטיפול נרשם בהצלחה במערכת!');
      }
    } catch (err) {
      console.error('Error adding session:', err);
      alert('שגיאה ברישום הטיפול: ' + err.message);
    } finally {
      setSavingSession(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      alert('נא להזין תוכן להערה');
      return;
    }

    setSavingNote(true);

    try {
      if (isMockMode) {
        if (editingNoteId) {
          const updatedNotes = therapistNotes.map(n => 
            n.id === editingNoteId ? { ...n, date: noteDate, notes: noteContent } : n
          );
          setTherapistNotes(updatedNotes);
          localStorage.setItem(`mock_therapist_notes_${id}`, JSON.stringify(updatedNotes));
          alert('ההערה עודכנה בהצלחה (מצב הדגמה)!');
        } else {
          const newNote = {
            id: `note-${Date.now()}`,
            patient_id: id,
            date: noteDate,
            notes: noteContent,
            created_at: new Date().toISOString()
          };
          const updatedNotes = [newNote, ...therapistNotes];
          setTherapistNotes(updatedNotes);
          localStorage.setItem(`mock_therapist_notes_${id}`, JSON.stringify(updatedNotes));
          alert('ההערה התווספה בהצלחה (מצב הדגמה)!');
        }
        setShowAddNoteModal(false);
        setNoteContent('');
        setNoteDate(new Date().toISOString().slice(0, 10));
        setEditingNoteId(null);
      } else {
        if (editingNoteId) {
          const { error } = await supabase
            .from('therapist_notes')
            .update({
              date: noteDate,
              notes: noteContent
            })
            .eq('id', editingNoteId);

          if (error) throw error;
          alert('ההערה עודכנה בהצלחה!');
        } else {
          const { data: authData } = await supabase.auth.getUser();
          const activeTherapistId = authData?.user?.id || user?.id;

          if (!activeTherapistId) {
            throw new Error('לא נמצא מזהה מטפל מחובר. אנא התחבר מחדש.');
          }

          const { error } = await supabase
            .from('therapist_notes')
            .insert({
              patient_id: id,
              therapist_id: activeTherapistId,
              date: noteDate,
              notes: noteContent
            });

          if (error) throw error;
          alert('ההערה נשמרה בהצלחה!');
        }

        await loadPatientData();
        setShowAddNoteModal(false);
        setNoteContent('');
        setNoteDate(new Date().toISOString().slice(0, 10));
        setEditingNoteId(null);
      }
    } catch (err) {
      console.error('Error adding/updating therapist note:', err);
      alert('שגיאה בשמירת ההערה: ' + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleEditNoteClick = (note) => {
    setEditingNoteId(note.id);
    setNoteContent(note.notes);
    const dateStr = note.date ? new Date(note.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    setNoteDate(dateStr);
    setShowAddNoteModal(true);
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק הערה זו?')) return;

    try {
      if (isMockMode) {
        const updatedNotes = therapistNotes.filter(n => n.id !== noteId);
        setTherapistNotes(updatedNotes);
        localStorage.setItem(`mock_therapist_notes_${id}`, JSON.stringify(updatedNotes));
        alert('ההערה נמחקה בהצלחה (מצב הדגמה)!');
      } else {
        const { error } = await supabase
          .from('therapist_notes')
          .delete()
          .eq('id', noteId);

        if (error) throw error;

        await loadPatientData();
        alert('ההערה נמחקה בהצלחה!');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('שגיאה במחיקת ההערה: ' + err.message);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [id, isMockMode, uploads]);

  useEffect(() => {
    const handleUploadRefresh = () => {
      loadPatientData();
    };
    window.addEventListener('sportag-media-uploaded', handleUploadRefresh);
    return () => {
      window.removeEventListener('sportag-media-uploaded', handleUploadRefresh);
    };
  }, [id]);

  const loadPatientData = async () => {
    if (isMockMode) {
      const p = mockPatients.find(x => x.id === id);
      setPatient(p);
      setSessions(mockSessions.filter(s => s.patientId === id));
      setExercises(mockExercises.map(e => ({
        ...e,
        categoryColor: getCategoryColor(e.category)
      })));
      setJournalHistory(mockJournalEntries);
      setPatientMedia(uploads);

      // Load mock notes from localStorage or default
      const savedNotes = localStorage.getItem(`mock_therapist_notes_${id}`);
      if (savedNotes) {
        setTherapistNotes(JSON.parse(savedNotes));
      } else {
        const defaultNotes = [
          {
            id: 'note-1',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            notes: 'פגישת הערכה ראשונית. המטופל מדווח על כאב ממוקד בגיד הפיקה ברגל ימין במהלך ואחרי ריצה. טווחי תנועה מלאים, כוח שריר 4/5.',
            patient_id: id,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'note-2',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            notes: 'דיווח על שיפור קל לאחר ביצוע תרגילי חיזוק איזומטריים לברך. כאב ירד לדרגה 3 במהלך הליכה.',
            patient_id: id,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setTherapistNotes(defaultNotes);
        localStorage.setItem(`mock_therapist_notes_${id}`, JSON.stringify(defaultNotes));
      }

      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 1. Fetch Profile
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (pError) throw pError;

      // 2. Fetch Sessions
      const { data: dbSessions, error: sError } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', id)
        .order('date', { ascending: false });

      const formattedSessions = (dbSessions || []).map(s => ({
        id: s.id,
        patientId: s.patient_id,
        date: s.date,
        duration: s.duration,
        type: s.type,
        summary: s.summary,
        recorded: s.recorded
      }));

      // 3. Fetch Exercises
      const { data: dbExercises, error: exError } = await supabase
        .from('exercises')
        .select('*')
        .eq('patient_id', id)
        .order('assigned_date', { ascending: false });

      const formattedExercises = (dbExercises || []).map(e => ({
        id: e.id,
        patientId: e.patient_id,
        name: e.name,
        nameHe: e.name_he,
        category: e.category,
        categoryColor: getCategoryColor(e.category),
        description: e.description,
        sets: e.sets,
        reps: e.reps,
        holdTime: e.hold_time,
        frequency: e.frequency,
        difficulty: e.difficulty,
        assignedDate: e.assigned_date,
        videoUrl: e.video_url,
        therapistNote: e.therapist_note
      }));

      // 4. Fetch Journals
      const { data: dbJournals, error: jError } = await supabase
        .from('journals')
        .select('*')
        .eq('patient_id', id)
        .order('date', { ascending: false });

      const formattedJournals = (dbJournals || []).map(j => {
        const entryDateStr = j.date ? new Date(j.date).toISOString().slice(0, 10) : '';
        
        // Local storage fallback for pilot testing on the same device
        const localCompleted = localStorage.getItem(`sportag_completed_exercises_${id}_${entryDateStr}`);
        const localNotes = localStorage.getItem(`sportag_exercise_notes_${id}_${entryDateStr}`);
        
        let hasCompleted = j.notes && (j.notes.includes('[מעקב תרגילים יומי]') || j.notes.includes('בוצע'));
        try {
          if (localCompleted) {
            const parsed = JSON.parse(localCompleted);
            hasCompleted = Object.values(parsed).some(v => v === true);
          }
        } catch(e){}

        return {
          id: j.id,
          date: j.date,
          painLevel: j.pain_level,
          mood: j.mood,
          energy: j.energy,
          sleep: j.sleep,
          activity: j.activity,
          notes: j.notes,
          exercisesCompleted: hasCompleted,
          walkingScore: j.walking_score,
          stairsScore: j.stairs_score,
          runningScore: j.running_score,
          stepsCount: j.steps_count,
          distanceKm: j.distance_km,
          deviceSynced: j.device_synced,
          deviceType: j.device_type,
          rom: j.rom,
          strength: j.strength,
          painLocation: j.pain_location || j.painLocation
        };
      });

      // 5. Fetch Media Uploads
      const { data: dbMedia, error: mError } = await supabase
        .from('media_uploads')
        .select('*')
        .eq('patient_id', id)
        .order('date', { ascending: false });

      const formattedMedia = (dbMedia || []).map(item => ({
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
      }));

      // 6. Fetch Therapist Notes
      let formattedNotes = [];
      try {
        const { data: dbNotes, error: nError } = await supabase
          .from('therapist_notes')
          .select('*')
          .eq('patient_id', id)
          .order('date', { ascending: false });

        if (nError) {
          console.warn('Could not fetch therapist notes:', nError);
        } else {
          formattedNotes = dbNotes || [];
        }
      } catch (noteErr) {
        console.warn('Error fetching therapist notes:', noteErr);
      }

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
        sessionsCount: formattedSessions.length,
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
          rom: j.rom || (profile.is_lower_limb ? 130 : 160),
          strength: j.strength || 4,
          walking: j.walkingScore || 7,
          stairs: j.stairsScore || 7,
          running: j.runningScore || 5
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
      setSessions(formattedSessions);
      setExercises(formattedExercises);
      setJournalHistory(formattedJournals);
      setPatientMedia(formattedMedia);
      setTherapistNotes(formattedNotes);
    } catch (err) {
      console.error('Error loading patient details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--color-primary-light)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
        <h3>טוען נתוני מטופל...</h3>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="empty-state">
        <h3>מטופל לא נמצא</h3>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/therapist/patients')}>
          חזרה לרשימה
        </button>
      </div>
    );
  }

  // --- Dynamic Progress & Goals Calculations ---
  const targets = patient.targets || {
    painLevel: { intermediate: 3, final: 0 },
    rom: { intermediate: 130, final: 140 },
    strength: { intermediate: 4, final: 5 }
  };
  const initialPain = patient.initialPainLevel || 8;
  const latestPainLocation = journalHistory && journalHistory.length > 0 ? journalHistory[0].painLocation : null;

  const latestMetric = patient.metricsHistory && patient.metricsHistory.length > 0
    ? patient.metricsHistory[patient.metricsHistory.length - 1]
    : null;
  const firstMetric = patient.metricsHistory && patient.metricsHistory.length > 0
    ? patient.metricsHistory[0]
    : null;

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

  const currentRom = latestMetric?.rom || 120;
  const initRom = firstMetric?.rom || 110;
  const romTarget = targets.rom?.intermediate ?? 130;

  activeMetrics.push({
    name: 'טווח תנועה (ROM)',
    current: currentRom,
    initial: initRom,
    target: romTarget,
    progress: calcMetricProgress(currentRom, initRom, romTarget),
    key: 'rom'
  });

  const currentStr = latestMetric?.strength || 3;
  const initStr = firstMetric?.strength || 3;
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
    const currentWalk = latestMetric?.walking || 5;
    const initWalk = firstMetric?.walking || 5;
    const walkTarget = targets.walking?.intermediate ?? 8;
    activeMetrics.push({
      name: 'הליכה',
      current: currentWalk,
      initial: initWalk,
      target: walkTarget,
      progress: calcMetricProgress(currentWalk, initWalk, walkTarget),
      key: 'walking'
    });

    const currentStairs = latestMetric?.stairs || 4;
    const initStairs = firstMetric?.stairs || 4;
    const stairsTarget = targets.stairs?.intermediate ?? 8;
    activeMetrics.push({
      name: 'מדרגות',
      current: currentStairs,
      initial: initStairs,
      target: stairsTarget,
      progress: calcMetricProgress(currentStairs, initStairs, stairsTarget),
      key: 'stairs'
    });

    const currentRun = latestMetric?.running || 2;
    const initRun = firstMetric?.running || 2;
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

  // Compliance (Exercises Completed)
  const complianceDays = journalHistory.filter(e => e.exercisesCompleted).length;
  const totalJournalDays = journalHistory.length;
  const complianceScore = totalJournalDays > 0 ? Math.round((complianceDays / totalJournalDays) * 100) : 0;

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

  // Pain trend data
  const painData = journalHistory.slice(0, 14).reverse().map(entry => ({
    date: entry.date.slice(5),
    pain: entry.painLevel,
    energy: entry.energy,
  }));

  // Clinical & Functional Metrics Data
  const metricsData = patient.metricsHistory?.map(m => ({
    date: new Date(m.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }),
    rom: m.rom,
    strength: m.strength,
    walking: m.walking,
    stairs: m.stairs,
    running: m.running,
  })) || [];

  // Wearable Device Synced Data
  const syncedEntries = journalHistory.filter(e => e.deviceSynced);
  const avgSteps = syncedEntries.length ? Math.round(syncedEntries.reduce((acc, e) => acc + (e.stepsCount || 0), 0) / syncedEntries.length) : 0;
  const avgDistance = syncedEntries.length ? (syncedEntries.reduce((acc, e) => acc + (e.distanceKm || 0), 0) / syncedEntries.length).toFixed(1) : 0;
  const deviceType = syncedEntries.find(e => e.deviceType)?.deviceType === 'garmin' ? 'Garmin Fenix 7' : 'Apple Watch / iPhone';

  // Helper to parse exercise checklist and notes from the journal notes text
  const parseExerciseLogsFromNotes = (notesText) => {
    const logs = { completed: {}, notes: {} };
    if (!notesText) return logs;
    
    const marker = '[מעקב תרגילים יומי]:';
    const markerIdx = notesText.indexOf(marker);
    if (markerIdx === -1) return logs;
    
    const logsPart = notesText.substring(markerIdx + marker.length).trim();
    const lines = logsPart.split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('•')) {
        const cleanLine = line.substring(1).trim();
        
        let noteContent = '';
        const noteMatch = cleanLine.match(/\(הערה:\s*(.*?)\)/);
        if (noteMatch) {
          noteContent = noteMatch[1].trim();
        }
        
        const statusIdx = cleanLine.indexOf(':');
        if (statusIdx !== -1) {
          const namePart = cleanLine.substring(0, statusIdx).trim();
          const restPart = cleanLine.substring(statusIdx + 1).trim();
          const isCompleted = restPart.includes('בוצע') && !restPart.includes('לא בוצע');
          
          const matchedEx = exercises.find(e => 
            e.nameHe === namePart || e.name_he === namePart || e.name === namePart
          );
          
          if (matchedEx) {
            logs.completed[matchedEx.id] = isCompleted;
            if (noteContent) {
              logs.notes[matchedEx.id] = noteContent;
            }
          }
        }
      }
    });
    return logs;
  };

  const dbTodayStr = new Date().toISOString().slice(0, 10);
  const todayJournal = journalHistory.find(j => j.date && j.date.slice(0, 10) === dbTodayStr);
  const dbLogs = todayJournal ? parseExerciseLogsFromNotes(todayJournal.notes) : { completed: {}, notes: {} };

  const tabs = [
    { id: 'overview', label: 'סקירה', icon: Activity },
    { id: 'sessions', label: 'טיפולים', icon: FileText },
    { id: 'exercises', label: 'תרגילים', icon: Dumbbell },
    { id: 'journal', label: 'מעקב יומי', icon: TrendingUp },
    { id: 'media', label: 'מדיה', icon: Camera },
    { id: 'targets', label: 'הגדרת יעדים', icon: Target }
  ];

  const handleTabChange = (tabId) => {
    if (tabId === 'targets') {
      setEditedTargets(JSON.parse(JSON.stringify(targets)));
      setEditedInitialPain(initialPain);
      setEditedTargetDate(targets.targetDate || '2026-06-20');
      setEditedStrengthMuscle(targets.strength?.muscle || 'ארבע ראשי');
      setEditedFirstMetric(JSON.parse(JSON.stringify(firstMetric || {
        rom: 110,
        strength: 3,
        walking: 5,
        stairs: 4,
        running: 2
      })));
    }
    setActiveTab(tabId);
  };

  const handleSaveTargets = async (e) => {
    e.preventDefault();
    const updatedTargets = {
      ...editedTargets,
      targetDate: editedTargetDate,
      strength: { ...editedTargets.strength, muscle: editedStrengthMuscle }
    };

    if (isMockMode) {
      patient.targets = updatedTargets;
      patient.initialPainLevel = editedInitialPain;
      if (patient.metricsHistory && patient.metricsHistory.length > 0) {
        patient.metricsHistory[0] = {
          ...patient.metricsHistory[0],
          rom: Number(editedFirstMetric.rom),
          strength: Number(editedFirstMetric.strength),
          ...(patient.isLowerLimb ? {
            walking: Number(editedFirstMetric.walking),
            stairs: Number(editedFirstMetric.stairs),
            running: Number(editedFirstMetric.running),
          } : {})
        };
      }
      if (patient.painLevel > editedInitialPain) {
        patient.painLevel = editedInitialPain;
      }
      alert('היעדים עודכנו בהצלחה במערכת!');
      setActiveTab('overview');
    } else {
      try {
        const { error: pError } = await supabase
          .from('profiles')
          .update({
            targets: updatedTargets
          })
          .eq('id', id);

        if (pError) throw pError;

        if (journalHistory && journalHistory.length > 0) {
          const oldestJournal = journalHistory[journalHistory.length - 1];
          const { error: jError } = await supabase
            .from('journals')
            .update({
              pain_level: editedInitialPain,
              rom: Number(editedFirstMetric.rom),
              strength: Number(editedFirstMetric.strength),
              ...(patient.isLowerLimb ? {
                walking_score: Number(editedFirstMetric.walking),
                stairs_score: Number(editedFirstMetric.stairs),
                running_score: Number(editedFirstMetric.running),
              } : {})
            })
            .eq('id', oldestJournal.id);

          if (jError) throw jError;
        }

        alert('היעדים עודכנו בהצלחה במערכת!');
        await loadPatientData();
        setActiveTab('overview');
      } catch (err) {
        console.error('Error saving targets:', err);
        alert('שגיאה בעדכון היעדים: ' + err.message);
      }
    }
  };

  return (
    <div>
      {/* Back button */}
      <button
        className="btn btn-ghost btn-sm mb-4"
        onClick={() => navigate('/therapist/patients')}
      >
        <ArrowRight size={18} />
        חזרה לרשימה
      </button>

      {/* Patient Header */}
      <div className="glass-card mb-6 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="avatar avatar-xl" style={{ background: patient.avatarBg, fontSize: '2rem' }}>
            {patient.avatar}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{patient.name}</h1>
            <p className="text-secondary">{patient.conditionHe}</p>
            <p className="text-xs text-muted mt-1">{patient.condition}</p>
            <div className="text-xs text-secondary mt-2 flex flex-wrap gap-x-4 gap-y-1" style={{ opacity: 0.85 }}>
              <span>📧 {patient.email}</span>
              <span>📞 {patient.phone}</span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="badge" style={{ background: `${patient.areaColor}20`, color: patient.areaColor }}>
                {patient.area}
              </span>
              <span className="badge badge-primary">{patient.sport}</span>
              <span className="badge badge-success">VAS: {patient.painLevel}/10</span>
            </div>
          </div>
        </div>

        {/* Dynamic Target Progress Track */}
        <div className="mt-4 border-t pt-4 border-color">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-secondary font-medium">התקדמות ליעד ({targets.targetDate ? `יעד ל-${new Date(targets.targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric', year: 'numeric'})}` : 'פגישה הבאה'})</span>
              <span className="font-bold" style={{ color: '#06B6D4' }}>{avgProgress}%</span>
            </div>
            <div className="progress-bar" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${avgProgress}%`, background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-teal) 100%)' }} />
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid-3 mt-4 pt-4 border-t border-color" style={{ gap: 'var(--space-3)' }}>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-primary-light)' }}>
              {patient.sessionsCount}
            </div>
            <div className="text-xs text-secondary">טיפולים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-teal-light)' }}>
              {patient.age}
            </div>
            <div className="text-xs text-secondary">גיל</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-accent-light)' }}>
              {Math.max(1, Math.round((new Date() - new Date(patient.startDate)) / (1000 * 60 * 60 * 24 * 7)))}
            </div>
            <div className="text-xs text-secondary">שבועות טיפול</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <tab.icon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          {/* Dynamic Progress Cards */}
          <div className="grid-2 mb-6 animate-fade-in-up" style={{ gap: 'var(--space-4)' }}>
            <div className="card text-center" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
              <div className="text-sm font-semibold text-secondary mb-2">התמדה בתרגול (Compliance)</div>
              <div className="text-3xl font-extrabold" style={{ color: '#10B981' }}>{complianceScore}%</div>
              <div className="text-xs text-muted mt-2">ביצוע תוכנית תרגילים ביתית</div>
            </div>
            <div className="card text-center" style={{ border: '1px solid rgba(6, 182, 212, 0.2)', background: 'rgba(6, 182, 212, 0.02)' }}>
              <div className="text-sm font-semibold text-secondary mb-2">יעד ({targets.targetDate ? `עד ל-${new Date(targets.targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric', year: 'numeric'})}` : 'פגישה הבאה'})</div>
              <div className="text-3xl font-extrabold" style={{ color: '#06B6D4' }}>{avgProgress}%</div>
              <div className="text-xs text-muted mt-2">מטרות השיקום כפי שהוגדרו על ידי המטפל</div>
            </div>
          </div>

          {/* Clinical Metrics Comparison Table */}
          <div className="card mb-6 animate-fade-in-up stagger-1">
            <h3 className="section-title">השוואת מדדים קליניים מול יעדים מוגדרים</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: 'var(--space-2) var(--space-3)' }}>מדד קליני</th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)' }}>ערך בסיס</th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)' }}>ערך נוכחי</th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)' }}>
                      יעד ({targets.targetDate ? `עד ל-${new Date(targets.targetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric', year: 'numeric'})}` : 'פגישה הבאה'})
                    </th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)' }}>סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMetrics.map((m, idx) => {
                    const status = getStatus(m);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{m.name}</td>
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
                </tbody>
              </table>
            </div>
          </div>

          {/* Pain Trend & Pain Location Visualizer */}
          <div className="grid-2 mb-4 animate-fade-in-up stagger-2" style={{ gap: 'var(--space-4)' }}>
            {/* Pain Chart */}
            <div className="card">
              <h3 className="section-title">מגמת כאב (14 ימים)</h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <AreaChart data={painData}>
                    <defs>
                      <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E22279" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E22279" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
                    <YAxis domain={[0, 10]} stroke="var(--text-tertiary)" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                        direction: 'rtl',
                      }}
                    />
                    <Area type="monotone" dataKey="pain" stroke="#E22279" fill="url(#painGrad)" strokeWidth={2} name="דרגת כאב" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Pain Location Visualizer */}
            {latestPainLocation ? (
              <PainVisualizer painLocation={latestPainLocation} />
            ) : (
              <div className="card text-center flex flex-col items-center justify-center p-6" style={{ minHeight: 250 }}>
                <div className="text-xs font-semibold text-secondary mb-2">מיקום כאב ממוקד</div>
                <div className="text-sm text-muted">לא דווח מיקום כאב ממוקד בימים האחרונים</div>
              </div>
            )}
          </div>

          {/* Clinical Metrics Graphs */}
          {metricsData.length > 0 && (
            <div className="grid-2 mb-4 animate-fade-in-up stagger-2">
              {/* ROM Chart */}
              <div className="card">
                <h3 className="section-title text-sm" style={{ color: '#06B6D4' }}>טווח תנועה (ROM)</h3>
                <div style={{ width: '100%', height: 160 }}>
                  <ResponsiveContainer>
                    <LineChart data={metricsData}>
                      <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                      <YAxis domain={['auto', 'auto']} stroke="var(--text-tertiary)" fontSize={10} unit="°" />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                          borderRadius: 8, color: 'var(--text-primary)', direction: 'rtl',
                        }}
                      />
                      <Line type="monotone" dataKey="rom" stroke="#06B6D4" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="ROM" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Muscle Strength Chart */}
              <div className="card">
                <h3 className="section-title text-sm" style={{ color: '#8B5CF6' }}>כוח שריר (MRC)</h3>
                <div style={{ width: '100%', height: 160 }}>
                  <ResponsiveContainer>
                    <LineChart data={metricsData}>
                      <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                      <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke="var(--text-tertiary)" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                          borderRadius: 8, color: 'var(--text-primary)', direction: 'rtl',
                        }}
                      />
                      <Line type="monotone" dataKey="strength" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="כוח שריר" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Lower Limb Functional Progress Chart */}
          {patient.isLowerLimb && metricsData.length > 0 && (
            <div className="card mb-4 animate-fade-in-up stagger-2">
              <h3 className="section-title" style={{ color: '#10B981' }}>מדדי תפקוד גפה תחתונה (0-10)</h3>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <LineChart data={metricsData}>
                    <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
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

          {/* Garmin / Wearable Sync Card */}
          {avgSteps > 0 && (
            <div className="card mb-4 animate-fade-in-up stagger-2" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.03)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title mb-0 flex items-center gap-2" style={{ color: '#F59E0B' }}>
                  <span>⌚ נתוני שעון מסונכרנים ({deviceType})</span>
                </h3>
                <span className="badge badge-success text-xs">✓ מחובר</span>
              </div>
              <div className="grid-2 text-center" style={{ gap: 'var(--space-2)' }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                  <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {avgSteps.toLocaleString()}
                  </div>
                  <div className="text-xs text-secondary">ממוצע צעדים יומי</div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                  <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {avgDistance} ק״מ
                  </div>
                  <div className="text-xs text-secondary">ממוצע מרחק ריצה שבועי</div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="card animate-fade-in-up stagger-2" style={{ direction: 'rtl' }}>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="section-title mb-0" style={{ fontSize: '1.15rem' }}>📋 תיעוד והערות מעקב קליני</h3>
              <button 
                type="button" 
                className="btn btn-primary btn-sm flex items-center gap-1"
                onClick={() => {
                  setEditingNoteId(null);
                  setNoteContent('');
                  setNoteDate(new Date().toISOString().slice(0, 10));
                  setShowAddNoteModal(true);
                }}
              >
                <span>➕</span> הוסף הערה
              </button>
            </div>

            {therapistNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6) 0', color: 'var(--text-tertiary)' }}>
                <p className="text-sm">אין עדיין הערות מעקב קליני מתועדות למטופל זה.</p>
                <p className="text-xs mt-1">לחץ על הכפתור למעלה כדי לרשום הערה ראשונה.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4" style={{ maxHeight: '400px', overflowY: 'auto', paddingLeft: 'var(--space-2)' }}>
                {therapistNotes.map((note, idx) => (
                  <div 
                    key={note.id || idx} 
                    style={{ 
                      borderBottom: idx < therapistNotes.length - 1 ? '1px solid var(--border-color)' : 'none',
                      paddingBottom: idx < therapistNotes.length - 1 ? 'var(--space-3)' : '0',
                      paddingTop: idx > 0 ? 'var(--space-1)' : '0',
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} style={{ color: 'var(--color-primary-light)' }} />
                        <span className="font-semibold text-xs text-primary" style={{ color: 'var(--text-primary)' }}>
                          {new Date(note.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn-icon"
                          title="ערוך הערה"
                          onClick={() => handleEditNoteClick(note)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="מחק הערה"
                          onClick={() => handleDeleteNote(note.id)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: '0' }}>
                      {note.notes}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="section-title mb-0">סיכומי טיפול וביקורים</h3>
            <div className="flex gap-2">
              <button 
                type="button"
                className="btn btn-accent btn-sm"
                onClick={() => navigate('/therapist/record')}
              >
                🎙️ הקלט טיפול (AI)
              </button>
              <button 
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddSessionModal(true)}
              >
                ➕ רשום טיפול ידני
              </button>
            </div>
          </div>
          {sessions.length > 0 ? sessions.map((session, i) => (
            <div key={session.id} className="card mb-4" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} style={{ color: 'var(--color-primary-light)' }} />
                  <span className="font-semibold text-sm">
                    {new Date(session.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-xs text-secondary">{session.duration} דקות</span>
                  <span className="badge badge-primary">{session.type}</span>
                </div>
              </div>
              <pre className="session-summary">{session.summary}</pre>
            </div>
          )) : (
            <div className="empty-state">
              <FileText size={48} />
              <h3 className="mt-4">אין סיכומי טיפולים</h3>
              <p className="text-secondary mt-2">הקלט או רשום טיפול חדש כדי להתחיל לתעד את הפיילוט.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="section-title mb-0">תוכנית תרגילים ששוייכה למטופל</h3>
            <button 
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddExerciseModal(true)}
            >
              ➕ שייך תרגיל חדש
            </button>
          </div>
          {exercises.length > 0 ? (
            <div className="flex flex-col gap-3">
              {exercises.map(ex => {
                // Read from localStorage to check if completed today or has notes (fallback for single-device testing)
                const todayStr = new Date().toISOString().slice(0, 10);
                const completedData = localStorage.getItem(`sportag_completed_exercises_${id}_${todayStr}`);
                const notesData = localStorage.getItem(`sportag_exercise_notes_${id}_${todayStr}`);
                
                let isCompleted = dbLogs.completed[ex.id] || false;
                let note = dbLogs.notes[ex.id] || '';
                try {
                  if (completedData) {
                    const localCompleted = JSON.parse(completedData)[ex.id];
                    if (localCompleted !== undefined) isCompleted = localCompleted === true;
                  }
                  if (notesData) {
                    const localNote = JSON.parse(notesData)[ex.id];
                    if (localNote) note = localNote;
                  }
                } catch(e){}

                return (
                  <div key={ex.id} className="relative flex flex-col gap-2">
                    <ExerciseCard 
                      exercise={ex} 
                      completed={isCompleted} 
                      customUploads={patientMedia}
                    />
                    {note && (
                      <div 
                        className="text-xs p-3 rounded-xl animate-fade-in" 
                        style={{ 
                          background: 'rgba(16, 185, 129, 0.08)', 
                          border: '1px solid rgba(16, 185, 129, 0.2)', 
                          color: 'var(--text-primary)',
                          marginTop: '-6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>📝</span>
                        <div>
                          <strong>הערת מטופל מהיום:</strong> {note}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Dumbbell size={48} />
              <h3 className="mt-4">אין תרגילים ששוייכו</h3>
              <p className="text-secondary mt-2">לחץ על הכפתור למעלה כדי לשייך תרגיל חדש.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'journal' && (
        <div className="animate-fade-in">
          {journalHistory.slice(0, 7).map((entry, i) => (
            <div key={entry.date} className="card card-compact mb-3" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">
                  {new Date(entry.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <div className="flex gap-2">
                  <span className="badge" style={{
                    background: entry.painLevel <= 3 ? 'rgba(16,185,129,0.2)' : entry.painLevel <= 6 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                    color: entry.painLevel <= 3 ? '#10B981' : entry.painLevel <= 6 ? '#F59E0B' : '#EF4444',
                  }}>
                    VAS: {entry.painLevel}
                  </span>
                  {entry.exercisesCompleted && (
                    <span className="badge badge-success">✓ תרגילים</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-secondary mt-2">
                <strong>פעילות:</strong> {entry.activity}
              </div>
              <div className="text-xs text-secondary mt-1">
                <strong>מיקום כאב:</strong> {PAIN_LOCATION_MAP[entry.painLocation] || 'לא דווח'}
              </div>
              {entry.notes && (
                <div className="text-xs text-muted mt-1">{entry.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'media' && (
        <div className="animate-fade-in">
          {patientMedia && patientMedia.length > 0 ? (
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                gap: 'var(--space-4)',
                direction: 'rtl'
              }}
            >
              {patientMedia.map((file) => (
                <div
                  key={file.id}
                  className="card card-compact card-hover"
                  onClick={() => setActiveMedia(file)}
                  style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    overflow: 'hidden',
                    height: '220px',
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
                  </div>

                  {/* Info details */}
                  <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{file.title || file.name}</div>
                      {file.note && (
                        <div className="text-secondary truncate mt-1" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MessageSquare size={10} style={{ flexShrink: 0 }} />
                          <span className="truncate">{file.note}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-muted text-right" style={{ fontSize: '10px', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      {new Date(file.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-8">
              <Camera size={48} />
              <p className="text-sm text-secondary mt-4">המטופל לא העלה קבצי מדיה עדיין</p>
            </div>
          )}
        </div>
      )}

      {/* Goal Settings Tab */}
      {activeTab === 'targets' && editedTargets && (
        <form onSubmit={handleSaveTargets} className="card animate-fade-in flex flex-col gap-6">
          <h3 className="section-title flex items-center gap-2" style={{ color: 'var(--color-primary-light)' }}>
            <Sliders size={20} />
            <span>עריכת מדדי בסיס ויעדים קליניים</span>
          </h3>

          <div className="input-group mb-4 mt-3">
            <label className="input-label">תאריך יעד להשגת יעדי הביניים</label>
            <input type="date" className="input" value={editedTargetDate || ''} onChange={e => setEditedTargetDate(e.target.value)} />
          </div>

          {/* Pain Level VAS */}
          <div className="p-4 rounded-lg border border-color" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-accent-light)' }}>רמת כאב (VAS 0-10)</h4>
            <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
              <div className="input-group">
                <label className="input-label">כאב התחלתי ({editedInitialPain})</label>
                <input type="range" min="0" max="10" step="1" className="w-full" value={editedInitialPain} onChange={e => setEditedInitialPain(Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label className="input-label">יעד כאב ({editedTargets.painLevel?.intermediate}) {editedTargetDate ? `עד ל-${new Date(editedTargetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                <input type="range" min="0" max="10" step="1" className="w-full" value={editedTargets.painLevel?.intermediate ?? 3} 
                  onChange={e => setEditedTargets({
                    ...editedTargets,
                    painLevel: { ...editedTargets.painLevel, intermediate: Number(e.target.value), final: Number(e.target.value) }
                  })} />
              </div>
            </div>
          </div>

          {/* ROM */}
          <div className="p-4 rounded-lg border border-color" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <h4 className="text-sm font-semibold mb-3 text-teal-light" style={{ color: 'var(--color-teal-light)' }}>טווח תנועה (ROM מעלות)</h4>
            <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
              <div className="input-group">
                <label className="input-label">ROM התחלתי (מעלות)</label>
                <input type="number" className="input" value={editedFirstMetric.rom || 110} 
                  onChange={e => setEditedFirstMetric({
                    ...editedFirstMetric,
                    rom: Number(e.target.value)
                  })} />
              </div>
              <div className="input-group">
                <label className="input-label">יעד ROM (מעלות) {editedTargetDate ? `עד ל-${new Date(editedTargetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                <input type="number" className="input" value={editedTargets.rom?.intermediate ?? 130} 
                  onChange={e => setEditedTargets({
                    ...editedTargets,
                    rom: { ...editedTargets.rom, intermediate: Number(e.target.value), final: Number(e.target.value) }
                  })} />
              </div>
            </div>
          </div>

          {/* Muscle Strength MRC */}
          <div className="p-4 rounded-lg border border-color" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#8B5CF6' }}>כוח שריר (MRC 0-5)</h4>
            
            <div className="input-group mb-4">
              <label className="input-label">שריר מטרה (למשל: ארבע ראשי, מסובבי כתף)</label>
              <input type="text" className="input" value={editedStrengthMuscle || ''} onChange={e => setEditedStrengthMuscle(e.target.value)} placeholder="שם השריר הנבדק..." />
            </div>

            <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
              <div className="input-group">
                <label className="input-label">כוח התחלתי ({editedFirstMetric.strength || 3})</label>
                <input type="range" min="0" max="5" step="0.5" className="w-full" value={editedFirstMetric.strength || 3} 
                  onChange={e => setEditedFirstMetric({
                    ...editedFirstMetric,
                    strength: Number(e.target.value)
                  })} />
              </div>
              <div className="input-group">
                <label className="input-label">יעד כוח ({editedTargets.strength?.intermediate}) {editedTargetDate ? `עד ל-${new Date(editedTargetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                <input type="range" min="0" max="5" step="0.5" className="w-full" value={editedTargets.strength?.intermediate ?? 4} 
                  onChange={e => setEditedTargets({
                    ...editedTargets,
                    strength: { ...editedTargets.strength, intermediate: Number(e.target.value), final: Number(e.target.value) }
                  })} />
              </div>
            </div>
          </div>

          {/* Lower Limb Functional Metrics */}
          {patient.isLowerLimb && (
            <div className="p-4 rounded-lg border border-success border-opacity-20" style={{ background: 'rgba(16, 185, 129, 0.02)' }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-success-light)' }}>מדדי תפקוד גפה תחתונה (0-10)</h4>

              {/* Walking */}
              <div className="mb-4">
                <h5 className="text-xs font-semibold mb-2 text-secondary">יכולת הליכה</h5>
                <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                  <div className="input-group">
                    <label className="input-label">הליכה התחלתית ({editedFirstMetric.walking || 5})</label>
                    <input type="range" min="0" max="10" step="1" className="w-full" value={editedFirstMetric.walking || 5} 
                      onChange={e => setEditedFirstMetric({
                        ...editedFirstMetric,
                        walking: Number(e.target.value)
                      })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">יעד הליכה ({editedTargets.walking?.intermediate}) {editedTargetDate ? `עד ל-${new Date(editedTargetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                    <input type="range" min="0" max="10" step="1" className="w-full" value={editedTargets.walking?.intermediate ?? 8} 
                      onChange={e => setEditedTargets({
                        ...editedTargets,
                        walking: { ...editedTargets.walking, intermediate: Number(e.target.value), final: Number(e.target.value) }
                      })} />
                  </div>
                </div>
              </div>

              {/* Stairs */}
              <div className="mb-4">
                <h5 className="text-xs font-semibold mb-2 text-secondary">עליית/ירידת מדרגות</h5>
                <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                  <div className="input-group">
                    <label className="input-label">מדרגות התחלתי ({editedFirstMetric.stairs || 4})</label>
                    <input type="range" min="0" max="10" step="1" className="w-full" value={editedFirstMetric.stairs || 4} 
                      onChange={e => setEditedFirstMetric({
                        ...editedFirstMetric,
                        stairs: Number(e.target.value)
                      })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">יעד מדרגות ({editedTargets.stairs?.intermediate}) {editedTargetDate ? `עד ל-${new Date(editedTargetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                    <input type="range" min="0" max="10" step="1" className="w-full" value={editedTargets.stairs?.intermediate ?? 8} 
                      onChange={e => setEditedTargets({
                        ...editedTargets,
                        stairs: { ...editedTargets.stairs, intermediate: Number(e.target.value), final: Number(e.target.value) }
                      })} />
                  </div>
                </div>
              </div>

              {/* Running */}
              <div>
                <h5 className="text-xs font-semibold mb-2 text-secondary">יכולת ריצה</h5>
                <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                  <div className="input-group">
                    <label className="input-label">ריצה התחלתית ({editedFirstMetric.running || 2})</label>
                    <input type="range" min="0" max="10" step="1" className="w-full" value={editedFirstMetric.running || 2} 
                      onChange={e => setEditedFirstMetric({
                        ...editedFirstMetric,
                        running: Number(e.target.value)
                      })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">יעד ריצה ({editedTargets.running?.intermediate}) {editedTargetDate ? `עד ל-${new Date(editedTargetDate).toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}` : ''}</label>
                    <input type="range" min="0" max="10" step="1" className="w-full" value={editedTargets.running?.intermediate ?? 5} 
                      onChange={e => setEditedTargets({
                        ...editedTargets,
                        running: { ...editedTargets.running, intermediate: Number(e.target.value), final: Number(e.target.value) }
                      })} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('overview')}>
              ביטול
            </button>
            <button type="submit" className="btn btn-primary">
              שמור שינויים
            </button>
          </div>
        </form>
      )}

      {/* Media Viewer Lightbox Modal for Therapist */}
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
              <div>
                <h3 className="font-bold text-sm text-primary truncate" style={{ maxWidth: '400px' }}>
                  {activeMedia.title || activeMedia.name}
                </h3>
                <span className="text-xs text-muted">
                  {new Date(activeMedia.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <button 
                className="btn btn-icon btn-ghost" 
                onClick={() => setActiveMedia(null)}
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
            {activeMedia.note && (
              <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-4)' }}>
                <div className="flex gap-2 items-start">
                  <MessageSquare size={16} style={{ color: 'var(--color-primary-light)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div className="text-xs text-muted font-bold mb-1">הערת המטופל:</div>
                    <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>{activeMedia.note}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Assign Exercise Modal */}
      {showAddExerciseModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            direction: 'rtl'
          }}
          onClick={() => setShowAddExerciseModal(false)}
        >
          <div 
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-color pb-3">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <Dumbbell size={20} style={{ color: 'var(--color-primary-light)' }} />
                שיוך תרגיל חדש למטופל
              </h3>
              <button 
                type="button"
                className="btn btn-icon btn-ghost" 
                onClick={() => setShowAddExerciseModal(false)}
                style={{ width: 32, height: 32 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExercise} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label text-xs font-semibold">שם התרגיל (עברית) *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={exNameHe} 
                  onChange={e => setExNameHe(e.target.value)} 
                  placeholder="למשל: סקוואט כנגד קיר" 
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label text-xs font-semibold">שם התרגיל (אנגלית / רפואי)</label>
                <input 
                  type="text" 
                  className="input" 
                  value={exNameEn} 
                  onChange={e => setExNameEn(e.target.value)} 
                  placeholder="למשל: Wall squat" 
                />
              </div>

              <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label text-xs font-semibold">קטגוריית גוף</label>
                  <select 
                    className="input" 
                    value={exCategory} 
                    onChange={e => setExCategory(e.target.value)}
                  >
                    <option value="knee">🦵 ברך</option>
                    <option value="shoulder">💪 כתף</option>
                    <option value="back">🔙 גב</option>
                    <option value="neck">🧣 צוואר</option>
                    <option value="hip">🦴 ירך</option>
                    <option value="ankle">🦶 קרסול</option>
                    <option value="general">🏃 כללי</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label text-xs font-semibold">דרגת קושי</label>
                  <select 
                    className="input" 
                    value={exDifficulty} 
                    onChange={e => setExDifficulty(e.target.value)}
                  >
                    <option value="קל">קל</option>
                    <option value="בינוני">בינוני</option>
                    <option value="קשה">קשה</option>
                  </select>
                </div>
              </div>

              <div className="grid-3" style={{ gap: 'var(--space-2)' }}>
                <div className="input-group">
                  <label className="input-label text-xs font-semibold">סטים</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="input" 
                    value={exSets} 
                    onChange={e => setExSets(Number(e.target.value))} 
                  />
                </div>

                <div className="input-group">
                  <label className="input-label text-xs font-semibold">חזרות</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="input" 
                    value={exReps} 
                    onChange={e => setExReps(Number(e.target.value))} 
                  />
                </div>

                <div className="input-group">
                  <label className="input-label text-xs font-semibold">החזקה (שניות)</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="input" 
                    value={exHoldTime} 
                    onChange={e => setExHoldTime(e.target.value)} 
                    placeholder="ללא"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label text-xs font-semibold">תדירות ביצוע</label>
                <input 
                  type="text" 
                  className="input" 
                  value={exFrequency} 
                  onChange={e => setExFrequency(e.target.value)} 
                  placeholder="למשל: פעם ביום, 3 פעמים בשבוע" 
                />
              </div>

              <div className="input-group">
                <label className="input-label text-xs font-semibold">הנחיות לביצוע ודגשים קליניים</label>
                <textarea 
                  className="input" 
                  rows="3" 
                  value={exDescription} 
                  onChange={e => setExDescription(e.target.value)} 
                  placeholder="למשל: לשמור על ברכיים מקבילות, לרדת ל-90 מעלות ולהחזיק..."
                />
              </div>

              <div className="input-group">
                <label className="input-label text-xs font-semibold">צרף סרטון הדגמה (וידאו)</label>
                <input 
                  type="file" 
                  accept="video/*" 
                  className="input" 
                  onChange={e => setExVideoFile(e.target.files[0])} 
                />
                {exVideoFile && (
                  <span className="text-xs text-success-light mt-1">
                    ✓ קובץ נבחר: {exVideoFile.name}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-color pt-3">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowAddExerciseModal(false)}
                  disabled={savingExercise}
                >
                  ביטול
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={savingExercise}
                >
                  {savingExercise ? (exUploadProgress > 0 ? `מעלה וידאו: ${exUploadProgress}%` : 'שומר...') : 'שייך תרגיל'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Session Modal */}
      {showAddSessionModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            direction: 'rtl'
          }}
          onClick={() => setShowAddSessionModal(false)}
        >
          <div 
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-color pb-3">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <FileText size={20} style={{ color: 'var(--color-primary-light)' }} />
                רישום טיפול ידני
              </h3>
              <button 
                type="button"
                className="btn btn-icon btn-ghost" 
                onClick={() => setShowAddSessionModal(false)}
                style={{ width: 32, height: 32 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSession} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label text-xs font-semibold">תאריך ושעה *</label>
                <input 
                  type="datetime-local" 
                  className="input" 
                  value={sessDate} 
                  onChange={e => setSessDate(e.target.value)} 
                  required 
                />
              </div>

              <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
                <div className="input-group">
                  <label className="input-label text-xs font-semibold">משך הטיפול (דקות)</label>
                  <input 
                    type="number" 
                    min="5" 
                    className="input" 
                    value={sessDuration} 
                    onChange={e => setSessDuration(Number(e.target.value))} 
                    required 
                  />
                </div>

                <div className="input-group">
                  <label className="input-label text-xs font-semibold">סוג הטיפול</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={sessType} 
                    onChange={e => setSessType(e.target.value)} 
                    placeholder="למשל: פיזיותרפיה, שיקום, שיקום ספורט" 
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label text-xs font-semibold">סיכום טיפול והנחיות המשך *</label>
                <textarea 
                  className="input" 
                  rows="6" 
                  value={sessSummary} 
                  onChange={e => setSessSummary(e.target.value)} 
                  placeholder="כתוב כאן את סיכום המפגש הקליני, המדדים שנמדדו, והנחיות לתרגול בבית..."
                  required 
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-color pt-3">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowAddSessionModal(false)}
                  disabled={savingSession}
                >
                  ביטול
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={savingSession}
                >
                  {savingSession ? 'רושם טיפול...' : 'רשום טיפול'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Therapist Note Modal */}
      {showAddNoteModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            direction: 'rtl'
          }}
          onClick={() => {
            setShowAddNoteModal(false);
            setEditingNoteId(null);
            setNoteContent('');
            setNoteDate(new Date().toISOString().slice(0, 10));
          }}
        >
          <div 
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-color pb-3">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <FileText size={20} style={{ color: 'var(--color-primary-light)' }} />
                {editingNoteId ? 'עריכת הערת מעקב קליני' : 'הוספת הערת מעקב קליני'}
              </h3>
              <button 
                type="button"
                className="btn btn-icon btn-ghost" 
                onClick={() => {
                  setShowAddNoteModal(false);
                  setEditingNoteId(null);
                  setNoteContent('');
                  setNoteDate(new Date().toISOString().slice(0, 10));
                }}
                style={{ width: 32, height: 32 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label text-xs font-semibold">תאריך *</label>
                <input 
                  type="date" 
                  className="input" 
                  value={noteDate}
                  onChange={e => setNoteDate(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label text-xs font-semibold">תוכן ההערה / מעקב *</label>
                <textarea 
                  className="input" 
                  rows="6" 
                  value={noteContent} 
                  onChange={e => setNoteContent(e.target.value)} 
                  placeholder="כתוב כאן ממצאים מהטיפול האחרון, הערות מעקב קליני, תצפיות או עדכונים קליניים..."
                  required 
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-color pt-3">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => {
                    setShowAddNoteModal(false);
                    setEditingNoteId(null);
                    setNoteContent('');
                    setNoteDate(new Date().toISOString().slice(0, 10));
                  }}
                  disabled={savingNote}
                >
                  ביטול
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={savingNote}
                >
                  {savingNote ? 'שומר...' : (editingNoteId ? 'עדכן הערה' : 'שמור הערה')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

