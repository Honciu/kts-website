export function getRomaniaTime(): Date {
  // Get current UTC time
  const now = new Date();
  
  // Romania is UTC+2 (UTC+3 during daylight saving)
  // For simplicity, we'll use UTC+2
  const romaniaOffset = 2 * 60; // 2 hours in minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const romaniaTime = new Date(utc + (romaniaOffset * 60000));
  
  return romaniaTime;
}

export function getRomaniaDateString(date?: Date): string {
  const romaniaDate = date || getRomaniaTime();
  return romaniaDate.toLocaleDateString('ro-RO');
}

export function getWeekNumber(date: Date): number {
  // Create a copy of the date to avoid mutation
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Set to the nearest Thursday (current date + 4 - current day of week)
  // Make Sunday's day number 7
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  
  // Calculate full weeks to nearest Thursday
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return weekNum;
}

export function getWeekDates(weekNumber: number, year: number): { start: Date; end: Date } {
  // Get January 4th (always in week 1)
  const jan4 = new Date(year, 0, 4);
  
  // Get the Monday of week 1
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4.getDay() + 1);
  
  // Calculate the Monday of the requested week
  const weekMonday = new Date(week1Monday);
  weekMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
  
  // Calculate the Sunday of the requested week
  const weekSunday = new Date(weekMonday);
  weekSunday.setDate(weekMonday.getDate() + 6);
  
  return {
    start: weekMonday,
    end: weekSunday
  };
}