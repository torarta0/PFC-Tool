import React, { useState, useEffect } from 'react';
import { useCommanderStore } from '../store';
import { MaterialIcon } from './MaterialIcon';
import { getLevel, Reward } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ImpulseBuffer } from './ImpulseBuffer';
import confetti from 'canvas-confetti';

export const RewardStore: React.FC = () => {
  const { state, redeemReward, undoRedemption, useItem, undoUseItem, deleteReward, deleteRedemption, balance, updateConfig, addReward, updateReward } = useCommanderStore();
  const [viewMode, setViewMode] = useState<'store' | 'warehouse'>('store');
  const [warehouseTab, setWarehouseTab] = useState<'unused' | 'used'>('unused');
  const [activeTab, setActiveTab] = useState('全部');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteRedemptionId, setConfirmDeleteRedemptionId] = useState<string | null>(null);
  const [activeRewardId, setActiveRewardId] = useState<string | null>(null);
  
  // Impulse Buffer State
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);
  const [showBuffer, setShowBuffer] = useState(false);
  
  // Management State
  const [isManaging, setIsManaging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPoints, setEditPoints] = useState(500);
  const [editIcon, setEditIcon] = useState('redeem');
  const [editImage, setEditImage] = useState<string | undefined>(undefined);
  const [editDisplayMode, setEditDisplayMode] = useState<'icon' | 'image'>('icon');
  const [editIsRepeatable, setEditIsRepeatable] = useState(true);
  const [editMinLevel, setEditMinLevel] = useState(1);

  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const REWARD_ICONS = [
    'redeem', 'shopping_bag', 'movie', 'restaurant', 'coffee', 'icecream', 
    'local_cafe', 'flight', 'hotel', 'videogame_asset', 'sports_esports', 
    'celebration', 'card_giftcard', 'savings', 'diamond', 'auto_awesome',
    'confirmation_number', 'local_activity', 'theater_comedy', 'music_note',
    'tv', 'cake', 'bakery_dining', 'wine_bar', 'beach_access', 'park',
    'directions_car', 'commute', 'payments', 'wallet', 'sell', 'emoji_events',
    'military_tech', 'brush', 'palette', 'camera_alt'
  ];

  const handleOpenEditor = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward);
      setEditLabel(reward.label);
      setEditCategory(reward.category);
      setEditPoints(reward.points);
      setEditIcon(reward.icon);
      setEditImage(reward.image);
      setEditDisplayMode(reward.image ? 'image' : 'icon');
      setEditIsRepeatable(reward.isRepeatable);
      setEditMinLevel(reward.minLevel || 1);
    } else {
      setEditingReward(null);
      setEditLabel('');
      setEditCategory(state.rewardCategories?.[0] || '日常');
      setEditPoints(500);
      setEditIcon('redeem');
      setEditImage(undefined);
      setEditDisplayMode('icon');
      setEditIsRepeatable(true);
      setEditMinLevel(1);
    }
    setIsEditing(true);
  };

  const handleSaveReward = () => {
    if (!editLabel.trim()) return;
    
    const rewardData = {
      label: editLabel,
      category: editCategory,
      points: editPoints,
      icon: editIcon,
      image: editDisplayMode === 'image' ? editImage : undefined,
      isRepeatable: editIsRepeatable,
      minLevel: editMinLevel
    };

    if (editingReward) {
      updateReward(editingReward.id, rewardData);
    } else {
      addReward(rewardData);
    }
    
    setIsEditing(false);
    setEditingReward(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
        setEditDisplayMode('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || state.rewardCategories.includes(newCategoryName.trim())) return;
    updateConfig({ rewardCategories: [...state.rewardCategories, newCategoryName.trim()] });
    setNewCategoryName('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (state.rewardCategories.length <= 1) return;
    updateConfig({ rewardCategories: state.rewardCategories.filter(c => c !== cat) });
    if (activeTab === cat) setActiveTab('全部');
  };
  
  // Success Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    type: 'redeem' | 'use';
    id: string;
    name: string;
    points?: number;
  } | null>(null);

  const userLevel = getLevel(state.totalPoints, state.levelTargets);

  const rewards = state.rewards.filter(r => activeTab === '全部' || r.category === activeTab);

  // Sorting logic: Unaffordable or Locked items to the end
  const sortedRewards = [...rewards].sort((a, b) => {
    const aPurchaseCount = state.redemptions.filter(r => r.rewardId === a.id).length;
    const bPurchaseCount = state.redemptions.filter(r => r.rewardId === b.id).length;
    
    const aIsLocked = (!a.isRepeatable && aPurchaseCount > 0) || (a.minLevel && userLevel < a.minLevel);
    const bIsLocked = (!b.isRepeatable && bPurchaseCount > 0) || (b.minLevel && userLevel < b.minLevel);
    
    const aCanAfford = balance >= a.points;
    const bCanAfford = balance >= b.points;

    const aStatus = aIsLocked ? 2 : (!aCanAfford ? 1 : 0);
    const bStatus = bIsLocked ? 2 : (!bCanAfford ? 1 : 0);

    return aStatus - bStatus;
  });

  const getPurchaseCount = (rewardId: string) => {
    return state.redemptions.filter(r => r.rewardId === rewardId).length;
  };

  const handleRedeem = (reward: Reward) => {
    // Impulse Buffer Logic: Trigger for specific categories
    const impulsiveCategories = ['感官愉悦', '精神放松'];
    if (impulsiveCategories.includes(reward.category)) {
      setPendingReward(reward);
      setShowBuffer(true);
      return;
    }
    
    executeRedeem(reward);
  };

  const executeRedeem = (reward: Reward) => {
    const redemption = redeemReward(reward);
    if (redemption) {
      setSuccessData({
        type: 'redeem',
        id: redemption.id,
        name: reward.label,
        points: reward.points
      });
      setShowSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#97cfe0', '#79a6a5', '#d2eeb9']
      });
    }
    setPendingReward(null);
    setShowBuffer(false);
  };

  const handleUse = (id: string, name: string) => {
    useItem(id);
    setSuccessData({
      type: 'use',
      id,
      name
    });
    setShowSuccess(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#97cfe0', '#79a6a5', '#d2eeb9']
    });
  };

  const handleUndo = () => {
    if (!successData) return;
    if (successData.type === 'redeem') {
      undoRedemption(successData.id);
    } else {
      undoUseItem(successData.id);
    }
    setShowSuccess(false);
  };

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleDeleteReward = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      deleteReward(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleDeleteRedemption = (id: string) => {
    if (confirmDeleteRedemptionId === id) {
      deleteRedemption(id);
      setConfirmDeleteRedemptionId(null);
    } else {
      setConfirmDeleteRedemptionId(id);
      setTimeout(() => setConfirmDeleteRedemptionId(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <section className="flex items-center justify-between border-b border-outline-variant/10">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar px-1">
          {[
            { id: 'store', label: '奖励中心', icon: 'shopping_bag' },
            { id: 'warehouse', label: '我的仓库', icon: 'inventory_2' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className={`group pb-3 transition-all relative shrink-0 flex items-center gap-2 ${viewMode === tab.id ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
            >
              <MaterialIcon name={tab.icon} className={`text-lg ${viewMode === tab.id ? 'text-primary' : 'text-on-background'}`} />
              <span className="font-headline text-base font-bold tracking-tight text-on-background">{tab.label}</span>
              <motion.div 
                initial={false}
                animate={{ width: viewMode === tab.id ? '100%' : '0%' }}
                className="absolute bottom-0 left-0 h-1 bg-primary rounded-full" 
              />
            </button>
          ))}
        </div>
        <div className="bg-primary/10 px-3 py-1 rounded-full mb-3">
          <span className="text-primary text-xs font-bold">{balance.toLocaleString()} 积分余额</span>
        </div>
      </section>

      {viewMode === 'store' ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <nav className="flex gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
              {['全部', ...state.rewardCategories].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full font-label text-xs font-bold uppercase tracking-wider transition-all ${activeTab === cat ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-bright'}`}
                >
                  {cat}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsManagingCategories(!isManagingCategories)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isManagingCategories ? 'bg-primary/20 text-primary' : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'}`}
              >
                <MaterialIcon name="settings" className="text-sm" />
              </button>
              <button 
                onClick={() => handleOpenEditor()}
                className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <MaterialIcon name="add" className="text-sm" />
              </button>
            </div>
          </div>

          {/* Category Management */}
          <AnimatePresence>
            {isManagingCategories && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="nordic-card p-4 space-y-4 bg-surface-variant/10 border-primary/10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">管理奖励类别</h4>
                    <button onClick={() => setIsManagingCategories(false)} className="text-on-surface-variant">
                      <MaterialIcon name="close" className="text-sm" />
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="新类别名称..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="flex-1 bg-surface-variant/50 border-none rounded-lg px-3 py-2 text-xs"
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg uppercase"
                    >
                      添加
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {state.rewardCategories.map(cat => (
                      <div key={cat} className="flex items-center gap-2 bg-surface-variant/50 px-3 py-1.5 rounded-lg border border-outline-variant/5">
                        <span className="text-xs font-bold">{cat}</span>
                        <button 
                          onClick={() => handleRemoveCategory(cat)}
                          className="text-on-surface-variant hover:text-error transition-colors"
                          disabled={state.rewardCategories.length <= 1}
                        >
                          <MaterialIcon name="close" className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedRewards.map((reward) => {
                const purchaseCount = getPurchaseCount(reward.id);
                const isOneTimeAndPurchased = !reward.isRepeatable && purchaseCount > 0;
                const isLevelLocked = reward.minLevel && userLevel < reward.minLevel;
                const isLocked = isLevelLocked || isOneTimeAndPurchased;
                const canAfford = balance >= reward.points;

                return (
                  <div 
                    key={reward.id} 
                    className={`bg-surface-low p-3 rounded-2xl space-y-3 relative overflow-hidden flex flex-col justify-between border border-outline-variant/5 ${isLocked ? 'opacity-60' : ''}`}
                  >
                    {isLevelLocked && (
                      <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-1">
                        <MaterialIcon name="lock" className="text-xl text-outline" />
                        <span className="font-headline font-bold text-[10px] tracking-widest uppercase text-outline">LV.{reward.minLevel}</span>
                      </div>
                    )}

                    {isOneTimeAndPurchased && (
                      <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-1">
                        <MaterialIcon name="check_circle" className="text-xl text-primary" />
                        <span className="font-headline font-bold text-[10px] tracking-widest uppercase text-primary">已兑换</span>
                      </div>
                    )}
                    
                    <div 
                      onClick={() => setActiveRewardId(activeRewardId === reward.id ? null : reward.id)}
                      className="relative aspect-square bg-surface-variant rounded-xl flex items-center justify-center text-primary group overflow-hidden cursor-pointer"
                    >
                      {reward.image ? (
                        <img src={reward.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <MaterialIcon name={reward.icon} className="text-3xl" />
                      )}
                      {reward.isRepeatable && purchaseCount > 0 && (
                        <div className="absolute bottom-1 right-1 bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                          x{purchaseCount}
                        </div>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenEditor(reward); }}
                        className={`absolute top-1 left-1 p-1.5 rounded-full bg-background/50 backdrop-blur-md transition-opacity text-outline hover:text-primary ${activeRewardId === reward.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <MaterialIcon name="edit" className="text-xs" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteReward(reward.id, e); }}
                        className={`absolute top-1 right-1 p-1.5 rounded-full bg-background/50 backdrop-blur-md transition-opacity text-outline hover:text-error ${activeRewardId === reward.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <MaterialIcon name={confirmDeleteId === reward.id ? 'done' : 'close'} className="text-xs" />
                      </button>
                    </div>
                    
                    <div className="space-y-0.5">
                      <h3 className="font-headline text-xs font-bold text-on-surface truncate">{reward.label}</h3>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${canAfford ? 'text-primary' : 'text-error'}`}>
                          {reward.points.toLocaleString()} <span className="text-[10px] opacity-60">分</span>
                        </p>
                        {!reward.isRepeatable && (
                          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter opacity-40">一次性</span>
                        )}
                      </div>
                    </div>

                    <button
                      disabled={isLocked || !canAfford}
                      onClick={() => handleRedeem(reward)}
                      className={`w-full py-2 rounded-lg font-bold text-xs transition-all ${isLocked || !canAfford ? 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed' : 'bg-primary text-on-primary hover:brightness-110 active:scale-95'}`}
                    >
                      {isLevelLocked ? '已锁定' : isOneTimeAndPurchased ? '已兑换' : !canAfford ? '积分不足' : '兑换'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Warehouse Tabs */}
          <div className="flex p-1 bg-surface-variant/30 rounded-xl w-fit border border-outline-variant/5">
            {[
              { id: 'unused', label: `待使用 (${state.redemptions.filter(r => !r.isUsed).length})`, icon: 'inventory_2' },
              { id: 'used', label: `已使用 (${state.redemptions.filter(r => r.isUsed).length})`, icon: 'history' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setWarehouseTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  warehouseTab === tab.id 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'text-on-surface-variant hover:bg-surface-variant/50'
                }`}
              >
                <MaterialIcon name={tab.icon} className="text-lg" />
                <span className="text-sm font-bold tracking-tight">{tab.label}</span>
              </button>
            ))}
          </div>

          {warehouseTab === 'unused' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {state.redemptions.filter(r => !r.isUsed).length === 0 ? (
                <div className="col-span-full p-12 text-center bg-surface-low/30 rounded-3xl border border-dashed border-outline-variant/20">
                  <MaterialIcon name="inventory_2" className="text-4xl text-outline/20 mb-2" />
                  <p className="text-on-surface-variant italic text-xs">仓库空空如也</p>
                </div>
              ) : (
                state.redemptions.filter(r => !r.isUsed).map((item) => {
                  const reward = state.rewards.find(r => r.id === item.rewardId);
                  return (
                    <div key={item.id} className="bg-surface-low p-3 rounded-2xl border border-outline-variant/5 flex flex-col gap-3 group hover:border-primary/20 transition-all">
                      <div className="aspect-square bg-surface-variant rounded-xl flex items-center justify-center text-primary relative overflow-hidden">
                        {reward?.image ? (
                          <img src={reward.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <>
                            <MaterialIcon name="redeem" className="text-3xl opacity-40" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <MaterialIcon name="inventory_2" className="text-xl" />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-on-surface truncate">{item.rewardName}</h3>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter opacity-60">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleUse(item.id, item.rewardName)}
                        className="w-full py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all"
                      >
                        立即使用
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {state.redemptions.filter(r => r.isUsed).length === 0 ? (
                <div className="col-span-full p-12 text-center bg-surface-low/30 rounded-3xl border border-dashed border-outline-variant/20">
                  <MaterialIcon name="history" className="text-4xl text-outline/20 mb-2" />
                  <p className="text-on-surface-variant italic text-xs">暂无使用记录</p>
                </div>
              ) : (
                state.redemptions.filter(r => r.isUsed).map((item) => {
                  const reward = state.rewards.find(r => r.id === item.rewardId);
                  return (
                    <div key={item.id} className="bg-surface-low/40 p-3 rounded-2xl border border-outline-variant/5 flex flex-col gap-3 opacity-60 grayscale-[0.5]">
                      <div className="aspect-square bg-surface-variant/50 rounded-xl flex items-center justify-center text-outline overflow-hidden">
                        {reward?.image ? (
                          <img src={reward.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <MaterialIcon name="check_circle" className="text-3xl" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-on-surface truncate">{item.rewardName}</h3>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">
                          使用于 {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteRedemption(item.id)}
                        className="w-full py-2 bg-surface-variant text-on-surface-variant text-xs font-bold rounded-lg hover:bg-error hover:text-on-error transition-all flex items-center justify-center gap-1"
                      >
                        <MaterialIcon name={confirmDeleteRedemptionId === item.id ? 'done' : 'delete'} className="text-xs" />
                        {confirmDeleteRedemptionId === item.id ? '确认' : '删除'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Reward Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[100] bg-background flex flex-col"
          >
            <header className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsEditing(false)} className="p-2 -ml-2 text-on-surface-variant hover:text-on-surface">
                  <MaterialIcon name="arrow_back" />
                </button>
                <h3 className="font-headline font-bold text-lg">{editingReward ? '编辑奖励' : '创建新奖励'}</h3>
              </div>
              <button 
                onClick={handleSaveReward}
                className="px-6 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                保存奖励
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 max-w-2xl mx-auto w-full space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-primary">奖励名称</label>
                  <input 
                    type="text"
                    placeholder="例如：看场电影..."
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full text-2xl font-headline font-bold bg-transparent border-b border-outline-variant/20 focus:border-primary focus:ring-0 px-0 py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-primary">奖励类别</label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {state.rewardCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setEditCategory(cat)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${editCategory === cat ? 'bg-primary text-on-primary' : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-bright'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-primary">所需积分</label>
                    <input 
                      type="number"
                      value={editPoints}
                      onChange={(e) => setEditPoints(Number(e.target.value))}
                      className="w-full bg-surface-variant/30 border-none rounded-xl px-4 py-3 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-primary">最低等级限制</label>
                    <input 
                      type="number"
                      value={editMinLevel}
                      onChange={(e) => setEditMinLevel(Number(e.target.value))}
                      className="w-full bg-surface-variant/30 border-none rounded-xl px-4 py-3 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-primary">封面展示</label>
                  <div className="flex gap-2 p-1 bg-surface-variant/30 rounded-xl w-fit">
                    <button 
                      onClick={() => setEditDisplayMode('icon')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${editDisplayMode === 'icon' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
                    >
                      图标
                    </button>
                    <button 
                      onClick={() => setEditDisplayMode('image')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${editDisplayMode === 'image' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
                    >
                      图片
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-surface-variant/30 flex items-center justify-center text-primary overflow-hidden border border-outline-variant/10">
                      {editDisplayMode === 'icon' ? (
                        <MaterialIcon name={editIcon} className="text-3xl" />
                      ) : (
                        editImage ? (
                          <img src={editImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <MaterialIcon name="image" className="text-3xl opacity-20" />
                        )
                      )}
                    </div>
                    <div className="flex-1">
                      {editDisplayMode === 'icon' ? (
                        <div className="grid grid-cols-6 gap-2 max-h-[120px] overflow-y-auto no-scrollbar p-1">
                          {REWARD_ICONS.map(icon => (
                            <button
                              key={icon}
                              onClick={() => setEditIcon(icon)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editIcon === icon ? 'bg-primary text-on-primary' : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'}`}
                            >
                              <MaterialIcon name={icon} className="text-sm" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="w-full py-4 bg-surface-variant/30 border border-dashed border-outline-variant/30 rounded-xl text-center text-xs font-bold text-on-surface-variant">
                            {editImage ? '点击更换图片' : '点击上传图片'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-variant/10 rounded-2xl border border-outline-variant/5">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">可重复购买</p>
                    <p className="text-xs text-on-surface-variant">关闭则为一次性奖励，兑换后将从商店下架</p>
                  </div>
                  <button 
                    onClick={() => setEditIsRepeatable(!editIsRepeatable)}
                    className={`w-12 h-6 rounded-full transition-all relative ${editIsRepeatable ? 'bg-primary' : 'bg-surface-variant'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${editIsRepeatable ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && successData && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-6 pointer-events-none">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-surface-low border border-primary/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto max-w-md w-full"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MaterialIcon name={successData.type === 'redeem' ? 'celebration' : 'check_circle'} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface">
                  {successData.type === 'redeem' ? '兑换成功！' : '已成功使用！'}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {successData.name} {successData.points ? `(-${successData.points} 分)` : ''}
                </p>
              </div>
              <button 
                onClick={handleUndo}
                className="px-3 py-1.5 bg-surface-variant text-on-surface-variant text-xs font-bold rounded-lg hover:bg-error hover:text-on-error transition-all"
              >
                撤回
              </button>
              <button 
                onClick={() => setShowSuccess(false)}
                className="p-1.5 text-outline hover:text-on-surface transition-colors"
              >
                <MaterialIcon name="close" className="text-sm" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Impulse Buffer */}
      <AnimatePresence>
        {showBuffer && pendingReward && (
          <ImpulseBuffer 
            itemName={pendingReward.label}
            onComplete={() => executeRedeem(pendingReward)}
            onCancel={() => {
              setShowBuffer(false);
              setPendingReward(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
