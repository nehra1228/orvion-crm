export const OFFICE_START_HOUR = 10;
export const OFFICE_START_MIN = 0;
export const OFFICE_END_HOUR = 18;
export const OFFICE_END_MIN = 30;
export const LATE_THRESHOLD_HOUR = 10;
export const LATE_THRESHOLD_MIN = 15;
export const LUNCH_START_HOUR = 14;
export const LUNCH_START_MIN = 0;
export const LUNCH_END_HOUR = 14;
export const LUNCH_END_MIN = 30;
export const WEEKLY_OFF_DAY = 2; // Tuesday (0=Sun,1=Mon,2=Tue)
const INDIA_TIMEZONE = "Asia/Kolkata";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function timeToMinutes(h: number, m: number) {
  return h * 60 + m;
}

function getIndianParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    year: Number(values.year ?? 0),
    month: Number(values.month ?? 0),
    day: Number(values.day ?? 0),
    hour: Number(values.hour ?? 0),
    minute: Number(values.minute ?? 0),
    second: Number(values.second ?? 0),
    dayOfWeek: new Intl.DateTimeFormat("en-US", { timeZone: INDIA_TIMEZONE, weekday: "short" }).format(date),
  };
}

export function getAttendanceDay(date = new Date()) {
  const parts = getIndianParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export const MARK_IN_HOUR = 9;
export const MARK_IN_MIN = 30;

function minutesOfParts(parts: { hour: number; minute: number }) {
  return timeToMinutes(parts.hour, parts.minute);
}

export function isAfterMarkInWindow(date = new Date()) {
  if (isWeeklyOff(date)) return false;
  const minutes = minutesOfParts(getIndianParts(date));
  const markStart = timeToMinutes(MARK_IN_HOUR, MARK_IN_MIN);
  const officeEnd = timeToMinutes(OFFICE_END_HOUR, OFFICE_END_MIN);
  return minutes >= markStart && minutes <= officeEnd;
}

export function isWeeklyOff(date = new Date()) {
  return getIndianParts(date).dayOfWeek === "Tue";
}

export function isDuringOfficeHours(date = new Date()) {
  if (isWeeklyOff(date)) return false;
  const minutes = minutesOfParts(getIndianParts(date));
  const start = timeToMinutes(OFFICE_START_HOUR, OFFICE_START_MIN);
  const end = timeToMinutes(OFFICE_END_HOUR, OFFICE_END_MIN);
  return minutes >= start && minutes <= end;
}

export function isDuringLunch(date = new Date()) {
  const minutes = minutesOfParts(getIndianParts(date));
  const lunchStart = timeToMinutes(LUNCH_START_HOUR, LUNCH_START_MIN);
  const lunchEnd = timeToMinutes(LUNCH_END_HOUR, LUNCH_END_MIN);
  return minutes >= lunchStart && minutes <= lunchEnd;
}

export function getMarkInStatus(date = new Date()) {
  if (isWeeklyOff(date)) return null;
  const minutes = minutesOfParts(getIndianParts(date));
  const lateThreshold = timeToMinutes(LATE_THRESHOLD_HOUR, LATE_THRESHOLD_MIN);
  const end = timeToMinutes(OFFICE_END_HOUR, OFFICE_END_MIN);
  if (minutes <= lateThreshold) return "PRESENT";
  if (minutes <= end) return "LATE";
  return null;
}

export function computeAttendanceFromState(state?: { status?: string; lastSeen?: string } | null) {
  const DEFAULT = "PRESENT";
  if (!state) return DEFAULT;

  const s = (state.status || "OFFLINE").toUpperCase();
  if (s === "PRESENT" || s === "ONLINE") return "PRESENT";
  if (s === "HALF_DAY") return "HALF_DAY";
  if (s === "ON_LEAVE") return "ON_LEAVE";
  if (s === "LATE") return "LATE";
  if (s === "ABSENT" || s === "OFFLINE") {
    if (!state.lastSeen) return "ABSENT";
    const last = new Date(state.lastSeen);
    const now = new Date();
    if (getAttendanceDay(last) !== getAttendanceDay(now)) return "ABSENT";
    if (isWeeklyOff(now)) return "ON_LEAVE";
    const markStatus = getMarkInStatus(last);
    if (markStatus === "LATE") return "LATE";
    if (markStatus === "PRESENT") return "PRESENT";
    return "ABSENT";
  }

  return DEFAULT;
}
