import React from "react";
import { Palette } from "lucide-react";
import type { Theme } from "../../../context/ThemeContext";

const themes: { id: Theme; label: string; bg: string; accent: string }[] = [
  { id: "light", label: "Light", bg: "#ffffff", accent: "#3b82f6" },
  { id: "dark", label: "Dark", bg: "#0f172a", accent: "#3b82f6" },
  { id: "frost", label: "Frost", bg: "#1e1b4b", accent: "#a5b4fc" },
  { id: "retro", label: "Retro", bg: "#244855", accent: "#E64833" },
  { id: "aqua", label: "Aqua", bg: "#003135", accent: "#0FA4AF" },
  { id: "earth", label: "Earth", bg: "#3E362E", accent: "#AC8968" },
];

type Props = {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
};

const AppearanceSection: React.FC<Props> = ({ theme, onThemeChange }) => {
  return (
    <section className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Palette size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        Select your preferred theme. This will be your default when you log in.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onThemeChange(t.id)}
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
  );
};

export default AppearanceSection;
