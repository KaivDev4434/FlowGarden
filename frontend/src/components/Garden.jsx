import { useState, useEffect } from 'react';
import { Plus, Settings, BarChart3, Clock } from 'lucide-react';
import PlantCard from './PlantCard';
import CreateProjectModal from './CreateProjectModal';
import FocusSession from './FocusSession';

const Garden = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFocusSession, setActiveFocusSession] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
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
    }
  };

  const handleFocusComplete = async (sessionData) => {
    // Update project health based on focus session
    if (sessionData.projectId && sessionData.durationMinutes) {
      const healthBoost = Math.min(20, Math.floor(sessionData.durationMinutes / 5));
      
      if (healthBoost > 0) {
        await handleEditProject(sessionData.projectId, {
          health: Math.min(100, 
            projects.find(p => p.id === sessionData.projectId)?.health + healthBoost || 50
          )
        });
      }
    }

    // Refresh projects to get updated data
    await fetchProjects();
    setActiveFocusSession(null);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
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
  if (activeFocusSession) {
    return (
      <FocusSession
        project={activeFocusSession}
        onComplete={handleFocusComplete}
        onCancel={() => setActiveFocusSession(null)}
      />
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
              <button className="zen-button-secondary p-3" title="Analytics">
                <BarChart3 size={20} />
              </button>
              <button className="zen-button-secondary p-3" title="Settings">
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
              <PlantCard
                key={project.id}
                plant={project}
                onFocusStart={handleFocusStart}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
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
    </div>
  );
};

export default Garden;
