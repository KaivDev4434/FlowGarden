# FlowGarden 🌱

A minimalist focus tracking app where users grow virtual plants by maintaining consistent focus sessions. Each project becomes a living plant that thrives with attention and withers with neglect, creating a zen garden of productivity with beautiful Lottie animations.

## ✨ Features

- **Virtual Plant Growth**: Watch your plants grow as you complete focus sessions
- **Beautiful Animations**: Lottie-powered plant animations with 5 growth stages
- **Multiple Plant Types**: Choose from succulents, bonsai, flowers, herbs, and trees
- **Focus Timer**: 25-minute Pomodoro sessions or open-ended focus time
- **Tab-Resistant Timers**: Web Worker-powered timers that work accurately even when tab is inactive
- **Offline Support**: Continue working even without internet connection
- **Health System**: Plants gain health from consistent focus, lose health from neglect
- **Zen Design**: Calming color palette and smooth animations
- **Real-time Clock**: Always know the current time while focusing
- **Analytics**: Track your focus sessions and plant growth over time
- **Connection Status**: Visual indicators for network connectivity
- **Auto-Recovery**: Automatically resume timers after page refresh or tab reactivation

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for beautiful, responsive styling
- **Lottie React** for smooth plant growth animations
- **Framer Motion** for UI transitions
- **Lucide React** for clean, minimal icons

### Backend
- **Node.js** with Express for the API
- **Prisma ORM** with SQLite for data persistence
- **CORS** enabled for frontend-backend communication

### DevOps
- **Docker** with multi-stage builds
- **Docker Compose** for easy deployment
- **Nginx** for frontend serving and API proxying

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd FlowGarden
   ```

2. **Start the Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   The backend will be available at `http://localhost:3001`

3. **Start the Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

## 📖 Usage

### Creating Your First Plant

1. Click the "Plant Your First Seed" button
2. Choose a project name (e.g., "Learn React", "Write Novel")
3. Select a plant type that resonates with you
4. Click "Plant Seed" to create your project

### Focus Sessions

1. Click "Start Focus" on any plant card
2. Choose between:
   - **25 min Timer**: Traditional Pomodoro session
   - **Open Session**: Focus for as long as you want
3. Click "Start" to begin your focus session
4. Stay focused and watch your plant grow in real-time
5. Complete the session to boost your plant's health

### Plant Growth System

- **Health Range**: 0-100%
- **Growth Stages**: Seed → Sprout → Young → Mature → Blooming
- **Health Boost**: +1 health per 5 minutes of focus (max +20 per session)
- **Natural Decay**: Plants lose health over time without attention

## 🎨 Plant Types

| Plant Type | Emoji | Description |
|------------|-------|-------------|
| Succulent  | 🌵    | Hardy and resilient |
| Bonsai     | 🌲    | Requires patience and care |
| Flower     | 🌸    | Blooms with attention |
| Herb       | 🌿    | Practical and aromatic |
| Tree       | 🌳    | Grows tall with time |

## 🐳 Docker Configuration

The project includes a complete Docker setup:

- **Multi-stage builds** for optimized image sizes
- **Health checks** for service monitoring
- **Volume persistence** for database data
- **Nginx proxy** for production deployment
- **Environment variables** for easy configuration

## 🎯 Project Structure

```
FlowGarden/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── assets/         # Lottie animations and images
│   │   └── ...
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                 # Express API
│   ├── prisma/             # Database schema
│   ├── index.js            # Main server file
│   └── Dockerfile
├── docker-compose.yml       # Container orchestration
└── README.md
```

## 📊 API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `PUT /api/projects/:id/animate` - Update plant animation

### Focus Sessions
- `POST /api/sessions/start` - Start a focus session
- `PUT /api/sessions/:id/complete` - Complete a session
- `GET /api/sessions` - Get session history

### Analytics
- `GET /api/analytics` - Get focus statistics

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

## 🎨 Design Philosophy

FlowGarden embraces minimalism and zen principles:

- **Calming Color Palette**: Soft greens and earth tones
- **Gentle Animations**: Smooth, non-distracting movements
- **Clean Typography**: Easy-to-read fonts and spacing
- **Intuitive UX**: Clear visual hierarchy and user flows
- **Mindful Interactions**: Purposeful clicks and transitions

## 🔧 Recent Improvements (Timer & Network Reliability)

### Tab Throttling Fix
- **Web Worker Timers**: Implemented background timer service using Web Workers to prevent browser tab throttling
- **Accurate Timing**: Timers now maintain precision even when tab is minimized or inactive
- **Fallback Support**: Graceful degradation to regular timers if Web Workers are unavailable

### Network Resilience
- **API Service**: Robust API service with automatic retry logic and exponential backoff
- **Offline Support**: Continue working when internet connection is lost
- **Connection Status**: Real-time indicators showing network connectivity
- **Auto-Recovery**: Automatic synchronization when connection is restored
- **Local Caching**: Settings and session data cached locally for offline operation

### Error Handling
- **Graceful Degradation**: App continues to function even with server issues
- **User Feedback**: Clear indicators when using fallback modes
- **Queue System**: Failed operations are queued and retried automatically

## 🌟 Future Enhancements

- [ ] Seasonal weather effects for plants
- [ ] Day/night cycle backgrounds
- [ ] Sound effects and ambient nature sounds
- [ ] Plant care reminders and notifications
- [ ] Social features (share your garden)
- [ ] Achievement system and badges
- [ ] Export focus session data
- [ ] Dark mode support
- [ ] Mobile responsive improvements
- [ ] PWA capabilities

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy focusing! 🌱✨**

*May your plants flourish and your productivity bloom.*
