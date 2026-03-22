import React, { useState, useEffect, useRef } from 'react';
import { CommandCenter } from './components/CommandCenter';
import { RewardStore } from './components/RewardStore';
import { Diary } from './components/Diary';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { useCommanderStore } from './store';
import { getLevel, getLevelTitle, getNextLevelProgress } from './types';
import { MaterialIcon } from './components/MaterialIcon';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

const ENCOURAGING_QUOTES = [
  "卓越不是一个行为，而是一个习惯。",
  "每一次克制，都是对灵魂的洗礼。",
  "指挥官，您的意志力正在重塑这个世界。",
  "自律是通往自由的唯一阶梯。",
  "您已经超越了昨天的自己，继续前进！",
  "伟大的事业始于微小的坚持。",
  "强者不是没有眼泪，而是含着眼泪奔跑。",
  "您的每一次进步，都在为未来的成功加冕。"
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'Command' | 'Store' | 'Diary' | 'Analytics' | 'Settings'>('Command');
  const { state, balance } = useCommanderStore();
  
  const userLevel = getLevel(state.totalPoints, state.levelTargets);
  const levelTitle = getLevelTitle(userLevel, state.levelTargets);
  const progress = getNextLevelProgress(state.totalPoints, state.levelTargets);

  // Apply appearance settings
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', state.appearance?.theme || 'bright');
    root.setAttribute('data-font-family', state.appearance?.fontFamily || 'sans');
    root.setAttribute('data-font-size', state.appearance?.fontSize || 'medium');
  }, [state.appearance]);

  // Level Up Detection
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(userLevel);
  const [currentQuote, setCurrentQuote] = useState("");
  const initialMount = useRef(true);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    if (userLevel > prevLevel) {
      setCurrentQuote(ENCOURAGING_QUOTES[Math.floor(Math.random() * ENCOURAGING_QUOTES.length)]);
      setShowLevelUp(true);
      
      // Celebration!
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
    setPrevLevel(userLevel);
  }, [userLevel, prevLevel]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Command': return <CommandCenter />;
      case 'Store': return <RewardStore />;
      case 'Diary': return <Diary />;
      case 'Analytics': return <Analytics />;
      case 'Settings': return <Settings />;
      default: return <CommandCenter />;
    }
  };

  const tabLabels: Record<string, string> = {
    Command: '指挥中心',
    Store: '奖励商店',
    Diary: '日志',
    Analytics: '数据分析',
    Settings: '系统设置'
  };

  return (
    <div className="min-h-screen pt-20 pb-32 md:pb-0">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-background/70 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-outline-variant/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-inner">
            <MaterialIcon name="military_tech" className="text-2xl fill-1" />
          </div>
          <h1 className="font-headline font-bold tracking-tight text-on-surface text-xl">PFC 指挥官</h1>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-6">
            {(['Command', 'Store', 'Diary', 'Analytics', 'Settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-headline font-bold text-sm tracking-wide transition-colors ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </nav>
          <div className="text-primary text-sm font-headline font-bold tracking-tighter bg-surface-variant px-4 py-1.5 rounded-full">
            等级 {userLevel} • {state.totalPoints.toLocaleString()} 累积积分
          </div>
        </div>

        <div className="md:hidden text-primary text-sm font-headline font-bold tracking-tighter">
          等级 {userLevel} • {state.totalPoints.toLocaleString()} 累积积分
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-4 md:py-8 space-y-6">
        {/* Cognitive Status Hero - Compressed */}
        {(activeTab === 'Command' || activeTab === 'Settings') && (
          <section className="bg-surface-low/40 p-5 rounded-2xl border border-outline-variant/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-secondary font-label tracking-[0.2em] uppercase text-xs font-bold">当前等级状态</p>
                  <span className="text-xs font-headline font-bold text-primary">LV.{userLevel} {levelTitle}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h2 className="font-headline text-3xl font-extrabold text-on-background tracking-tighter">
                    {balance.toLocaleString()}
                  </h2>
                  <span className="text-primary/40 text-sm font-bold">当前余额</span>
                </div>
              </div>
              
              <div className="flex-1 max-w-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <span>升级进度</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-fixed-dim rounded-full transition-all duration-1000" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {renderContent()}
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-background/70 backdrop-blur-xl border-t border-outline-variant/15 flex justify-around items-center px-4 pb-6 pt-2 md:hidden">
        {[
          { id: 'Command', icon: 'dashboard', label: '指挥' },
          { id: 'Store', icon: 'payments', label: '商店' },
          { id: 'Diary', icon: 'history_edu', label: '日志' },
          { id: 'Analytics', icon: 'insights', label: '分析' },
          { id: 'Settings', icon: 'settings', label: '设置' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-all ${activeTab === tab.id ? 'bg-surface-variant text-primary rounded-xl scale-95' : 'text-on-surface-variant'}`}
          >
            <MaterialIcon name={tab.icon} className={activeTab === tab.id ? 'fill-1' : ''} />
            <span className="font-label text-xs font-medium tracking-wide uppercase mt-1">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Level Up Modal */}
      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              className="relative max-w-lg w-full nordic-card p-12 text-center space-y-8 overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />

              <div className="space-y-4 relative">
                <motion.div 
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-6"
                >
                  <MaterialIcon name="military_tech" className="text-5xl" />
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="font-headline text-4xl font-black text-on-surface tracking-tighter uppercase">晋升成功</h2>
                  <p className="text-primary font-headline font-bold tracking-[0.3em] uppercase text-sm">Level Up Detected</p>
                </div>
              </div>

              <div className="py-8 border-y border-outline-variant/10 space-y-2">
                <p className="text-outline text-xs font-black uppercase tracking-widest">获得新军衔</p>
                <h3 className="font-headline text-3xl font-bold text-on-surface">
                  LV.{userLevel} <span className="text-primary">{levelTitle}</span>
                </h3>
              </div>

              <div className="space-y-4">
                <MaterialIcon name="format_quote" className="text-3xl text-primary/20" />
                <p className="text-lg font-medium text-on-surface-variant italic leading-relaxed px-4">
                  “{currentQuote}”
                </p>
              </div>

              <button 
                onClick={() => setShowLevelUp(false)}
                className="w-full py-5 bg-primary text-on-primary text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/30 hover:brightness-110 transition-all active:scale-95"
              >
                继续前进，指挥官
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decorative Zen Elements */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
