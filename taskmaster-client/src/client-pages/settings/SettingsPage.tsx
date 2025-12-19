import React, { useState, useEffect } from "react";
import { useTheme, Theme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { supabase } from "../../lib/supabase";
import { User, Palette, Bell, Shield, Trash2 } from "lucide-react";

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, setUserState, logout } = useUser();
  
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
  });
  
  // Preferences
  const [preferences, setPreferences] = useState({
    personality: 0.5,
    time: 0,
    inPerson: 0,
    privateSpace: 0,
  });
  
  // Notifications
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    taskReminders: true,
    friendRequests: true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        displayName: user.displayName || user.username || "",
      });
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
        taskReminders: true,
        friendRequests: true,
      });
    }
  }, [user]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!user?._id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: profileForm.firstName,
          last_name: profileForm.lastName,
          display_name: profileForm.displayName,
        })
        .eq('id', user._id);
      
      if (error) throw error;
      
      setUserState({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        displayName: profileForm.displayName,
      });
      setIsEditingProfile(false);
      showMessage("success", "Profile updated!");
    } catch (error: any) {
      showMessage("error", error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user?._id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          personality: preferences.personality,
          time_preference: preferences.time,
          in_person: preferences.inPerson,
          settings: notifications,
        })
        .eq('id', user._id);
      
      if (error) throw error;
      
      setUserState({ preferences, settings: notifications });
      showMessage("success", "Preferences saved!");
    } catch (error: any) {
      showMessage("error", error.message || "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    if (user?._id) {
      await supabase.from('users').update({ theme: newTheme }).eq('id', user._id);
    }
  };

  const themes: { id: Theme; label: string; bg: string; accent: string }[] = [
    { id: 'light', label: 'Light', bg: '#ffffff', accent: '#3b82f6' },
    { id: 'dark', label: 'Dark', bg: '#0f172a', accent: '#3b82f6' },
    { id: 'frost', label: 'Frost', bg: '#1e1b4b', accent: '#a5b4fc' },
    { id: 'retro', label: 'Retro', bg: '#244855', accent: '#E64833' },
    { id: 'aqua', label: 'Aqua', bg: '#003135', accent: '#0FA4AF' },
    { id: 'earth', label: 'Earth', bg: '#3E362E', accent: '#AC8968' },
  ];

  const timeOptions = [
    { value: 0, label: "Morning (6am-12pm)" },
    { value: 1, label: "Afternoon (12pm-6pm)" },
    { value: 2, label: "Evening (6pm-12am)" },
    { value: 3, label: "Night (12am-6am)" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <section className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {(user?.firstName?.[0] || user?.displayName?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">@{user?.displayName || user?.username}</p>
            </div>
          </div>

          {isEditingProfile ? (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Display Name</label>
                <input
                  type="text"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="text-sm text-primary hover:underline"
            >
              Edit Profile
            </button>
          )}
        </div>
      </section>

      {/* Appearance Section */}
      <section className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-3">
            Select your preferred theme. This will be your default when you log in.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={`p-2 rounded-lg border-2 transition-all ${
                theme === t.id ? "border-primary" : "border-transparent hover:border-border"
              }`}
            >
              <div
                className="w-full aspect-square rounded-md mb-1 flex items-center justify-center"
                style={{ backgroundColor: t.bg }}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accent }} />
              </div>
              <span className="text-xs text-foreground">{t.label}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Current theme: <span className="font-medium capitalize">{theme}</span> (saved to your profile)
        </p>
      </section>

      {/* Study Preferences Section */}
      <section className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Study Preferences</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Used for matching you with study partners
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Personality: {preferences.personality < 0.4 ? "Introvert" : preferences.personality > 0.6 ? "Extrovert" : "Ambivert"}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={preferences.personality}
              onChange={(e) => setPreferences({ ...preferences, personality: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Introvert</span>
              <span>Extrovert</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Preferred Study Time</label>
            <select
              value={preferences.time}
              onChange={(e) => setPreferences({ ...preferences, time: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            >
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Study Style</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreferences({ ...preferences, inPerson: 1 })}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  preferences.inPerson === 1
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-foreground border-border hover:border-primary"
                }`}
              >
                In Person
              </button>
              <button
                type="button"
                onClick={() => setPreferences({ ...preferences, inPerson: 0 })}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  preferences.inPerson === 0
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-foreground border-border hover:border-primary"
                }`}
              >
                Virtual
              </button>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            { key: "emailNotifications", label: "Email Notifications" },
            { key: "pushNotifications", label: "Push Notifications" },
            { key: "weeklyDigest", label: "Weekly Digest" },
            { key: "taskReminders", label: "Task Reminders" },
            { key: "friendRequests", label: "Friend Request Alerts" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-foreground">{item.label}</span>
              <button
                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-secondary"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    notifications[item.key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
          
          <button
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Notifications"}
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-card border border-red-500/30 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 size={20} className="text-red-500" />
          <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
        </div>

        <div className="space-y-3">
          <button
            onClick={logout}
            className="w-full px-4 py-2 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Log Out
          </button>
          <button
            onClick={() => alert("Contact support to delete your account")}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
