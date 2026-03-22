import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserState, ActivityLog, RedemptionLog, QuickTile, Reward, DiaryEntry, DEFAULT_LEVEL_TARGETS, DEFAULT_APPEARANCE } from './types';

const INITIAL_STATE: UserState = {
  totalPoints: 0,
  spentPoints: 0,
  logs: [],
  redemptions: [],
  quickTiles: [
    { id: 'q1', label: '冥想 (10分钟)', icon: 'self_improvement', category: '认知', value: 50 },
    { id: 'q2', label: '深度工作 (25分钟)', icon: 'mindfulness', category: '认知', value: 100 },
    { id: 'q3', label: '整理桌面', icon: 'inventory_2', category: '秩序', value: 30 },
    { id: 'q4', label: '抵制冲动', icon: 'do_not_disturb_on', category: '冲动', value: 80 },
    { id: 'q5', label: '23:00前入睡', icon: 'bedtime', category: '生理', value: 150 },
    { id: 'q6', label: '散步', icon: 'directions_walk', category: '生理', value: 40 },
  ],
  rewards: [
    { id: '1', label: '精品咖啡', category: '感官愉悦', points: 200, icon: 'coffee', isRepeatable: true },
    { id: '2', label: '额外30分钟游戏', category: '精神放松', points: 500, icon: 'sports_esports', isRepeatable: true },
    { id: '3', label: '深度睡眠包', category: '感官愉悦', points: 3500, icon: 'bedtime', isRepeatable: false },
    { id: '4', label: '周末旅行', category: '物质奖励', points: 15000, icon: 'flight', minLevel: 20, isRepeatable: false },
    { id: '5', label: '心仪书籍', category: '物质奖励', points: 1200, icon: 'book', isRepeatable: true },
    { id: '6', label: '零噪音一小时', category: '精神放松', points: 300, icon: 'headphones', isRepeatable: true },
  ],
  categories: ['认知', '生理', '秩序', '冲动', '负面', 'Negative'],
  rewardCategories: ['感官愉悦', '物质奖励', '精神放松'],
  diary: [],
  diaryCategories: ['随笔', '复盘', '感悟', '计划'],
  levelTargets: DEFAULT_LEVEL_TARGETS,
  appearance: DEFAULT_APPEARANCE,
};

interface CommanderContextType {
  state: UserState;
  logActivity: (label: string, category: string, points: number, image?: string, note?: string) => string;
  deleteLog: (id: string) => void;
  redeemReward: (reward: Reward) => RedemptionLog | false;
  undoRedemption: (redemptionId: string) => void;
  useItem: (redemptionId: string) => void;
  undoUseItem: (redemptionId: string) => void;
  deleteReward: (id: string) => void;
  deleteRedemption: (id: string) => void;
  addDiaryEntry: (title: string, content: string, category: string, isDraft?: boolean) => void;
  updateDiaryEntry: (id: string, updates: Partial<DiaryEntry>) => void;
  deleteDiaryEntry: (id: string) => void;
  resetAllData: (options?: { diary?: boolean; stats?: boolean }) => void;
  updateConfig: (updates: Partial<UserState>) => void;
  balance: number;
}

const CommanderContext = createContext<CommanderContextType | undefined>(undefined);

export const CommanderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UserState>(() => {
    const saved = localStorage.getItem('pfc_commander_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure totalPoints and spentPoints are recalculated from logs/redemptions for robustness
        const totalPoints = (parsed.logs || []).reduce((sum: number, log: ActivityLog) => sum + log.points, 0);
        const spentPoints = (parsed.redemptions || []).reduce((sum: number, r: RedemptionLog) => sum + r.pointsSpent, 0);
        return { 
          ...INITIAL_STATE,
          ...parsed, 
          totalPoints, 
          spentPoints,
          levelTargets: parsed.levelTargets || DEFAULT_LEVEL_TARGETS,
          appearance: parsed.appearance || DEFAULT_APPEARANCE
        };
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem('pfc_commander_state', JSON.stringify(state));
  }, [state]);

  const logActivity = (label: string, category: string, points: number, image?: string, note?: string) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      label,
      category,
      points,
      timestamp: Date.now(),
      image,
      note,
    };
    setState(prev => {
      const newLogs = [newLog, ...prev.logs];
      return {
        ...prev,
        logs: newLogs,
        totalPoints: newLogs.reduce((sum, l) => sum + l.points, 0),
      };
    });
    return newLog.id;
  };

  const deleteLog = (id: string) => {
    setState(prev => {
      const newLogs = prev.logs.filter(l => l.id !== id);
      return {
        ...prev,
        logs: newLogs,
        totalPoints: newLogs.reduce((sum, l) => sum + l.points, 0),
      };
    });
  };

  const redeemReward = (reward: Reward) => {
    const currentBalance = state.totalPoints - state.spentPoints;
    if (currentBalance < reward.points) return false;

    const newRedemption: RedemptionLog = {
      id: Math.random().toString(36).substr(2, 9),
      rewardId: reward.id,
      rewardName: reward.label,
      category: reward.category,
      pointsSpent: reward.points,
      timestamp: Date.now(),
      isUsed: false,
    };

    setState(prev => {
      const newRedemptions = [newRedemption, ...prev.redemptions];
      return {
        ...prev,
        redemptions: newRedemptions,
        spentPoints: newRedemptions.reduce((sum, r) => sum + r.pointsSpent, 0),
      };
    });
    return newRedemption;
  };

  const undoRedemption = (redemptionId: string) => {
    setState(prev => {
      const newRedemptions = prev.redemptions.filter(r => r.id !== redemptionId);
      return {
        ...prev,
        redemptions: newRedemptions,
        spentPoints: newRedemptions.reduce((sum, r) => sum + r.pointsSpent, 0),
      };
    });
  };

  const useItem = (redemptionId: string) => {
    setState(prev => ({
      ...prev,
      redemptions: prev.redemptions.map(r => 
        r.id === redemptionId ? { ...r, isUsed: true, usedAt: Date.now() } : r
      ),
    }));
  };

  const undoUseItem = (redemptionId: string) => {
    setState(prev => ({
      ...prev,
      redemptions: prev.redemptions.map(r => 
        r.id === redemptionId ? { ...r, isUsed: false, usedAt: undefined } : r
      ),
    }));
  };

  const deleteReward = (id: string) => {
    setState(prev => ({
      ...prev,
      rewards: prev.rewards.filter(r => r.id !== id),
    }));
  };

  const deleteRedemption = (id: string) => {
    setState(prev => {
      const newRedemptions = prev.redemptions.filter(r => r.id !== id);
      return {
        ...prev,
        redemptions: newRedemptions,
        spentPoints: newRedemptions.reduce((sum, r) => sum + r.pointsSpent, 0),
      };
    });
  };
  
  const addDiaryEntry = (title: string, content: string, category: string, isDraft: boolean = false) => {
    const newEntry: DiaryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      content,
      category,
      timestamp: Date.now(),
      isDraft,
    };
    setState(prev => ({
      ...prev,
      diary: [newEntry, ...prev.diary],
    }));
  };

  const updateDiaryEntry = (id: string, updates: Partial<DiaryEntry>) => {
    setState(prev => ({
      ...prev,
      diary: prev.diary.map(d => 
        d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
      ),
    }));
  };

  const deleteDiaryEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      diary: prev.diary.filter(d => d.id !== id),
    }));
  };

  const resetAllData = (options?: { diary?: boolean; stats?: boolean }) => {
    setState(prev => {
      const newState = { ...prev };
      if (!options || options.stats) {
        newState.logs = [];
        newState.redemptions = [];
        newState.totalPoints = 0;
        newState.spentPoints = 0;
      }
      if (!options || options.diary) {
        newState.diary = [];
      }
      return newState;
    });
  };

  const updateConfig = (updates: Partial<UserState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      // Recalculate points if logs or redemptions were updated
      if (updates.logs) {
        newState.totalPoints = updates.logs.reduce((sum, l) => sum + l.points, 0);
      }
      if (updates.redemptions) {
        newState.spentPoints = updates.redemptions.reduce((sum, r) => sum + r.pointsSpent, 0);
      }
      return newState;
    });
  };

  const balance = state.totalPoints - state.spentPoints;

  return (
    <CommanderContext.Provider value={{
      state,
      logActivity,
      deleteLog,
      redeemReward,
      undoRedemption,
      useItem,
      undoUseItem,
      deleteReward,
      deleteRedemption,
      addDiaryEntry,
      updateDiaryEntry,
      deleteDiaryEntry,
      resetAllData,
      updateConfig,
      balance,
    }}>
      {children}
    </CommanderContext.Provider>
  );
};

export function useCommanderStore() {
  const context = useContext(CommanderContext);
  if (context === undefined) {
    throw new Error('useCommanderStore must be used within a CommanderProvider');
  }
  return context;
}
