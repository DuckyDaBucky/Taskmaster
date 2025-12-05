import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/authService";
import { theme } from "../constants/theme";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, useForm } from "react-hook-form";
import { motion } from "framer-motion";

const signupSchema = z.object({
  userName: z
    .string()
    .min(9, "Username should be at least 9 characters long")
    .max(20, "Username should not exceed 20 characters"),
  firstName: z.string().min(1, "Name must be at least 1 character"),
  lastName: z.string().min(1, "Name must be at least 1 character"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(9, "Password must be at least 9 characters")
    .max(20, "Password must not exceed 20 characters"),
});
type SignupFormData = z.infer<typeof signupSchema>;

function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });
  const [formError, setFormError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onSubmit = async (data: FieldValues) => {
    setIsLoading(true);
    setFormError(false);
    setErrorMessage("");
    
    try {
      await authService.signup({
        userName: data.userName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      
      // Signup successful - Supabase session is automatically managed
      // UserContext will pick up the auth state change
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error("Error submitting form: ", error);
      setFormError(true);
      
      // Use the error message from the service, or provide a default
      const errorMsg = error.message || "";
      if (errorMsg.includes("check your email") || errorMsg.includes("confirm")) {
        setErrorMessage(errorMsg);
      } else if (errorMsg.includes("already") || errorMsg.includes("taken") || errorMsg.includes("exists") || errorMsg.includes("duplicate") || errorMsg.includes("unique")) {
        setErrorMessage("Username or email is already taken");
      } else if (errorMsg.includes("row-level security") || errorMsg.includes("policy") || errorMsg.includes("RLS")) {
        // Suppress RLS errors - user account was likely created successfully
        // They can try logging in
        setErrorMessage("Account may have been created. Please try logging in.");
      } else {
        // Show a generic error message
        setErrorMessage("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-y-auto py-8" style={{ backgroundColor: theme.colors.background }}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6B6BFF] via-[#8B7FFF] to-[#A88FFF] opacity-90" />
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Animated Blobs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        style={{ backgroundColor: '#8B7FFF', top: '-10%', left: '-10%' }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -40, 40, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        style={{ backgroundColor: '#A88FFF', bottom: '-10%', right: '-10%' }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -40, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Signup Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-2xl mx-4 z-10 relative my-8"
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.card,
          boxShadow: theme.shadows.modal,
          padding: '2.5rem',
        }}
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.accentPrimary }}>
              Taskmaster
            </h1>
            <div className="w-16 h-1 mx-auto rounded-full" style={{ backgroundColor: theme.colors.accentPrimary }} />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-semibold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            Create Your Account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            Join Taskmaster and start organizing your academic life
          </motion.p>
        </div>

        {/* Error Message */}
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg text-sm"
            style={{
              backgroundColor: `${theme.colors.error}15`,
              color: theme.colors.error,
              border: `1px solid ${theme.colors.error}40`,
            }}
          >
            {errorMessage || "Username or email is already taken. Please try again."}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Username Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label
                htmlFor="userName"
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.textPrimary }}
              >
                Username
              </label>
              <input
                type="text"
                id="userName"
                {...register("userName")}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.accentPrimary;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.colors.accentPrimary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border;
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Choose a username"
              />
              {errors.userName && (
                <p className="text-sm mt-1.5" style={{ color: theme.colors.error }}>
                  {errors.userName.message}
                </p>
              )}
            </motion.div>

            {/* First Name Field */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label
                htmlFor="firstName"
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.textPrimary }}
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                {...register("firstName")}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.accentPrimary;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.colors.accentPrimary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border;
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <p className="text-sm mt-1.5" style={{ color: theme.colors.error }}>
                  {errors.firstName.message}
                </p>
              )}
            </motion.div>

            {/* Last Name Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label
                htmlFor="lastName"
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.textPrimary }}
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                {...register("lastName")}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.accentPrimary;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.colors.accentPrimary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border;
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <p className="text-sm mt-1.5" style={{ color: theme.colors.error }}>
                  {errors.lastName.message}
                </p>
              )}
            </motion.div>

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: theme.colors.textPrimary }}
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                {...register("email")}
                className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.textPrimary,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.accentPrimary;
                  e.target.style.boxShadow = `0 0 0 3px ${theme.colors.accentPrimary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border;
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-sm mt-1.5" style={{ color: theme.colors.error }}>
                  {errors.email.message}
                </p>
              )}
            </motion.div>
          </div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.textPrimary }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              {...register("password")}
              className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.accentPrimary;
                e.target.style.boxShadow = `0 0 0 3px ${theme.colors.accentPrimary}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border;
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Create a strong password"
            />
            {errors.password && (
              <p className="text-sm mt-1.5" style={{ color: theme.colors.error }}>
                {errors.password.message}
              </p>
            )}
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="w-full py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.colors.accentPrimary,
              color: 'white',
              boxShadow: `0 4px 12px ${theme.colors.accentPrimary}40`,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = theme.colors.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.accentPrimary;
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </motion.button>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center pt-2"
          >
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold transition-colors duration-200 hover:underline"
                style={{ color: theme.colors.accentPrimary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.accentHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.accentPrimary;
                }}
              >
                Log in
              </Link>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}

export default Signup;