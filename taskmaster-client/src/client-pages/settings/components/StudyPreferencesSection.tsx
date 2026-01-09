import React from "react";
import { Shield } from "lucide-react";

type Preferences = {
  personality: number;
  time: number;
  inPerson: number;
  privateSpace: number;
};

type Props = {
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
  timeOptions: { value: number; label: string }[];
  onSave: () => void;
  isSaving: boolean;
};

const StudyPreferencesSection: React.FC<Props> = ({ preferences, setPreferences, timeOptions, onSave, isSaving }) => {
  return (
    <section className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Study Preferences</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">Used for matching you with study partners</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Personality:{" "}
            {preferences.personality < 0.4
              ? "Introvert"
              : preferences.personality > 0.6
              ? "Extrovert"
              : "Ambivert"}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={preferences.personality}
            onChange={(e) => setPreferences((p) => ({ ...p, personality: parseFloat(e.target.value) }))}
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
            onChange={(e) => setPreferences((p) => ({ ...p, time: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
          >
            {timeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Study Style</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPreferences((p) => ({ ...p, inPerson: 1 }))}
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
              onClick={() => setPreferences((p) => ({ ...p, inPerson: 0 }))}
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
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </section>
  );
};

export default StudyPreferencesSection;
