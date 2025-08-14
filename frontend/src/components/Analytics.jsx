import { useState, useEffect } from 'react';
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

const Analytics = ({ onBack }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/analytics');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-500"></div>
      </div>
    );
  }

  const productivityScore = getProductivityScore();
  const streakDays = getStreakDays();

  return (
    <div className="min-h-screen p-6">
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
                className="bg-nature-50 rounded-lg p-4"
                whileHover={{ scale: 1.02 }}
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
    </div>
  );
};

export default Analytics;

