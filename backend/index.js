const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health calculation functions
function calculateHealthFromFocusTime(totalMinutes, daysSinceLastSession = 0) {
  // Start at 30% health
  let health = 30;
  
  // For testing: Any session (even seconds) gives health boost
  // In testing mode (sessions < 1 minute), each session gives 5% boost
  if (totalMinutes < 1) {
    // Count sessions by checking total seconds - each 10+ second session = 5% health
    const totalSeconds = totalMinutes * 60;
    const sessionCount = Math.floor(totalSeconds / 10); // Each 10-second chunk = 1 session
    const testingBonus = Math.min(70, sessionCount * 5); // 5% per session, max 70%
    health += testingBonus;
    console.log(`Testing mode: ${totalSeconds}s = ${sessionCount} sessions = +${testingBonus}% health`);
  } else {
    // Production mode: Every 25 minutes of focus adds 10% health (up to 100%)
    const focusBonus = Math.min(70, Math.floor(totalMinutes / 25) * 10);
    health += focusBonus;
    console.log(`Production mode: ${totalMinutes}min = +${focusBonus}% health`);
  }
  
  // Decrease health for consecutive days without focus
  const decayPenalty = daysSinceLastSession * 10;
  health -= decayPenalty;
  
  // Ensure health stays within bounds
  return Math.max(0, Math.min(100, health));
}

function calculateGrowthStage(health) {
  if (health <= 0) return 0; // dead
  if (health <= 20) return 1; // seed
  if (health <= 40) return 2; // sprout
  if (health <= 60) return 3; // young
  if (health <= 80) return 4; // mature
  return 5; // blooming
}

function getDaysSinceDate(date) {
  const now = new Date();
  const diffTime = Math.abs(now - new Date(date));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Update plant health based on focus sessions
async function updatePlantHealth() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        focusSessions: {
          where: { completed: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    for (const project of projects) {
      // Calculate total focus time
      const totalFocusMinutes = project.focusSessions.reduce(
        (total, session) => total + (session.durationMinutes || 0),
        0
      );

      // Get days since last session
      const lastSession = project.focusSessions[0];
      const daysSinceLastSession = lastSession 
        ? getDaysSinceDate(lastSession.createdAt)
        : getDaysSinceDate(project.createdAt);

      // Calculate new health
      const newHealth = calculateHealthFromFocusTime(totalFocusMinutes, daysSinceLastSession);
      const newGrowthStage = calculateGrowthStage(newHealth);
      
      // Determine status
      let status = 'ACTIVE';
      if (newHealth <= 0) status = 'DEAD';
      else if (newHealth <= 10) status = 'PAUSED';

      // Only update if health has changed
      if (newHealth !== project.health) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            health: newHealth,
            status,
            growthStage: newGrowthStage,
            lastWateredAt: new Date()
          }
        });
        
        console.log(`Updated ${project.name}: health ${project.health} -> ${newHealth}`);
      }
    }
  } catch (error) {
    console.error('Error updating plant health:', error);
  }
}

// Run health update every hour
setInterval(updatePlantHealth, 60 * 60 * 1000);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FlowGarden API is running' });
});

// Project endpoints
app.get('/api/projects/:id/sessions', async (req, res) => {
  try {
    const { id } = req.params;
    const { since } = req.query;
    
    const whereClause = {
      projectId: id
    };
    
    if (since) {
      whereClause.createdAt = {
        gte: new Date(since)
      };
    }
    
    const sessions = await prisma.focusSession.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching project sessions:', error);
    res.status(500).json({ error: 'Failed to fetch project sessions' });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        focusSessions: {
          where: { completed: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, plantType } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Convert lowercase to uppercase for database enum
    const plantTypeUpper = (plantType || 'succulent').toUpperCase();

    const project = await prisma.project.create({
      data: {
        name,
        plantType: plantTypeUpper,
        health: 30, // Start with 30% health as specified
        growthStage: 1 // Start at seed/sprout stage
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        focusSessions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, health, growthStage, status } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(health !== undefined && { health }),
        ...(growthStage !== undefined && { growthStage }),
        ...(status && { status }),
        lastWateredAt: new Date()
      }
    });

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.put('/api/projects/:id/animate', async (req, res) => {
  try {
    const { id } = req.params;
    const { healthDelta } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const newHealth = Math.max(0, Math.min(100, project.health + (healthDelta || 0)));
    const newGrowthStage = Math.floor(newHealth / 20);

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        health: newHealth,
        growthStage: newGrowthStage,
        lastWateredAt: new Date()
      }
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project animation:', error);
    res.status(500).json({ error: 'Failed to update project animation' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Focus Session endpoints
app.post('/api/sessions/start', async (req, res) => {
  try {
    const { projectId, sessionType } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const session = await prisma.focusSession.create({
      data: {
        projectId,
        sessionType: sessionType || 'TIMED'
      },
      include: {
        project: true
      }
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Error starting focus session:', error);
    res.status(500).json({ error: 'Failed to start focus session' });
  }
});

app.put('/api/sessions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { durationMinutes } = req.body;
    
    console.log(`Completing session ${id} with duration ${durationMinutes} minutes`);

    const session = await prisma.focusSession.update({
      where: { id },
      data: {
        endTime: new Date(),
        durationMinutes: durationMinutes || 0,
        completed: true
      },
      include: {
        project: true
      }
    });
    
    console.log('Session updated:', session);

    // Recalculate health based on completed sessions
    const allSessions = await prisma.focusSession.findMany({
      where: { 
        projectId: session.projectId,
        completed: true 
      }
    });
    
    const totalFocusMinutes = allSessions.reduce(
      (total, s) => total + (s.durationMinutes || 0),
      0
    );
    
    // For testing: Give immediate +10% health for any completed session
    const currentHealth = session.project.health;
    const sessionBonus = 10; // 10% per completed session for testing
    const newHealthFromSession = Math.min(100, currentHealth + sessionBonus);
    
    // Also use the formula-based approach
    const daysSinceCreation = getDaysSinceDate(session.project.createdAt);
    const formulaHealth = calculateHealthFromFocusTime(totalFocusMinutes, 0);
    
    // Use the higher of the two approaches
    const newHealth = Math.max(newHealthFromSession, formulaHealth);
    const newGrowthStage = calculateGrowthStage(newHealth);
    
    console.log('Health calculation:', {
      totalSessions: allSessions.length,
      totalFocusMinutes,
      currentHealth,
      sessionBonus: `+${sessionBonus}%`,
      newHealthFromSession,
      formulaHealth,
      finalNewHealth: newHealth,
      newGrowthStage
    });
    
    // If a full session was completed (25+ minutes), trigger blooming
    const triggerBlooming = durationMinutes >= 25;
    const bloomingHealth = triggerBlooming ? 100 : newHealth;
    
    const updatedProject = await prisma.project.update({
      where: { id: session.projectId },
      data: {
        health: bloomingHealth,
        growthStage: triggerBlooming ? 5 : newGrowthStage,
        lastWateredAt: new Date()
      }
    });
    
    console.log('Project health updated:', {
      oldHealth: session.project.health,
      newHealth: bloomingHealth,
      healthIncrease: `+${bloomingHealth - session.project.health}%`,
      oldGrowthStage: session.project.growthStage,
      newGrowthStage: triggerBlooming ? 5 : newGrowthStage
    });
    
    // Return session with updated project data
    const updatedSession = await prisma.focusSession.findUnique({
      where: { id },
      include: { 
        project: true 
      }
    });
    
    res.json({
      ...updatedSession,
      triggerBlooming
    });
  } catch (error) {
    console.error('Error completing focus session:', error);
    res.status(500).json({ error: 'Failed to complete focus session' });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const { projectId } = req.query;
    const sessions = await prisma.focusSession.findMany({
      where: projectId ? { projectId } : {},
      include: {
        project: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// User Settings endpoints
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.userSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {}
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { soundsEnabled, defaultFocusTime, themePreference, animationsEnabled } = req.body;

    let settings = await prisma.userSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          soundsEnabled,
          defaultFocusTime,
          themePreference,
          animationsEnabled
        }
      });
    } else {
      settings = await prisma.userSettings.update({
        where: { id: settings.id },
        data: {
          ...(soundsEnabled !== undefined && { soundsEnabled }),
          ...(defaultFocusTime !== undefined && { defaultFocusTime }),
          ...(themePreference && { themePreference }),
          ...(animationsEnabled !== undefined && { animationsEnabled })
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Analytics endpoints
app.get('/api/analytics', async (req, res) => {
  try {
    const totalSessions = await prisma.focusSession.count({
      where: { completed: true }
    });

    const totalFocusTime = await prisma.focusSession.aggregate({
      _sum: {
        durationMinutes: true
      },
      where: { completed: true }
    });

    const recentSessions = await prisma.focusSession.findMany({
      where: { 
        completed: true,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        project: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const projectStats = await prisma.project.findMany({
      include: {
        _count: {
          select: { focusSessions: true }
        }
      }
    });

    res.json({
      totalSessions,
      totalFocusTime: totalFocusTime._sum.durationMinutes || 0,
      recentSessions,
      projectStats
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Break Session endpoints
app.post('/api/break-sessions', async (req, res) => {
  try {
    const { projectId, breakType, sessionNumber } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const breakSession = await prisma.breakSession.create({
      data: {
        projectId,
        breakType: breakType || 'SHORT',
        sessionNumber: sessionNumber || 1,
        startTime: new Date()
      },
      include: {
        project: true
      }
    });

    console.log('Break session created:', breakSession);
    res.json(breakSession);
  } catch (error) {
    console.error('Error creating break session:', error);
    res.status(500).json({ error: 'Failed to create break session' });
  }
});

app.put('/api/break-sessions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { durationMinutes, completed } = req.body;

    const breakSession = await prisma.breakSession.update({
      where: { id },
      data: {
        endTime: new Date(),
        durationMinutes: durationMinutes || 0,
        completed: completed !== undefined ? completed : true
      },
      include: {
        project: true
      }
    });

    console.log('Break session completed:', breakSession);
    res.json(breakSession);
  } catch (error) {
    console.error('Error completing break session:', error);
    res.status(500).json({ error: 'Failed to complete break session' });
  }
});

app.put('/api/break-sessions/:id/skip', async (req, res) => {
  try {
    const { id } = req.params;
    const { skipped } = req.body;

    const breakSession = await prisma.breakSession.update({
      where: { id },
      data: {
        endTime: new Date(),
        skipped: skipped !== undefined ? skipped : true,
        completed: false
      },
      include: {
        project: true
      }
    });

    console.log('Break session skipped:', breakSession);
    res.json(breakSession);
  } catch (error) {
    console.error('Error skipping break session:', error);
    res.status(500).json({ error: 'Failed to skip break session' });
  }
});

// Settings endpoints
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.userSettings.findFirst();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          soundsEnabled: true,
          defaultFocusTime: 10,
          defaultFocusTimeUnit: 'seconds',
          shortBreakTime: 2,
          shortBreakTimeUnit: 'seconds',
          longBreakTime: 5,
          longBreakTimeUnit: 'seconds',
          autoStartBreaks: true, // Enable auto-breaks by default
          themePreference: 'zen',
          animationsEnabled: true
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const {
      defaultFocusTime,
      defaultFocusTimeUnit,
      shortBreakTime,
      shortBreakTimeUnit,
      longBreakTime,
      longBreakTimeUnit,
      autoStartBreaks,
      autoStartPomodoros,
      shortBreaksBeforeLong,
      maxSessionsPerDay,
      longBreakInterval,
      soundsEnabled,
      notificationSounds,
      ambientSounds,
      volume,
      themePreference,
      animationsEnabled,
      reducedMotion,
      plantAnimationSpeed,
      browserNotifications,
      sessionReminders,
      plantCareReminders,
      autoSaveEnabled,
      dataCollection,
      betaFeatures
    } = req.body;

    // Find existing settings or create new
    let settings = await prisma.userSettings.findFirst();
    
    if (settings) {
      // Update existing settings - only include defined values
      const updateData = {};
      if (defaultFocusTime !== undefined) updateData.defaultFocusTime = defaultFocusTime;
      if (defaultFocusTimeUnit !== undefined) updateData.defaultFocusTimeUnit = defaultFocusTimeUnit;
      if (shortBreakTime !== undefined) updateData.shortBreakTime = shortBreakTime;
      if (shortBreakTimeUnit !== undefined) updateData.shortBreakTimeUnit = shortBreakTimeUnit;
      if (longBreakTime !== undefined) updateData.longBreakTime = longBreakTime;
      if (longBreakTimeUnit !== undefined) updateData.longBreakTimeUnit = longBreakTimeUnit;
      if (autoStartBreaks !== undefined) updateData.autoStartBreaks = autoStartBreaks;
      if (autoStartPomodoros !== undefined) updateData.autoStartPomodoros = autoStartPomodoros;
      if (shortBreaksBeforeLong !== undefined) updateData.shortBreaksBeforeLong = shortBreaksBeforeLong;
      if (maxSessionsPerDay !== undefined) updateData.maxSessionsPerDay = maxSessionsPerDay;
      if (longBreakInterval !== undefined) updateData.longBreakInterval = longBreakInterval;
      if (soundsEnabled !== undefined) updateData.soundsEnabled = soundsEnabled;
      if (notificationSounds !== undefined) updateData.notificationSounds = notificationSounds;
      if (ambientSounds !== undefined) updateData.ambientSounds = ambientSounds;
      if (volume !== undefined) updateData.volume = volume;
      if (themePreference !== undefined) updateData.themePreference = themePreference;
      if (animationsEnabled !== undefined) updateData.animationsEnabled = animationsEnabled;
      if (reducedMotion !== undefined) updateData.reducedMotion = reducedMotion;
      if (plantAnimationSpeed !== undefined) updateData.plantAnimationSpeed = plantAnimationSpeed;
      if (browserNotifications !== undefined) updateData.browserNotifications = browserNotifications;
      if (sessionReminders !== undefined) updateData.sessionReminders = sessionReminders;
      if (plantCareReminders !== undefined) updateData.plantCareReminders = plantCareReminders;
      if (autoSaveEnabled !== undefined) updateData.autoSaveEnabled = autoSaveEnabled;
      if (dataCollection !== undefined) updateData.dataCollection = dataCollection;
      if (betaFeatures !== undefined) updateData.betaFeatures = betaFeatures;

      console.log('Updating settings with data:', updateData);
      
      settings = await prisma.userSettings.update({
        where: { id: settings.id },
        data: updateData
      });
    } else {
      // Create new settings
      settings = await prisma.userSettings.create({
        data: {
          defaultFocusTime,
          defaultFocusTimeUnit,
          shortBreakTime,
          shortBreakTimeUnit,
          longBreakTime,
          longBreakTimeUnit,
          autoStartBreaks,
          autoStartPomodoros,
          shortBreaksBeforeLong,
          maxSessionsPerDay,
          longBreakInterval,
          soundsEnabled,
          notificationSounds,
          ambientSounds,
          volume,
          themePreference,
          animationsEnabled,
          reducedMotion,
          plantAnimationSpeed,
          browserNotifications,
          sessionReminders,
          plantCareReminders,
          autoSaveEnabled,
          dataCollection,
          betaFeatures
        }
      });
    }
    
    console.log('Settings updated:', settings);
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Run immediately on startup to update plant health (disabled for testing)
// setTimeout(updatePlantHealth, 5000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🌱 FlowGarden API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
