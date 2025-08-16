import { useState, useEffect } from 'react';
import { Plus, Settings, BarChart3, Clock } from 'lucide-react';
import PlantController from './Plant/PlantController';
import CreateProjectModal from './CreateProjectModal';
import FocusSession from './FocusSession';
import Analytics from './Analytics';
import PlantCareReminder from './PlantCareReminder';
import SettingsPage from './Settings';
import BreakSession from './BreakSession';


const Garden = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFocusSession, setActiveFocusSession] = useState(null);
  const [activeBreakSession, setActiveBreakSession] = useState(null);
  const [pomodoroSessionCount, setPomodoroSessionCount] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [settings, setSettings] = useState({
    clockFormat: '24h'
  });
  const [autoStartNextFocus, setAutoStartNextFocus] = useState(false);

  // Settings changes effect (no debug)
  useEffect(() => {}, [settings]);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch projects and settings on component mount
  useEffect(() => {
    fetchProjects();
    fetchSettings();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings');
      if (response.ok) {
        const userSettings = await response.json();
        setSettings(prev => {
          const newSettings = {
            ...prev,
            ...userSettings
          };
          return newSettings;
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const response = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [newProject, ...prev]);
        setShowCreateModal(false);
      } else {
        console.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleEditProject = async (projectId, updates) => {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProjects(prev => 
          prev.map(p => p.id === projectId ? updatedProject : p)
        );
      } else {
        console.error('Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this plant? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        console.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleFocusStart = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setActiveFocusSession(project);
    } else {
      console.error('Project not found for ID:', projectId);
    }
  };

  const handleWaterPlant = async (plantId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${plantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          health: Math.min(100, projects.find(p => p.id === plantId)?.health + 15 || 50)
        }),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProjects(prev => 
          prev.map(p => p.id === plantId ? updatedProject : p)
        );
      }
    } catch (error) {
      console.error('Error watering plant:', error);
    }
  };

  const handleFocusComplete = async (sessionData) => {
    
    // Increment Pomodoro session count
    const newSessionCount = pomodoroSessionCount + 1;
    setPomodoroSessionCount(newSessionCount);
    
    
    // Session is already completed by FocusSession component
    // Just refresh projects to get updated health data
    await fetchProjects();
    
    // Check if we should start a break session
    if (sessionData.startBreak) {
      
      const breakSessionData = {
        project: activeFocusSession, // This contains the project data
        breakType: sessionData.breakType,
        sessionNumber: newSessionCount
      };
      setActiveBreakSession(breakSessionData);
    } else {
      // If auto-breaks are disabled or no break triggered
      if (sessionData.autoBreaksDisabled) {
        setPomodoroSessionCount(0); // Reset when auto-breaks are off
      } else {
        
      }
    }
    
    setActiveFocusSession(null);
    
    // Show celebration message for significant progress
    if (sessionData.durationMinutes >= 1) {
      
    }
  };

  const handleBreakComplete = async () => {
    
    // Capture the project to resume before clearing state
    const projectToResume = activeBreakSession?.project;

    // Check user settings for auto-start pomodoros
    let shouldAutoStartNextSession = false;
    try {
      const response = await fetch('http://localhost:3001/api/settings');
      if (response.ok) {
        const settings = await response.json();
        shouldAutoStartNextSession = settings.autoStartPomodoros === true;
      }
    } catch (error) {
      console.error('Error fetching settings for break completion:', error);
    }
    
    setTimeout(() => {
      // Clear break session state
      setActiveBreakSession(null);
      
      if (projectToResume) {
        if (shouldAutoStartNextSession) {
          setAutoStartNextFocus(true);
        } else {
          setAutoStartNextFocus(false);
        }
        setActiveFocusSession(projectToResume);
      } else {
        setActiveFocusSession(null);
        fetchProjects();
        // Reset session count when returning to garden
        setPomodoroSessionCount(0);
      }
    }, 10);
  };

  const handleBreakSkip = () => {
    setActiveBreakSession(null);
    // When break is skipped, continue the cycle with next focus session
    if (activeBreakSession?.project) {
      setActiveFocusSession(activeBreakSession.project);
    }
  };

  const handleExitPomodoroCycle = () => {
    setActiveFocusSession(null);
    setActiveBreakSession(null);
    setPomodoroSessionCount(0);
    fetchProjects();
  };

  const formatTime = (date) => {
    const result = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: settings.clockFormat === '12h'
    });
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-500 mx-auto mb-4"></div>
          <p className="text-zen-600">Loading your garden...</p>
        </div>
      </div>
    );
  }

  // If there's an active focus session, show the focus view
  // If break session is active, show break session
  // render checks
  
  if (activeBreakSession) {
    
    return (
      <BreakSession
        project={activeBreakSession.project}
        breakType={activeBreakSession.breakType}
        sessionNumber={activeBreakSession.sessionNumber}
        onComplete={handleBreakComplete}
        onSkip={handleBreakSkip}
        onCancel={() => setActiveBreakSession(null)}
      />
    );
  }

  // If focus session is active, show focus session
  if (activeFocusSession) {
    return (
      <FocusSession
        project={activeFocusSession}
        sessionNumber={pomodoroSessionCount + 1}
        autoStart={autoStartNextFocus}
        onComplete={handleFocusComplete}
        onCancel={handleExitPomodoroCycle}
      />
    );
  }

  // If analytics is requested, show analytics dashboard
  if (showAnalytics) {
    return (
      <Analytics onBack={() => setShowAnalytics(false)} />
    );
  }

  // If settings is requested, show settings page
  if (showSettings) {
    return (
      <SettingsPage onBack={async () => {
        setShowSettings(false);
        // Refresh projects and settings to get any updated settings effects
        await fetchProjects();
        await fetchSettings();
      }} />
    );
  }

  
  
  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex justify-between items-center">
          {/* Logo and Title */}
          <div>
            <h1 className="text-3xl font-bold text-zen-800 mb-2">
              FlowGarden 🌱
            </h1>
            <p className="text-zen-600">
              Grow your focus, nurture your productivity
            </p>
          </div>

          {/* Clock and Actions */}
          <div className="flex items-center gap-4">
            {/* Clock */}
            <div className="zen-card px-4 py-2 flex items-center gap-2">
              <Clock size={20} className="text-zen-600" />
              <span className="text-xl font-mono text-zen-800">
                {formatTime(currentTime)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAnalytics(true)}
                className="zen-button-secondary p-3" 
                title="Analytics"
              >
                <BarChart3 size={20} />
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="zen-button-secondary p-3" 
                title="Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>



      {/* Garden Grid */}
      <main>
        {projects.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="zen-card max-w-md mx-auto p-8">
              <div className="text-6xl mb-4">🌱</div>
              <h2 className="text-2xl font-semibold text-zen-800 mb-3">
                Your garden is empty
              </h2>
              <p className="text-zen-600 mb-6">
                Plant your first seed by creating a new focus project. 
                Watch it grow as you maintain consistent focus sessions!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="zen-button flex items-center gap-2 mx-auto"
              >
                <Plus size={20} />
                Plant Your First Seed
              </button>
            </div>
          </div>
        ) : (
          // Projects Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <PlantController
                key={project.id}
                plant={project}
                onPlantClick={(plant) => {
                  // For now, start focus session when plant is clicked
                  handleFocusStart(plant.id);
                }}
              />
            ))}

            {/* Add New Plant Card */}
            <div 
              className="zen-card p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-dashed border-zen-300 hover:border-nature-400"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={48} className="text-zen-400 mb-4" />
              <h3 className="text-lg font-semibold text-zen-600 mb-2">
                Add New Plant
              </h3>
              <p className="text-sm text-zen-500 text-center">
                Start a new focus project and watch it bloom
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      )}

      {/* Plant Care Reminder */}
      <PlantCareReminder 
        projects={projects} 
        onWaterPlant={handleWaterPlant}
      />
    </div>
  );
};

export default Garden;
