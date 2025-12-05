import React, { useState, useEffect } from "react";
import { useTheme, Theme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";
import { supabase } from "../../lib/supabase";

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, setUserState } = useUser();
  const [preferences, setPreferences] = useState({
    personality: 0.5,
    time: 0,
    inPerson: 0,
    privateSpace: 0,
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load user preferences on mount
  useEffect(() => {
    if (user) {
      setPreferences({
        personality: user.preferences?.personality ?? 0.5,
        time: user.preferences?.time ?? 0,
        inPerson: user.preferences?.inPerson ?? 0,
        privateSpace: user.preferences?.privateSpace ?? 0,
      });
      setNotifications({
        emailNotifications: user.settings?.emailNotifications ?? true,
        pushNotifications: user.settings?.pushNotifications ?? false,
        weeklyDigest: user.settings?.weeklyDigest ?? true,
      });
    }
  }, [user]);

  const handleSavePreferences = async () => {
    if (!user?._id) {
      setSaveMessage("Please log in to save preferences");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Save preferences directly to Supabase
      const { error } = await supabase
        .from('users')
        .update({
          personality: preferences.personality,
          time_preference: preferences.time,
          in_person: preferences.inPerson,
          private_space: preferences.privateSpace,
          settings: notifications,
        })
        .eq('id', user._id);

      if (error) throw error;

      // Update local state
      setUserState({
        preferences,
        settings: notifications,
      });

      setSaveMessage("Preferences saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSaveMessage("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    
    // Save theme to database if user is logged in
    if (user?._id) {
      try {
        await supabase
          .from('users')
          .update({ theme: newTheme })
          .eq('id', user._id);
        setUserState({ theme: newTheme });
      } catch (error) {
        console.error("Failed to save theme:", error);
      }
    }
  };

  const themes: { id: Theme; label: string; color: string; primary: string }[] = [
    { id: 'light', label: 'Light', color: '#f8fafc', primary: '#3b82f6' },
    { id: 'dark', label: 'Dark', color: '#020617', primary: '#3b82f6' },
    { id: 'frost', label: 'Frost', color: '#1e1b4b', primary: '#a5b4fc' },
    { id: 'retro', label: 'Retro', color: '#244855', primary: '#E64833' },
    { id: 'aqua', label: 'Aqua', color: '#003135', primary: '#0FA4AF' },
    { id: 'earth', label: 'Earth', color: '#3E362E', primary: '#AC8968' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Account Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b border-border-color pb-2">Account</h2>
        <div className="bg-surface border border-border-color rounded-md p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <input 
                type="text" 
                value={user?.username || "Not set"} 
                readOnly
                className="w-full bg-background border border-border-color rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <input 
                type="email" 
                value={user?.email || "Not set"} 
                readOnly
                className="w-full bg-background border border-border-color rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Contact support to update your account information
          </p>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b border-border-color pb-2">Appearance</h2>
        <div className="bg-surface border border-border-color rounded-md p-6">
          <h3 className="text-foreground font-medium mb-4">Theme</h3>
          <div className="flex flex-wrap gap-4">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`
                  group flex flex-col items-center gap-2 p-2 rounded-lg transition-all
                  ${theme === t.id ? 'bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-surface' : 'hover:bg-background'}
                `}
              >
                <div 
                  className="w-24 h-24 rounded-md shadow-sm border border-border-color flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: t.color }}
                >
                  <div 
                    className="w-8 h-8 rounded-full shadow-sm"
                    style={{ backgroundColor: t.primary }}
                  />
                </div>
                <span className={`text-sm font-medium ${theme === t.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Study Preferences Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b border-border-color pb-2">Study Preferences</h2>
        <div className="bg-surface border border-border-color rounded-md p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Set your study preferences to help us match you with compatible study partners.
          </p>

          {/* Personality */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Personality (0 = Introverted, 1 = Extroverted)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={preferences.personality}
              onChange={(e) => setPreferences({ ...preferences, personality: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Introverted</span>
              <span className="font-medium">{preferences.personality.toFixed(1)}</span>
              <span>Extroverted</span>
            </div>
          </div>

          {/* Preferred Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Preferred Study Time</label>
            <select
              value={preferences.time}
              onChange={(e) => setPreferences({ ...preferences, time: parseInt(e.target.value) })}
              className="w-full bg-background border border-border-color rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
            >
              <option value={0}>Morning (6 AM - 12 PM)</option>
              <option value={1}>Afternoon (12 PM - 6 PM)</option>
              <option value={2}>Evening (6 PM - 12 AM)</option>
              <option value={3}>Night (12 AM - 6 AM)</option>
            </select>
          </div>

          {/* In Person or Virtual */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Study Preference</label>
            <div className="flex gap-4">
              <button
                onClick={() => setPreferences({ ...preferences, inPerson: 1 })}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  preferences.inPerson === 1
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-foreground border-border-color hover:border-primary"
                }`}
              >
                In Person
              </button>
              <button
                onClick={() => setPreferences({ ...preferences, inPerson: 0 })}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  preferences.inPerson === 0
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-foreground border-border-color hover:border-primary"
                }`}
              >
                Virtual
              </button>
            </div>
          </div>

          {/* Private or Public Space (only if in-person) */}
          {preferences.inPerson === 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Study Space Preference</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setPreferences({ ...preferences, privateSpace: 1 })}
                  className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                    preferences.privateSpace === 1
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-foreground border-border-color hover:border-primary"
                  }`}
                >
                  Private Space
                </button>
                <button
                  onClick={() => setPreferences({ ...preferences, privateSpace: 0 })}
                  className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                    preferences.privateSpace === 0
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-foreground border-border-color hover:border-primary"
                  }`}
                >
                  Public Space
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-border-color">
            <button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Preferences"}
            </button>
            {saveMessage && (
              <p className={`mt-2 text-sm ${saveMessage.includes("success") ? "text-green-500" : "text-red-500"}`}>
                {saveMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b border-border-color pb-2">Notifications</h2>
        <div className="bg-surface border border-border-color rounded-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground">Email Notifications</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notifications.emailNotifications}
                onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
              />
              <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground">Push Notifications</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notifications.pushNotifications}
                onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
              />
              <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground">Weekly Digest</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notifications.weeklyDigest}
                onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
              />
              <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
