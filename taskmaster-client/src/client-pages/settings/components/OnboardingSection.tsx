import React, { useMemo } from "react";
import { Shield } from "lucide-react";
import StyledSelect from "@/components/ui/StyledSelect";
import StyledDatePicker from "@/components/ui/StyledDatePicker";

type YearOption =
  | "Freshman"
  | "Sophomore"
  | "Junior"
  | "Senior"
  | "Graduate"
  | "Other";

type OnboardingForm = {
  net_id: string;
  major: string;
  current_year: YearOption | "";
  expected_graduation: string;
};

type Props = {
  form: OnboardingForm;
  setForm: React.Dispatch<React.SetStateAction<OnboardingForm>>;
  onSave: () => void;
  isSaving: boolean;
};

const OnboardingSection: React.FC<Props> = ({
  form,
  setForm,
  onSave,
  isSaving,
}) => {
  const yearOptions = useMemo<YearOption[]>(
    () => ["Freshman", "Sophomore", "Junior", "Senior", "Graduate", "Other"],
    []
  );

  function sanitizeNetId(raw: string) {
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 9);

    // First 3 chars letters only
    const first = cleaned
      .slice(0, 3)
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 3);

    // Remaining digits only (up to 6)
    const rest = cleaned.slice(3).replace(/\D/g, "").slice(0, 6);

    return (first + rest).toLowerCase();
  }

  const netIdIsValid = /^[a-zA-Z]{3}\d{6}$/.test(form.net_id.trim());

  return (
    <section className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Onboarding Information
        </h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Update what you entered during onboarding.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Net ID
          </label>
          <input
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={form.net_id}
            onChange={(e) =>
              setForm((p) => ({ ...p, net_id: sanitizeNetId(e.target.value) }))
            }
            placeholder="e.g., abc123456"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
          />

          {form.net_id.length > 0 && !netIdIsValid && (
            <p className="mt-1 text-xs text-destructive">
              NetID must be 3 letters followed by 6 numbers (e.g., abc123456).
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Major
          </label>
          <input
            type="text"
            value={form.major}
            onChange={(e) => setForm((p) => ({ ...p, major: e.target.value }))}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Current Year
            </label>
            <StyledSelect
              variant="settings"
              value={form.current_year}
              placeholder="Select year…"
              options={yearOptions.map((y) => ({ label: y, value: y }))}
              onChange={(v) => setForm((p) => ({ ...p, current_year: v as YearOption}))}
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Expected Graduation
            </label>
            <StyledDatePicker
              variant="settings"
              value={form.expected_graduation}
              onChange={(v) =>
                setForm((p) => ({ ...p, expected_graduation: v }))
              }
              disabled={isSaving}
              placeholder="Select graduation date…"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={
            isSaving ||
            !netIdIsValid ||
            !form.current_year ||
            !form.expected_graduation
          }
          className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Onboarding Info"}
        </button>
      </div>
    </section>
  );
};

export default OnboardingSection;
