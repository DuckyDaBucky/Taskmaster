import React from "react";
import { useTheme, Theme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();

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
                onClick={() => setTheme(t.id)}
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

      {/* Notifications Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b border-border-color pb-2">Notifications</h2>
        <div className="bg-surface border border-border-color rounded-md p-6 space-y-4">
          {["Email Notifications", "Push Notifications", "Weekly Digest"].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <span className="text-foreground">{item}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
