/**
 * Estatística: acerto, intervalo de Wilson, desempenho por assunto, tendência e pontuação de simulados.
 */
import { addDays, startOfWeek } from "./dates.js";

export const questionStats = (a) => {
  let s = 0,
    t = 0,
    r = 0,
    l = 0,
    o = 0;
  for (let u of a)
    (u.correto === true ? s++ : u.correto === false ? t++ : r++,
      u.tempoSeg > 0 && ((l += u.tempoSeg), o++));
  let d = s + t;
  return {
    c: s,
    e: t,
    b: r,
    valid: d,
    total: a.length,
    acc: d ? s / d : null,
    avgSec: o ? l / o : null,
    timedN: o,
  };
};

export const wilsonInterval = (a, s) => {
  if (!s) return null;
  let t = 1.96,
    r = a / s,
    l = 1 + (t * t) / s,
    o = (r + (t * t) / (2 * s)) / l,
    d = (t * Math.sqrt((r * (1 - r)) / s + (t * t) / (4 * s * s))) / l;
  return [Math.max(0, o - d), Math.min(1, o + d)];
};

export const formatPct = (a, s = 0) => (a == null ? "—" : `${(a * 100).toFixed(s)}%`);

export const evidenceLevel = (a, s) =>
  a >= 3 * s ? "suficiente" : a >= s ? "indicativa" : "insuficiente";

export function topicStats(a, s) {
  let t = a.questions.filter((n) => n.topicId === s),
    r = questionStats(t),
    l = r.c,
    o = r.e,
    d = r.b;
  for (let n of a.simulados)
    for (let i of n.rows || [])
      i.topicId === s && ((l += i.acertos || 0), (o += i.erros || 0), (d += i.brancos || 0));
  let u = l + o,
    L = a.sessions.filter((n) => n.status === "feita" && (n.topicIds || []).includes(s)),
    g = L.reduce((n, i) => n + (i.actualMin || 0), 0),
    m = [...L.filter((n) => n.tipo !== "simulado").map((n) => n.date), ...t.map((n) => n.date)]
      .filter(Boolean)
      .sort(),
    h = a.topics.find((n) => n.id === s),
    f = L.filter((n) => n.tipo === "teoria")
      .map((n) => n.date)
      .sort();
  return {
    c: l,
    e: o,
    b: d,
    valid: u,
    n: u + d,
    acc: u ? l / u : null,
    minutes: g,
    last: m.length ? m[m.length - 1] : null,
    firstTheory: f[0] || null,
    avgSec: r.avgSec,
    timedN: r.timedN,
    unreviewedErrors: t.filter((n) => n.correto === false && n.revisar).length,
    lapses: h?.rev?.lapses || 0,
    reviews: (h?.rev?.history || []).length,
  };
}

export function weeklyAccuracy(a, s, t, r) {
  let l = [],
    o = startOfWeek(t);
  for (let d = s - 1; d >= 0; d--) {
    let u = addDays(o, -7 * d),
      L = addDays(u, 6),
      g = questionStats(a.filter((m) => m.date >= u && m.date <= L));
    l.push({
      start: u,
      ...g,
      low: g.valid < r,
    });
  }
  return l;
}

export function linearSlope(a) {
  let s = a.length;
  if (s < 2) return null;
  let t = a.reduce((d, u) => d + u.x, 0) / s,
    r = a.reduce((d, u) => d + u.y, 0) / s,
    l = 0,
    o = 0;
  for (let d of a) ((l += (d.x - t) * (d.y - r)), (o += (d.x - t) ** 2));
  return o ? l / o : null;
}

export const stdDev = (a) => {
  if (a.length < 2) return null;
  let s = a.reduce((t, r) => t + r, 0) / a.length;
  return Math.sqrt(a.reduce((t, r) => t + (r - s) ** 2, 0) / (a.length - 1));
};

export function scoreSimulado(a) {
  let acerto = Number(a.regra?.acerto ?? 1),
    penalidade = Number(a.regra?.erro ?? 0),
    t = 0,
    r = 0,
    l = (a.rows || []).map((u) => {
      let L = u.peso ?? 1,
        g = L * (acerto * (u.acertos || 0) - penalidade * (u.erros || 0)),
        m = L * acerto * (u.itens || 0);
      ((t += g), (r += m));
      let h = u.notaMin != null && u.notaMin !== "" ? g >= Number(u.notaMin) : null,
        f = (u.acertos || 0) + (u.erros || 0) + (u.brancos || 0);
      return {
        ...u,
        pts: g,
        max: m,
        pctMax: m ? g / m : null,
        ok: h,
        inconsistent: u.itens != null && f !== u.itens,
      };
    }),
    o = l.reduce((u, L) => u + (L.acertos || 0), 0),
    d = l.reduce((u, L) => u + (L.erros || 0), 0);
  return {
    rows: l,
    pts: t,
    max: r,
    pctMax: r ? t / r : null,
    acertos: o,
    erros: d,
    brancos: l.reduce((u, L) => u + (L.brancos || 0), 0),
    itens: l.reduce((u, L) => u + (L.itens || 0), 0),
    aprovado: l.length ? l.every((u) => u.ok !== false) : null,
  };
}

export function executionStats(a, s, t, r) {
  let l = r && r < t ? r : t,
    o = a.filter(
      (L) =>
        L.date && L.date >= s && L.date <= l && L.status !== "cancelada" && L.status !== "backlog",
    ),
    d = o.reduce((L, g) => L + (g.plannedMin || 0), 0),
    u = o
      .filter((L) => L.status === "feita" || L.status === "parcial")
      .reduce((L, g) => L + (g.actualMin || 0), 0);
  return {
    planned: d,
    done: u,
    ratio: d ? u / d : null,
    n: o.length,
  };
}
