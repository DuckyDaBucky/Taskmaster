import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authService } from "../services/authService";
import { supabase } from "../lib/supabase";
import { theme } from "../constants/theme";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, useForm } from "react-hook-form";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const [setInvalidPass, setSetInvalidPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Prevent auto-login if user just logged out
  useEffect(() => {
    // If coming from logout, ensure everything is cleared
    if (searchParams.get('logout') === 'true') {
      // Supabase session is already cleared by authService.logout()
      // Just clear any legacy localStorage data
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("personalityData");
      // Remove the query parameter from URL
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const onSubmit = async (data: FieldValues) => {
    setIsLoading(true);
    setSetInvalidPass(false);
    setErrorMessage("");
    
    try {
      // Check if input is email or username
      const emailOrUsername = data.emailOrUsername;
      const isEmail = emailOrUsername.includes("@");
      
      await authService.login(emailOrUsername, data.password, isEmail);
      
      // Wait a moment for session to be fully set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify session is set before redirecting
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Use React Router navigation instead of window.location
        navigate("/dashboard", { replace: true });
      } else {
        throw new Error("Session not created. Please try again.");
      }
    } catch (error: any) {
      console.error("Login error: ", error.message || error);
      setSetInvalidPass(true);
      setErrorMessage(error.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
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

      {/* Login Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md mx-4 z-10 relative"
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
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            Sign in to continue to your dashboard
          </motion.p>
        </div>

        {/* Error Message */}
        {setInvalidPass && (
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
            {errorMessage || "Invalid email or password. Please try again."}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email/Username Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label
              htmlFor="emailOrUsername"
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.textPrimary }}
            >
              Email or Username
            </label>
            <input
              type="text"
              id="emailOrUsername"
              {...register("emailOrUsername")}
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
              placeholder="you@example.com or username"
            />
            {errors.emailOrUsername && (
              <p className="text-sm mt-1.5" style={{ color: theme.colors.error }}>
                {errors.emailOrUsername.message}
              </p>
            )}
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
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
              placeholder="Enter your password"
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
            transition={{ delay: 0.4 }}
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
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </motion.button>

          {/* Sign Up Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-2"
          >
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold transition-colors duration-200 hover:underline"
                style={{ color: theme.colors.accentPrimary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.accentHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.accentPrimary;
                }}
              >
                Sign up
              </Link>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}

export default Login;