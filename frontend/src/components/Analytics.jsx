import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  ArrowLeft,
  Award,
  Flame
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, TimeScale, Filler);
import ProjectAnalytics from './ProjectAnalytics';

const Analytics = ({ onBack }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/analytics?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStreakDays = () => {
    if (!analytics?.recentSessions) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasSessionOnDay = analytics.recentSessions.some(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate.toDateString() === checkDate.toDateString();
      });
      
      if (hasSessionOnDay) {
        streak++;
      } else if (i === 0) {
        // If no session today, check yesterday
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getProductivityScore = () => {
    if (!analytics) return 0;
    
    const avgSessionLength = analytics.totalSessions > 0 
      ? analytics.totalFocusTime / analytics.totalSessions 
      : 0;
    
    const streakBonus = getStreakDays() * 10;
    const consistencyBonus = analytics.totalSessions >= 7 ? 20 : 0;
    
    return Math.min(100, Math.round(avgSessionLength + streakBonus + consistencyBonus));
  };

  const productivityScore = getProductivityScore();
  const streakDays = getStreakDays();

  // Charts data
  const dailyLine = useMemo(() => {
    if (!analytics?.dailyFocus) return null;
    const labels = analytics.dailyFocus.map(d => new Date(d.date).toLocaleDateString());
    const data = analytics.dailyFocus.map(d => d.minutes);
    return {
      labels,
      datasets: [
        {
          label: 'Minutes focused',
          data,
          fill: true,
          tension: 0.35,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          pointRadius: 2
        }
      ]
    };
  }, [analytics]);

  const hourlyBar = useMemo(() => {
    if (!analytics?.hourlyDistribution) return null;
    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Sessions',
          data: analytics.hourlyDistribution,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)'
        }
      ]
    };
  }, [analytics]);

  const projectDoughnut = useMemo(() => {
    if (!analytics?.projectFocus?.length) return null;
    const top = analytics.projectFocus.slice(0, 6);
    return {
      labels: top.map(p => p.name),
      datasets: [
        {
          data: top.map(p => Math.max(1, Math.round(p.totalMinutes))),
          backgroundColor: ['#34d399','#60a5fa','#fbbf24','#f472b6','#a78bfa','#f87171']
        }
      ]
    };
  }, [analytics]);

  const lengthBar = useMemo(() => {
    if (!analytics?.sessionLengthHistogram) return null;
    return {
      labels: analytics.sessionLengthHistogram.labels,
      datasets: [
        {
          label: 'Sessions',
          data: analytics.sessionLengthHistogram.counts,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgba(16, 185, 129, 1)'
        }
      ]
    };
  }, [analytics]);

  // Stacked per-project daily bar
  const stackedBar = useMemo(() => {
    if (!analytics?.perProjectDaily) return null;
    const { dates, series } = analytics.perProjectDaily;
    const palette = ['#34d399','#60a5fa','#fbbf24','#f472b6','#a78bfa','#f87171','#10b981','#3b82f6','#f59e0b'];
    return {
      labels: dates.map(d => new Date(d).toLocaleDateString()),
      datasets: series.map((s, idx) => ({
        label: s.name,
        data: s.data,
        backgroundColor: palette[idx % palette.length]
      }))
    };
  }, [analytics]);

  // Calendar heatmap data (simple monthly grid using dailyFocus)
  const heatmapData = useMemo(() => {
    if (!analytics?.dailyFocus?.length) return null;
    return analytics.dailyFocus; // [{date, minutes}]
  }, [analytics]);

  // Dynamic unit helpers (minutes -> h or m)
  const unitFor = (values) => {
    const max = Math.max(0, ...values);
    if (max >= 60 * 6) {
      return { unit: 'h', factor: 60, tickFmt: (v)=>`${v}h`, tipFmt: (v)=>`${v.toFixed(1)} h` };
    }
    return { unit: 'm', factor: 1, tickFmt: (v)=>`${v}m`, tipFmt: (v)=>`${v} m` };
  };

  return (
    <div className="min-h-screen p-6">
      {loading ? (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-500"></div>
        </div>
      ) : (
        <>
      {selectedProject ? (
        <ProjectAnalytics project={selectedProject} onBack={() => setSelectedProject(null)} />
      ) : (
        <>
      {/* Header */}
      <motion.header 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <motion.button
            onClick={onBack}
            className="zen-button-secondary p-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-zen-800 flex items-center gap-3">
              <BarChart3 className="text-nature-500" />
              Analytics Dashboard
            </h1>
            <p className="text-zen-600">Track your focus journey and plant growth</p>
          </div>
        </div>
      </motion.header>

      {/* Range selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-zen-600">Range:</span>
        <div className="flex gap-2">
          {[7,14,30].map(r => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`px-3 py-1 rounded-lg text-sm ${days===r?'bg-nature-500 text-white':'bg-zen-100 text-zen-700 hover:bg-zen-200'}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Focus Time */}
        <motion.div
          className="zen-card p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Clock className="w-8 h-8 text-nature-500 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-zen-800 mb-1">
            {formatDuration(analytics?.totalFocusTime || 0)}
          </h3>
          <p className="text-zen-600 text-sm">Total Focus Time</p>
        </motion.div>

        {/* Total Sessions */}
        <motion.div
          className="zen-card p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Target className="w-8 h-8 text-blue-500 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-zen-800 mb-1">
            {analytics?.totalSessions || 0}
          </h3>
          <p className="text-zen-600 text-sm">Total Sessions</p>
        </motion.div>

        {/* Streak */}
        <motion.div
          className="zen-card p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Flame className="w-8 h-8 text-orange-500 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-zen-800 mb-1">
            {streakDays}
          </h3>
          <p className="text-zen-600 text-sm">Day Streak</p>
        </motion.div>

        {/* Productivity Score */}
        <motion.div
          className="zen-card p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Award className="w-8 h-8 text-purple-500 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-zen-800 mb-1">
            {productivityScore}
          </h3>
          <p className="text-zen-600 text-sm">Productivity Score</p>
        </motion.div>
      </div>

      {/* Focus over time */}
      {dailyLine && (() => {
        const u = unitFor(dailyLine.datasets[0].data);
        const lineOptions = {
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx)=> u.tipFmt(ctx.parsed.y) } } },
          scales: { y: { ticks: { callback: (v)=> u.tickFmt(v) } } }
        };
        return (
        <motion.div className="zen-card p-6 mb-8" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <h2 className="text-xl font-semibold text-zen-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-nature-500" />
            Focus Trend (minutes)
          </h2>
          <Line data={dailyLine} options={lineOptions} />
        </motion.div>
        );
      })()}

      {/* Distribution + Project split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {hourlyBar && (
          <motion.div className="zen-card p-6" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            <h2 className="text-xl font-semibold text-zen-800 mb-4">Hourly Session Distribution</h2>
            <Bar data={hourlyBar} options={{responsive:true, plugins:{legend:{display:false}}}} />
          </motion.div>
        )}
        {projectDoughnut && (
          <motion.div className="zen-card p-6" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            <h2 className="text-xl font-semibold text-zen-800 mb-4">Time by Project (top)</h2>
            <Doughnut data={projectDoughnut} />
          </motion.div>
        )}
      </div>

      {/* Session length buckets */}
      {lengthBar && (()=>{
        const u = unitFor(lengthBar.datasets[0].data);
        const options = { responsive:true, plugins:{legend:{display:false}, tooltip:{callbacks:{label:(ctx)=>`Sessions: ${ctx.parsed.y}`}}}, scales:{ y: { ticks:{ callback:(v)=>v } } } };
        return (
        <motion.div className="zen-card p-6 mb-8" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <h2 className="text-xl font-semibold text-zen-800 mb-4">Session Length Distribution</h2>
          <Bar data={lengthBar} options={{responsive:true, plugins:{legend:{display:false}}}} />
        </motion.div>
        );
      })()}

      {/* Stacked per-project daily minutes */}
      {stackedBar && (()=>{
        const totals = stackedBar.datasets.reduce((acc,ds)=>acc.map((v,i)=>v+(ds.data[i]||0)), Array.from({length: stackedBar.labels.length}, ()=>0));
        const u = unitFor(totals);
        const options = { responsive:true, plugins:{legend:{position:'bottom'}, tooltip:{callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${u.tipFmt(ctx.parsed.y)}`}}}, scales:{ x:{ stacked:true }, y:{ stacked:true, ticks:{ callback:(v)=> u.tickFmt(v) } } } };
        return (
        <motion.div className="zen-card p-6 mb-8" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <h2 className="text-xl font-semibold text-zen-800 mb-4">Daily Minutes by Project</h2>
          <Bar data={stackedBar} options={options} />
        </motion.div>
        );
      })()}

      {/* Calendar heatmap (simple grid) */}
      {heatmapData && (
        <motion.div className="zen-card p-6 mb-8" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <h2 className="text-xl font-semibold text-zen-800 mb-4">Calendar Heatmap</h2>
          <div className="grid grid-cols-14 gap-1">
            {heatmapData.map((d) => {
              const m = d.minutes || 0;
              const intensity = Math.min(1, m / 60); // up to 60m per day highlights
              const bg = `rgba(52, 211, 153, ${0.1 + intensity*0.7})`;
              return (
                <div key={d.date} title={`${new Date(d.date).toLocaleDateString()} • ${m}m`} className="w-5 h-5 rounded" style={{backgroundColor: bg}} />
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Plant Statistics */}
      <motion.div
        className="zen-card p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-xl font-semibold text-zen-800 mb-4 flex items-center gap-2">
          <TrendingUp className="text-nature-500" />
          Your Garden Overview
        </h2>
        
        {analytics?.projectStats?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.projectStats.map((project) => (
              <motion.div
                key={project.id}
                className="bg-nature-50 rounded-lg p-4 cursor-pointer hover:shadow-md"
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-zen-800">{project.name}</h3>
                  <span className="text-xs px-2 py-1 bg-nature-200 text-nature-800 rounded-full capitalize">
                    {project.plantType.toLowerCase()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zen-600">Health:</span>
                    <span className={`font-medium ${
                      project.health >= 80 ? 'text-nature-600' :
                      project.health >= 60 ? 'text-nature-500' :
                      project.health >= 40 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {project.health}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-zen-200 rounded-full h-2">
                    <motion.div
                      className="bg-nature-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${project.health}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-zen-600">Sessions:</span>
                    <span className="font-medium text-zen-700">
                      {project._count?.focusSessions || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🌱</div>
            <p className="text-zen-600">No plants in your garden yet!</p>
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className="zen-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h2 className="text-xl font-semibold text-zen-800 mb-4 flex items-center gap-2">
          <Calendar className="text-nature-500" />
          Recent Focus Sessions
        </h2>
        
        {analytics?.recentSessions?.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentSessions.slice(0, 10).map((session, index) => (
              <motion.div
                key={session.id}
                className="flex items-center justify-between p-3 bg-zen-50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-nature-500 rounded-full"></div>
                  <div>
                    <span className="font-medium text-zen-800">{session.project.name}</span>
                    <p className="text-sm text-zen-600">
                      {formatDuration(session.durationMinutes || 0)} • {session.sessionType.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zen-600">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-zen-500">
                    {new Date(session.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-zen-600">No focus sessions yet. Start your first session!</p>
          </div>
        )}
      </motion.div>
      </>
      )}
      </>
      )}
    </div>
  );
};

export default Analytics;

