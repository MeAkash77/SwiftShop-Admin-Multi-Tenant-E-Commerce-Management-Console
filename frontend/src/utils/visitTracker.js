const VISIT_KEY = "multicommerce_last_visit";
const COUNT_KEY = "multicommerce_visit_count";

export function recordVisit() {
  const now = Date.now();
  let lastVisit = null;
  let visitCount = 1;
  try {
    lastVisit = Number(localStorage.getItem(VISIT_KEY)) || null;
    visitCount = (Number(localStorage.getItem(COUNT_KEY)) || 0) + 1;
    localStorage.setItem(VISIT_KEY, String(now));
    localStorage.setItem(COUNT_KEY, String(visitCount));
  } catch {
    /* ignore */
  }
  const hoursAway = lastVisit ? (now - lastVisit) / (1000 * 60 * 60) : null;
  return {
    isReturning: Boolean(lastVisit) && visitCount > 1,
    hoursAway,
    visitCount,
  };
}

/** End-of-day countdown for “Deals of the Day” urgency. */
export function msUntilEndOfDay() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return Math.max(0, end.getTime() - Date.now());
}

export function formatCountdown(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
