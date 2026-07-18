const DATE_FMT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const DATETIME_FMT = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});
const TIME_FMT = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });

const toDate = (v) => (v instanceof Date ? v : new Date(String(v).replace(" ", "T")));

export const formatDate = (v) => (v ? DATE_FMT.format(toDate(v)) : "—");
export const formatDateTime = (v) => (v ? DATETIME_FMT.format(toDate(v)) : "—");
export const formatTime = (v) => (v ? TIME_FMT.format(toDate(v)) : "—");

/** Valeur prête pour un <input type="datetime-local"> */
export const toInputDateTime = (v) => {
  if (!v) return "";
  const d = toDate(v);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** datetime-local → format MySQL "YYYY-MM-DD HH:MM:SS" attendu par Laravel */
export const toApiDateTime = (v) => (v ? `${v.replace("T", " ")}:00` : null);
