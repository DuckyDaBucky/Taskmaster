import React, { useState, useEffect } from "react";
import { useTheme, Theme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { supabase } from "../../lib/supabase";

import SettingsMessage from "./components/SettingsMessage";
import ProfileSection from "./components/ProfileSection";
import AppearanceSection from "./components/AppearanceSection";
import StudyPreferencesSection from "./components/StudyPreferencesSection";
import OnboardingSection from "./components/OnboardingSection";
import NotificationsSection from "./components/NotificationsSection";
import DangerZoneSection from "./components/DangerZoneSection";

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user, setUserState, logout } = useUser();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
  });

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
    taskReminders: true,
    friendRequests: true,
  });

  const getErrorMessage = (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong";

  const [onboardingForm, setOnboardingForm] = useState({
    net_id: "",
    major: "",
    current_year: "",
    expected_graduation: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

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

    const hasOnboarding =
      !!user.net_id ||
      !!user.major ||
      !!user.current_year ||
      !!user.expected_graduation;

    if (hasOnboarding) {
      setOnboardingForm({
        net_id: user.net_id || "",
        major: user.major || "",
        current_year: user.current_year || "",
        expected_graduation: user.expected_graduation || "",
      });
    } else {
      loadOnboardingFromDb();
    }
  }, [user]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadOnboardingFromDb = async () => {
    if (!user?._id) return;

    const { data, error } = await supabase
      .from("users")
      .select("net_id, major, current_year, expected_graduation")
      .eq("id", user._id)
      .single();

    if (error) {
      console.error("Failed to load onboarding fields:", error.message);
      return;
    }

    const next = {
      net_id: data?.net_id ?? "",
      major: data?.major ?? "",
      current_year: data?.current_year ?? "",
      expected_graduation: data?.expected_graduation ?? "",
    };

    setOnboardingForm(next);

    // Optional but recommended: keep UserContext in sync so other pages can use it too
    setUserState(next);
  };

  const handleSaveProfile = async () => {
    if (!user?._id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          first_name: profileForm.firstName,
          last_name: profileForm.lastName,
          display_name: profileForm.displayName,
        })
        .eq("id", user._id);

      if (error) throw error;

      setUserState({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        displayName: profileForm.displayName,
      });
      setIsEditingProfile(false);
      showMessage("success", "Profile updated!");
    } catch (error: unknown) {
      showMessage("error", getErrorMessage(error) || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user?._id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          personality: preferences.personality,
          time_preference: preferences.time,
          in_person: preferences.inPerson,
          settings: notifications,
        })
        .eq("id", user._id);

      if (error) throw error;

      setUserState({ preferences, settings: notifications });
      showMessage("success", "Preferences saved!");
    } catch (error: unknown) {
      showMessage("error", getErrorMessage(error) || "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOnboarding = async () => {
    if (!user?._id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          net_id: onboardingForm.net_id.trim(),
          major: onboardingForm.major.trim(),
          current_year: onboardingForm.current_year.trim(),
          expected_graduation: onboardingForm.expected_graduation.trim(),
        })
        .eq("id", user._id);

      if (error) throw error;

      setUserState(onboardingForm);
      showMessage("success", "Onboarding info updated!");
    } catch (error: unknown) {
      showMessage("error", getErrorMessage(error) || "Failed to update onboarding info");
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    if (user?._id) {
      await supabase
        .from("users")
        .update({ theme: newTheme })
        .eq("id", user._id);
    }
  };

  const timeOptions = [
    { value: 0, label: "Morning (6am-12pm)" },
    { value: 1, label: "Afternoon (12pm-6pm)" },
    { value: 2, label: "Evening (6pm-12am)" },
    { value: 3, label: "Night (12am-6am)" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <SettingsMessage message={message} />

      <ProfileSection
        user={user}
        isEditing={isEditingProfile}
        setIsEditing={setIsEditingProfile}
        form={profileForm}
        setForm={setProfileForm}
        onSave={handleSaveProfile}
        isSaving={isSaving}
      />

      <AppearanceSection theme={theme} onThemeChange={handleThemeChange} />

      <StudyPreferencesSection
        preferences={preferences}
        setPreferences={setPreferences}
        timeOptions={timeOptions}
        onSave={handleSavePreferences}
        isSaving={isSaving}
      />

      <OnboardingSection
        form={onboardingForm}
        setForm={setOnboardingForm}
        onSave={handleSaveOnboarding}
        isSaving={isSaving}
      />

      <NotificationsSection
        notifications={notifications}
        setNotifications={setNotifications}
        onSave={handleSavePreferences}
        isSaving={isSaving}
      />

      <DangerZoneSection onLogout={logout} />
    </div>
  );
};

export default SettingsPage;
