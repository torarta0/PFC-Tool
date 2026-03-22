import React, { useState } from 'react';
import { useCommanderStore } from '../store';
import { MaterialIcon } from './MaterialIcon';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { motion } from 'motion/react';
import { 
  startOfDay, format, subDays, isSameDay, isSameMonth, subMonths,
  startOfWeek, startOfMonth, startOfYear, eachDayOfInterval, eachMonthOfInterval
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const Analytics: React.FC = () => {
  const { state } = useCommanderStore();
  const [activeTab, setActiveTab] = useState<'Actions' | 'Redemptions'>('Actions');
  const [timeRange, setTimeRange] = useState('Week');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const now = new Date();
  const getTimeContextLabel = () => {
    switch (timeRange) {
      case 'Day': return format(now, 'yyyy年MM月dd日');
      case 'Week': return `${format(startOfWeek(now, { weekStartsOn: 1 }), 'MM/dd')} - ${format(now, 'MM/dd')}`;
      case 'Month': return format(now, 'yyyy年MM月');
      case 'Year': return format(now, 'yyyy年');
      default: return '';
    }
  };

  // Prepare data for Action Analytics based on timeRange
  const getTrendData = () => {
    const now = new Date();
    let data: { name: string; points: number }[] = [];

    const filteredLogs = selectedCategory === '全部' 
      ? state.logs 
      : state.logs.filter(log => log.category === selectedCategory);

    switch (timeRange) {
      case 'Day':
        const dayStart = startOfDay(now);
        // Show full 24 hours for today
        const hours = Array.from({ length: 24 }, (_, i) => i);
        data = hours.map(hour => {
          const points = filteredLogs
            .filter(log => {
              const logDate = new Date(log.timestamp);
              return isSameDay(logDate, dayStart) && logDate.getHours() === hour;
            })
            .reduce((acc, log) => acc + log.points, 0);
          return { name: `${hour}:00`, points };
        });
        break;

      case 'Week':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({ start: weekStart, end: now });
        const dayNames: Record<string, string> = {
          'Mon': '周一', 'Tue': '周二', 'Wed': '周三', 'Thu': '周四', 'Fri': '周五', 'Sat': '周六', 'Sun': '周日'
        };
        data = weekDays.map(date => ({
          name: dayNames[format(date, 'EEE')] || format(date, 'EEE'),
          points: filteredLogs
            .filter(log => isSameDay(new Date(log.timestamp), date))
            .reduce((acc, log) => acc + log.points, 0)
        }));
        break;

      case 'Month':
        const monthStart = startOfMonth(now);
        const monthDays = eachDayOfInterval({ start: monthStart, end: now });
        data = monthDays.map(date => ({
          name: format(date, 'd'),
          points: filteredLogs
            .filter(log => isSameDay(new Date(log.timestamp), date))
            .reduce((acc, log) => acc + log.points, 0)
        }));
        break;

      case 'Year':
        const yearStart = startOfYear(now);
        const yearMonths = eachMonthOfInterval({ start: yearStart, end: now });
        data = yearMonths.map(date => ({
          name: format(date, 'MMM', { locale: zhCN }),
          points: filteredLogs
            .filter(log => isSameMonth(new Date(log.timestamp), date))
            .reduce((acc, log) => acc + log.points, 0)
        }));
        break;
    }
    return data;
  };

  const trendData = getTrendData();

  const categoryData = Array.from(new Set(state.logs.map(log => log.category))).map(cat => {
    const total = state.logs
      .filter(log => log.category === cat)
      .reduce((acc, log) => acc + Math.abs(log.points), 0);
    return { name: cat, value: total };
  }).filter(d => d.value > 0);

  const COLORS = ['#97cfe0', '#79a6a5', '#d2eeb9', '#a5ddee', '#ee7d77', '#f2c94c', '#eb5757'];

  // Prepare data for Redemption Analytics
  const getRedemptionTrendData = () => {
    const now = new Date();
    let data: { name: string; points: number }[] = [];

    switch (timeRange) {
      case 'Day':
        const dayStart = startOfDay(now);
        // Show full 24 hours for today
        const hours = Array.from({ length: 24 }, (_, i) => i);
        data = hours.map(hour => {
          const points = state.redemptions
            .filter(r => {
              const rDate = new Date(r.timestamp);
              return isSameDay(rDate, dayStart) && rDate.getHours() === hour;
            })
            .reduce((acc, r) => acc + r.pointsSpent, 0);
          return { name: `${hour}:00`, points };
        });
        break;

      case 'Week':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({ start: weekStart, end: now });
        const dayNames: Record<string, string> = {
          'Mon': '周一', 'Tue': '周二', 'Wed': '周三', 'Thu': '周四', 'Fri': '周五', 'Sat': '周六', 'Sun': '周日'
        };
        data = weekDays.map(date => ({
          name: dayNames[format(date, 'EEE')] || format(date, 'EEE'),
          points: state.redemptions
            .filter(r => isSameDay(new Date(r.timestamp), date))
            .reduce((acc, r) => acc + r.pointsSpent, 0)
        }));
        break;

      case 'Month':
        const monthStart = startOfMonth(now);
        const monthDays = eachDayOfInterval({ start: monthStart, end: now });
        data = monthDays.map(date => ({
          name: format(date, 'd'),
          points: state.redemptions
            .filter(r => isSameDay(new Date(r.timestamp), date))
            .reduce((acc, r) => acc + r.pointsSpent, 0)
        }));
        break;

      case 'Year':
        const yearStart = startOfYear(now);
        const yearMonths = eachMonthOfInterval({ start: yearStart, end: now });
        data = yearMonths.map(date => ({
          name: format(date, 'MMM', { locale: zhCN }),
          points: state.redemptions
            .filter(r => isSameMonth(new Date(r.timestamp), date))
            .reduce((acc, r) => acc + r.pointsSpent, 0)
        }));
        break;
    }
    return data;
  };

  const redemptionTrendData = getRedemptionTrendData();

  const redemptionCategoryData = Array.from(new Set(state.redemptions.map(r => r.category))).map(cat => {
    const total = state.redemptions
      .filter(r => r.category === cat)
      .reduce((acc, r) => acc + r.pointsSpent, 0);
    return { name: cat, value: total };
  }).filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-background">指挥分析</h2>
          <p className="text-secondary font-label tracking-widest text-[10px] uppercase font-bold">系统概览</p>
        </div>
        <div className="bg-surface-low p-1 rounded-lg flex items-center">
          {[
            { id: 'Day', label: '当天' },
            { id: 'Week', label: '当周' },
            { id: 'Month', label: '当月' },
            { id: 'Year', label: '当年' }
          ].map(range => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${timeRange === range.id ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-6 border-b border-outline-variant/10 overflow-x-auto no-scrollbar px-1">
        {[
          { id: 'Actions', label: '行为统计', icon: 'insights' },
          { id: 'Redemptions', label: '奖励兑换', icon: 'redeem' }
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

      {activeTab === 'Actions' && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['全部', ...state.categories].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${selectedCategory === cat ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant border border-transparent'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'Actions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 bg-surface-low p-4 rounded-2xl border border-outline-variant/5">
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-0.5">
                <h3 className="font-headline text-sm font-bold text-on-surface">积分累积趋势</h3>
                <p className="text-[10px] text-outline font-medium">{getTimeContextLabel()}</p>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#97cfe0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#97cfe0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#38486410" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9babcc', fontSize: 8, fontWeight: 'bold' }}
                    dy={5}
                    interval={timeRange === 'Month' || timeRange === 'Day' ? 'preserveStartEnd' : 0}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1c1e', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#97cfe0' }}
                  />
                  <Area type="monotone" dataKey="points" stroke="#97cfe0" fillOpacity={1} fill="url(#colorPoints)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="lg:col-span-4 bg-surface-low p-4 rounded-2xl border border-outline-variant/5">
            <h3 className="font-headline text-sm font-bold text-on-surface mb-4">类别分布</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1c1e', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] text-on-surface-variant truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 bg-surface-low p-4 rounded-2xl border border-outline-variant/5">
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-0.5">
                <h3 className="font-headline text-sm font-bold text-on-surface">兑换消耗趋势</h3>
                <p className="text-[10px] text-outline font-medium">{getTimeContextLabel()}</p>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={redemptionTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#79a6a5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#79a6a5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#38486410" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9babcc', fontSize: 8, fontWeight: 'bold' }}
                    dy={5}
                    interval={timeRange === 'Month' || timeRange === 'Day' ? 'preserveStartEnd' : 0}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1c1e', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#79a6a5' }}
                  />
                  <Area type="monotone" dataKey="points" stroke="#79a6a5" fillOpacity={1} fill="url(#colorSpent)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="lg:col-span-4 bg-surface-low p-4 rounded-2xl border border-outline-variant/5">
            <h3 className="font-headline text-sm font-bold text-on-surface mb-4">兑换类别分布</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={redemptionCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {redemptionCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1c1e', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {redemptionCategoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                  <span className="text-[10px] text-on-surface-variant truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
