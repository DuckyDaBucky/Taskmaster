import React from "react";
import { Shield } from "lucide-react";

type OnboardingForm = {
  net_id: string;
  major: string;
  current_year: string;
  expected_graduation: string;
};

type Props = {
  form: OnboardingForm;
  setForm: React.Dispatch<React.SetStateAction<OnboardingForm>>;
  onSave: () => void;
  isSaving: boolean;
};

const OnboardingSection: React.FC<Props> = ({ form, setForm, onSave, isSaving }) => {
  return (
    <section className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Onboarding Information</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Update what you entered during onboarding.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Net ID</label>
          <input
            type="text"
            value={form.net_id}
            onChange={(e) => setForm((p) => ({ ...p, net_id: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Major</label>
          <input
            type="text"
            value={form.major}
            onChange={(e) => setForm((p) => ({ ...p, major: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Current Year</label>
            <input
              type="text"
              value={form.current_year}
              onChange={(e) => setForm((p) => ({ ...p, current_year: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              placeholder="e.g., Sophomore"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Expected Graduation</label>
            <input
              type="text"
              value={form.expected_graduation}
              onChange={(e) => setForm((p) => ({ ...p, expected_graduation: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              placeholder="e.g., May 2027"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Onboarding Info"}
        </button>
      </div>
    </section>
  );
};

export default OnboardingSection;
