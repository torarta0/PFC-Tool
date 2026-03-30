import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from './MaterialIcon';

interface ImpulseBufferProps {
  onComplete: () => void;
  onCancel: () => void;
  itemName: string;
}

export const ImpulseBuffer: React.FC<ImpulseBufferProps> = ({ onComplete, onCancel, itemName }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [step, setStep] = useState<'breathing' | 'qa'>('breathing');
  const [answer, setAnswer] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsFinished(true);
    }
  }, [timeLeft, isFinished]);

  const questions = [
    "这个奖励能给你的长期目标带来什么价值？",
    "如果你现在不兑换，10分钟后的你会觉得后悔吗？",
    "你现在的压力水平（1-10）是多少？这个行为是在逃避压力吗？",
    "今天你已经完成了哪些值得奖励的事情？"
  ];
  const [currentQuestion] = useState(questions[Math.floor(Math.random() * questions.length)]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-surface-low border border-outline-variant/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8 text-center"
      >
        <div className="space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
            <MaterialIcon name="timer" className="text-3xl animate-pulse" />
          </div>
          <h2 className="font-headline text-2xl font-black text-on-surface tracking-tight">冲动抑制缓冲区</h2>
          <p className="text-sm text-on-surface-variant font-medium">
            正在为 <span className="text-primary font-bold">“{itemName}”</span> 进行冷静处理
          </p>
        </div>

        {/* Timer Circle */}
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-surface-variant"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="60"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={377}
              animate={{ strokeDashoffset: 377 * (1 - timeLeft / 60) }}
              className="text-primary"
            />
          </svg>
          <span className="absolute font-headline text-3xl font-black text-on-surface">{timeLeft}s</span>
        </div>

        <div className="space-y-6">
          {timeLeft > 30 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-primary font-bold uppercase tracking-widest text-xs">深呼吸引导</p>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-lg font-medium text-on-surface"
              >
                {timeLeft % 8 < 4 ? '吸气...' : '呼气...'}
              </motion.div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-primary font-bold uppercase tracking-widest text-xs">理性问答</p>
              <p className="text-sm font-medium text-on-surface leading-relaxed italic">
                “{currentQuestion}”
              </p>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="在此输入你的思考..."
                className="w-full bg-surface-variant/30 border border-outline-variant/20 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary/50 transition-colors h-24 resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 rounded-2xl border border-outline-variant/20 text-xs font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant/20 transition-all"
          >
            取消兑换
          </button>
          <button
            disabled={!isFinished}
            onClick={onComplete}
            className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              isFinished 
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/30 active:scale-95' 
                : 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'
            }`}
          >
            确认兑换
          </button>
        </div>
      </motion.div>
    </div>
  );
};
