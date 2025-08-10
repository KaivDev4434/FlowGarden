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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FlowGarden API is running' });
});

// Project endpoints
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

    const lottieFileMap = {
      'SUCCULENT': 'succulent-growth',
      'BONSAI': 'bonsai-growth',
      'FLOWER': 'flower-growth',
      'HERB': 'herb-growth',
      'TREE': 'tree-growth'
    };

    const project = await prisma.project.create({
      data: {
        name,
        plantType: plantType || 'SUCCULENT',
        lottieFileName: lottieFileMap[plantType] || 'succulent-growth'
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
    const { name, health, growthStage, animationProgress, status } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(health !== undefined && { health }),
        ...(growthStage !== undefined && { growthStage }),
        ...(animationProgress !== undefined && { animationProgress }),
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
    const progressInStage = (newHealth % 20) / 20;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        health: newHealth,
        growthStage: newGrowthStage,
        animationProgress: progressInStage,
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

    // Update plant health based on session duration
    const healthBoost = Math.min(20, Math.floor(durationMinutes / 5)); // 1 health per 5 minutes, max 20
    if (healthBoost > 0) {
      await prisma.project.update({
        where: { id: session.projectId },
        data: {
          health: Math.min(100, session.project.health + healthBoost),
          lastWateredAt: new Date()
        }
      });
    }

    res.json(session);
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

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
