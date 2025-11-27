/**
 * Convert UTC timestamp to IST and format as DD/MM/YYYY • HH:MM:SS
 */
export function formatToIST(utcTimestamp: string | Date): string {
  const date = new Date(utcTimestamp);
  
  // Convert to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istDate = new Date(date.getTime() + istOffset);
  
  // Extract components
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const year = istDate.getUTCFullYear();
  
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} • ${hours}:${minutes}:${seconds}`;
}

/**
 * Get current IST timestamp
 */
export function getCurrentISTTimestamp(): string {
  return formatToIST(new Date());
}
