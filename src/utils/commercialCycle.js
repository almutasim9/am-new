import { format, subMonths, addMonths, startOfDay, endOfDay } from 'date-fns';

/**
 * Returns the bounds of the commercial cycle for a given date.
 * Cycle starts on the 19th of month N and ends on the 18th of month N+1.
 * @param {Date} date 
 * @returns {{ start: Date, end: Date, cycleMonth: string }}
 */
export const getCommercialCycle = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDate();
  
  let start;
  if (day >= 19) {
    // Current cycle started on the 19th of this month
    start = new Date(d.getFullYear(), d.getMonth(), 19);
  } else {
    // Current cycle started on the 19th of last month
    const lastMonth = subMonths(d, 1);
    start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 19);
  }
  
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 18, 23, 59, 59, 999);
  
  return {
    start: startOfDay(start),
    end: endOfDay(end),
    cycleMonth: format(start, 'yyyy-MM')
  };
};

/**
 * Checks if a given date falls within the current commercial cycle.
 * @param {Date|string} dateToCheck 
 * @param {Date} referenceDate 
 * @returns {boolean}
 */
export const isWithinCurrentCycle = (dateToCheck, referenceDate = new Date()) => {
  const { start, end } = getCommercialCycle(referenceDate);
  const d = new Date(dateToCheck);
  return d >= start && d <= end;
};
