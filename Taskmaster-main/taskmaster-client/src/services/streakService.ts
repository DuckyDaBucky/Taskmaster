/**
 * Streak Service
 * Tracks login streaks and updates them on dashboard views, task completion, and midnight
 */

import { supabase } from "../lib/supabase";

interface StreakResult {
  streak: number;
  streakChange: number;
  loginDates: string[];
  isNewLogin: boolean;
}

export const streakService = {
  /**
   * Update user's login streak
   * Call this on: login, dashboard load, task completion, midnight check
   */
  async updateStreak(): Promise<StreakResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { streak: 0, streakChange: 0, loginDates: [], isNewLogin: false };
      }

      // Get current user data
      const { data: profile } = await supabase
        .from('users')
        .select('login_dates, streak, last_login_date')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return { streak: 0, streakChange: 0, loginDates: [], isNewLogin: false };
      }

      // Use local date for streak calculation to match user's wall clock
      const now = new Date();
      // Reset time to midnight for accurate day comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD local

      const loginDates: string[] = profile.login_dates || [];
      const currentStreak = profile.streak || 0;
      const lastLoginDateUTC = profile.last_login_date;

      // Determine last login day in local time
      let lastLoginDay = null;
      if (lastLoginDateUTC) {
        const lastLoginDate = new Date(lastLoginDateUTC);
        // Create date object for midnight of that day in LOCAL time
        const lastDay = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());
        lastLoginDay = lastDay.toLocaleDateString('en-CA');
      }

      if (lastLoginDay === todayStr) {
        // Already logged in today (local time), no change
        return {
          streak: currentStreak,
          streakChange: 0,
          loginDates,
          isNewLogin: false
        };
      }

      // Calculate new streak
      let newStreak = currentStreak;
      let streakChange = 0;

      if (lastLoginDay) {
        const lastDate = new Date(lastLoginDay); // This will be local midnight
        // Difference in days (treating both as UTC midnight for calculation safety)
        // Since we constructed them from YYYY-MM-DD strings or zeroed times, this is safe
        // Actually, let's just use the timestamps of the zeroed dates
        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day - increase streak
          newStreak = currentStreak + 1;
          streakChange = 1;
        } else if (diffDays > 1) {
          // Streak broken - reset to 1
          const previousStreak = currentStreak;
          newStreak = 1;
          streakChange = -(previousStreak);

          if (previousStreak > 0) {
            await this.logActivity('streak_lost', {
              streak: newStreak,
              previousStreak: previousStreak
            });
          }
        }
      } else {
        // First login ever
        newStreak = 1;
        streakChange = 1;
      }

      // Update login dates (keep last 365 days)
      const updatedLoginDates = [...loginDates, todayStr];
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const filteredDates = updatedLoginDates.filter(date => date >= oneYearAgo);

      // Update database
      await supabase
        .from('users')
        .update({
          login_dates: filteredDates,
          streak: newStreak,
          last_login_date: now.toISOString()
        })
        .eq('id', user.id);

      // Log activity if streak increased
      if (streakChange > 0) {
        await this.logActivity('login', { streak: newStreak, streakChange });

        // Log milestone achievements
        if (newStreak === 7 || newStreak === 30 || newStreak === 100 || newStreak % 50 === 0) {
          await this.logActivity('streak_achieved', {
            streak: newStreak,
            streakChange,
            milestone: true
          });
        }
      }

      return {
        streak: newStreak,
        streakChange,
        loginDates: filteredDates,
        isNewLogin: true
      };
    } catch (error) {
      console.error('Error updating streak:', error);
      return { streak: 0, streakChange: 0, loginDates: [], isNewLogin: false };
    }
  },

  /**
   * Check if it's midnight and update streak if needed
   * Call this periodically on dashboard
   */
  async checkMidnightUpdate(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('last_login_date')
        .eq('id', user.id)
        .single();

      if (!profile?.last_login_date) return;

      const lastLogin = new Date(profile.last_login_date);
      const now = new Date();

      // Check if date changed (midnight passed)
      const lastLoginDay = lastLogin.toISOString().split('T')[0];
      const currentDay = now.toISOString().split('T')[0];

      if (lastLoginDay !== currentDay) {
        // Midnight passed, update streak
        await this.updateStreak();
      }
    } catch (error) {
      console.error('Error checking midnight update:', error);
    }
  },

  /**
   * Log activity to activities table
   */
  async logActivity(type: string, metadata: any = {}): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          type,
          description: type === 'login' ? 'Logged in' : type === 'streak_achieved' ? 'Streak milestone' : type,
          metadata
        });
    } catch (error) {
      // Silent fail - don't block user experience
      console.error('Error logging activity:', error);
    }
  },

  /**
   * Get current streak without updating
   */
  async getCurrentStreak(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: profile } = await supabase
        .from('users')
        .select('streak')
        .eq('id', user.id)
        .single();

      return profile?.streak || 0;
    } catch (error) {
      return 0;
    }
  }
};
