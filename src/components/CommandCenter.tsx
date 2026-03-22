import React, { useState, useEffect } from 'react';
import { useCommanderStore } from '../store';
import { MaterialIcon } from './MaterialIcon';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export const CommandCenter: React.FC = () => {
  const { state, logActivity, deleteLog } = useCommanderStore();
  const [manualLabel, setManualLabel] = useState('');
  const [manualCategory, setManualCategory] = useState(state.categories[0]);
  const [manualPoints, setManualPoints] = useState<number>(5);
  const [manualImage, setManualImage] = useState<string | undefined>(undefined);
  const [manualNote, setManualNote] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // View States
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  
  // Celebration State
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastLogId, setLastLogId] = useState<string | null>(null);
  const [lastLogLabel, setLastLogLabel] = useState('');
  const [lastLogPoints, setLastLogPoints] = useState<number>(0);
  const [floatingPhrases, setFloatingPhrases] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  // Feedback State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [activeTab, setActiveTab] = useState<'protocols' | 'manual' | 'recent'>('protocols');

  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [filterType, setFilterType] = useState<'all' | 'behavior' | 'reward'>('all');

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const triggerCelebration = (id: string, label: string, points: number) => {
    setLastLogId(id);
    setLastLogLabel(label);
    setLastLogPoints(points);
    setShowCelebration(true);
    
    const isNegative = points < 0;

    if (isNegative) {
      // Warning phrases instead of confetti - more uniform distribution
      const phrases = ['警惕冲动', '保持觉察', '回归秩序', 'PFC 离线', '深呼吸', '重新对齐', '专注当下', '情绪平稳'];
      const count = 16; // Increased count for better coverage
      const newPhrases = Array.from({ length: count }).map((_, i) => ({
        id: Date.now() + i,
        text: phrases[Math.floor(Math.random() * phrases.length)],
        // Better grid distribution for "full screen uniform" feel
        x: (i % 4) * 22 + 5 + Math.random() * 10, // 4 columns
        y: Math.floor(i / 4) * 20 + 10 + Math.random() * 15, // 4 rows
      }));
      setFloatingPhrases(newPhrases);
      setTimeout(() => setFloatingPhrases([]), 3000);
    } else {
      // Confetti effect for positive achievements
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#97cfe0', '#79a6a5', '#d2eeb9']
      });
    }

    // Auto hide after 5 seconds
    setTimeout(() => setShowCelebration(false), 5000);
  };

  const handleLog = (label: string, category: string, points: number, image?: string, note?: string) => {
    const id = logActivity(label, category, points, image, note);
    triggerCelebration(id, label, points);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLabel) return;
    
    // Auto-negate points for Negative category
    const finalPoints = (manualCategory === 'Negative' || manualCategory === '负面') 
      ? -Math.abs(manualPoints) 
      : manualPoints;

    handleLog(manualLabel, manualCategory, finalPoints, manualImage, manualNote);
    setManualLabel('');
    setManualImage(undefined);
    setManualNote('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUndo = () => {
    if (lastLogId) {
      deleteLog(lastLogId);
      setShowCelebration(false);
      setLastLogId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      const log = state.logs.find(l => l.id === id);
      deleteLog(id);
      showToast(`已删除记录: ${log?.label}`, 'info');
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      // Reset confirmation after 3 seconds
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const getFilteredLogs = () => {
    const behaviors = state.logs.map(log => ({
      ...log,
      type: 'behavior' as const,
      displayLabel: log.label,
      displayPoints: log.points,
      displayCategory: log.category
    }));

    const rewards = state.redemptions.map(r => ({
      id: r.id,
      label: r.rewardName,
      type: 'reward' as const,
      category: '兑换',
      points: -r.pointsSpent,
      timestamp: r.timestamp,
      displayLabel: `兑换了 ${r.rewardName}`,
      displayPoints: -r.pointsSpent,
      displayCategory: r.status === 'used' ? '已使用' : '未使用',
      note: r.status === 'used' ? '该奖品已在仓库中使用' : '奖品已存入仓库',
      image: undefined
    }));

    let combined = [...behaviors, ...rewards];

    // Type Filter
    if (filterType === 'behavior') {
      combined = combined.filter(item => item.type === 'behavior');
    } else if (filterType === 'reward') {
      combined = combined.filter(item => item.type === 'reward');
    }

    // Category Filter
    if (filterCategory !== 'all') {
      combined = combined.filter(item => item.category === filterCategory);
    }

    // Time Filter
    if (filterTime !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      const oneMonthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

      if (filterTime === 'today') {
        combined = combined.filter(item => item.timestamp >= startOfToday);
      } else if (filterTime === 'week') {
        combined = combined.filter(item => item.timestamp >= oneWeekAgo);
      } else if (filterTime === 'month') {
        combined = combined.filter(item => item.timestamp >= oneMonthAgo);
      }
    }

    return combined.sort((a, b) => b.timestamp - a.timestamp);
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="relative space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Floating Warning Phrases */}
      <AnimatePresence>
        {floatingPhrases.map((phrase) => (
          <motion.div
            key={phrase.id}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1.2, y: -100 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="fixed z-[200] pointer-events-none font-headline font-black text-error/40 text-2xl sm:text-4xl tracking-tighter whitespace-nowrap"
            style={{ left: `${phrase.x}%`, top: `${phrase.y}%` }}
          >
            {phrase.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Celebration/Warning Toast */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-4 pointer-events-auto ${
              lastLogPoints < 0 
                ? 'bg-error/10 border-error/30 text-error backdrop-blur-md' 
                : 'bg-surface-bright border-primary/20 text-on-surface'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                lastLogPoints < 0 ? 'bg-error/20 text-error' : 'bg-primary/10 text-primary'
              }`}>
                <MaterialIcon name={lastLogPoints < 0 ? "warning" : "auto_awesome"} className="text-xl" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{lastLogPoints < 0 ? '警示：记录了负面行为' : '成就已达成！'}</p>
                <p className={`text-xs truncate ${lastLogPoints < 0 ? 'opacity-80' : 'text-on-surface-variant'}`}>{lastLogLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button 
                onClick={handleUndo}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center justify-center min-w-[60px] ${
                  lastLogPoints < 0 ? 'text-error hover:bg-error/10' : 'text-primary hover:bg-primary/10'
                }`}
              >
                撤回
              </button>
              <button 
                onClick={() => setShowCelebration(false)}
                className="p-2 text-outline hover:text-on-surface transition-colors"
              >
                <MaterialIcon name="close" className="text-lg" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* General Toast */}
      <AnimatePresence>
        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-sm pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 pointer-events-auto ${
                toast.type === 'success' ? 'bg-primary/10 border-primary/20 text-primary' : 
                'bg-surface-variant border-outline-variant/20 text-on-surface'
              }`}
            >
              <MaterialIcon 
                name={toast.type === 'success' ? 'check_circle' : 'info'} 
                className="text-xl" 
              />
              <p className="text-xs font-bold flex-1">{toast.message}</p>
              <button onClick={() => setToast(null)} className="p-1 hover:opacity-70 transition-opacity">
                <MaterialIcon name="close" className="text-sm" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-outline-variant/10 overflow-x-auto no-scrollbar px-1">
        {[
          { id: 'protocols', label: '快捷协议', icon: 'bolt' },
          { id: 'manual', label: '手动记录', icon: 'edit_note' },
          { id: 'recent', label: '最近活动', icon: 'history' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`group pb-3 transition-all relative shrink-0 flex items-center gap-2 ${activeTab === tab.id ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
          >
            <MaterialIcon name={tab.icon} className={`text-lg ${activeTab === tab.id ? 'text-primary' : 'text-on-background'}`} />
            <span className="font-headline text-base font-bold tracking-tight text-on-background">{tab.label}</span>
            <motion.div 
              initial={false}
              animate={{ width: activeTab === tab.id ? '100%' : '0%' }}
              className="absolute bottom-0 left-0 h-1 bg-primary rounded-full" 
            />
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'protocols' && (
            <motion.section 
              key="protocols"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {state.quickTiles.map((tile) => (
                  <button
                    key={tile.id}
                    onClick={() => handleLog(tile.label, tile.category, tile.value)}
                    className="group flex flex-col items-center justify-center p-6 bg-surface-low rounded-2xl hover:bg-surface-variant transition-all duration-300 border border-outline-variant/10 shadow-sm hover:shadow-md min-h-[120px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                      <MaterialIcon name={tile.icon} className="text-primary text-2xl opacity-70 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors text-center leading-tight line-clamp-2">
                      {tile.label}
                    </span>
                    <span className="text-[8px] text-outline mt-1">{tile.value} 分</span>
                  </button>
                ))}
                {state.quickTiles.length === 0 && (
                  <div className="col-span-full p-12 text-center bg-surface-variant/10 rounded-3xl border border-dashed border-outline-variant/20">
                    <MaterialIcon name="grid_off" className="text-4xl text-outline/20 mb-2" />
                    <p className="text-on-surface-variant italic text-xs">暂无快捷协议，请在设置中添加</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {activeTab === 'manual' && (
            <motion.section 
              key="manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto w-full"
            >
              <div className="nordic-card p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <MaterialIcon name="edit_note" className="text-primary text-2xl" />
                  <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface">手动记录成就</h3>
                </div>
                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">你达成了什么？</label>
                    <input
                      value={manualLabel}
                      onChange={(e) => setManualLabel(e.target.value)}
                      className="w-full bg-surface-variant border-none rounded-xl px-5 py-4 text-sm focus:ring-1 focus:ring-primary/40 placeholder:text-outline/40 text-on-surface"
                      placeholder="例如：完成了战略审计..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">类别</label>
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {state.categories.map(cat => {
                      const isNegative = cat === 'Negative' || cat === '负面';
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setManualCategory(cat)}
                          className={`flex-shrink-0 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                            manualCategory === cat 
                              ? (isNegative ? 'bg-error text-on-error shadow-lg scale-105' : 'bg-primary text-on-primary shadow-lg scale-105') 
                              : (isNegative ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-surface-variant text-on-surface hover:bg-surface-bright')
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">积分</label>
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {[1, 2, 5, 10, 15, 20].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setManualPoints(p)}
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${manualPoints === p ? 'bg-primary text-on-primary scale-110 shadow-lg' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-bright'}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">备注 (选填)</label>
                    <textarea
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      className="w-full bg-surface-variant border-none rounded-xl px-5 py-4 text-sm focus:ring-1 focus:ring-primary/40 placeholder:text-outline/40 text-on-surface min-h-[100px] resize-none"
                      placeholder="添加一些详细说明..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">上传图片 (选填)</label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-2xl bg-surface-variant flex items-center justify-center overflow-hidden border border-dashed border-outline-variant/30 group">
                        {manualImage ? (
                          <img src={manualImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <MaterialIcon name="add_a_photo" className="text-2xl text-outline/40 group-hover:text-primary transition-colors" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      {manualImage && (
                        <button 
                          type="button"
                          onClick={() => setManualImage(undefined)}
                          className="text-[10px] font-bold text-error uppercase tracking-widest hover:underline"
                        >
                          移除图片
                        </button>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="nordic-btn-primary w-full py-4 text-sm tracking-widest shadow-xl">
                    记录此项行为
                  </button>
                </form>
              </div>
            </motion.section>
          )}

          {activeTab === 'recent' && (
            <motion.section 
              key="recent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-3">
                  <MaterialIcon name="history" className="text-primary text-2xl" />
                  <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface">最近活动全记录</h3>
                </div>
                <button 
                  onClick={() => setShowAllLogs(true)}
                  className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/20 transition-all self-start sm:self-auto"
                >
                  查看全部
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-4 bg-surface-low p-4 rounded-2xl border border-outline-variant/10 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest mr-2">类型:</span>
                  {[
                    { id: 'all', label: '全部' },
                    { id: 'behavior', label: '行为记录' },
                    { id: 'reward', label: '奖品兑换' }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setFilterType(type.id as any)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filterType === type.id ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-bright'}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                {filterType !== 'reward' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest mr-2">类别:</span>
                    <button
                      onClick={() => setFilterCategory('all')}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filterCategory === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-bright'}`}
                    >
                      全部
                    </button>
                    {state.categories.map(cat => {
                      const isNegative = cat === 'Negative' || cat === '负面';
                      return (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                            filterCategory === cat 
                              ? (isNegative ? 'bg-error text-on-error' : 'bg-primary text-on-primary') 
                              : (isNegative ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-bright')
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest mr-2">时间:</span>
                  {[
                    { id: 'all', label: '全部时间' },
                    { id: 'today', label: '今天' },
                    { id: 'week', label: '最近一周' },
                    { id: 'month', label: '最近一月' }
                  ].map(time => (
                    <button
                      key={time.id}
                      onClick={() => setFilterTime(time.id as any)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filterTime === time.id ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-bright'}`}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLogs.slice(0, 12).map((log) => (
                  <div 
                    key={log.id} 
                    onClick={() => setSelectedLogId(log.id)}
                    className={`flex items-center justify-between p-5 bg-surface-low rounded-2xl border-l-4 cursor-pointer hover:bg-surface-variant/40 transition-all shadow-sm ${log.type === 'reward' ? 'border-reward' : (log.points >= 0 ? 'border-primary' : 'border-error-dim')}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${log.type === 'reward' ? 'bg-reward/10 text-reward' : (log.points >= 0 ? 'bg-primary/10 text-primary' : 'bg-error-dim/10 text-error-dim')}`}>
                        <MaterialIcon name={log.type === 'reward' ? 'redeem' : (log.points >= 0 ? 'check_circle' : 'warning')} className="text-2xl" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface line-clamp-1">{log.displayLabel}</h4>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
                          {log.displayCategory} • {formatDistanceToNow(log.timestamp, { addSuffix: true, locale: zhCN })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`font-headline font-bold text-base ${log.type === 'reward' ? 'text-reward' : (log.points >= 0 ? 'text-primary' : 'text-error-dim')}`}>
                          {log.displayPoints >= 0 ? `+${log.displayPoints}` : log.displayPoints}
                        </span>
                      </div>
                      {log.type === 'behavior' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(log.id);
                          }}
                          className={`p-2 rounded-full transition-all ${confirmDeleteId === log.id ? 'bg-error-dim text-on-error' : 'text-outline hover:bg-surface-variant'}`}
                        >
                          <MaterialIcon name={confirmDeleteId === log.id ? 'done' : 'delete'} className="text-xl" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {state.logs.length === 0 && (
                  <div className="col-span-full p-12 text-center bg-surface-variant/10 rounded-3xl border border-dashed border-outline-variant/20">
                    <MaterialIcon name="history" className="text-4xl text-outline/20 mb-2" />
                    <p className="text-on-surface-variant italic text-xs">暂无活动记录</p>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* View All Logs Modal */}
      <AnimatePresence>
        {showAllLogs && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllLogs(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-low rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
                <h3 className="font-headline text-xl font-bold text-on-surface">所有活动记录</h3>
                <button onClick={() => setShowAllLogs(false)} className="p-2 text-outline hover:text-on-surface transition-colors">
                  <MaterialIcon name="close" className="text-xl" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
                {filteredLogs.length === 0 ? (
                  <div className="p-12 text-center bg-surface-variant/10 rounded-3xl border border-dashed border-outline-variant/20">
                    <MaterialIcon name="history" className="text-4xl text-outline/20 mb-2" />
                    <p className="text-on-surface-variant italic text-xs">暂无符合条件的记录</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      onClick={() => {
                        setSelectedLogId(log.id);
                        setShowAllLogs(false);
                      }}
                      className={`flex items-center justify-between p-4 bg-surface-variant/20 rounded-2xl border-l-4 cursor-pointer hover:bg-surface-variant/40 transition-all ${log.type === 'reward' ? 'border-reward' : (log.points >= 0 ? 'border-primary' : 'border-error')}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.type === 'reward' ? 'bg-reward/10 text-reward' : (log.points >= 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error')}`}>
                          <MaterialIcon name={log.type === 'reward' ? 'redeem' : (log.points >= 0 ? 'check_circle' : 'warning')} className="text-xl" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">{log.displayLabel}</h4>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
                            {log.displayCategory} • {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-headline font-bold text-sm ${log.type === 'reward' ? 'text-reward' : (log.points >= 0 ? 'text-primary' : 'text-error')}`}>
                          {log.displayPoints >= 0 ? `+${log.displayPoints}` : log.displayPoints} 分
                        </span>
                        {log.image && <MaterialIcon name="image" className="text-primary text-sm" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLogId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLogId(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-xl"
            />
            {(() => {
              const behaviors = state.logs.map(l => ({ ...l, type: 'behavior' as const, displayLabel: l.label, displayPoints: l.points, displayCategory: l.category }));
              const rewards = state.redemptions.map(r => ({
                id: r.id,
                label: r.rewardName,
                type: 'reward' as const,
                category: '兑换',
                points: -r.pointsSpent,
                timestamp: r.timestamp,
                displayLabel: `兑换了 ${r.rewardName}`,
                displayPoints: -r.pointsSpent,
                displayCategory: r.status === 'used' ? '已使用' : '未使用',
                note: r.status === 'used' ? '该奖品已在仓库中使用' : '奖品已存入仓库',
                image: undefined
              }));
              const log = [...behaviors, ...rewards].find(l => l.id === selectedLogId);
              if (!log) return null;
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 40 }}
                  className="relative w-full max-w-lg bg-surface-low rounded-[2rem] shadow-2xl overflow-hidden"
                >
                  {log.image && (
                    <div className="w-full aspect-video overflow-hidden">
                      <img src={log.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-md ${log.type === 'reward' ? 'bg-reward/10 text-reward' : 'bg-primary/10 text-primary'}`}>
                            {log.displayCategory}
                          </span>
                          <span className="text-[10px] text-outline font-medium">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="font-headline text-2xl font-bold text-on-surface leading-tight">{log.displayLabel}</h3>
                      </div>
                      <div className={`text-2xl font-black ${log.type === 'reward' ? 'text-reward' : (log.points >= 0 ? 'text-primary' : 'text-error-dim')}`}>
                        {log.displayPoints >= 0 ? `+${log.displayPoints}` : log.displayPoints}
                      </div>
                    </div>

                    {log.note && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-outline">{log.type === 'reward' ? '状态说明' : '备注'}</label>
                        <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-variant/30 p-4 rounded-2xl italic">
                          "{log.note}"
                        </p>
                      </div>
                    )}

                    <div className="pt-4 flex gap-3">
                      <button 
                        onClick={() => setSelectedLogId(null)}
                        className="flex-1 py-4 bg-surface-variant text-on-surface-variant font-bold rounded-2xl text-sm hover:bg-surface-bright transition-colors"
                      >
                        关闭
                      </button>
                      {log.type === 'behavior' && (
                        <button 
                          onClick={() => {
                            handleDelete(log.id);
                            setSelectedLogId(null);
                          }}
                          className="px-6 py-4 bg-error-dim text-on-error font-bold rounded-2xl text-sm hover:brightness-110 transition-all"
                        >
                          <MaterialIcon name="delete" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
