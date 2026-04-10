export type Tab = 'chant' | 'mantras' | 'history' | 'profile' | 'ai' | 'guide';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type ThemeId = 'himalayan' | 'temple' | 'forest' | 'void' | 'candlelight';

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    primary: string;
    surface: string;
    onSurface: string;
    accent: string;
  };
  bgImage: string;
}

export interface Mantra {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  isCustom?: boolean;
  voiceType?: 'ai' | 'recorded';
  voiceConfig?: string;
  createdBy?: string;
}

export interface Session {
  id: string;
  mantraId: string;
  mantraName: string;
  date: string;
  time: string;
  counts: number;
  imageUrl: string;
  timestamp?: any;
}

export interface UserStats {
  totalJapa: number;
  currentStreak: number;
  mantraCount: number;
  totalMinutes?: number;
  lastChantDate?: string;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  achievedAt?: any;
  target: number;
  type: 'total_chants' | 'streak' | 'malas';
}

export interface Soundscape {
  id: string;
  name: string;
  url: string;
  icon: string;
}
