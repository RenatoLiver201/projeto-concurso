/**
 * Utilitários de data (ISO local, semanas, meses), formatação de minutos e uid().
 */
const pad2 = (a) => String(a).padStart(2, "0");

const formatISODate = (a) => `${a.getFullYear()}-${pad2(a.getMonth() + 1)}-${pad2(a.getDate())}`;

export const parseISODate = (a) => {
  let [s, t, r] = a.split("-").map(Number);
  return new Date(s, t - 1, r, 12);
};

export const today = () => formatISODate(new Date());

export const addDays = (a, s) => {
  let t = parseISODate(a);
  return (t.setDate(t.getDate() + s), formatISODate(t));
};

export const diffDays = (a, s) => Math.round((parseISODate(a) - parseISODate(s)) / 864e5);

export const weekdayIndex = (a) => parseISODate(a).getDay();

export const startOfWeek = (a) => {
  let s = weekdayIndex(a);
  return addDays(a, s === 0 ? -6 : 1 - s);
};

export const weekDates = (a) =>
  Array.from(
    {
      length: 7,
    },
    (s, t) => addDays(startOfWeek(a), t),
  );

export const startOfMonth = (a) => a.slice(0, 7) + "-01";

export const addMonths = (a, s) => {
  let t = parseISODate(startOfMonth(a));
  return (t.setMonth(t.getMonth() + s), formatISODate(t));
};

export const daysInMonth = (a) => {
  let s = parseISODate(startOfMonth(a));
  return new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate();
};

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const WEEKDAYS_LONG = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const formatDM = (a) => (a ? `${a.slice(8, 10)}/${a.slice(5, 7)}` : "—");

export const formatDMY = (a) => (a ? `${a.slice(8, 10)}/${a.slice(5, 7)}/${a.slice(0, 4)}` : "—");

export const formatWeekdayDM = (a) => {
  let s = parseISODate(a);
  return `${WEEKDAYS_SHORT[s.getDay()]}, ${pad2(s.getDate())}/${pad2(s.getMonth() + 1)}`;
};

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const formatMinutes = (a) => {
  if (a == null || isNaN(a)) return "—";
  let s = Math.floor(a / 60),
    t = Math.round(a % 60);
  return s ? `${s}h${t ? pad2(t) : ""}` : `${t}min`;
};

export const clamp = (a, s, t) => Math.max(s, Math.min(t, a));
