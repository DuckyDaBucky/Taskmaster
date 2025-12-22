"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { theme } from "@/constants/theme";
import StyledSelect from "@/components/ui/StyledSelect";
import StyledDatePicker from "@/components/ui/StyledDatePicker";

type YearOption =
  | "Freshman"
  | "Sophomore"
  | "Junior"
  | "Senior"
  | "Graduate"
  | "Other";

type OnboardingData = {
  netId: string;
  major: string;
  currentYear: YearOption | "";
  expectedGraduation: string; // YYYY-MM-DD from <input type="date">
};

const storageKeyForUser = (userId: string) =>
  `taskmaster:onboardingDraft:${userId}`;

function isValidNetId(v: string) {
  return /^[a-zA-Z]{3}\d{6}$/.test(v.trim());
}

function isValidMajor(v: string) {
  return v.trim().length >= 2;
}

function isValidYear(v: string) {
  return v.length > 0;
}

function isValidGradDate(v: string) {
  // basic: non-empty date string
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export default function OnboardingFlow() {
  const router = useRouter();

  const [data, setData] = useState<OnboardingData>({
    netId: "",
    major: "",
    currentYear: "",
    expectedGraduation: "",
  });

  const [stepIndex, setStepIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [submitError, setSubmitError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const steps = useMemo(
    () => [
      {
        id: "netId",
        title: "What’s your UTD NetID?",
        subtitle: "This helps personalize your student workflow experience.",
        placeholder: "e.g., abc123456",
        type: "text" as const,
        value: data.netId,
        setValue: (v: string) => setData((d) => ({ ...d, netId: v })),
        isValid: () => isValidNetId(data.netId),
        helper:
          "Use the NetID you use for UTD systems (it can be letters/numbers).",
      },
      {
        id: "major",
        title: "What’s your major?",
        subtitle: "We’ll tailor templates and suggestions to your coursework.",
        placeholder: "e.g., Computer Science",
        type: "text" as const,
        value: data.major,
        setValue: (v: string) => setData((d) => ({ ...d, major: v })),
        isValid: () => isValidMajor(data.major),
        helper: "Type the full major name (you can edit this later).",
      },
      {
        id: "currentYear",
        title: "What year are you currently?",
        subtitle: "This helps us adjust pacing and recommendations.",
        type: "select" as const,
        value: data.currentYear,
        setValue: (v: string) =>
          setData((d) => ({ ...d, currentYear: v as YearOption })),
        isValid: () => isValidYear(data.currentYear),
        options: [
          "Freshman",
          "Sophomore",
          "Junior",
          "Senior",
          "Graduate",
          "Other",
        ] as YearOption[],
        helper: "If you’re not sure, choose the closest match.",
      },
      {
        id: "expectedGraduation",
        title: "When do you expect to graduate?",
        subtitle: "We’ll use this for long-range planning and milestones.",
        type: "date" as const,
        value: data.expectedGraduation,
        setValue: (v: string) =>
          setData((d) => ({ ...d, expectedGraduation: v })),
        isValid: () => isValidGradDate(data.expectedGraduation),
        helper: "You can change this anytime later in Settings.",
      },
    ],
    [data]
  );

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKeyForUser(userId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<OnboardingData>;
      setData((d) => ({ ...d, ...parsed }));
    } catch {
      // ignore
    }
  }, []);

  // Save draft whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyForUser(userId), JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  // Scroll new content into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [stepIndex]);

  const progress = Math.round(
    ((Math.min(stepIndex, steps.length - 1) + 1) / steps.length) * 100
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? "");
    })();
  }, []);

  const allValid = steps.every((s) => s.isValid());

  async function handleFinish() {
    if (!allValid) return;

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userData.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      const { error: updateErr } = await supabase
        .from("users")
        .update({
          net_id: data.netId.trim(),
          major: data.major.trim(),
          current_year: data.currentYear,
          expected_graduation: data.expectedGraduation, // 'YYYY-MM-DD' is fine for a date column
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (updateErr) {
        // If your unique index is users_net_id_unique, this is the common conflict
        const msg = updateErr.message?.toLowerCase() ?? "";
        if (
          msg.includes("duplicate") ||
          msg.includes("unique") ||
          msg.includes("users_net_id_unique")
        ) {
          setSubmitError(
            "That NetID is already in use. Please double-check and try again."
          );
        } else {
          setSubmitError(
            updateErr.message || "Failed to save onboarding info."
          );
        }
        return;
      }

      // optional: clear draft after success
      localStorage.removeItem(storageKeyForUser(userId));

      router.replace("/dashboard");
    } catch (e: unknown) {
      if (e instanceof Error) {
        setSubmitError(e.message);
      } else {
        setSubmitError("Something went wrong while saving your profile.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    setSubmitError("");
    setStepIndex((s) => Math.max(0, s - 1));
  }

  function goNext() {
    if (!steps[stepIndex].isValid()) return;
    setSubmitError("");
    setStepIndex((s) => Math.min(steps.length - 1, s + 1));
  }

  function handleEnterToAdvance(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    e.preventDefault();

    if (!steps[stepIndex].isValid()) return;

    if (stepIndex < steps.length - 1) {
      goNext();
    } else {
      handleFinish();
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#6B6BFF] via-[#8B7FFF] to-[#A88FFF] opacity-90" />
      <div className="w-full max-w-2xl">
        <div className="relative z-10 w-full max-w-xl mx-auto px-6 pb-64 -translate-y-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={steps[stepIndex].id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <div className="text-lg sm:text-xl font-semibold text-white">
                {steps[stepIndex].title}
              </div>

              <div className="text-sm text-white/70">
                {steps[stepIndex].helper}
              </div>

              {steps[stepIndex].type === "text" && (
                <input
                  value={steps[stepIndex].value}
                  onChange={(e) => steps[stepIndex].setValue(e.target.value)}
                  placeholder={steps[stepIndex].placeholder}
                  className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-white/50 outline-none focus:border-white/40 focus:bg-white/15 transition"
                  onKeyDown={handleEnterToAdvance}
                />
              )}

              {steps[stepIndex].type === "date" && (
                <StyledDatePicker
                  value={steps[stepIndex].value}
                  onChange={(v) => steps[stepIndex].setValue(v)}
                  disabled={isSubmitting}
                  placeholder="Select graduation date…"
                />
              )}

              {steps[stepIndex].type === "select" && (
                <StyledSelect
                  value={steps[stepIndex].value}
                  placeholder="Select one…"
                  options={(steps[stepIndex].options ?? []).map((o) => ({
                    label: o,
                    value: o,
                  }))}
                  onChange={(v) => steps[stepIndex].setValue(v)}
                  disabled={isSubmitting}
                />
              )}

              {submitError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {submitError}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-5">
          <div className="mx-auto max-w-xl rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 p-4">
            <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
              <motion.div
                className="h-full bg-white/70"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                onClick={goBack}
                disabled={stepIndex === 0 || isSubmitting}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  stepIndex === 0 || isSubmitting
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-white/15 text-white hover:bg-white/20",
                ].join(" ")}
              >
                Back
              </button>

              <div className="text-xs text-white/60">
                {stepIndex + 1} / {steps.length}
              </div>

              {stepIndex < steps.length - 1 ? (
                <button
                  onClick={goNext}
                  disabled={!steps[stepIndex].isValid() || isSubmitting}
                  className={[
                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                    !steps[stepIndex].isValid() || isSubmitting
                      ? "bg-white/10 text-white/40 cursor-not-allowed"
                      : "bg-white text-black hover:bg-white/90",
                  ].join(" ")}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={!steps[stepIndex].isValid() || isSubmitting}
                  className={[
                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                    !steps[stepIndex].isValid() || isSubmitting
                      ? "bg-white/10 text-white/40 cursor-not-allowed"
                      : "bg-white text-black hover:bg-white/90",
                  ].join(" ")}
                >
                  {isSubmitting ? "Saving..." : "Finish"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
