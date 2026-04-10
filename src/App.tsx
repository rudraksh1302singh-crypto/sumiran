import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  Settings, 
  BookOpen, 
  Fingerprint, 
  History as HistoryIcon, 
  User as UserIcon, 
  CheckCircle2, 
  Flower2, 
  Sparkles, 
  Waves, 
  Plus, 
  ArrowRight, 
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Mail,
  Lock,
  LogOut,
  Vibrate,
  Eye,
  Bell,
  RefreshCw,
  Volume2,
  LogIn,
  MessageSquare,
  Compass,
  Send,
  Music,
  Palette,
  Zap,
  Activity,
  Wind,
  Mountain,
  TreePine,
  Church,
  Mic,
  Square,
  Play,
  Trophy,
  BarChart3,
  Users,
  VolumeX,
  Volume1,
  Info,
  HelpCircle,
  Lightbulb,
  Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tab, Mantra, Session, UserStats, Theme, ThemeId, Milestone, Soundscape, DifficultyLevel } from './types';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, query, orderBy, serverTimestamp, addDoc, limit } from 'firebase/firestore';
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const THEMES: Theme[] = [
  {
    id: 'himalayan',
    name: 'Himalayan Dawn',
    colors: { primary: '#6366f1', surface: '#f8fafc', onSurface: '#0f172a', accent: '#818cf8' },
    bgImage: 'https://picsum.photos/seed/himalayas/1920/1080?blur=10'
  },
  {
    id: 'temple',
    name: 'Ancient Temple',
    colors: { primary: '#92400e', surface: '#fffbeb', onSurface: '#451a03', accent: '#d97706' },
    bgImage: 'https://picsum.photos/seed/temple_interior/1920/1080?blur=10'
  },
  {
    id: 'forest',
    name: 'Forest Stillness',
    colors: { primary: '#166534', surface: '#f0fdf4', onSurface: '#064e3b', accent: '#22c55e' },
    bgImage: 'https://picsum.photos/seed/forest_mist/1920/1080?blur=10'
  },
  {
    id: 'void',
    name: 'Deep Void',
    colors: { primary: '#e2e8f0', surface: '#020617', onSurface: '#f8fafc', accent: '#94a3b8' },
    bgImage: 'https://picsum.photos/seed/stardust/1920/1080?blur=10'
  },
  {
    id: 'candlelight',
    name: 'Candlelight Vigil',
    colors: { primary: '#f59e0b', surface: '#0c0a09', onSurface: '#fef3c7', accent: '#ea580c' },
    bgImage: 'https://picsum.photos/seed/candle/1920/1080?blur=20'
  }
];

const MILESTONES: Milestone[] = [
  { id: 'm1', title: 'First Steps', description: 'Complete your first Mala (108 chants).', icon: 'Zap', target: 108, type: 'total_chants' },
  { id: 'm2', title: 'Steady Seeker', description: 'Maintain a 3-day chanting streak.', icon: 'Activity', target: 3, type: 'streak' },
  { id: 'm3', title: 'Sacred Century', description: 'Complete 100 Malas.', icon: 'Trophy', target: 100, type: 'malas' },
  { id: 'm4', title: 'Deep Devotion', description: 'Reach 10,000 total chants.', icon: 'Sparkles', target: 10000, type: 'total_chants' },
];

const SOUNDSCAPES: Soundscape[] = [
  { id: 'none', name: 'Silence', url: '', icon: 'VolumeX' },
  { id: 'ganges', name: 'Ganges Flow', url: 'https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3', icon: 'Waves' },
  { id: 'himalayan', name: 'Himalayan Wind', url: 'https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3', icon: 'Wind' },
  { id: 'temple', name: 'Temple Bells', url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', icon: 'Bell' },
];

// Auth Context
const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
    });
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

// Error Boundary
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      setHasError(true);
      setError(e.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    let message = "Something went wrong.";
    try {
      const parsed = JSON.parse(error?.message || "{}");
      if (parsed.error) message = `Firebase Error: ${parsed.error}`;
    } catch (e) {}
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-surface text-center">
        <div className="max-w-md space-y-4">
          <h1 className="font-headline text-3xl text-primary">Sanctuary Interrupted</h1>
          <p className="font-body text-on-surface-variant">{message}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-white rounded-full">Retry</button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

const MANTRAS: Mantra[] = [
  {
    id: '1',
    name: 'Hare Krishna',
    description: 'The Great Mantra for peace, happiness, and spiritual liberation.',
    category: 'Currently Active',
    icon: 'BookOpen'
  },
  {
    id: '2',
    name: 'Om Mani Padme Hum',
    description: 'The six-syllabled Sanskrit mantra associated with the Bodhisattva of compassion.',
    category: 'Compassion',
    icon: 'Spa'
  },
  {
    id: '3',
    name: 'Waheguru',
    description: 'Ecstasy in the experience of the Divine Teacher. Eliminator of darkness.',
    category: 'Infinite Guru',
    icon: 'Flare'
  },
  {
    id: '4',
    name: 'Om Namah Shivaya',
    description: 'Adoration to Lord Shiva. A prayer for the inner self to be purified.',
    category: 'Liberation',
    icon: 'Waves'
  }
];

const SESSIONS: Session[] = [
  {
    id: 's1',
    mantraId: '4',
    mantraName: 'Om Namah Shivaya',
    date: 'Thursday, Oct 5',
    time: '06:15 AM',
    counts: 1008,
    imageUrl: 'https://picsum.photos/seed/beads/200/200'
  },
  {
    id: 's2',
    mantraId: 'g1',
    mantraName: 'Gayatri Mantra',
    date: 'Wednesday, Oct 4',
    time: '07:45 PM',
    counts: 108,
    imageUrl: 'https://picsum.photos/seed/temple/200/200'
  },
  {
    id: 's3',
    mantraId: '2',
    mantraName: 'Om Mani Padme Hum',
    date: 'Tuesday, Oct 3',
    time: '05:30 AM',
    counts: 540,
    imageUrl: 'https://picsum.photos/seed/sunset/200/200'
  }
];

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function CandlelightEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-15] overflow-hidden bg-black">
      {/* The Flame */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 0.95, 1.02, 1],
            opacity: [0.6, 0.8, 0.7, 0.9, 0.6],
            x: [0, 2, -2, 1, 0],
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="w-[300px] h-[400px] rounded-full bg-orange-500/20 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 0.9, 1.05, 1],
            opacity: [0.4, 0.6, 0.5, 0.7, 0.4],
            y: [0, -10, 5, -5, 0],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="w-[200px] h-[300px] rounded-full bg-amber-500/30 blur-[80px]"
        />
        {/* Core Flame */}
        <motion.div 
          animate={{ 
            height: [120, 130, 115, 125, 120],
            width: [40, 45, 38, 42, 40],
            opacity: [0.8, 1, 0.9, 1, 0.8],
          }}
          transition={{ 
            duration: 0.2, 
            repeat: Infinity,
            ease: "steps(4)" 
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-32 bg-gradient-to-t from-orange-600 via-amber-400 to-transparent rounded-full blur-md"
        />
      </div>
      
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05)_0%,transparent_70%)]" />
    </div>
  );
}

function AppContent() {
  const { user, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<Tab>('mantras');
  const [activeMantra, setActiveMantra] = useState<Mantra>(MANTRAS[0]);
  const [chantCount, setChantCount] = useState(0);
  const [laps, setLaps] = useState(1);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme>(THEMES[0]);
  const [globalPulses, setGlobalPulses] = useState<{ id: string, name: string }[]>([]);
  const [customMantras, setCustomMantras] = useState<Mantra[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [isAddMantraModalOpen, setIsAddMantraModalOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [activeSoundscape, setActiveSoundscape] = useState<Soundscape>(SOUNDSCAPES[0]);
  const [soundscapeVolume, setSoundscapeVolume] = useState(0.3);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const ctx = getAudioContext();
    if (activeSoundscape.id === 'none') {
      if (ambientSourceRef.current) {
        ambientSourceRef.current.stop();
        ambientSourceRef.current = null;
      }
      return;
    }

    let isCancelled = false;
    const loadAndPlay = async () => {
      try {
        const response = await fetch(activeSoundscape.url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        
        if (isCancelled) return;

        if (ambientSourceRef.current) {
          ambientSourceRef.current.stop();
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const gainNode = ctx.createGain();
        gainNode.gain.value = soundscapeVolume;
        ambientGainRef.current = gainNode;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        source.start(0);
        ambientSourceRef.current = source;
      } catch (err) {
        console.error("Failed to play soundscape:", err);
      }
    };

    loadAndPlay();
    return () => { isCancelled = true; };
  }, [activeSoundscape]);

  useEffect(() => {
    if (ambientGainRef.current) {
      ambientGainRef.current.gain.value = soundscapeVolume;
    }
  }, [soundscapeVolume]);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const decodePCM = async (base64Data: string): Promise<AudioBuffer> => {
    const ctx = getAudioContext();
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Gemini TTS returns 16-bit PCM, mono, 24kHz
    // Ensure we don't have an odd number of bytes for Int16Array
    const numSamples = Math.floor(bytes.length / 2);
    const pcmData = new Int16Array(bytes.buffer, 0, numSamples);
    const buffer = ctx.createBuffer(1, pcmData.length, 24000);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < pcmData.length; i++) {
      // Convert 16-bit PCM to float [-1, 1]
      channelData[i] = pcmData[i] / 32768;
    }
    
    return buffer;
  };

  const playBuffer = (buffer: AudioBuffer) => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (error) {
      console.error("Playback failed:", error);
    }
  };

  const generateMantraAudio = async (mantra: Mantra, shouldPlay = false) => {
    if (!isVoiceEnabled) return;
    setIsGeneratingAudio(true);
    try {
      if (mantra.voiceType === 'recorded' && mantra.voiceConfig) {
        const ctx = getAudioContext();
        const binaryString = atob(mantra.voiceConfig);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const buffer = await ctx.decodeAudioData(bytes.buffer);
        setAudioBuffer(buffer);
        if (shouldPlay) playBuffer(buffer);
        return;
      }

      const isRadha = mantra.name.toLowerCase().includes('radha');
      const voiceName = mantra.voiceConfig || (isRadha ? 'Kore' : 'Puck'); 
      const prompt = isRadha 
        ? `Say in a deeply spiritual, calm, and resonant voice like a great saint: ${mantra.name}`
        : `Say in a deep, resonant, and meditative voice like an ancient sadhu: ${mantra.name}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        console.log("Mantra audio generated successfully for:", mantra.name);
        const buffer = await decodePCM(base64Audio);
        setAudioBuffer(buffer);
        if (shouldPlay) {
          playBuffer(buffer);
        }
      } else {
        console.warn("No audio data received from Gemini TTS");
      }
    } catch (error) {
      console.error("Failed to generate mantra audio:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  useEffect(() => {
    if (isVoiceEnabled) {
      // Speak on selection
      generateMantraAudio(activeMantra, true);
    } else {
      setAudioBuffer(null);
    }
  }, [activeMantra, isVoiceEnabled]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp?.toDate().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) || 'Just now',
        time: doc.data().timestamp?.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) || ''
      })) as Session[];
      setSessions(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/sessions`));
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'global_pulse'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pulses = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().userName || 'A Seeker'
      }));
      setGlobalPulses(pulses);
    }, (err) => {
      // Silent fail for global pulse to avoid intrusive errors, but log for debugging
      console.warn("Global pulse listener failed:", err);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'mantras'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Mantra[];
      setCustomMantras(docs);
    }, (err) => {
      console.warn("Custom mantras listener failed:", err);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center"><RefreshCw className="animate-spin text-primary" /></div>;
  if (!user) return <LoginScreen />;

  const handleChant = () => {
    if (isVoiceEnabled && audioBuffer) {
      playBuffer(audioBuffer);
    }

    const targetCount = difficulty === 'beginner' ? 27 : 108;

    if (chantCount >= targetCount - 1) {
      setChantCount(0);
      setLaps(l => l + 1);
      
      // Play Mala completion sound
      const malaSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      malaSound.play().catch(() => {});

      // Save session on Mala completion
      const sessionData = {
        uid: user.uid,
        mantraId: activeMantra.id,
        mantraName: activeMantra.name,
        counts: targetCount,
        timestamp: serverTimestamp(),
        difficulty
      };
      addDoc(collection(db, 'users', user.uid, 'sessions'), sessionData)
        .catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/sessions`));
      
      // Add to global pulse
      addDoc(collection(db, 'global_pulse'), {
        userName: user.displayName || 'A Seeker',
        timestamp: serverTimestamp()
      }).catch(() => {}); // Silent fail for pulse
    } else {
      setChantCount(c => c + 1);
    }
  };

  const handleReset = () => {
    setChantCount(0);
    setLaps(1);
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-1000 text-on-surface font-body selection:bg-primary-fixed selection:text-primary pb-32 relative overflow-hidden"
      style={{ 
        backgroundColor: activeTheme.colors.surface,
        color: activeTheme.colors.onSurface,
        '--primary': activeTheme.colors.primary,
        '--secondary': activeTheme.colors.accent,
      } as any}
    >
      {/* Visual Sanctuary Background */}
      <div 
        className="fixed inset-0 -z-20 opacity-10 transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url(${activeTheme.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {activeTheme.id === 'candlelight' && <CandlelightEffect />}
      
      <TopAppBar activeTab={activeTab} onSettingsClick={() => setActiveTab('profile')} user={user} theme={activeTheme} />
      
      <GlobalPulse pulses={globalPulses} />

      <main className="max-w-4xl mx-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          {activeTab === 'mantras' && (
            <MantraScreen 
              key="mantras"
              activeMantra={activeMantra} 
              onSelectMantra={setActiveMantra} 
              customMantras={customMantras}
              onAddMantra={() => setIsAddMantraModalOpen(true)}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen 
              key="profile" 
              onBack={() => setActiveTab('mantras')} 
              user={user} 
              activeTheme={activeTheme}
              onThemeChange={setActiveTheme}
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
            />
          )}
          {activeTab === 'history' && (
            <HistoryScreen key="history" sessions={sessions} />
          )}
          {activeTab === 'guide' && (
            <GuideScreen key="guide" sessions={sessions} difficulty={difficulty} />
          )}
          {activeTab === 'ai' && (
            <AIScreen key="ai" sessions={sessions} difficulty={difficulty} />
          )}
          {activeTab === 'chant' && (
            <ChantScreen 
              key="chant"
              activeMantra={activeMantra} 
              count={chantCount} 
              laps={laps}
              onChant={handleChant}
              onReset={handleReset}
              theme={activeTheme}
              isVoiceEnabled={isVoiceEnabled}
              onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
              isGeneratingAudio={isGeneratingAudio}
              difficulty={difficulty}
            />
          )}
        </AnimatePresence>
      </main>

      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} theme={activeTheme} />

      <AddMantraModal 
        isOpen={isAddMantraModalOpen} 
        onClose={() => setIsAddMantraModalOpen(false)} 
        user={user}
      />
    </div>
  );
}

function GlobalPulse({ pulses }: { pulses: { id: string, name: string }[] }) {
  const [visiblePulses, setVisiblePulses] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    if (pulses.length > 0) {
      const newPulse = pulses[0];
      if (!visiblePulses.find(p => p.id === newPulse.id)) {
        setVisiblePulses(prev => [newPulse, ...prev].slice(0, 3));
        setTimeout(() => {
          setVisiblePulses(prev => prev.filter(p => p.id !== newPulse.id));
        }, 5000);
      }
    }
  }, [pulses]);

  return (
    <div className="fixed top-24 right-6 z-40 flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {visiblePulses.map((pulse) => (
          <motion.div
            key={pulse.id}
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, x: 10 }}
            className="flex items-center gap-2 bg-primary/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/20"
          >
            <Activity size={12} className="text-primary animate-pulse" />
            <span className="text-[10px] font-label uppercase tracking-widest text-primary font-bold">
              {pulse.name} completed a Mala
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function LoginScreen() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="space-y-4">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto text-on-primary-container">
            <Fingerprint size={40} />
          </div>
          <h1 className="font-headline text-5xl text-primary font-bold">The Sacred Interval</h1>
          <p className="font-body text-on-surface-variant">Enter your digital sanctuary to begin your journey of stillness.</p>
        </div>

        <div className="space-y-4 pt-8">
          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/30 py-4 rounded-full font-label font-bold text-on-surface hover:bg-surface-container-low transition-colors shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/20"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest text-on-surface-variant/40 bg-surface px-4">Or sanctuary access</div>
          </div>

          <div className="space-y-3">
            <input type="email" placeholder="Email Address" className="w-full bg-surface-container-low border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none" />
            <input type="password" placeholder="Password" className="w-full bg-surface-container-low border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none" />
            <button className="w-full bg-primary text-white py-4 rounded-full font-label font-bold hover:opacity-90 transition-opacity">Enter Sanctuary</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TopAppBar({ activeTab, onSettingsClick, user, theme }: { activeTab: Tab, onSettingsClick: () => void, user: User, theme: Theme }) {
  return (
    <header 
      className="w-full top-0 sticky backdrop-blur-md z-50 border-b border-outline-variant/10"
      style={{ backgroundColor: `${theme.colors.surface}CC` }}
    >
      <div className="flex justify-between items-center px-8 py-6">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSettingsClick}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
          style={{ color: theme.colors.primary }}
        >
          <Settings size={24} />
        </motion.button>
        <h1 className="font-headline text-2xl font-bold" style={{ color: theme.colors.primary }}>The Sacred Interval</h1>
        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-outline-variant/15 cursor-pointer">
          <img 
            alt="User Profile" 
            className="w-full h-full object-cover" 
            src={user.photoURL || "https://picsum.photos/seed/meditation/100/100"}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}

function BottomNavBar({ activeTab, onTabChange, theme }: { activeTab: Tab, onTabChange: (tab: Tab) => void, theme: Theme }) {
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'chant', label: 'Chant', icon: Fingerprint },
    { id: 'mantras', label: 'Mantras', icon: BookOpen },
    { id: 'guide', label: 'Guide', icon: Compass },
    { id: 'ai', label: 'Oracle', icon: Sparkles },
    { id: 'history', label: 'History', icon: ScrollText },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-outline-variant/10"
      style={{ backgroundColor: `${theme.colors.surface}EE` }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center px-6 py-2 transition-all duration-500 rounded-full ${
              isActive 
                ? 'bg-primary-container text-on-primary' 
                : 'text-on-surface-variant opacity-60 hover:opacity-100'
            }`}
            style={isActive ? { backgroundColor: theme.colors.primary, color: 'white' } : { color: theme.colors.onSurface }}
          >
            <Icon size={20} className={isActive ? 'fill-current' : ''} />
            <span className="text-[10px] uppercase tracking-[0.1em] font-semibold mt-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function MantraScreen({ activeMantra, onSelectMantra, customMantras, onAddMantra, ...props }: { 
  activeMantra: Mantra, 
  onSelectMantra: (m: Mantra) => void, 
  customMantras: Mantra[],
  onAddMantra: () => void,
  [key: string]: any 
}) {
  const allMantras = [...MANTRAS, ...customMantras];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <section className="mb-16">
        <h2 className="font-headline text-5xl md:text-6xl text-primary font-bold tracking-tight mb-4">Choose Your Mantra</h2>
        <p className="font-body text-on-surface-variant text-lg max-w-xl leading-relaxed">
          Select a vibration to anchor your meditation. Each sound carries a unique frequency of peace and realization.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {allMantras.map((mantra) => {
          const isActive = activeMantra.id === mantra.id;
          return (
            <motion.div
              key={mantra.id}
              whileHover={{ y: -4 }}
              onClick={() => onSelectMantra(mantra)}
              className={`relative group cursor-pointer p-8 rounded-xl transition-all duration-500 ${
                isActive 
                  ? 'bg-surface-container-lowest active-mantra-shadow border-l-4 border-primary' 
                  : 'bg-surface-container-low hover:bg-surface-container-lowest'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <span className={`font-label text-xs uppercase tracking-widest font-bold ${isActive ? 'text-secondary' : 'text-on-surface-variant/50'}`}>
                  {mantra.category}
                </span>
                {mantra.id === '1' && <BookOpen className={isActive ? 'text-primary' : 'text-on-surface-variant/30'} size={20} />}
                {mantra.id === '2' && <Flower2 className={isActive ? 'text-primary' : 'text-on-surface-variant/30'} size={20} />}
                {mantra.id === '3' && <Sparkles className={isActive ? 'text-primary' : 'text-on-surface-variant/30'} size={20} />}
                {mantra.id === '4' && <Waves className={isActive ? 'text-primary' : 'text-on-surface-variant/30'} size={20} />}
                {mantra.isCustom && <Fingerprint className={isActive ? 'text-primary' : 'text-on-surface-variant/30'} size={20} />}
              </div>
              <h3 className={`font-headline text-3xl font-medium mb-3 ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                {mantra.name}
              </h3>
              <p className="font-body text-sm text-on-surface-variant mb-6 leading-relaxed italic">
                {mantra.description}
              </p>
              {isActive && (
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <span>Selected</span>
                  <CheckCircle2 size={16} />
                </div>
              )}
            </motion.div>
          );
        })}

        <motion.div 
          whileHover={{ y: -4 }}
          onClick={onAddMantra}
          className="relative group cursor-pointer md:col-span-2"
        >
          <div className="bg-surface-container-high/40 border-2 border-dashed border-outline-variant p-10 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-500 hover:border-secondary/50 group">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 group-hover:bg-secondary-container transition-colors duration-500">
              <Plus className="text-primary" size={32} />
            </div>
            <h3 className="font-headline text-2xl text-primary font-medium mb-2">Add Custom Mantra</h3>
            <p className="font-body text-sm text-on-surface-variant">Create a personal intention or chant for your ritual.</p>
          </div>
        </motion.div>
      </div>

      <section className="mt-24 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-primary-container text-on-primary-container p-12 rounded-xl relative overflow-hidden flex flex-col justify-end min-h-[400px]">
            <div className="absolute inset-0 opacity-20">
              <img 
                alt="Abstract background" 
                className="w-full h-full object-cover" 
                src="https://picsum.photos/seed/ritual/800/600"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative z-10">
              <span className="font-label text-xs uppercase tracking-widest text-on-primary-container/70 mb-4 block">Evening Ritual</span>
              <h4 className="font-headline text-4xl mb-6 max-w-md">"The word is the bridge between the heart and the infinite."</h4>
              <button className="bg-secondary text-on-secondary px-8 py-3 rounded-full font-label text-sm font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2 w-fit">
                Learn more about Japa
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="bg-tertiary-container/10 p-8 rounded-xl flex flex-col justify-center items-center text-center border border-tertiary-container/20">
            <ScrollText className="text-tertiary mb-6" size={40} />
            <h5 className="font-headline text-2xl text-tertiary font-medium mb-4">Mantra History</h5>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Explore the ancient origins and lineages of the sacred sounds you chant every day.
            </p>
            <div className="mt-8 pt-8 border-t border-tertiary-container/20 w-full">
              <span className="font-label text-xs text-tertiary font-bold tracking-widest uppercase">12 Mantras Discovered</span>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function GuideScreen({ sessions, difficulty, ...props }: { sessions: Session[], difficulty: DifficultyLevel, [key: string]: any }) {
  const [activeSection, setActiveSection] = useState<'tutorial' | 'spiritual' | 'faq'>('tutorial');

  const pathAdvice = {
    beginner: {
      title: "The Beginner's Path",
      advice: "Start with 27 counts (1/4 Mala). Focus on the physical sensation of the tap and the sound of the mantra. Don't worry about a quiet mind; just return to the sound whenever you drift.",
      icon: Compass
    },
    intermediate: {
      title: "The Intermediate Path",
      advice: "Aim for a full 108 counts. Begin to synchronize your breath with the rhythm. Notice the subtle vibrations in your body after each chant. Consistency is your greatest ally.",
      icon: Zap
    },
    advanced: {
      title: "The Advanced Path",
      advice: "Move beyond the numbers. Let the Mala be a background rhythm to your deep silence. Explore the 'Ajapa Japa'—where the mantra repeats itself within your awareness without effort.",
      icon: Activity
    }
  };

  const tutorialSteps = [
    {
      title: "The Sacred Mala",
      description: "A traditional Mala has 108 beads. Chanting one full circle is called a 'Mala' or 'Lap'.",
      icon: Fingerprint,
      color: "text-blue-500"
    },
    {
      title: "Voice & Vibration",
      description: "You can use AI voices or record your own. The vibration of your own voice is deeply powerful.",
      icon: Mic,
      color: "text-purple-500"
    },
    {
      title: "Ambient Soundscapes",
      description: "Use the Ganges Flow or Himalayan Wind to create an immersive sanctuary for your mind.",
      icon: Waves,
      color: "text-teal-500"
    },
    {
      title: "Spiritual Oracle",
      description: "Use the Oracle tab to get personalized mantra suggestions based on your current state of mind.",
      icon: Sparkles,
      color: "text-amber-500"
    }
  ];

  const spiritualGuide = [
    {
      title: "Why 108?",
      content: "108 is a sacred number in many traditions. It represents the distance between the Sun, Moon, and Earth, and the 108 energy lines that converge to form the heart chakra."
    },
    {
      title: "Breath & Rhythm",
      content: "Try to sync your chant with your breath. Inhale deeply, and chant as you exhale. Let the rhythm of the Mala guide your focus."
    },
    {
      title: "Setting Intention",
      content: "Before you begin, hold a clear intention (Sankalpa) in your heart. Whether it's peace, healing, or gratitude, let it infuse every bead."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <header className="text-center space-y-2">
        <h1 className="font-headline text-4xl text-primary font-bold">Sanctuary Guide</h1>
        <p className="text-on-surface-variant">Master the art of digital Japa meditation</p>
      </header>

      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center gap-6"
      >
        <div className="p-4 bg-primary text-white rounded-2xl shadow-lg shrink-0">
          {React.createElement(pathAdvice[difficulty].icon, { size: 32 })}
        </div>
        <div className="space-y-1">
          <h3 className="font-headline text-xl font-bold text-primary">{pathAdvice[difficulty].title}</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">{pathAdvice[difficulty].advice}</p>
        </div>
      </motion.section>

      <div className="flex justify-center gap-2 p-1 bg-surface-container-low rounded-full w-fit mx-auto">
        {[
          { id: 'tutorial', label: 'App Tutorial', icon: HelpCircle },
          { id: 'spiritual', label: 'Spiritual Wisdom', icon: Lightbulb },
          { id: 'faq', label: 'FAQ', icon: Info }
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-label uppercase tracking-widest transition-all ${
              activeSection === section.id ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <section.icon size={14} />
            {section.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'tutorial' && (
          <motion.div 
            key="tutorial"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {tutorialSteps.map((step, i) => (
              <div key={i} className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 space-y-4 hover:shadow-lg transition-all">
                <div className={`p-3 rounded-2xl bg-surface-container-high w-fit ${step.color}`}>
                  <step.icon size={24} />
                </div>
                <h3 className="font-headline text-xl font-bold">{step.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </motion.div>
        )}

        {activeSection === 'spiritual' && (
          <motion.div 
            key="spiritual"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {spiritualGuide.map((item, i) => (
              <div key={i} className="p-8 bg-surface-container-low rounded-3xl border border-outline-variant/10 space-y-3">
                <h3 className="font-headline text-xl font-bold text-primary flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  {item.title}
                </h3>
                <p className="text-on-surface-variant leading-relaxed italic">"{item.content}"</p>
              </div>
            ))}
          </motion.div>
        )}

        {activeSection === 'faq' && (
          <motion.div 
            key="faq"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {[
              { q: "Can I chant without internet?", a: "Yes! Once your mantras and voices are loaded, the core chanting experience works offline." },
              { q: "Where is my data stored?", a: "Your sessions and custom mantras are securely stored in your private sanctuary on the cloud." },
              { q: "How do I reset my Mala?", a: "Simply long-press the center bead or use the reset button in the Chant screen." }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 space-y-2">
                <h4 className="font-bold text-primary">Q: {item.q}</h4>
                <p className="text-on-surface-variant text-sm">A: {item.a}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AIScreen({ sessions, difficulty, ...props }: { sessions: Session[], difficulty: DifficultyLevel, [key: string]: any }) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'chat' | 'generator' | 'insights'>('chat');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const consultGuide = async () => {
    if (mode === 'chat') {
      if (!prompt.trim()) return;
      const userMsg = prompt.trim();
      setPrompt('');
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setIsGenerating(true);

      try {
        const recentActivity = sessions.slice(0, 3).map(s => `${s.mantraName} (${s.counts} counts)`).join(', ');
        const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Guide'}: ${m.content}`).join('\n');
        
        const systemPrompt = `You are a wise spiritual meditation guide in the Sacred Mala sanctuary. 
        User's current path: ${difficulty}.
        Recent user practice: ${recentActivity}.
        Previous conversation:
        ${history}
        
        User says: "${userMsg}"
        
        Respond as a compassionate, poetic guide. 
        If user is 'beginner', use simple, encouraging language and clear instructions.
        If user is 'advanced', use more subtle, mystical, and profound guidance.
        Keep it brief (max 3 sentences). If relevant, suggest a mantra or breathing technique.`;

        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: systemPrompt,
        });
        setMessages(prev => [...prev, { role: 'ai', content: result.text }]);
      } catch (error) {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, { role: 'ai', content: "The sanctuary is currently quiet. Please try again in a moment of stillness." }]);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (mode !== 'insights' && !prompt.trim()) return;
    setIsGenerating(true);
    try {
      const recentActivity = sessions.slice(0, 5).map(s => `${s.mantraName} (${s.counts} counts)`).join(', ');
      
      let systemPrompt = "";
      if (mode === 'generator') {
        systemPrompt = `Create a unique, personal mantra or affirmation (max 10 words) based on this challenge/goal: "${prompt}". Explain its meaning in one sentence.`;
      } else {
        systemPrompt = `Analyze this meditation history and provide a "Weekly Spiritual Summary" with growth insights: ${recentActivity}. Be encouraging and mystical.`;
      }

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: systemPrompt,
      });
      setResponse(result.text);
    } catch (error) {
      console.error("AI Error:", error);
      setResponse("The sanctuary is currently quiet. Please try again in a moment of stillness.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
      className="h-[calc(100vh-280px)] flex flex-col"
    >
      <section className="text-center space-y-4 mb-6 shrink-0">
        <div className="flex justify-center gap-2">
          {[
            { id: 'chat', label: 'Oracle', icon: MessageSquare },
            { id: 'generator', label: 'Generator', icon: Zap },
            { id: 'insights', label: 'Insights', icon: Activity }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id as any); setResponse(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-label text-[10px] uppercase tracking-widest transition-all ${
                mode === m.id ? 'bg-primary text-white shadow-lg' : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              <m.icon size={12} />
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <div className="flex-1 overflow-hidden flex flex-col bg-surface-container-low rounded-[2rem] border border-outline-variant/10 shadow-inner">
        {mode === 'chat' ? (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                  <Compass size={48} className="text-primary animate-pulse" />
                  <div className="space-y-1">
                    <h3 className="font-headline text-xl font-bold">The Oracle Awaits</h3>
                    <p className="text-sm max-w-[200px]">Ask about your practice, seek a mantra, or share your feelings.</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-surface-container-high text-on-surface rounded-tl-none italic'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-surface-container-high p-4 rounded-2xl rounded-tl-none">
                    <RefreshCw size={16} className="animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-outline-variant/10 bg-surface-container-low">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && consultGuide()}
                  placeholder="Seek wisdom..."
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-full py-4 pl-6 pr-14 font-body text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <button 
                  onClick={consultGuide}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute right-2 p-2.5 bg-primary text-white rounded-full shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="font-headline text-3xl text-primary font-bold">
                {mode === 'generator' ? 'Mantra Generator' : 'Spiritual Insights'}
              </h2>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                {mode === 'generator' 
                  ? 'Describe a challenge or goal to receive a unique personal mantra.' 
                  : 'Let the AI analyze your journey and provide growth reflections.'}
              </p>
            </div>

            {mode === 'generator' ? (
              <div className="space-y-4">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What is your current focus?"
                  className="w-full h-32 bg-surface-container-high border border-outline-variant/10 rounded-2xl p-6 font-body text-sm text-on-surface outline-none resize-none"
                />
                <button 
                  onClick={consultGuide}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full py-4 bg-primary text-white rounded-xl font-label text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                >
                  {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                  Generate Mantra
                </button>
              </div>
            ) : (
              !response && (
                <button 
                  onClick={consultGuide}
                  disabled={isGenerating}
                  className="w-full py-16 bg-surface-container-high rounded-2xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center gap-4 hover:bg-surface-container-low transition-all group"
                >
                  <Activity size={40} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-headline text-xl text-primary">Generate Weekly Summary</span>
                </button>
              )
            )}

            <AnimatePresence>
              {response && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 bg-primary/5 rounded-3xl border border-primary/10 space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={48} className="text-primary" />
                  </div>
                  <p className="font-body text-lg text-on-surface leading-relaxed italic relative z-10">
                    {response}
                  </p>
                  <button 
                    onClick={() => setResponse(null)}
                    className="text-xs text-primary font-label uppercase tracking-widest hover:underline"
                  >
                    Clear Reflection
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ProfileScreen({ onBack, user, activeTheme, onThemeChange, difficulty, onDifficultyChange, ...props }: { 
  onBack: () => void, 
  user: User, 
  activeTheme: Theme,
  onThemeChange: (t: Theme) => void,
  difficulty: DifficultyLevel,
  onDifficultyChange: (d: DifficultyLevel) => void,
  [key: string]: any 
}) {
  const logout = () => auth.signOut();

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-12"
    >
      <section className="relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-4 aspect-square rounded-2xl overflow-hidden shadow-sm bg-surface-container-low">
            <img 
              className="w-full h-full object-cover opacity-90" 
              src={user.photoURL || "https://picsum.photos/seed/aria/400/400"}
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="md:col-span-8 mb-4">
            <span className="font-label text-secondary tracking-widest text-[10px] uppercase font-bold mb-2 block">Personal Sanctuary</span>
            <h2 className="font-headline text-5xl md:text-6xl text-primary leading-tight mb-4">{user.displayName || 'Aria Veda'}</h2>
            <p className="font-body text-on-surface-variant max-w-md leading-relaxed text-sm">
              Synchronizing breath and intention since Autumn 2023. Currently focused on the Mahamrityunjaya Mantra for healing and renewal.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-outline-variant/15 pb-2">
          <h3 className="font-headline text-2xl text-primary-container">Path of Practice</h3>
          <span className="font-label text-on-surface-variant text-xs opacity-60">Select your current depth</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map(level => (
            <button
              key={level}
              onClick={() => onDifficultyChange(level)}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                difficulty === level 
                  ? 'border-primary bg-primary/5 shadow-md scale-105' 
                  : 'border-outline-variant/20 hover:border-primary/30 opacity-70'
              }`}
            >
              <div className={`p-3 rounded-full ${difficulty === level ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {level === 'beginner' && <Compass size={20} />}
                {level === 'intermediate' && <Zap size={20} />}
                {level === 'advanced' && <Activity size={20} />}
              </div>
              <div className="text-center">
                <span className="font-label text-[10px] uppercase tracking-widest font-bold block">
                  {level}
                </span>
                <span className="text-[8px] opacity-60 font-body">
                  {level === 'beginner' && 'Gentle Guidance'}
                  {level === 'intermediate' && 'Steady Rhythm'}
                  {level === 'advanced' && 'Deep Silence'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-outline-variant/15 pb-2">
          <h3 className="font-headline text-2xl text-primary-container">Visual Sanctuaries</h3>
          <span className="font-label text-on-surface-variant text-xs opacity-60">Choose your atmosphere</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t)}
              className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                activeTheme.id === t.id ? 'border-primary scale-105 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={t.bgImage} className="w-full h-full object-cover" alt={t.name} />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white font-label text-[10px] uppercase tracking-widest font-bold">{t.name}</span>
              </div>
              {activeTheme.id === t.id && (
                <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full">
                  <CheckCircle2 size={12} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-outline-variant/15 pb-2">
          <h3 className="font-headline text-2xl text-primary-container">Ritual Preferences</h3>
          <span className="font-label text-on-surface-variant text-xs opacity-60">Adjust your sensory experience</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-8 bg-surface-container-low rounded-xl flex flex-col justify-between min-h-[180px] group hover:bg-surface-container-high transition-colors duration-500">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-surface-container-lowest rounded-full text-secondary">
                <Vibrate size={24} />
              </div>
              <Switch defaultChecked />
            </div>
            <div>
              <h4 className="font-headline text-xl text-primary mb-1">Haptic feedback</h4>
              <p className="font-body text-xs text-on-surface-variant">Subtle tactile pulses on each mantra completion.</p>
            </div>
          </div>
          <div className="p-8 bg-surface-container-lowest border border-outline-variant/15 rounded-xl flex flex-col justify-between min-h-[180px] group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-surface-container-low rounded-full text-secondary">
                <Eye size={24} />
              </div>
              <Switch />
            </div>
            <div>
              <h4 className="font-headline text-lg text-primary mb-1">Keep screen active</h4>
              <p className="font-body text-xs text-on-surface-variant">Prevents sleep during long chanting sessions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 pt-6">
        <h3 className="font-headline text-2xl text-primary-container border-b border-outline-variant/15 pb-2">Sanctuary Access</h3>
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-surface-container-high hover:bg-surface-container-low transition-colors duration-300 cursor-pointer">
            <div className="flex items-center gap-4">
              <Mail className="text-on-surface-variant" size={20} />
              <div>
                <p className="font-label text-xs uppercase tracking-tighter text-on-surface-variant font-bold">Email Address</p>
                <p className="font-body text-sm">{user.email}</p>
              </div>
            </div>
            <ChevronRight className="text-outline-variant" size={20} />
          </div>
          <div 
            onClick={logout}
            className="p-6 flex items-center justify-between hover:bg-surface-container-low transition-colors duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-4 text-error">
              <LogOut size={20} />
              <p className="font-body font-semibold">Exit Sanctuary</p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function AddMantraModal({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: User }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [voiceType, setVoiceType] = useState<'ai' | 'recorded'>('ai');
  const [voiceConfig, setVoiceConfig] = useState('Puck');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      let finalVoiceConfig = voiceConfig;
      if (voiceType === 'recorded' && recordedBlob) {
        finalVoiceConfig = await blobToBase64(recordedBlob);
      }

      await addDoc(collection(db, 'mantras'), {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        isCustom: true,
        voiceType,
        voiceConfig: finalVoiceConfig,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });
      setName('');
      setDescription('');
      setCategory('Personal');
      setRecordedBlob(null);
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'mantras');
    } finally {
      setIsSubmitting(false);
    }
  };

  const VOICE_LIBRARY = [
    { id: 'Puck', name: 'Ancient Sadhu (Deep)', gender: 'Male' },
    { id: 'Charon', name: 'Elder Monk (Resonant)', gender: 'Male' },
    { id: 'Kore', name: 'Divine Mother (Calm)', gender: 'Female' },
    { id: 'Aoede', name: 'Devotional Singer (Soft)', gender: 'Female' },
    { id: 'Fenrir', name: 'Young Seeker (Clear)', gender: 'Male' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-headline text-2xl text-primary font-bold">New Mantra</h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <Plus className="rotate-45 text-on-surface-variant" size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Mantra Name</label>
              <input 
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Om Namo Bhagavate..."
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 font-body focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Category</label>
                <input 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Peace"
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 font-body focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Voice Source</label>
                <div className="flex bg-surface-container-low rounded-xl p-1 border border-outline-variant/10">
                  <button 
                    type="button"
                    onClick={() => setVoiceType('ai')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${voiceType === 'ai' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
                  >
                    AI Voice
                  </button>
                  <button 
                    type="button"
                    onClick={() => setVoiceType('recorded')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${voiceType === 'recorded' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
                  >
                    Record
                  </button>
                </div>
              </div>
            </div>

            {voiceType === 'ai' ? (
              <div className="space-y-2">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Spiritual Voice Library</label>
                <div className="grid grid-cols-1 gap-2">
                  {VOICE_LIBRARY.map((voice) => (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() => setVoiceConfig(voice.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${voiceConfig === voice.id ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/10 bg-surface-container-low text-on-surface-variant hover:border-primary/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Volume2 size={18} />
                        <div className="text-left">
                          <p className="text-sm font-bold">{voice.name}</p>
                          <p className="text-[10px] opacity-60 uppercase tracking-tighter">{voice.gender}</p>
                        </div>
                      </div>
                      {voiceConfig === voice.id && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-6 bg-surface-container-low rounded-xl border border-outline-variant/10 flex flex-col items-center">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Record Your Voice</label>
                <div className="relative">
                  {isRecording && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 bg-error/20 rounded-full"
                    />
                  )}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-error text-white' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}
                  >
                    {isRecording ? <Square size={32} /> : <Mic size={32} />}
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">
                  {isRecording ? "Recording... Click to stop" : recordedBlob ? "Voice captured! Click to re-record" : "Click to start recording"}
                </p>
                {recordedBlob && !isRecording && (
                  <button 
                    type="button"
                    onClick={() => {
                      const url = URL.createObjectURL(recordedBlob);
                      new Audio(url).play();
                    }}
                    className="flex items-center gap-2 text-primary font-bold text-sm mt-2 hover:underline"
                  >
                    <Play size={16} />
                    <span>Listen to Recording</span>
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Description (Optional)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="The meaning or intention behind this chant..."
                rows={2}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 font-body focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !name.trim() || (voiceType === 'recorded' && !recordedBlob)}
              className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
              <span>Add to Sanctuary</span>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function HistoryScreen({ sessions, ...props }: { sessions: Session[], [key: string]: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <section className="mb-12">
        <h2 className="font-headline text-4xl mb-2 text-primary">Your Journey</h2>
        <p className="font-body text-on-surface-variant opacity-80 mb-8 max-w-lg">The rhythm of your devotion, captured in moments of stillness and sound.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Japa" value={sessions.reduce((acc, s) => acc + s.counts, 0).toLocaleString()} unit="counts" />
          <StatCard label="Current Streak" value="14" unit="days" />
          <StatCard label="Mantra Count" value="06" unit="active" />
        </div>
      </section>

      <section className="mb-12">
        <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/15">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline text-2xl text-primary-container">October 2023</h3>
            <div className="flex gap-4">
              <ChevronLeft className="text-outline-variant cursor-pointer hover:text-primary transition-colors" />
              <ChevronRight className="text-outline-variant cursor-pointer hover:text-primary transition-colors" />
            </div>
          </div>
          <Calendar />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xl text-primary">Recent Sessions</h3>
          <span className="font-label text-xs text-secondary cursor-pointer hover:underline">View All</span>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant/40 italic">No sessions recorded yet. Begin your practice to see your journey here.</div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="group bg-surface-container-lowest p-6 rounded-xl transition-all duration-700 hover:bg-surface-container-low flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-700">
                  <img 
                    alt={session.mantraName} 
                    className="w-full h-full object-cover" 
                    src={session.imageUrl || `https://picsum.photos/seed/${session.id}/200/200`}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="font-headline text-lg text-primary-container">{session.mantraName}</h4>
                  <p className="font-body text-sm text-on-surface-variant">{session.date} • {session.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-headline text-2xl font-bold text-primary">{session.counts.toLocaleString()}</p>
                <p className="font-label text-[10px] uppercase tracking-widest text-secondary">Counts</p>
              </div>
            </div>
          ))
        )}
      </section>
    </motion.div>
  );
}

function ChantScreen({ 
  activeMantra, 
  count, 
  laps, 
  onChant, 
  onReset, 
  theme, 
  isVoiceEnabled, 
  onToggleVoice, 
  isGeneratingAudio,
  difficulty,
  ...props 
}: { 
  activeMantra: Mantra, 
  count: number, 
  laps: number,
  onChant: () => void,
  onReset: () => void,
  theme: Theme,
  isVoiceEnabled: boolean,
  onToggleVoice: () => void,
  isGeneratingAudio: boolean,
  difficulty: DifficultyLevel,
  [key: string]: any
}) {
  const [soundscape, setSoundscape] = useState<'none' | 'bells' | 'water' | 'drone'>('none');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const targetCount = difficulty === 'beginner' ? 27 : 108;
  const progress = (count / targetCount) * 100;

  const guidance = {
    beginner: "Focus on the sound. Let each tap be a breath.",
    intermediate: "Maintain the rhythm. Observe the space between sounds.",
    advanced: "Dissolve into the vibration. Pure awareness."
  };

  const soundscapes = [
    { id: 'none', label: 'Silence', icon: Volume2, url: '' },
    { id: 'bells', label: 'Bells', icon: Church, url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' },
    { id: 'water', label: 'Water', icon: Waves, url: 'https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.mp3' },
    { id: 'drone', label: 'Drone', icon: Wind, url: 'https://assets.mixkit.co/active_storage/sfx/1105/1105-preview.mp3' }
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const current = soundscapes.find(s => s.id === soundscape);
    if (current && current.url) {
      const audio = new Audio(current.url);
      audio.loop = true;
      audio.play().catch(e => console.error("Audio play failed:", e));
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundscape]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <div className="text-center mb-8 max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold">
            {difficulty} Path
          </span>
          <div className="w-1 h-1 rounded-full bg-outline-variant/30"></div>
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-bold">
            Target: {targetCount}
          </p>
        </div>
        <h2 className="font-headline text-4xl text-primary leading-tight">{activeMantra.name}</h2>
        <p className="mt-4 font-body text-sm text-on-surface-variant/80 italic">
          "{guidance[difficulty]}"
        </p>
      </div>

      <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
        <div 
          className="absolute inset-0 rounded-full blur-3xl opacity-30 transition-colors duration-1000"
          style={{ backgroundColor: theme.colors.accent }}
        ></div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={onChant}
          className={`group relative z-10 w-72 h-72 rounded-full bg-surface-container-lowest shadow-2xl shadow-on-surface/5 flex flex-col items-center justify-center transition-all duration-700 border border-outline-variant/10 ${
            difficulty === 'advanced' ? 'opacity-90' : ''
          }`}
        >
          <div className="absolute inset-2 rounded-full border border-dashed border-outline-variant/20 group-active:rotate-45 transition-transform duration-1000"></div>
          <span className="font-headline text-8xl text-primary font-bold text-glow tracking-tighter">
            {count === 0 && laps > 1 ? targetCount : count}
          </span>
          <span className="font-label text-[10px] uppercase tracking-[0.3em] text-secondary mt-2 opacity-60">Chants</span>
        </motion.button>
        
        <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-20" viewBox="0 0 100 100">
          <circle className="text-outline-variant" cx="50" cy="50" fill="none" r="48" stroke="currentColor" strokeWidth="0.5"></circle>
          <motion.circle 
            cx="50" cy="50" fill="none" r="48" 
            stroke={theme.colors.primary} 
            strokeWidth="1" 
            strokeDasharray="301.59"
            animate={{ strokeDashoffset: 301.59 - (301.59 * progress) / 100 }}
            transition={{ type: 'spring', stiffness: 50 }}
          ></motion.circle>
        </svg>
      </div>

      <div className="mt-16 w-full max-w-sm grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-start gap-1">
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/50">Target</p>
          <div className="flex items-baseline gap-1">
            <span className="font-headline text-2xl text-primary">{targetCount}</span>
            <span className="font-label text-xs text-on-surface-variant/40">/ {difficulty === 'beginner' ? 'Quarter' : 'Mala'}</span>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-start gap-1">
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/50">Laps</p>
          <div className="flex items-baseline gap-1">
            <span className="font-headline text-2xl text-primary">{laps}</span>
            <span className="font-label text-xs text-on-surface-variant/40">/ 11</span>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        {soundscapes.map(s => (
          <button
            key={s.id}
            onClick={() => setSoundscape(s.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-label text-[10px] uppercase tracking-widest transition-all ${
              soundscape === s.id ? 'bg-secondary text-white' : 'bg-surface-container-low text-on-surface-variant'
            }`}
          >
            <s.icon size={14} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-4 bg-surface-container-low px-6 py-3 rounded-full border border-outline-variant/10">
          <div className="flex items-center gap-2">
            <Music size={16} className={isVoiceEnabled ? 'text-primary' : 'text-on-surface-variant/40'} />
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Voice Chanting</span>
          </div>
          <Switch checked={isVoiceEnabled} onChange={onToggleVoice} />
          {isGeneratingAudio && <RefreshCw size={14} className="animate-spin text-primary" />}
        </div>
      </div>

      <div className="mt-8 flex gap-6">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-on-surface-variant/60 hover:text-primary transition-colors"
        >
          <RefreshCw size={18} />
          <span className="font-label text-xs uppercase tracking-widest">Reset</span>
        </button>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, unit }: { label: string, value: string, unit: string }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 transition-all duration-500 hover:bg-surface-container">
      <p className="font-label text-xs uppercase tracking-widest text-secondary mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-headline text-3xl font-bold text-primary">{value}</span>
        <span className="font-body text-xs text-on-surface-variant opacity-60 italic">{unit}</span>
      </div>
    </div>
  );
}

function Calendar() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [
    { val: 25, active: false, current: false },
    { val: 26, active: false, current: false },
    { val: 27, active: false, current: false },
    { val: 28, active: false, current: false },
    { val: 29, active: false, current: false },
    { val: 30, active: false, current: false },
    { val: 1, active: true, current: false },
    { val: 2, active: true, current: false },
    { val: 3, active: true, current: true, partial: true },
    { val: 4, active: true, current: false },
    { val: 5, active: true, current: true },
    { val: 6, active: true, current: false },
    { val: 7, active: true, current: false },
    { val: 8, active: true, current: false },
  ];

  return (
    <div className="grid grid-cols-7 gap-y-4 text-center">
      {days.map(d => (
        <span key={d} className="font-label text-[10px] uppercase text-stone-400">{d}</span>
      ))}
      {dates.map((d, i) => (
        <div key={i} className={`h-10 flex items-center justify-center ${d.active ? 'text-on-surface' : 'text-stone-300'}`}>
          {d.current ? (
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${d.partial ? 'bg-secondary-container/40' : 'bg-secondary-container/80'}`}>
              {d.val}
            </span>
          ) : d.val}
        </div>
      ))}
    </div>
  );
}

function Switch({ checked, onChange, defaultChecked = false }: { checked?: boolean, onChange?: (checked: boolean) => void, defaultChecked?: boolean }) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  
  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? checked : internalChecked;

  const handleClick = () => {
    if (isControlled) {
      onChange?.(!checked);
    } else {
      setInternalChecked(!internalChecked);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none ${currentChecked ? 'bg-primary' : 'bg-outline-variant/30'}`}
    >
      <span
        className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-300 ${currentChecked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  );
}
