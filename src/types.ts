import { Activity, Brain, CheckCircle2, Zap, AlertTriangle, Coffee, Gamepad2, Moon, Book, Headphones, Dumbbell, LayoutGrid } from 'lucide-react';

export type CategoryType = 'Cognitive' | 'Physical' | 'Order' | 'Impulse' | 'Negative' | string;

export interface QuickTile {
  id: string;
  label: string;
  icon: string;
  category: CategoryType;
  value: number;
}

export interface ActivityLog {
  id: string;
  label: string;
  category: CategoryType;
  points: number;
  timestamp: number;
  image?: string;
  note?: string;
}

export interface Reward {
  id: string;
  label: string;
  category: string;
  points: number;
  icon: string;
  image?: string;
  minLevel?: number;
  isRepeatable?: boolean;
}

export interface RedemptionLog {
  id: string;
  rewardId: string;
  rewardName: string;
  category: string;
  pointsSpent: number;
  timestamp: number;
  isUsed?: boolean;
  usedAt?: number;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  timestamp: number;
  updatedAt?: number;
  isDraft?: boolean;
}

export interface LevelTarget {
  level: number;
  minPoints: number;
  title: string;
}

export interface AppearanceSettings {
  theme: 'bright' | 'dark' | 'moss' | 'nebula';
  fontFamily: 'sans' | 'serif' | 'mono' | 'display';
  fontSize: 'small' | 'medium' | 'large';
}

export interface UserState {
  totalPoints: number;
  spentPoints: number;
  logs: ActivityLog[];
  redemptions: RedemptionLog[];
  quickTiles: QuickTile[];
  rewards: Reward[];
  categories: string[];
  rewardCategories: string[];
  diary: DiaryEntry[];
  diaryCategories: string[];
  levelTargets: LevelTarget[];
  appearance: AppearanceSettings;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: 'bright',
  fontFamily: 'sans',
  fontSize: 'medium',
};

export const DEFAULT_LEVEL_TARGETS: LevelTarget[] = [
  { level: 1, minPoints: 0, title: "反应弧战士" },
  { level: 2, minPoints: 100, title: "本能守卫" },
  { level: 3, minPoints: 200, title: "神经火花" },
  { level: 4, minPoints: 300, title: "专注学徒" },
  { level: 5, minPoints: 400, title: "认知侦察兵" },
  { level: 6, minPoints: 500, title: "秩序维护者" },
  { level: 7, minPoints: 800, title: "逻辑哨兵" },
  { level: 8, minPoints: 1100, title: "模式探索者" },
  { level: 9, minPoints: 1400, title: "自律达人" },
  { level: 10, minPoints: 1700, title: "理性觉醒者" },
  { level: 11, minPoints: 2000, title: "深度思考家" },
  { level: 12, minPoints: 2600, title: "策略编织者" },
  { level: 13, minPoints: 3200, title: "精神架构师" },
  { level: 14, minPoints: 3800, title: "认知领袖" },
  { level: 15, minPoints: 4400, title: "专注大师" },
  { level: 16, minPoints: 5000, title: "韧性专家" },
  { level: 17, minPoints: 6200, title: "决策智者" },
  { level: 18, minPoints: 7400, title: "神经统御者" },
  { level: 19, minPoints: 8600, title: "执行总监" },
  { level: 20, minPoints: 9800, title: "首席指挥官" },
];

export const getLevel = (totalPoints: number, targets: LevelTarget[]) => {
  const sortedTargets = [...targets].sort((a, b) => b.minPoints - a.minPoints);
  const target = sortedTargets.find(t => totalPoints >= t.minPoints);
  return target ? target.level : 1;
};

export const getLevelTitle = (level: number, targets: LevelTarget[]) => {
  const target = targets.find(t => t.level === level);
  return target ? target.title : "未知等级";
};

export const getNextLevelProgress = (totalPoints: number, targets: LevelTarget[]) => {
  const currentLevel = getLevel(totalPoints, targets);
  if (currentLevel >= targets.length) return 100;
  
  const currentTarget = targets.find(t => t.level === currentLevel);
  const nextTarget = targets.find(t => t.level === currentLevel + 1);
  
  if (!currentTarget || !nextTarget) return 0;
  
  const range = nextTarget.minPoints - currentTarget.minPoints;
  const progress = totalPoints - currentTarget.minPoints;
  
  return Math.min(100, Math.max(0, (progress / range) * 100));
};
