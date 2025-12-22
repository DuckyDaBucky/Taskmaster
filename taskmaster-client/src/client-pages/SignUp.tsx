"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "../services/api";
import { supabase } from "../lib/supabase";
import { theme } from "../constants/theme";
import { motion } from "framer-motion";

function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authService.signup(formData);

      // Check if we have a session (no email confirmation)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace("/onboarding");
      } else {
        setError("Check your email to confirm your account, then log in.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Signup failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-y-auto"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6B6BFF] via-[#8B7FFF] to-[#A88FFF] opacity-90" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-4 my-8 z-10 p-8 rounded-xl"
        style={{
          backgroundColor: theme.colors.surface,
          boxShadow: theme.shadows.modal,
        }}
      >
        <div className="text-center mb-6">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: theme.colors.accentPrimary }}
          >
            Taskmaster
          </h1>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Create your account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/10 text-red-500 border border-red-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: theme.colors.textPrimary }}
              >
                Username
              </label>
              <input
                type="text"
                value={formData.userName}
                onChange={handleChange("userName")}
                required
                minLength={3}
                className="w-full px-4 py-2 rounded-lg focus:outline-none"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                }}
                placeholder="username"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: theme.colors.textPrimary }}
              >
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                required
                className="w-full px-4 py-2 rounded-lg focus:outline-none"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                }}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: theme.colors.textPrimary }}
              >
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                required
                className="w-full px-4 py-2 rounded-lg focus:outline-none"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                }}
                placeholder="John"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: theme.colors.textPrimary }}
              >
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                required
                className="w-full px-4 py-2 rounded-lg focus:outline-none"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                }}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: theme.colors.textPrimary }}
            >
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={handleChange("password")}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg focus:outline-none"
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary,
              }}
              placeholder="Min 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: theme.colors.accentPrimary }}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>

          <p
            className="text-center text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold"
              style={{ color: theme.colors.accentPrimary }}
            >
              Log in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}

export default Signup;
