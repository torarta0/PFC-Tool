import React, { useState, useEffect } from 'react';
import { useCommanderStore } from '../store';
import { MaterialIcon } from './MaterialIcon';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export const Settings: React.FC = () => {
  const { state, updateConfig, deleteReward, resetAllData } = useCommanderStore();
  const [newCategory, setNewCategory] = useState('');
  const [newRewardCategory, setNewRewardCategory] = useState('');
  const [confirmDeleteTileId, setConfirmDeleteTileId] = useState<string | null>(null);
  const [confirmDeleteRewardId, setConfirmDeleteRewardId] = useState<string | null>(null);
  const [protocolFilter, setProtocolFilter] = useState('全部');
  const [rewardFilter, setRewardFilter] = useState('全部');
  const [behaviorTab, setBehaviorTab] = useState<'category' | 'protocol'>('category');
  const [rewardTab, setRewardTab] = useState<'category' | 'reward'>('category');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'behavior' | 'reward' | 'level' | 'appearance'>('behavior');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetOptions, setResetOptions] = useState({
    diary: true,
    stats: true
  });

  // Feedback State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#97cfe0', '#79a6a5', '#d2eeb9']
    });
  };

  // Add Protocol Form State
  const [showAddProtocol, setShowAddProtocol] = useState(false);
  const [protocolLabel, setProtocolLabel] = useState('');
  const [protocolCategory, setProtocolCategory] = useState(state.categories?.[0]);
  const [protocolPoints, setProtocolPoints] = useState(50);
  const [protocolIcon, setProtocolIcon] = useState('star');

  // Add Reward Form State
  const [showAddReward, setShowAddReward] = useState(false);
  const [rewardLabel, setRewardLabel] = useState('');
  const [rewardCategory, setRewardCategory] = useState(state.rewardCategories?.[0]);
  const [rewardPoints, setRewardPoints] = useState(500);
  const [rewardIcon, setRewardIcon] = useState('redeem');
  const [rewardImage, setRewardImage] = useState<string | undefined>(undefined);
  const [rewardDisplayMode, setRewardDisplayMode] = useState<'icon' | 'image'>('icon');
  const [rewardIsRepeatable, setRewardIsRepeatable] = useState(true);

  const PROTOCOL_ICONS = [
    'star', 'fitness_center', 'self_improvement', 'menu_book', 'water_drop', 
    'restaurant', 'bedtime', 'psychology', 'directions_run', 'directions_bike', 
    'timer', 'edit_note', 'check_circle', 'lightbulb', 'groups', 'visibility',
    'eco', 'favorite', 'bolt', 'auto_awesome', 'pool', 'hiking', 'sports_tennis',
    'sports_basketball', 'wb_sunny', 'cleaning_services', 'schedule', 'work',
    'school', 'language', 'public', 'forum', 'meditation', 'spa', 'nightlight'
  ];

  const REWARD_ICONS = [
    'redeem', 'shopping_bag', 'movie', 'restaurant', 'coffee', 'icecream', 
    'local_cafe', 'flight', 'hotel', 'videogame_asset', 'sports_esports', 
    'celebration', 'card_giftcard', 'savings', 'diamond', 'auto_awesome',
    'confirmation_number', 'local_activity', 'theater_comedy', 'music_note',
    'tv', 'cake', 'bakery_dining', 'wine_bar', 'beach_access', 'park',
    'directions_car', 'commute', 'payments', 'wallet', 'sell', 'emoji_events',
    'military_tech', 'brush', 'palette', 'camera_alt'
  ];

  const addCategory = () => {
    if (!newCategory || state.categories.includes(newCategory)) return;
    updateConfig({ categories: [...state.categories, newCategory] });
    showToast(`已添加行为类别: ${newCategory}`);
    triggerConfetti();
    setNewCategory('');
  };

  const removeCategory = (cat: string) => {
    if (cat === 'Negative' || cat === '负面') {
      showToast(`类别 "${cat}" 是系统内置的，不可删除`, 'error');
      return;
    }
    const updatedTiles = state.quickTiles.map(t => 
      t.category === cat ? { ...t, category: state.categories.find(c => c !== cat) || '未分类' } : t
    );
    updateConfig({ 
      categories: state.categories.filter(c => c !== cat),
      quickTiles: updatedTiles
    });
    showToast(`已移除类别: ${cat}`, 'info');
  };

  const addRewardCategory = () => {
    if (!newRewardCategory || state.rewardCategories.includes(newRewardCategory)) return;
    updateConfig({ rewardCategories: [...state.rewardCategories, newRewardCategory] });
    showToast(`已添加奖励类别: ${newRewardCategory}`);
    triggerConfetti();
    setNewRewardCategory('');
  };

  const removeRewardCategory = (cat: string) => {
    const updatedRewards = state.rewards.map(r => 
      r.category === cat ? { ...r, category: state.rewardCategories.find(c => c !== cat) || '未分类' } : r
    );
    updateConfig({ 
      rewardCategories: state.rewardCategories.filter(c => c !== cat),
      rewards: updatedRewards
    });
    showToast(`已移除奖励类别: ${cat}`, 'info');
  };

  const removeQuickTile = (id: string) => {
    if (confirmDeleteTileId === id) {
      const tile = state.quickTiles.find(t => t.id === id);
      updateConfig({ quickTiles: state.quickTiles.filter(t => t.id !== id) });
      showToast(`已删除协议: ${tile?.label}`, 'info');
      setConfirmDeleteTileId(null);
    } else {
      setConfirmDeleteTileId(id);
      setTimeout(() => setConfirmDeleteTileId(null), 3000);
    }
  };

  const handleAddProtocol = () => {
    if (!protocolLabel) return;
    const newTile = {
      id: Math.random().toString(36).substr(2, 9),
      label: protocolLabel,
      category: protocolCategory,
      value: protocolPoints,
      icon: protocolIcon
    };
    updateConfig({ quickTiles: [...state.quickTiles, newTile] });
    showToast(`已创建快捷协议: ${protocolLabel}`);
    triggerConfetti();
    setProtocolLabel('');
    setShowAddProtocol(false);
  };

  const handleAddReward = () => {
    if (!rewardLabel) return;
    const newReward = {
      id: Math.random().toString(36).substr(2, 9),
      label: rewardLabel,
      category: rewardCategory,
      points: rewardPoints,
      icon: rewardIcon,
      image: rewardDisplayMode === 'image' ? rewardImage : undefined,
      isRepeatable: rewardIsRepeatable
    };
    updateConfig({ rewards: [...state.rewards, newReward] });
    showToast(`已创建新奖励: ${rewardLabel}`);
    triggerConfetti();
    setRewardLabel('');
    setRewardImage(undefined);
    setRewardDisplayMode('icon');
    setShowAddReward(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRewardImage(reader.result as string);
        setRewardDisplayMode('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReward = (id: string) => {
    if (confirmDeleteRewardId === id) {
      const reward = state.rewards.find(r => r.id === id);
      deleteReward(id);
      showToast(`已删除奖励: ${reward?.label}`, 'info');
      setConfirmDeleteRewardId(null);
    } else {
      setConfirmDeleteRewardId(id);
      setTimeout(() => setConfirmDeleteRewardId(null), 3000);
    }
  };

  const updateLevelTarget = (level: number, field: 'minPoints' | 'title', value: any) => {
    const updatedTargets = state.levelTargets.map(t => 
      t.level === level ? { ...t, [field]: value } : t
    );
    updateConfig({ levelTargets: updatedTargets });
  };

  const addLevel = () => {
    const nextLevel = state.levelTargets.length + 1;
    const lastLevel = state.levelTargets[state.levelTargets.length - 1];
    const newTarget = {
      level: nextLevel,
      minPoints: lastLevel ? lastLevel.minPoints + 1000 : 0,
      title: `新等级 ${nextLevel}`
    };
    updateConfig({ levelTargets: [...state.levelTargets, newTarget] });
    showToast(`已添加等级 LV.${nextLevel}`);
  };

  const removeLevel = (level: number) => {
    if (state.levelTargets.length <= 1) {
      showToast('至少需要保留一个等级', 'error');
      return;
    }
    const updatedTargets = state.levelTargets
      .filter(t => t.level !== level)
      .map((t, index) => ({ ...t, level: index + 1 })); // Re-index levels
    updateConfig({ levelTargets: updatedTargets });
    showToast(`已移除等级 LV.${level}`, 'info');
  };

  const handleReset = () => {
    if (!resetOptions.diary && !resetOptions.stats) {
      showToast('请至少选择一项要清空的内容', 'error');
      return;
    }
    resetAllData(resetOptions);
    setShowResetConfirm(false);
    showToast('所选数据已清空', 'info');
  };

  const filteredQuickTiles = protocolFilter === '全部' 
    ? state.quickTiles 
    : state.quickTiles.filter(t => t.category === protocolFilter);

  const filteredRewards = rewardFilter === '全部'
    ? state.rewards
    : state.rewards.filter(r => r.category === rewardFilter);

  const handleUpdateAppearance = (appearance: Partial<typeof state.appearance>) => {
    updateConfig({ appearance: { ...state.appearance, ...appearance } });
    showToast('外观设置已更新');
  };

  const renderAppearanceSettings = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <MaterialIcon name="palette" className="text-lg" />
          </div>
          <h3 className="font-headline text-lg font-bold text-on-surface">配色系统</h3>
        </div>
        
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
          {[
            { id: 'bright', label: '明亮', icon: 'light_mode', color: '#6366f1' },
            { id: 'dark', label: '暗黑', icon: 'dark_mode', color: '#090e17' },
            { id: 'moss', label: '北欧苔', icon: 'forest', color: '#4a6741' },
            { id: 'rose', label: '落日玫', icon: 'filter_vintage', color: '#d81b60' }
          ].map(theme => (
            <button
              key={theme.id}
              onClick={() => handleUpdateAppearance({ theme: theme.id as any })}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border transition-all ${state.appearance?.theme === theme.id ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-surface-variant/10 border-outline-variant/5 hover:bg-surface-variant/20'}`}
            >
              <div 
                className="w-8 h-8 rounded-full mb-2 flex items-center justify-center shadow-sm"
                style={{ backgroundColor: theme.color }}
              >
                <MaterialIcon name={theme.icon} className="text-white text-sm" />
              </div>
              <span className={`text-[11px] font-bold ${state.appearance?.theme === theme.id ? 'text-primary' : 'text-on-surface'}`}>{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <MaterialIcon name="font_download" className="text-lg" />
          </div>
          <h3 className="font-headline text-lg font-bold text-on-surface">字体选择</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'sans', label: '无衬线 (Sans)', font: 'font-sans' },
            { id: 'serif', label: '衬线 (Serif)', font: 'font-serif' },
            { id: 'mono', label: '等宽 (Mono)', font: 'font-mono' },
            { id: 'display', label: '展示 (Display)', font: 'font-display' }
          ].map(font => (
            <button
              key={font.id}
              onClick={() => handleUpdateAppearance({ fontFamily: font.id as any })}
              className={`p-5 rounded-[1.5rem] border text-left transition-all ${state.appearance?.fontFamily === font.id ? 'bg-primary/10 border-primary' : 'bg-surface-variant/10 border-outline-variant/5 hover:bg-surface-variant/20'}`}
            >
              <span className={`block text-xl mb-2 ${font.font}`}>PFC指挥官</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{font.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <MaterialIcon name="format_size" className="text-lg" />
          </div>
          <h3 className="font-headline text-lg font-bold text-on-surface">字体大小</h3>
        </div>
        
        <div className="bg-surface-variant/10 p-2 rounded-[1.5rem] border border-outline-variant/5 flex gap-2">
          {[
            { id: 'small', label: '小', icon: 'text_fields', size: 'text-xs' },
            { id: 'medium', label: '中', icon: 'text_fields', size: 'text-sm' },
            { id: 'large', label: '大', icon: 'text_fields', size: 'text-base' }
          ].map(size => (
            <button
              key={size.id}
              onClick={() => handleUpdateAppearance({ fontSize: size.id as any })}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all ${state.appearance?.fontSize === size.id ? 'bg-primary text-on-primary shadow-xl shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-variant/20'}`}
            >
              <MaterialIcon name={size.icon} className={size.size} />
              <span className="text-xs font-bold">{size.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-on-surface-variant text-center opacity-60 font-medium">调整字体大小以获得最佳的移动端阅读体验</p>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <section className="space-y-2">
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-background">系统配置</h1>
        <p className="text-on-surface-variant text-sm max-w-md leading-relaxed">
          根据你的康复需求和认知目标定制 PFC 指挥官。
        </p>
      </section>

      <div className="flex items-center gap-6 border-b border-outline-variant/10 overflow-x-auto no-scrollbar px-1">
        {[
          { id: 'behavior', label: '行为管理', icon: 'psychology' },
          { id: 'level', label: '等级系统', icon: 'military_tech' },
          { id: 'appearance', label: '外观设置', icon: 'palette' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSettingsTab(tab.id as any)}
            className={`group pb-3 transition-all relative shrink-0 flex items-center gap-2 ${activeSettingsTab === tab.id ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
          >
            <MaterialIcon name={tab.icon} className={`text-lg ${activeSettingsTab === tab.id ? 'text-primary' : 'text-on-surface'}`} />
            <span className="font-headline text-base font-bold tracking-tight text-on-background">{tab.label}</span>
            <motion.div 
              initial={false}
              animate={{ width: activeSettingsTab === tab.id ? '100%' : '0%' }}
              className="absolute bottom-0 left-0 h-1 bg-primary rounded-full" 
            />
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSettingsTab === 'behavior' && (
          <motion.div 
            key="behavior-settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
          >
            {/* Behavior Management Block */}
            <div className="space-y-6">
              <div className="flex p-1 bg-surface-variant/30 rounded-xl w-fit border border-outline-variant/5">
                {[
                  { id: 'category', label: '行为类别', icon: 'category' },
                  { id: 'protocol', label: '快捷协议', icon: 'grid_view' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setBehaviorTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                      behaviorTab === tab.id 
                        ? 'bg-primary text-on-primary shadow-sm' 
                        : 'text-on-surface-variant hover:bg-surface-variant/50'
                    }`}
                  >
                    <MaterialIcon name={tab.icon} className="text-lg" />
                    <span className="text-sm font-bold tracking-tight">{tab.label}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {behaviorTab === 'category' && (
                  <motion.section 
                    key="behavior-cat"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="nordic-card p-8 space-y-8 min-h-[400px]"
                  >
                    <div className="flex items-center gap-3">
                      <MaterialIcon name="category" className="text-primary text-xl" />
                      <h3 className="font-headline text-lg font-bold text-on-surface">行为类别管理</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex gap-2 items-stretch">
                        <input
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="新类别名称..."
                          className="flex-1 min-w-0 bg-surface-variant border-none rounded-xl px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary/40"
                        />
                        <button 
                          onClick={addCategory}
                          className="flex-shrink-0 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm whitespace-nowrap"
                        >
                          添加
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {state.categories.map(cat => {
                          const isNegative = cat === 'Negative' || cat === '负面';
                          return (
                            <div 
                              key={cat} 
                              className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                                isNegative 
                                  ? 'bg-error/10 text-error border-error/20' 
                                  : 'bg-surface-variant border-outline-variant/10'
                              }`}
                            >
                              <span className="text-xs font-medium">{cat}</span>
                              {(cat !== 'Negative' && cat !== '负面') && (
                                <button onClick={() => removeCategory(cat)} className="text-outline hover:text-error transition-colors">
                                  <MaterialIcon name="close" className="text-sm" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.section>
                )}

                {behaviorTab === 'protocol' && (
                  <motion.section 
                    key="protocol"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="nordic-card p-8 space-y-8 min-h-[400px]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MaterialIcon name="grid_view" className="text-primary text-xl" />
                        <h3 className="font-headline text-lg font-bold text-on-surface">快捷协议配置</h3>
                      </div>
                      <button 
                        onClick={() => setShowAddProtocol(!showAddProtocol)}
                        className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                      >
                        <MaterialIcon name={showAddProtocol ? "close" : "add"} className="text-lg" />
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {showAddProtocol && (
                        <div className="p-6 bg-surface-variant/30 rounded-2xl border border-primary/20 space-y-4 animate-in slide-in-from-top-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-outline">名称</label>
                              <input 
                                value={protocolLabel}
                                onChange={e => setProtocolLabel(e.target.value)}
                                className="w-full bg-surface-variant border-none rounded-lg px-3 py-2 text-sm"
                                placeholder="例如：深呼吸"
                              />
                            </div>
                            <div className="space-y-1 col-span-2">
                              <label className="text-[10px] font-bold uppercase text-outline">类别</label>
                              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                                {state.categories.map(c => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setProtocolCategory(c)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                      protocolCategory === c 
                                        ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20' 
                                        : 'bg-surface-variant text-on-surface-variant hover:bg-surface-bright border border-outline-variant/5'
                                    }`}
                                  >
                                    {c}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-outline">积分</label>
                              <input 
                                type="number"
                                value={protocolPoints}
                                onChange={e => setProtocolPoints(Number(e.target.value))}
                                className="w-full bg-surface-variant border-none rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-outline">图标</label>
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-primary shrink-0">
                                  <MaterialIcon name={protocolIcon} className="text-xl" />
                                </div>
                                <select 
                                  value={protocolIcon}
                                  onChange={e => setProtocolIcon(e.target.value)}
                                  className="w-full bg-surface-variant border-none rounded-lg px-3 py-2 text-sm"
                                >
                                  {PROTOCOL_ICONS.map(icon => (
                                    <option key={icon} value={icon}>{icon}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={handleAddProtocol}
                            className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl text-sm"
                          >
                            确认添加协议
                          </button>
                        </div>
                      )}
                      
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {['全部', ...state.categories].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setProtocolFilter(cat)}
                            className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${protocolFilter === cat ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-bright'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                        {filteredQuickTiles.map(tile => (
                          <div key={tile.id} className="flex items-center justify-between p-4 bg-surface-variant/20 rounded-xl border border-outline-variant/5">
                            <div className="flex items-center gap-3">
                              <MaterialIcon name={tile.icon} className="text-primary" />
                              <div>
                                <p className="text-sm font-bold">{tile.label}</p>
                                <p className="text-[10px] text-on-surface-variant uppercase">{tile.category} • {tile.value} 分</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeQuickTile(tile.id)}
                              className={`p-2 rounded-full transition-all ${confirmDeleteTileId === tile.id ? 'bg-error-dim text-on-error' : 'text-outline hover:text-error'}`}
                              title={confirmDeleteTileId === tile.id ? '确认删除？' : '删除此协议'}
                            >
                              <MaterialIcon name={confirmDeleteTileId === tile.id ? 'done' : 'delete'} className="text-lg" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}



        {activeSettingsTab === 'level' && (
          <motion.div 
            key="level-settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="nordic-card p-6 sm:p-10 space-y-10 max-w-3xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <MaterialIcon name="military_tech" className="text-primary text-2xl" />
                  <h3 className="font-headline text-2xl font-bold text-on-surface">等级系统配置</h3>
                </div>
                <p className="text-[10px] text-outline font-bold uppercase tracking-widest ml-9">
                  基于累积积分 (包含惩罚扣分，不含兑换消耗)
                </p>
              </div>
              <button 
                onClick={addLevel}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                <MaterialIcon name="add" className="text-lg" />
                添加新等级
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
              {state.levelTargets.map((target) => (
                <div key={target.level} className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-surface-variant/10 rounded-[1.5rem] border border-outline-variant/5 hover:bg-surface-variant/20 transition-all">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-mono text-sm font-black text-primary border border-primary/20">
                      {target.level}
                    </div>
                    <div className="sm:hidden">
                      <p className="text-[9px] font-black text-outline uppercase tracking-tighter">等级序列</p>
                      <p className="text-xs font-bold text-on-surface-variant">LEVEL {target.level}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-outline ml-1 tracking-widest">称号 / 荣誉头衔</label>
                      <input 
                        value={target.title}
                        onChange={(e) => updateLevelTarget(target.level, 'title', e.target.value)}
                        placeholder="输入等级称号..."
                        className="w-full bg-surface-variant/40 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 text-on-surface transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-outline ml-1 tracking-widest">所需累积积分</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={target.minPoints}
                          onChange={(e) => updateLevelTarget(target.level, 'minPoints', Number(e.target.value))}
                          className="w-full bg-surface-variant/40 border-none rounded-xl px-4 py-3 text-sm font-mono font-bold focus:ring-2 focus:ring-primary/20 text-on-surface transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-outline">PTS</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => removeLevel(target.level)}
                    className="p-3 text-outline hover:text-error-dim hover:bg-error-dim/10 rounded-xl transition-all self-end sm:self-center"
                    title="移除此等级"
                  >
                    <MaterialIcon name="delete" className="text-xl" />
                  </button>
                </div>
              ))}
              
              {state.levelTargets.length === 0 && (
                <div className="p-12 text-center bg-surface-variant/10 rounded-[2rem] border border-dashed border-outline-variant/20">
                  <MaterialIcon name="layers_clear" className="text-4xl text-outline/20 mb-3" />
                  <p className="text-on-surface-variant italic text-sm">尚未定义等级序列</p>
                </div>
              )}
            </div>

            <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4 items-start">
              <MaterialIcon name="info" className="text-primary text-lg shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface">关于累积积分逻辑</p>
                <p className="text-[10px] text-on-surface-variant leading-relaxed opacity-80">
                  等级进度仅取决于您在系统中获得的<strong>总积分净值</strong>。这意味着即使您在商店兑换了奖励，您的等级和称号也不会下降。只有负面行为导致的扣分会影响累积进度。
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeSettingsTab === 'appearance' && (
          <motion.div 
            key="appearance-settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="nordic-card p-6 sm:p-10 space-y-10 max-w-3xl mx-auto"
          >
            {renderAppearanceSettings()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset All Data Button */}
      <div className="max-w-3xl mx-auto mt-12 mb-8 px-6">
        <div className="p-8 bg-error-dim/5 rounded-[2rem] border border-error-dim/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-headline text-lg font-bold text-error-dim">危险区域</h4>
            <p className="text-[10px] text-on-surface-variant font-medium opacity-70">
              可选择性清空日志记录或核心数据（积分、行为、兑换记录）。此操作不可撤销。
            </p>
          </div>
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-8 py-4 bg-error-dim/10 text-error-dim text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-error-dim hover:text-on-error transition-all shadow-lg shadow-error-dim/10"
          >
            <MaterialIcon name="delete_forever" className="text-xl" />
            清空所有数据
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="nordic-card p-10 max-w-md w-full space-y-8 text-center"
            >
              <div className="w-20 h-20 bg-error-dim/10 rounded-[2.5rem] flex items-center justify-center text-error-dim mx-auto">
                <MaterialIcon name="warning" className="text-4xl" />
              </div>
              
              <div className="space-y-3">
                <h3 className="font-headline text-2xl font-black text-on-surface tracking-tight">确认清空数据？</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed opacity-80">
                  请勾选您想要永久删除的内容。此操作无法撤销，请谨慎操作。
                </p>
              </div>

              <div className="space-y-4 text-left">
                <button 
                  onClick={() => setResetOptions(prev => ({ ...prev, diary: !prev.diary }))}
                  className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${resetOptions.diary ? 'bg-error-dim/10 border-error-dim text-error-dim' : 'bg-surface-variant/20 border-outline-variant/10 text-on-surface-variant'}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${resetOptions.diary ? 'bg-error-dim border-error-dim text-on-error' : 'border-outline-variant'}`}>
                    {resetOptions.diary && <MaterialIcon name="check" className="text-sm" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">清空日志记录</p>
                    <p className="text-[10px] opacity-70">删除所有日记、随笔和草稿</p>
                  </div>
                  <MaterialIcon name="book" className="text-xl" />
                </button>

                <button 
                  onClick={() => setResetOptions(prev => ({ ...prev, stats: !prev.stats }))}
                  className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${resetOptions.stats ? 'bg-error-dim/10 border-error-dim text-error-dim' : 'bg-surface-variant/20 border-outline-variant/10 text-on-surface-variant'}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${resetOptions.stats ? 'bg-error-dim border-error-dim text-on-error' : 'border-outline-variant'}`}>
                    {resetOptions.stats && <MaterialIcon name="check" className="text-sm" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">清空核心数据</p>
                    <p className="text-[10px] opacity-70">删除积分、行为记录及兑换历史</p>
                  </div>
                  <MaterialIcon name="analytics" className="text-xl" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleReset}
                  className="w-full py-4 bg-error-dim text-on-error text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-error-dim/20 hover:brightness-110 transition-all active:scale-95"
                >
                  确认永久删除
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-4 bg-surface-variant text-on-surface-variant text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-surface-bright transition-all"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Feedback Toast */}
      <AnimatePresence>
        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 pointer-events-auto ${
                toast.type === 'success' ? 'bg-primary/10 border-primary/20 text-primary' : 
                toast.type === 'error' ? 'bg-error-dim/10 border-error-dim/20 text-error-dim' : 
                'bg-surface-variant border-outline-variant/20 text-on-surface'
              }`}
            >
              <MaterialIcon 
                name={toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'} 
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
    </div>
  );
};
