import { createBrowserClient } from "@/utils/supabase-browser";

import type { HolidayTypes } from "@/types";

const supabase = createBrowserClient();

export const holidayTypes = ["Regular Holiday", "Special (Non-Working) Day"];

/**
 * Leave types counted in calendar days rather than working days.
 *
 * RA 11210 grants 105 *straight* days of maternity leave, so weekends and
 * holidays fall inside the count. LeaveForm ticks "Include weekend" for these
 * automatically; holidays follow the same rule -- if weekends are counted,
 * holidays are too.
 */
export const calendarDayLeaveTypes = [
  "Maternity Leave",
  "Adoption Leave",
  "Special Leave Benefits For Women",
  "Rehabilitation Leave",
  "Study Leave",
];

/**
 * All holidays keyed by `yyyy-MM-dd`. The table holds roughly 18 rows a year,
 * so the whole list is cheap to pull once and reuse for every lookup.
 */
export async function fetchHolidayMap(): Promise<Map<string, HolidayTypes>> {
  try {
    const { data, error } = await supabase
      .from("hrm_holidays")
      .select("*")
      .order("date", { ascending: true });

    if (error) throw new Error(error.message);

    return new Map((data ?? []).map((h: HolidayTypes) => [h.date, h]));
  } catch (error) {
    console.error("fetch holiday map error", error);
    return new Map();
  }
}

export function isWeekendDate(date: string) {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
}

/**
 * Whether an already-saved leave request was counted in calendar days.
 *
 * The "Include weekend" choice is not stored on the tracker, so it is derived:
 * the leave type is a known calendar-day type, or the saved dates contain a
 * Saturday or Sunday (which only happens when weekends were counted).
 */
export function countsCalendarDays(leaveType: string, dates: string[]) {
  if (calendarDayLeaveTypes.includes(leaveType)) return true;
  return dates.some((date) => isWeekendDate(date));
}
