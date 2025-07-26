/**
 * Format a date to a readable string (e.g., "Jan 15, 2023")
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | number): string => {
  const d = typeof date === "number" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Format a time to a readable string (e.g., "2:30 PM")
 * @param date The date object containing the time to format
 * @returns Formatted time string
 */
export const formatTime = (date: Date | number): string => {
  const d = typeof date === "number" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format a date and time together (e.g., "Jan 15, 2023 at 2:30 PM")
 * @param date The date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | number): string => {
  const d = typeof date === "number" ? new Date(date) : date;
  return `${formatDate(d)} at ${formatTime(d)}`;
};

/**
 * Get a relative time string (e.g., "2 hours ago", "Yesterday", "Just now")
 * @param date The date to format relatively
 * @returns Relative time string
 */
export const getRelativeTimeString = (date: Date | number): string => {
  const now = new Date();
  const d = typeof date === "number" ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "Just now";
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  } else if (diffDay < 2) {
    return "Yesterday";
  } else if (diffDay < 7) {
    return `${diffDay} days ago`;
  } else {
    return formatDate(d);
  }
};

/**
 * Get the start of the current week
 * @returns Date object for the start of the current week (Sunday)
 */
export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 for Sunday, 1 for Monday, etc.
  d.setDate(d.getDate() - day); // Go back to Sunday
  d.setHours(0, 0, 0, 0); // Set to beginning of day
  return d;
};

/**
 * Get the end of the current week
 * @returns Date object for the end of the current week (Saturday)
 */
export const getEndOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day)); // Go forward to Saturday
  d.setHours(23, 59, 59, 999); // Set to end of day
  return d;
};

/**
 * Get the start of the current day
 */
export const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the end of the current day
 */
export const getEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get the start of the current month
 */
export const getStartOfMonth = (date: Date): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the end of the current month
 */
export const getEndOfMonth = (date: Date): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0); // Last day of previous month
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Convert a Date object to a timestamp (milliseconds since epoch)
 */
export const dateToTimestamp = (date: Date): number => {
  return date.getTime();
};

/**
 * Convert a timestamp (milliseconds since epoch) to a Date object
 */
export const timestampToDate = (timestamp: number): Date => {
  return new Date(timestamp);
};
