-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "plantType" TEXT NOT NULL DEFAULT 'SUCCULENT',
    "health" INTEGER NOT NULL DEFAULT 50,
    "growthStage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastWateredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "focus_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "durationMinutes" INTEGER,
    "sessionType" TEXT NOT NULL DEFAULT 'TIMED',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "sessionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "focus_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "break_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "breakType" TEXT NOT NULL DEFAULT 'SHORT',
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "durationMinutes" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "sessionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "break_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "defaultFocusTime" REAL NOT NULL DEFAULT 10,
    "defaultFocusTimeUnit" TEXT NOT NULL DEFAULT 'seconds',
    "shortBreakTime" REAL NOT NULL DEFAULT 2,
    "shortBreakTimeUnit" TEXT NOT NULL DEFAULT 'seconds',
    "longBreakTime" REAL NOT NULL DEFAULT 5,
    "longBreakTimeUnit" TEXT NOT NULL DEFAULT 'seconds',
    "autoStartBreaks" BOOLEAN NOT NULL DEFAULT true,
    "autoStartPomodoros" BOOLEAN NOT NULL DEFAULT false,
    "shortBreaksBeforeLong" INTEGER NOT NULL DEFAULT 3,
    "maxSessionsPerDay" INTEGER NOT NULL DEFAULT 8,
    "longBreakInterval" INTEGER NOT NULL DEFAULT 4,
    "soundsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationSounds" BOOLEAN NOT NULL DEFAULT true,
    "ambientSounds" BOOLEAN NOT NULL DEFAULT true,
    "volume" INTEGER NOT NULL DEFAULT 70,
    "themePreference" TEXT NOT NULL DEFAULT 'zen',
    "animationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "plantAnimationSpeed" TEXT NOT NULL DEFAULT 'normal',
    "clockFormat" TEXT NOT NULL DEFAULT '24h',
    "browserNotifications" BOOLEAN NOT NULL DEFAULT true,
    "sessionReminders" BOOLEAN NOT NULL DEFAULT true,
    "plantCareReminders" BOOLEAN NOT NULL DEFAULT true,
    "autoSaveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dataCollection" BOOLEAN NOT NULL DEFAULT true,
    "betaFeatures" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
