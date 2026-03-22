import React, { useState, useMemo } from 'react';
import { useCommanderStore } from '../store';
import { MaterialIcon } from './MaterialIcon';
import { motion, AnimatePresence } from 'motion/react';
import { DiaryEntry } from '../types';

export function Diary() {
  const { state, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry, updateConfig } = useCommanderStore();
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  
  // Detail View State
  const [viewingEntry, setViewingEntry] = useState<DiaryEntry | null>(null);
  
  // Category Management State
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('全部');
  const [showDrafts, setShowDrafts] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Confirmation State
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const filteredEntries = useMemo(() => {
    return state.diary.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           entry.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === '全部' || entry.category === filterCategory;
      const matchesDraftStatus = showDrafts ? entry.isDraft : !entry.isDraft;
      
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(entry.timestamp) >= new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(entry.timestamp) <= end;
      }
      
      return matchesSearch && matchesCategory && matchesDraftStatus && matchesDate;
    });
  }, [state.diary, searchQuery, filterCategory, showDrafts, startDate, endDate]);

  const handleOpenEditor = (entry?: DiaryEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setEditTitle(entry.title);
      setEditContent(entry.content);
      setEditCategory(entry.category);
    } else {
      setEditingEntry(null);
      setEditTitle('');
      setEditContent('');
      setEditCategory(state.diaryCategories?.[0] || '随笔');
    }
    setIsEditing(true);
  };

  const handleCloseEditor = () => {
    const hasChanges = editTitle.trim() !== (editingEntry?.title || '') || 
                      editContent.trim() !== (editingEntry?.content || '') ||
                      editCategory !== (editingEntry?.category || (state.diaryCategories?.[0] || '随笔'));
    
    if (hasChanges) {
      setShowCloseConfirm(true);
    } else {
      setIsEditing(false);
      setEditingEntry(null);
    }
  };

  const handleDiscardChanges = () => {
    setIsEditing(false);
    setEditingEntry(null);
    setShowCloseConfirm(false);
  };

  const handleSaveEntry = (asDraft: boolean = false) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    
    if (editingEntry) {
      updateDiaryEntry(editingEntry.id, {
        title: editTitle,
        content: editContent,
        category: editCategory,
        isDraft: asDraft
      });
    } else {
      addDiaryEntry(editTitle, editContent, editCategory, asDraft);
    }
    
    setIsEditing(false);
    setEditingEntry(null);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || state.diaryCategories.includes(newCategoryName.trim())) return;
    updateConfig({ diaryCategories: [...state.diaryCategories, newCategoryName.trim()] });
    setNewCategoryName('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (state.diaryCategories.length <= 1) return;
    updateConfig({ diaryCategories: state.diaryCategories.filter(c => c !== cat) });
    if (filterCategory === cat) setFilterCategory('全部');
  };

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-headline text-2xl font-bold text-on-surface">日志</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
            <input 
              type="text"
              placeholder="搜索日志..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-variant/30 border border-outline-variant/10 rounded-xl text-sm focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <button 
            onClick={() => handleOpenEditor()}
            className="flex-shrink-0 w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <MaterialIcon name="add" />
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex p-1 bg-surface-variant/30 rounded-xl w-fit border border-outline-variant/5">
            <button
              onClick={() => setShowDrafts(false)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!showDrafts ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
            >
              已发布
            </button>
            <button
              onClick={() => setShowDrafts(true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${showDrafts ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
            >
              草稿箱
            </button>
          </div>
          
          <button 
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${isFiltersExpanded ? 'bg-primary/10 text-primary' : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'}`}
          >
            <MaterialIcon name="filter_list" className="text-sm" />
            筛选
            <MaterialIcon name={isFiltersExpanded ? "expand_less" : "expand_more"} className="text-sm" />
          </button>
        </div>

        <AnimatePresence>
          {isFiltersExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {['全部', ...state.diaryCategories].map(cat => {
                  const isNegative = cat === 'Negative' || cat === '负面';
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                        filterCategory === cat 
                          ? (isNegative ? 'bg-error text-on-error' : 'bg-primary text-on-primary') 
                          : (isNegative ? 'bg-error/10 text-error hover:bg-error/20' : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-bright')
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setIsManagingCategories(!isManagingCategories)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isManagingCategories ? 'bg-primary/20 text-primary' : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50'}`}
                >
                  <MaterialIcon name="settings" className="text-sm" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 p-4 bg-surface-variant/20 rounded-2xl border border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest">期间:</span>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-surface-variant/50 border-none rounded-lg px-2 py-1 text-xs text-on-surface focus:ring-1 focus:ring-primary/40"
                  />
                  <span className="text-xs text-outline">至</span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-surface-variant/50 border-none rounded-lg px-2 py-1 text-xs text-on-surface focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                  >
                    重置日期
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">管理日志类别</h4>
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
                  className="px-4 py-2 bg-primary text-on-primary text-[10px] font-bold rounded-lg uppercase"
                >
                  添加
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {state.diaryCategories.map(cat => (
                  <div key={cat} className="flex items-center gap-2 bg-surface-variant/50 px-3 py-1.5 rounded-lg border border-outline-variant/5">
                    <span className="text-[10px] font-bold">{cat}</span>
                    <button 
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-on-surface-variant hover:text-error transition-colors"
                      disabled={state.diaryCategories.length <= 1}
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

      {/* Diary List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredEntries.map(entry => (
            <motion.div 
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="nordic-card p-6 group hover:border-primary/20 transition-all cursor-pointer"
              onClick={() => setViewingEntry(entry)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded">
                      {entry.category}
                    </span>
                    <span className="text-[9px] text-on-surface-variant font-medium">
                      {new Date(entry.timestamp).toLocaleString('zh-CN', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <h4 className="font-headline font-bold text-on-surface leading-tight">{entry.title}</h4>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenEditor(entry); }}
                    className="p-2 text-outline hover:text-primary transition-all"
                  >
                    <MaterialIcon name="edit" className="text-lg" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteDiaryEntry(entry.id); }}
                    className="p-2 text-outline hover:text-error transition-all"
                  >
                    <MaterialIcon name="delete" className="text-lg" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                {entry.content}
              </p>
              {entry.updatedAt && (
                <p className="mt-4 text-[9px] text-on-surface-variant/40 italic">
                  最后修改于: {new Date(entry.updatedAt).toLocaleString()}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 opacity-40">
            <MaterialIcon name="history_edu" className="text-6xl" />
            <p className="text-sm font-medium">暂无相关日志记录</p>
          </div>
        )}
      </div>

      {/* Full Screen Editor */}
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
                <button onClick={handleCloseEditor} className="p-2 -ml-2 text-on-surface-variant hover:text-on-surface">
                  <MaterialIcon name="arrow_back" />
                </button>
                <h3 className="font-headline font-bold text-lg">{editingEntry ? '编辑日志' : '撰写新日志'}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleSaveEntry(true)}
                  className="px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl transition-all"
                >
                  存为草稿
                </button>
                <button 
                  onClick={() => handleSaveEntry(false)}
                  className="px-6 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  发布日志
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full space-y-8">
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                  {state.diaryCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setEditCategory(cat)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${editCategory === cat ? 'bg-primary text-on-primary' : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-bright'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input 
                  type="text"
                  placeholder="输入标题..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-3xl md:text-5xl font-headline font-black bg-transparent border-none focus:ring-0 placeholder:opacity-20"
                />
              </div>

              <textarea 
                placeholder="在此记录您的思考..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-[60vh] text-lg bg-transparent border-none focus:ring-0 resize-none placeholder:opacity-20 leading-relaxed"
              />
            </div>

            {/* Close Confirmation Modal */}
            <AnimatePresence>
              {showCloseConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-xl flex items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="nordic-card max-w-sm w-full p-8 space-y-6"
                  >
                    <div className="space-y-2">
                      <h4 className="font-headline text-xl font-bold text-on-surface">未保存的更改</h4>
                      <p className="text-sm text-on-surface-variant">您有未保存的更改，是否要存为草稿？</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleSaveEntry(true)}
                        className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl text-sm shadow-lg shadow-primary/20"
                      >
                        存为草稿并退出
                      </button>
                      <button 
                        onClick={handleDiscardChanges}
                        className="w-full py-3 bg-error/10 text-error font-bold rounded-xl text-sm hover:bg-error/20 transition-all"
                      >
                        放弃更改并退出
                      </button>
                      <button 
                        onClick={() => setShowCloseConfirm(false)}
                        className="w-full py-3 bg-surface-variant text-on-surface-variant font-bold rounded-xl text-sm hover:bg-surface-bright transition-all"
                      >
                        继续编辑
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail View Modal */}
      <AnimatePresence>
        {viewingEntry && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setViewingEntry(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="nordic-card max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8 md:p-12 space-y-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                      {viewingEntry.category}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      {new Date(viewingEntry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="font-headline text-3xl font-black text-on-surface">{viewingEntry.title}</h2>
                </div>
                <button onClick={() => setViewingEntry(null)} className="p-2 text-on-surface-variant hover:text-error">
                  <MaterialIcon name="close" className="text-2xl" />
                </button>
              </div>

              <div className="prose prose-sm max-w-none text-on-surface-variant leading-relaxed whitespace-pre-wrap text-lg">
                {viewingEntry.content}
              </div>

              <div className="pt-8 border-t border-outline-variant/10 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-on-surface-variant/40 uppercase font-bold">最初发布于: {new Date(viewingEntry.timestamp).toLocaleString()}</p>
                  {viewingEntry.updatedAt && (
                    <p className="text-[10px] text-primary/60 uppercase font-bold">最后修改于: {new Date(viewingEntry.updatedAt).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { handleOpenEditor(viewingEntry); setViewingEntry(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-variant text-on-surface text-xs font-bold rounded-xl hover:bg-surface-bright transition-all"
                  >
                    <MaterialIcon name="edit" className="text-sm" />
                    编辑
                  </button>
                  <button 
                    onClick={() => { deleteDiaryEntry(viewingEntry.id); setViewingEntry(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error text-xs font-bold rounded-xl hover:bg-error/20 transition-all"
                  >
                    <MaterialIcon name="delete" className="text-sm" />
                    删除
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
