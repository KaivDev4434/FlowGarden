# FLowGarden - A Focus App

## 🌱 Project Overview

A minimalist focus tracking app where users grow virtual plants by maintaining consistent focus sessions. Each project becomes a living plant that thrives with attention and withers with neglect, creating a zen garden of productivity with **beautiful Lottie animations**.

## 🛠️ Updated Tech Stack

### Frontend

- **Framework**: React with Vite (fast development, good for weekend projects)
- **Styling**: Tailwind CSS + custom CSS for layout
- **Animations**: **Lottie React** for plant growth animations + Framer Motion for UI transitions
- **Charts**: Chart.js or Recharts for analytics
- **Icons**: Lucide React for clean, minimal icons
- **Lottie Player**: `@lottiefiles/react-lottie-player` (free)

### Backend

- **Runtime**: Node.js with Express (simple and fast to set up)
- **Database**: SQLite with Prisma ORM (perfect for homeserver deployment)
- **Authentication**: Skip for weekend build (single user mode)

### Additional Libraries

- **Sounds**: Howler.js for ambient zen sounds
- **Timer**: Custom JavaScript timer with Web Workers
- **State Management**: React Context (sufficient for this scope)

## 🎨 Free Lottie Animation Resources

### **Primary Sources** (100% Free)

1. **LottieFiles Community** - Free tier includes:
   - Plant growth animations
   - Nature-themed backgrounds
   - Loading spinners
   - Success celebrations

2. **Specific Free Plant Animations** to Look For:
   - "Plant Growing" sequences
   - "Seedling to Tree" transformations
   - "Watering Plants" interactions
   - "Wilting/Dying Plant" animations
   - "Garden Scene" backgrounds

3. **Free Alternative Sources**:
   - **Icons8 Lottie** (free tier)
   - **Lordicon** (free animations available)
   - **Feather Icons Animated** (open source)

### **DIY Animation Option**

- **Lottie Creator** (free web tool) for simple custom animations
- **After Effects** (if you have access) + Bodymovin plugin

## 🏗️ Updated Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │◄──►│     Backend     │◄──►│    Database     │
│  (React + Lottie) │    │  (Express API)  │    │    (SQLite)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Lottie Assets  │
│   (JSON files)  │
└─────────────────┘
```

## 🗄️ Updated Database Schema

```sql
-- Projects (Plants) - Enhanced for Lottie
Projects:
  - id (primary key)
  - name (string)
  - plant_type (enum: succulent, bonsai, flower, herb, tree)
  - lottie_file_name (string) -- maps to animation file
  - health (0-100)
  - growth_stage (0-4) -- maps to Lottie animation segments
  - animation_progress (0-1) -- current animation frame
  - created_at
  - status (active, paused, completed, dead)
  - last_watered_at

-- Focus Sessions (unchanged)
FocusSessions:
  - id (primary key)
  - project_id (foreign key)
  - start_time
  - end_time
  - duration_minutes
  - session_type (timed, open, pomodoro)
  - completed (boolean)

-- User Settings (unchanged)
UserSettings:
  - id (primary key)
  - sounds_enabled
  - default_focus_time
  - theme_preference
  - animations_enabled -- toggle for performance
```

## 🎨 Updated UI/UX Components

### Main Garden View

- **Lottie background**: Subtle zen garden scene animation
- **Grid layout** with Lottie plant cards
- **Floating action button** with gentle bounce animation
- **Clock in top-right corner** (minimal, toggleable 12/24h)

### Enhanced Plant Growth System with Lottie

```javascript
// Plant growth stages mapped to Lottie segments
const plantStages = {
  0: { segment: [0, 50], health: 0 - 20, name: "seed" },
  1: { segment: [50, 100], health: 21 - 40, name: "sprout" },
  2: { segment: [100, 150], health: 41 - 60, name: "young" },
  3: { segment: [150, 200], health: 61 - 80, name: "mature" },
  4: { segment: [200, 250], health: 81 - 100, name: "blooming" },
};
```

### Plant Animation States

1. **Growth Animation**: Smooth progression through Lottie segments
2. **Idle Animation**: Gentle swaying loop
3. **Celebration Animation**: Sparkle effects when health increases
4. **Withering Animation**: Reverse growth when neglected
5. **Revival Animation**: Recovery from near-death

### Focus Session Interface

- **Circular timer** with Lottie progress ring
- **Plant preview** showing real-time mini growth
- **Ambient controls** with animated toggle switches
- **Zen-themed background** Lottie animation

## 🔧 Updated Backend API Endpoints

```javascript
// Lottie-specific endpoints added
GET    /api/lottie/:filename        // Serve Lottie JSON files
GET    /api/plants/animations       // Get available plant animations

// Enhanced existing endpoints
GET    /api/projects                // Include lottie_file_name and animation_progress
PUT    /api/projects/:id/animate    // Update animation state
POST   /api/sessions/start          // Triggers growth animation
```

## 🌟 Lottie Animation Implementation

### Plant Component with Lottie

```javascript
import { Player } from "@lottiefiles/react-lottie-player";

const PlantCard = ({ plant }) => {
  const [animationData, setAnimationData] = useState(null);

  // Load animation based on plant type
  useEffect(() => {
    import(`../assets/lottie/${plant.lottie_file_name}.json`).then((data) =>
      setAnimationData(data.default),
    );
  }, [plant.lottie_file_name]);

  return (
    <div className="plant-card">
      <Player
        autoplay
        loop
        src={animationData}
        style={{ height: "200px", width: "200px" }}
        segments={getCurrentSegments(plant.health)}
        onComplete={handleGrowthComplete}
      />
      <PlantNameInput plant={plant} />
      <HealthBar health={plant.health} />
    </div>
  );
};
```

### Animation Control System

```javascript
// Smooth health-based animation progression
const updatePlantAnimation = (plantId, newHealth) => {
  const stage = calculateGrowthStage(newHealth);
  const progress = (newHealth % 20) / 20; // Smooth progression within stage

  // Update Lottie player
  playerRef.current?.goToAndPlay(
    stage.segment[0] + progress * (stage.segment[1] - stage.segment[0]),
  );
};
```

## 🎵 Free Audio Assets

### **Free Resources**

- **Freesound.org**: CC-licensed nature sounds
- **YouTube Audio Library**: Royalty-free ambient tracks
- **BBC Sound Effects**: Free nature recordings
- **OpenGameArt.org**: Game-ready sound effects

### **Suggested Sounds**

- **Focus start**: Gentle wind chime
- **Growth milestone**: Soft bell
- **Session complete**: Bird chirp
- **Plant withering**: Subtle warning tone
- **Ambient background**: Rain, forest, or silence

## 📅 Updated Weekend Development Timeline

### Saturday Morning (4 hours)

- **Setup**: Initialize React + Express projects
- **Lottie Integration**: Install and configure Lottie player
- **Asset Collection**: Download 3-5 free plant animations
- **Database**: Prisma schema with Lottie fields
- **Backend**: Core API endpoints

### Saturday Afternoon (4 hours)

- **Plant Lottie Components**: Basic plant cards with animations
- **Timer Logic**: Focus session functionality
- **Animation Control**: Health-based Lottie progression
- **Basic Garden View**: Layout with clock

### Saturday Evening (2 hours)

- **Animation Polish**: Smooth transitions between stages
- **Plant Naming**: User input for plant names
- **Basic Styling**: Zen theme application

### Sunday Morning (4 hours)

- **Advanced Animations**:
  - Growth celebrations
  - Withering effects
  - Idle animations
- **Analytics**: Charts with animated transitions
- **Sounds**: Audio integration
- **UI Polish**: Framer Motion for UI elements

### Sunday Afternoon (4 hours)

- **Animation Performance**: Optimize Lottie loading
- **Docker Setup**: Include Lottie assets in container
- **Final Testing**: All animation states
- **Deployment**: Test on homeserver

## 🚀 Free Lottie Asset Organization

```
src/
  assets/
    lottie/
      plants/
        succulent-growth.json      // 5-stage growth
        bonsai-growth.json
        flower-growth.json
        herb-growth.json
      ui/
        timer-ring.json            // Circular progress
        sparkles.json             // Celebration effect
        zen-background.json       // Subtle background
      states/
        withering.json            // Dying animation
        watering.json            // Care animation
```

## 💡 Animation Performance Tips

1. **Lazy Loading**: Load Lottie files only when needed
2. **Preloading**: Cache frequently used animations
3. **Reduced Motion**: Respect user's accessibility preferences
4. **Animation Toggle**: Setting to disable for performance
5. **Compression**: Use optimized Lottie files

## 🐳 Updated Docker Configuration

### Updated Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/assets/lottie ./dist/lottie
COPY package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "server/index.js"]
```

## 🎯 Key Free Animation Features

### **Essential Animations** (Weekend Priority)

1. **Plant growth progression** (5 stages)
2. **Timer countdown ring**
3. **Success celebration sparkles**
4. **Gentle idle plant movement**

### **Nice-to-Have Animations** (Post-Weekend)

1. **Seasonal weather effects**
2. **Day/night cycle background**
3. **Watering interaction**
4. **Garden zooming transitions**

## 🚀 Quick Start Commands

```bash
# Setup with Lottie
npx create-vite@latest frontend --template react
cd frontend
npm install @lottiefiles/react-lottie-player framer-motion tailwindcss

# Backend setup
mkdir backend && cd backend
npm init -y
npm install express prisma sqlite3 cors

# Create Lottie assets folder
mkdir -p src/assets/lottie/plants
mkdir -p src/assets/lottie/ui
```

## 📱 Responsive Lottie Design

- **Mobile**: Smaller plant animations (150px)
- **Tablet**: Medium size (200px)
- **Desktop**: Full size (250px)
- **Touch interactions**: Tap to see plant details

This updated plan prioritizes **beautiful, free Lottie animations** while maintaining weekend feasibility. The modular approach lets you start with basic growth animations and enhance them throughout the weekend!

Sources
