/**
 * Returns the Monday 00:00:00.000 of the week containing the given date.
 * ISO weeks start on Monday.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Calculate the difference to Monday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns true if the current server time is past Sunday 23:59:00 of the
 * current week (i.e., the submission window for this week is closed).
 */
export function isSubmissionWindowClosed(): boolean {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const sundayDeadline = new Date(weekStart);
  sundayDeadline.setDate(sundayDeadline.getDate() + 6); // Sunday
  sundayDeadline.setHours(23, 59, 0, 0);
  return now > sundayDeadline;
}
