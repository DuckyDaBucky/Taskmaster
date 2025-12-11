/**
 * AI Context Service
 * Provides context to the AI assistant about the user's data
 */

import { supabase } from '../lib/supabase';

export interface AIContext {
  user: {
    name: string;
    email: string;
  };
  tasks: Array<{
    title: string;
    status: string;
    deadline?: string;
    className?: string;
  }>;
  classes: Array<{
    name: string;
    professor?: string;
    topics?: string[];
  }>;
  upcomingEvents: Array<{
    title: string;
    startTime: string;
    location?: string;
  }>;
  flashcardDecks: Array<{
    topic: string;
    count: number;
  }>;
  recentActivities: Array<{
    type: string;
    description: string;
  }>;
  stats: {
    totalTasks: number;
    completedTasks: number;
    upcomingDeadlines: number;
    totalClasses: number;
  };
}

export const aiContextService = {
  /**
   * Gather comprehensive context about the user's data
   */
  async getUserContext(userId: string): Promise<AIContext> {
    try {
      // Fetch all data in parallel
      const [
        { data: userData },
        { data: tasks },
        { data: classes },
        { data: events },
        { data: flashcards },
        { data: activities },
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('tasks').select('*, classes(name)').eq('user_id', userId).order('deadline', { ascending: true }),
        supabase.from('classes').select('*').eq('user_id', userId).eq('is_archived', false),
        supabase
          .from('events')
          .select('*')
          .eq('user_id', userId)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(10),
        supabase.from('flashcards').select('topic, id').eq('user_id', userId),
        supabase.from('activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      ]);

      // Process tasks
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const upcomingTasks = tasks?.filter((t) => {
        if (!t.deadline || t.completed) return false;
        const deadline = new Date(t.deadline);
        return deadline >= now && deadline <= threeDaysFromNow;
      }) || [];

      const completedTasks = tasks?.filter((t) => t.completed) || [];

      // Group flashcards by topic
      const deckMap = new Map<string, number>();
      flashcards?.forEach((fc) => {
        deckMap.set(fc.topic, (deckMap.get(fc.topic) || 0) + 1);
      });
      const flashcardDecks = Array.from(deckMap.entries()).map(([topic, count]) => ({ topic, count }));

      return {
        user: {
          name: userData?.display_name || userData?.first_name || 'Student',
          email: userData?.email || '',
        },
        tasks: (tasks || []).slice(0, 20).map((t) => ({
          title: t.title,
          status: t.status,
          deadline: t.deadline,
          className: (t as any).classes?.name,
        })),
        classes: (classes || []).map((c) => ({
          name: c.name,
          professor: c.professor,
          topics: c.topics,
        })),
        upcomingEvents: (events || []).map((e) => ({
          title: e.title,
          startTime: e.start_time,
          location: e.location,
        })),
        flashcardDecks,
        recentActivities: (activities || []).map((a) => ({
          type: a.type,
          description: a.description || '',
        })),
        stats: {
          totalTasks: tasks?.length || 0,
          completedTasks: completedTasks.length,
          upcomingDeadlines: upcomingTasks.length,
          totalClasses: classes?.length || 0,
        },
      };
    } catch (error) {
      console.error('Error fetching AI context:', error);
      return {
        user: { name: 'Student', email: '' },
        tasks: [],
        classes: [],
        upcomingEvents: [],
        flashcardDecks: [],
        recentActivities: [],
        stats: { totalTasks: 0, completedTasks: 0, upcomingDeadlines: 0, totalClasses: 0 },
      };
    }
  },

  /**
   * Format context into a readable string for the AI
   */
  formatContextForAI(context: AIContext): string {
    let formatted = `TASKMASTER PLATFORM CONTEXT\n`;
    formatted += `=============================\n\n`;

    formatted += `USER: ${context.user.name}\n\n`;

    // Stats overview
    formatted += `OVERVIEW:\n`;
    formatted += `- ${context.stats.totalClasses} classes\n`;
    formatted += `- ${context.stats.totalTasks} total tasks (${context.stats.completedTasks} completed)\n`;
    formatted += `- ${context.stats.upcomingDeadlines} upcoming deadlines in next 3 days\n`;
    formatted += `- ${context.upcomingEvents.length} upcoming events\n`;
    formatted += `- ${context.flashcardDecks.length} flashcard decks\n\n`;

    // Classes
    if (context.classes.length > 0) {
      formatted += `CLASSES:\n`;
      context.classes.forEach((c) => {
        formatted += `- ${c.name}`;
        if (c.professor) formatted += ` (Prof. ${c.professor})`;
        if (c.topics && c.topics.length > 0) formatted += ` - Topics: ${c.topics.join(', ')}`;
        formatted += `\n`;
      });
      formatted += `\n`;
    }

    // Tasks
    if (context.tasks.length > 0) {
      formatted += `RECENT/UPCOMING TASKS:\n`;
      context.tasks.slice(0, 10).forEach((t) => {
        formatted += `- ${t.title} [${t.status}]`;
        if (t.className) formatted += ` - ${t.className}`;
        if (t.deadline) {
          const deadline = new Date(t.deadline);
          formatted += ` - Due: ${deadline.toLocaleDateString()}`;
        }
        formatted += `\n`;
      });
      formatted += `\n`;
    }

    // Events
    if (context.upcomingEvents.length > 0) {
      formatted += `UPCOMING EVENTS:\n`;
      context.upcomingEvents.slice(0, 5).forEach((e) => {
        const eventDate = new Date(e.startTime);
        formatted += `- ${e.title} - ${eventDate.toLocaleString()}`;
        if (e.location) formatted += ` @ ${e.location}`;
        formatted += `\n`;
      });
      formatted += `\n`;
    }

    // Flashcard decks
    if (context.flashcardDecks.length > 0) {
      formatted += `FLASHCARD DECKS:\n`;
      context.flashcardDecks.forEach((d) => {
        formatted += `- ${d.topic} (${d.count} cards)\n`;
      });
      formatted += `\n`;
    }

    return formatted;
  },

  /**
   * Build system prompt for the AI
   */
  buildSystemPrompt(context: AIContext): string {
    return `You are TaskMaster AI, an intelligent study assistant deeply integrated with the TaskMaster platform for UTD students.

CRITICAL ROLE:
- You are NOT just an AI chatbot - you are the core assistant of the TaskMaster web application
- You have DIRECT access to the user's tasks, classes, events, flashcards, and study resources
- You can answer questions about THEIR SPECIFIC DATA in the TaskMaster platform
- Always reference their actual data when relevant

CAPABILITIES ON TASKMASTER PLATFORM:
1. **Tasks Management** - View their tasks, deadlines, and completion status
2. **Classes** - Know their enrolled classes, professors, topics
3. **Calendar** - Access their upcoming events and schedule
4. **Flashcards** - See their flashcard decks and study topics
5. **Study Resources** - Help them organize materials
6. **Progress Tracking** - Monitor completion rates and streaks

WHEN USER ASKS ABOUT PLATFORM FEATURES:
- Direct them to specific pages: "Check your Tasks page", "Visit the Calendar", "Go to Flashcards"
- Explain what each section does
- Reference their actual data: "You have 3 upcoming deadlines this week"
- Suggest features they might not know about

USER'S CURRENT DATA:
${this.formatContextForAI(context)}

RESPONSE STYLE:
- Friendly, concise, and action-oriented
- Use bullet points for clarity
- Reference their specific data when relevant
- Suggest next steps or actions
- Stay within 3-4 sentences unless more detail is requested

EXAMPLES:
User: "What do I need to work on today?"
Assistant: "You have 3 tasks due soon: Calculus homework (tomorrow), CS project (in 2 days), and Physics lab report (Friday). I'd tackle the Calculus homework first! Check your Tasks page to get started."

User: "Where can I get study help on Taskmaster?"
Assistant: "TaskMaster offers several study tools: 📝 **Flashcards** for memorization, 📚 **Resources page** to organize materials, 🎯 **Tasks** to break down assignments, and 📅 **Calendar** to schedule study sessions. What subject do you need help with?"

User: "What's my progress like?"
Assistant: "You've completed ${context.stats.completedTasks} out of ${context.stats.totalTasks} tasks - nice work! You have ${context.stats.upcomingDeadlines} deadlines coming up in the next 3 days. Keep the momentum going!"

Remember: You're embedded in the platform, not separate from it!`;
  },
};
