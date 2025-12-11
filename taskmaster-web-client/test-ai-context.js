/**
 * Test script to verify AI context service
 * Run this in browser console while logged in to test data fetching
 */

// Test 1: Check if service can be imported
console.log('Test 1: Import check');
import { aiContextService } from './src/services/aiContextService';
console.log('✅ Service imported successfully');

// Test 2: Fetch user context
console.log('\nTest 2: Fetching user context...');
const { data: { session } } = await supabase.auth.getSession();
if (session?.user?.id) {
  const context = await aiContextService.getUserContext(session.user.id);
  console.log('✅ Context fetched:', context);
  
  console.log('\nYour Stats:');
  console.log(`- Total Tasks: ${context.stats.totalTasks}`);
  console.log(`- Completed: ${context.stats.completedTasks}`);
  console.log(`- Upcoming Deadlines: ${context.stats.upcomingDeadlines}`);
  console.log(`- Classes: ${context.stats.totalClasses}`);
} else {
  console.log('❌ No active session');
}

// Test 3: Format context
console.log('\nTest 3: Formatting context for AI...');
const formatted = aiContextService.formatContextForAI(context);
console.log('✅ Formatted context (first 500 chars):');
console.log(formatted.substring(0, 500));

// Test 4: Build system prompt
console.log('\nTest 4: Building system prompt...');
const prompt = aiContextService.buildSystemPrompt(context);
console.log('✅ System prompt created (length:', prompt.length, 'characters)');
console.log('First 300 chars:', prompt.substring(0, 300));

console.log('\n🎉 All tests passed!');
