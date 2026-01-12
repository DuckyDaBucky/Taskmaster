/**
 * Date Utilities
 * Handles parsing and formatting dates from various formats
 */

/**
 * Parse date string from various formats to YYYY-MM-DD
 * Handles: "2024-02-15", "Feb 15, 2024", "02/15/2024", "15-02-2024", etc.
 */
export function parseDateToISO(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try parsing with Date object
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Try common formats manually
  // MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, part1, part2, year] = slashMatch;
    // Assume MM/DD/YYYY (US format)
    const month = part1.padStart(2, '0');
    const day = part2.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // DD-MM-YYYY
  const dashMatch = dateStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dashMatch) {
    const [, day, month, year] = dashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
}

/**
 * Normalize due date object to ensure proper format
 */
export function normalizeDueDate(dueDate: any): { date: string; description: string } | null {
  if (!dueDate) return null;

  const description = dueDate.description || dueDate.title || dueDate.name || 'Task';
  const dateStr = dueDate.date || dueDate.deadline || dueDate.due_date;

  if (!dateStr) return null;

  const normalizedDate = parseDateToISO(dateStr);
  if (!normalizedDate) return null;

  return {
    date: normalizedDate,
    description: String(description).trim(),
  };
}
