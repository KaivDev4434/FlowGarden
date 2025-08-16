import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  Volume2, 
  VolumeX, 
  Palette, 
  Zap, 
  Save,
  RotateCcw,
  Bell,
  Monitor,
  Smartphone,
  Settings as SettingsIcon
} from 'lucide-react';

const Settings = ({ onBack }) => {
  const [settings, setSettings] = useState({
    // Timer Settings (with time units)
    defaultFocusTime: 25,
    defaultFocusTimeUnit: 'minutes',
    shortBreakTime: 5,
    shortBreakTimeUnit: 'minutes', 
    longBreakTime: 15,
    longBreakTimeUnit: 'minutes',
    autoStartBreaks: true,
    autoStartPomodoros: false,
    
    // Pomodoro Cycle Settings
    shortBreaksBeforeLong: 3,
    maxSessionsPerDay: 8,
    longBreakInterval: 4,
    
    // Sound Settings
    soundsEnabled: true,
    notificationSounds: true,
    ambientSounds: true,
    volume: 70,
    
    // Visual Settings
    themePreference: 'zen',
    animationsEnabled: true,
    reducedMotion: false,
    plantAnimationSpeed: 'normal',
    clockFormat: '24h',
    
    // Notification Settings
    browserNotifications: true,
    sessionReminders: true,
    plantCareReminders: true,
    
    // Advanced Settings
    autoSaveEnabled: true,
    dataCollection: true,
    betaFeatures: false
  });

  const [originalSettings, setOriginalSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const loadSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings');
      if (response.ok) {
        const userSettings = await response.json();
        setSettings(prev => ({
          ...prev,
          ...userSettings
        }));
        setOriginalSettings({
          ...settings,
          ...userSettings
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      
      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const savedSettings = await response.json();
        setOriginalSettings(settings);
        setHasChanges(false);
        
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(originalSettings);
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      defaultFocusTime: 25,
      defaultFocusTimeUnit: 'minutes',
      shortBreakTime: 5,
      shortBreakTimeUnit: 'minutes',
      longBreakTime: 15, 
      longBreakTimeUnit: 'minutes',
      autoStartBreaks: true,
      autoStartPomodoros: false,
      shortBreaksBeforeLong: 3,
      maxSessionsPerDay: 8,
      longBreakInterval: 4,
      soundsEnabled: true,
      notificationSounds: true,
      ambientSounds: true,
      volume: 70,
      themePreference: 'zen',
      animationsEnabled: true,
      reducedMotion: false,
      plantAnimationSpeed: 'normal',
      clockFormat: '24h',
      browserNotifications: true,
      sessionReminders: true,
      plantCareReminders: true,
      autoSaveEnabled: true,
      dataCollection: true,
      betaFeatures: false
    };
    setSettings(defaultSettings);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Helper function to convert time to minutes for calculations
  const convertToMinutes = (value, unit) => {
    switch (unit) {
      case 'seconds': return value / 60;
      case 'hours': return value * 60;
      case 'minutes': 
      default: return value;
    }
  };

  // Helper function to format time for display
  const formatTime = (value, unit) => {
    if (unit === 'seconds' && value === 1) return '1 second';
    if (unit === 'seconds') return `${value} seconds`;
    if (unit === 'hours' && value === 1) return '1 hour';
    if (unit === 'hours') return `${value} hours`;
    if (unit === 'minutes' && value === 1) return '1 minute';
    return `${value} minutes`;
  };

  const SettingRow = ({ icon: Icon, title, description, children }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-zen-200 hover:border-zen-300 transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-zen-600" />
        <div>
          <h3 className="font-medium text-zen-800">{title}</h3>
          {description && (
            <p className="text-sm text-zen-600">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-nature-500' : 'bg-zen-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const NumberInput = ({ value, onChange, min = 1, max = 120, suffix = "min" }) => (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min={min}
        max={max}
        className="w-16 px-2 py-1 text-center border border-zen-300 rounded focus:outline-none focus:ring-2 focus:ring-nature-500"
      />
      <span className="text-sm text-zen-600">{suffix}</span>
    </div>
  );

  const TimeInput = ({ value, onChange, timeUnit, onTimeUnitChange, label }) => {
    const timeUnits = [
      { value: 'seconds', label: 'sec', max: 3600, step: 1 }, // Max 1 hour in seconds
      { value: 'minutes', label: 'min', max: 240, step: 1 },  // Max 4 hours in minutes  
      { value: 'hours', label: 'hr', max: 24, step: 0.25 }    // Max 24 hours
    ];
    
    const currentUnit = timeUnits.find(unit => unit.value === timeUnit) || timeUnits[1];
    
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={timeUnit === 'hours' ? 0.25 : 1}
          max={currentUnit.max}
          step={currentUnit.step}
          className="w-20 px-2 py-1 text-center border border-zen-300 rounded focus:outline-none focus:ring-2 focus:ring-nature-500"
        />
        <select
          value={timeUnit}
          onChange={(e) => onTimeUnitChange(e.target.value)}
          className="px-2 py-1 text-sm border border-zen-300 rounded focus:outline-none focus:ring-2 focus:ring-nature-500"
        >
          {timeUnits.map(unit => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const Select = ({ value, onChange, options }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1 border border-zen-300 rounded focus:outline-none focus:ring-2 focus:ring-nature-500"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const Slider = ({ value, onChange, min = 0, max = 100, step = 1 }) => (
    <div className="flex items-center gap-3">
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="flex-1 h-2 bg-zen-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <span className="w-8 text-sm text-zen-600">{value}%</span>
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-zen-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-zen-200 transition-colors"
          >
            <ArrowLeft size={24} className="text-zen-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-zen-800">Settings</h1>
            <p className="text-zen-600">Customize your FlowGarden experience</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {hasChanges && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={resetSettings}
              className="flex items-center gap-2 px-4 py-2 text-zen-600 hover:bg-zen-200 rounded-lg transition-colors"
            >
              <RotateCcw size={16} />
              Reset
            </motion.button>
          )}
          
          <motion.button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              hasChanges && !saving
                ? 'bg-nature-500 text-white hover:bg-nature-600'
                : 'bg-zen-300 text-zen-500 cursor-not-allowed'
            }`}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </div>
      </div>

      <div className="max-w-4xl space-y-8">
        {/* Timer Settings */}
        <section>
          <h2 className="text-xl font-semibold text-zen-800 mb-4 flex items-center gap-2">
            <Clock size={24} />
            Timer Settings
          </h2>
          <div className="space-y-4">
            <SettingRow
              icon={Clock}
              title="Focus Session Duration"
              description="Default length for focus sessions"
            >
              <TimeInput
                value={settings.defaultFocusTime}
                onChange={(value) => updateSetting('defaultFocusTime', value)}
                timeUnit={settings.defaultFocusTimeUnit}
                onTimeUnitChange={(unit) => updateSetting('defaultFocusTimeUnit', unit)}
              />
            </SettingRow>

            <SettingRow
              icon={Clock}
              title="Short Break Duration"
              description="Length of short breaks between sessions"
            >
              <TimeInput
                value={settings.shortBreakTime}
                onChange={(value) => updateSetting('shortBreakTime', value)}
                timeUnit={settings.shortBreakTimeUnit}
                onTimeUnitChange={(unit) => updateSetting('shortBreakTimeUnit', unit)}
              />
            </SettingRow>

            <SettingRow
              icon={Clock}
              title="Long Break Duration"
              description="Length of long breaks after 4 sessions"
            >
              <TimeInput
                value={settings.longBreakTime}
                onChange={(value) => updateSetting('longBreakTime', value)}
                timeUnit={settings.longBreakTimeUnit}
                onTimeUnitChange={(unit) => updateSetting('longBreakTimeUnit', unit)}
              />
            </SettingRow>

            <SettingRow
              icon={Zap}
              title="Auto-start Breaks"
              description="Automatically start break timers"
            >
              <Toggle
                enabled={settings.autoStartBreaks}
                onChange={(value) => updateSetting('autoStartBreaks', value)}
              />
            </SettingRow>

            <SettingRow
              icon={Zap}
              title="Auto-start Focus Sessions"
              description="Automatically start next focus session after break"
            >
              <Toggle
                enabled={settings.autoStartPomodoros}
                onChange={(value) => updateSetting('autoStartPomodoros', value)}
              />
            </SettingRow>
          </div>
        </section>

        {/* Pomodoro Cycle Settings */}
        <section>
          <h2 className="text-xl font-semibold text-zen-800 mb-4 flex items-center gap-2">
            <Clock size={24} />
            Pomodoro Cycle Settings
          </h2>
          <div className="space-y-4">
            <SettingRow
              icon={Clock}
              title="Sessions Before Long Break"
              description="How many focus sessions before a long break"
            >
              <NumberInput
                value={settings.longBreakInterval}
                onChange={(value) => updateSetting('longBreakInterval', value)}
                min={2}
                max={8}
                suffix="sessions"
              />
            </SettingRow>

            <SettingRow
              icon={Clock}
              title="Short Breaks Before Long"
              description="How many short breaks before switching to long break"
            >
              <NumberInput
                value={settings.shortBreaksBeforeLong}
                onChange={(value) => updateSetting('shortBreaksBeforeLong', value)}
                min={1}
                max={6}
                suffix="breaks"
              />
            </SettingRow>

            <SettingRow
              icon={Clock}
              title="Max Sessions Per Day"
              description="Maximum focus sessions in a single day"
            >
              <NumberInput
                value={settings.maxSessionsPerDay}
                onChange={(value) => updateSetting('maxSessionsPerDay', value)}
                min={4}
                max={16}
                suffix="sessions"
              />
            </SettingRow>

            {/* Cycle Preview */}
            <div className="p-4 bg-nature-50 rounded-lg border border-nature-200">
              <h4 className="font-medium text-nature-800 mb-2">Daily Cycle Preview</h4>
              <div className="text-sm text-nature-700">
                <div className="mb-2">
                  <strong>Pattern:</strong> {settings.longBreakInterval} focus sessions → 1 long break
                </div>
                <div className="mb-2">
                  <strong>Total Time:</strong> {(() => {
                    const focusTimeMin = convertToMinutes(settings.defaultFocusTime, settings.defaultFocusTimeUnit);
                    const shortBreakMin = convertToMinutes(settings.shortBreakTime, settings.shortBreakTimeUnit);
                    const longBreakMin = convertToMinutes(settings.longBreakTime, settings.longBreakTimeUnit);
                    
                    const cycleTime = (focusTimeMin * settings.longBreakInterval) + 
                                    ((settings.longBreakInterval - 1) * shortBreakMin) + 
                                    longBreakMin;
                    const dailyTime = Math.floor(settings.maxSessionsPerDay / settings.longBreakInterval) * cycleTime;
                    const hours = Math.floor(dailyTime / 60);
                    const minutes = Math.round(dailyTime % 60);
                    return `~${hours}h ${minutes}m per day`;
                  })()}
                </div>
                <div className="text-xs text-nature-600">
                  Example: Focus {formatTime(settings.defaultFocusTime, settings.defaultFocusTimeUnit)} → Break {formatTime(settings.shortBreakTime, settings.shortBreakTimeUnit)} → Focus {formatTime(settings.defaultFocusTime, settings.defaultFocusTimeUnit)} → Break {formatTime(settings.shortBreakTime, settings.shortBreakTimeUnit)} → Focus {formatTime(settings.defaultFocusTime, settings.defaultFocusTimeUnit)} → Break {formatTime(settings.shortBreakTime, settings.shortBreakTimeUnit)} → Focus {formatTime(settings.defaultFocusTime, settings.defaultFocusTimeUnit)} → Long Break {formatTime(settings.longBreakTime, settings.longBreakTimeUnit)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sound Settings */}
        <section>
          <h2 className="text-xl font-semibold text-zen-800 mb-4 flex items-center gap-2">
            <Volume2 size={24} />
            Sound Settings
          </h2>
          <div className="space-y-4">
            <SettingRow
              icon={settings.soundsEnabled ? Volume2 : VolumeX}
              title="Enable Sounds"
              description="Master switch for all app sounds"
            >
              <Toggle
                enabled={settings.soundsEnabled}
                onChange={(value) => updateSetting('soundsEnabled', value)}
              />
            </SettingRow>

            {settings.soundsEnabled && (
              <>
                <SettingRow
                  icon={Bell}
                  title="Notification Sounds"
                  description="Play sounds for session start/end"
                >
                  <Toggle
                    enabled={settings.notificationSounds}
                    onChange={(value) => updateSetting('notificationSounds', value)}
                  />
                </SettingRow>

                <SettingRow
                  icon={Volume2}
                  title="Ambient Sounds"
                  description="Background nature sounds during focus"
                >
                  <Toggle
                    enabled={settings.ambientSounds}
                    onChange={(value) => updateSetting('ambientSounds', value)}
                  />
                </SettingRow>

                <SettingRow
                  icon={Volume2}
                  title="Volume Level"
                  description="Overall volume for app sounds"
                >
                  <div className="w-32">
                    <Slider
                      value={settings.volume}
                      onChange={(value) => updateSetting('volume', value)}
                    />
                  </div>
                </SettingRow>
              </>
            )}
          </div>
        </section>

        {/* Visual Settings */}
        <section>
          <h2 className="text-xl font-semibold text-zen-800 mb-4 flex items-center gap-2">
            <Palette size={24} />
            Visual Settings
          </h2>
          <div className="space-y-4">
            <SettingRow
              icon={Palette}
              title="Theme"
              description="Choose your preferred color scheme"
            >
              <Select
                value={settings.themePreference}
                onChange={(value) => updateSetting('themePreference', value)}
                options={[
                  { value: 'zen', label: 'Zen Garden' },
                  { value: 'forest', label: 'Forest' },
                  { value: 'ocean', label: 'Ocean' },
                  { value: 'sunset', label: 'Sunset' }
                ]}
              />
            </SettingRow>

            <SettingRow
              icon={Zap}
              title="Enable Animations"
              description="Show plant growth and UI animations"
            >
              <Toggle
                enabled={settings.animationsEnabled}
                onChange={(value) => updateSetting('animationsEnabled', value)}
              />
            </SettingRow>

            <SettingRow
              icon={Monitor}
              title="Reduce Motion"
              description="Minimize animations for accessibility"
            >
              <Toggle
                enabled={settings.reducedMotion}
                onChange={(value) => updateSetting('reducedMotion', value)}
              />
            </SettingRow>

            <SettingRow
              icon={Zap}
              title="Plant Animation Speed"
              description="How fast plants grow and change"
            >
              <Select
                value={settings.plantAnimationSpeed}
                onChange={(value) => updateSetting('plantAnimationSpeed', value)}
                options={[
                  { value: 'slow', label: 'Slow' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'fast', label: 'Fast' },
                  { value: 'instant', label: 'Instant' }
                ]}
              />
            </SettingRow>

            <SettingRow
              icon={Clock}
              title="Clock Format"
              description="Choose between 12-hour and 24-hour time display"
            >
              <Select
                value={settings.clockFormat}
                onChange={(value) => updateSetting('clockFormat', value)}
                options={[
                  { value: '12h', label: '12-hour (AM/PM)' },
                  { value: '24h', label: '24-hour' }
                ]}
              />
            </SettingRow>
          </div>
        </section>

        {/* Notification Settings */}
        <section>
          <h2 className="text-xl font-semibold text-zen-800 mb-4 flex items-center gap-2">
            <Bell size={24} />
            Notification Settings
          </h2>
          <div className="space-y-4">
            <SettingRow
              icon={Monitor}
              title="Browser Notifications"
              description="Show desktop notifications"
            >
              <Toggle
                enabled={settings.browserNotifications}
                onChange={(value) => updateSetting('browserNotifications', value)}
              />
            </SettingRow>

            <SettingRow
              icon={Clock}
              title="Session Reminders"
              description="Remind you to start focus sessions"
            >
              <Toggle
                enabled={settings.sessionReminders}
                onChange={(value) => updateSetting('sessionReminders', value)}
              />
            </SettingRow>

            <SettingRow
              icon={Bell}
              title="Plant Care Reminders"
              description="Notify when plants need attention"
            >
              <Toggle
                enabled={settings.plantCareReminders}
                onChange={(value) => updateSetting('plantCareReminders', value)}
              />
            </SettingRow>
          </div>
        </section>

        {/* Advanced Settings */}
        <section>
          <h2 className="text-xl font-semibold text-zen-800 mb-4 flex items-center gap-2">
            <SettingsIcon size={24} />
            Advanced Settings
          </h2>
          <div className="space-y-4">
            <SettingRow
              icon={Save}
              title="Auto-save"
              description="Automatically save your progress"
            >
              <Toggle
                enabled={settings.autoSaveEnabled}
                onChange={(value) => updateSetting('autoSaveEnabled', value)}
              />
            </SettingRow>

            <SettingRow
              icon={SettingsIcon}
              title="Usage Analytics"
              description="Help improve FlowGarden with anonymous data"
            >
              <Toggle
                enabled={settings.dataCollection}
                onChange={(value) => updateSetting('dataCollection', value)}
              />
            </SettingRow>

            <SettingRow
              icon={Zap}
              title="Beta Features"
              description="Try experimental features (may be unstable)"
            >
              <Toggle
                enabled={settings.betaFeatures}
                onChange={(value) => updateSetting('betaFeatures', value)}
              />
            </SettingRow>
          </div>
        </section>

        {/* Reset to Defaults */}
        <section className="pt-8 border-t border-zen-200">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <h3 className="font-medium text-red-800">Reset All Settings</h3>
              <p className="text-sm text-red-600">This will restore all settings to their default values</p>
            </div>
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
