/**
 * Motor de decisão: prioridades, classificação de domínio, revisão espaçada, plano diário, replanejamento, alertas e resumo semanal.
 */
import { PRIORITY_FACTORS, SESSION_TYPE_MODE, STUDY_STAGES } from "../data/constants.js";
import { addDays, clamp, diffDays, startOfWeek, uid, weekdayIndex } from "./dates.js";
import { executionStats, questionStats, topicStats } from "./stats.js";

/** Apenas assuntos de concursos ativos e explicitamente vinculados podem ser planejados. */
export function activeTopics(a) {
  const ids = new Set(a.concursos.filter(c => c.ativo).map(c => c.id));
  return a.topics.filter(t => Array.isArray(t.concursos) && t.concursos.some(id => ids.has(id)));
}
export function computePriorities(a, s) {
  let { settings: t, concursos: l } = a,
    r = activeTopics(a),
    o = Object.fromEntries(l.map((f) => [f.id, f])),
    d = Math.max(1, ...r.map((f) => f.concursos.filter((n) => o[n]?.ativo).length)),
    u = {};
  for (let f of r) {
    let n = f.blocoId || "";
    u[n] = (u[n] || 0) + 1;
  }
  let L = r.map((f) => {
      let n = topicStats(a, f.id),
        i = f.concursos.map((N) => o[N]).filter((N) => N && N.ativo),
        w = null;
      for (let N of i) {
        let I = (N.blocos || []).find(
          (A) => A.id === f.blocoId && A.tipo === "objetiva" && A.peso != null,
        );
        if (I) {
          let A = N.blocos
              .filter((S) => S.tipo === "objetiva")
              .reduce((S, O) => S + O.itens * (O.peso ?? 0), 0),
            R = A > 0 ? (I.itens * I.peso) / A / Math.max(1, u[f.blocoId]) : null;
          R != null && (w = Math.max(w ?? 0, R));
        }
      }
      let v = null;
      for (let N of i)
        if (N.dataProva && N.status === "edital_publicado") {
          let I = diffDays(N.dataProva, s);
          I >= 0 && (v = Math.max(v ?? 0, clamp(1 - I / 120, 0, 1)));
        }
      let C = ((n.c || 0) + 2) / ((n.valid || 0) + 4),
        x = f.rev?.history?.length || 0,
        b = {
          relevancia: (f.relevancia - 1) / 4,
          peso: w,
          lacuna: 1 - C,
          facilidade: 1 - (f.dificuldade - 1) / 4,
          tempo: n.last ? clamp(diffDays(s, n.last) / 30, 0, 1) : 1,
          esquecimento: x >= 2 ? clamp((f.rev.lapses || 0) / x, 0, 1) : null,
          concursos: i.length ? (i.length - 0) / d : 0,
          proximidade: v,
        };
      return {
        t: f,
        st: n,
        comp: b,
        cs: i.length,
      };
    }),
    g = L.map((f) => f.comp.peso).filter((f) => f != null),
    m = g.length ? Math.min(...g) : 0,
    h = g.length ? Math.max(...g) : 0;
  for (let f of L) f.comp.peso != null && (f.comp.peso = h > m ? (f.comp.peso - m) / (h - m) : 0.5);
  return L.map((f) => {
    let n = 0,
      i = 0,
      w = [];
    for (let x of Object.keys(PRIORITY_FACTORS)) {
      let b = f.comp[x],
        N = t.pesos[x] ?? 0;
      if (b == null || !N) {
        w.push({
          k: x,
          v: b,
          w: N,
          used: false,
        });
        continue;
      }
      ((n += b * N),
        (i += N),
        w.push({
          k: x,
          v: b,
          w: N,
          used: true,
        }));
    }
    let v = i ? n / i : 0,
      C = Math.max(0.25, (f.t.estMin || 180) / 60);
    return {
      ...f,
      score: v,
      parts: w,
      perHour: v / C,
      den: i,
    };
  }).sort((f, n) => n.score - f.score);
}

export function classifyTopic(a, s, t) {
  let r = a.settings,
    l = r.amostraMin,
    o = [];
  return (
    t.valid >= l &&
    t.acc >= 0.8 &&
    s.status === "estudado" &&
    (t.reviews === 0 || t.lapses / t.reviews < 0.5)
      ? o.push("dominado")
      : t.valid >= l && t.acc >= 0.5 && t.acc < 0.8
        ? o.push("parcial")
        : t.valid >= l && t.acc < 0.5 && o.push("desconhecido"),
    t.valid < l && s.familiaridade === "pratica" && o.push("pratica"),
    t.valid < l &&
      s.familiaridade === "nenhuma" &&
      s.status === "nao_iniciado" &&
      o.push("desconhecido"),
    t.reviews >= 2 && t.lapses / t.reviews >= 0.5 && o.push("esquecimento"),
    t.timedN >= 5 && t.avgSec > r.segPorItemMeta && o.push("lento"),
    o.length || o.push("pendente"),
    o
  );
}

export function computeReview(a, s, t, r) {
  let l = a.settings,
    o = s.rev?.stage ?? 0,
    d = l.intervalos[Math.min(o, l.intervalos.length - 1)] || 1,
    u = 1 - 0.1 * (s.relevancia - 3),
    L = 1 - 0.075 * (s.dificuldade - 3),
    g = 1,
    m = "";
  r.valid >= l.amostraMin &&
    (r.acc >= 0.85
      ? ((g = 1.15), (m = "acerto ≥85%"))
      : r.acc < 0.6 && ((g = 0.7), (m = "acerto <60%")));
  let h = t === "ok" ? 1 : t === "parcial" ? 0.7 : 0.5,
    f = Math.max(1, Math.round(d * u * L * g * h)),
    n = t === "ok" ? o + 1 : t === "parcial" ? o : 0;
  return {
    days: f,
    nextStage: n,
    note: `base ${d}d × importância ${u.toFixed(2)} × dificuldade ${L.toFixed(2)}${m ? ` × ${m} ${g}` : ""} × resultado ${h}`,
  };
}

export function applyReview(a, s, t, r) {
  let l = topicStats(a, s.id),
    o = computeReview(a, s, t, l),
    d = [
      ...(s.rev?.history || []),
      {
        date: r,
        outcome: t,
        dias: o.days,
        nota: o.note,
      },
    ];
  return {
    ...s,
    rev: {
      stage: o.nextStage,
      due: addDays(r, o.days),
      lapses: (s.rev?.lapses || 0) + (t === "esqueci" ? 1 : 0),
      history: d,
    },
  };
}

export function scheduleFirstReview(a, s, t) {
  if (s.rev?.due) return s;
  let r = Math.max(1, Math.round((a.settings.intervalos[0] || 1) * (1 - 0.1 * (s.relevancia - 3))));
  return {
    ...s,
    rev: {
      ...(s.rev || {
        stage: 0,
        lapses: 0,
        history: [],
      }),
      stage: 0,
      due: addDays(t, r),
    },
  };
}

export const dueReviews = (a, s) =>
  activeTopics(a)
    .filter((t) => t.rev?.due && t.rev.due <= s)
    .sort((t, r) => t.rev.due.localeCompare(r.rev.due));

export const netMinutes = (a, s) => {
  let t = a.horasDia[weekdayIndex(s)] || 0,
    r = a.bloqueios.filter((l) => l.data === s).reduce((l, o) => l + (o.min || 0), 0);
  return Math.max(0, Math.round((t - r) * (1 - a.bufferPct / 100)));
};

export const grossMinutes = (a, s) =>
  Math.max(
    0,
    (a.horasDia[weekdayIndex(s)] || 0) -
      a.bloqueios.filter((t) => t.data === s).reduce((t, r) => t + (r.min || 0), 0),
  );

export const plannedMinutes = (a, s, t = []) =>
  a
    .filter((r) => r.date === s && ["planejada", "parcial"].includes(r.status) && !t.includes(r.id))
    .reduce((r, l) => r + (l.plannedMin || 0), 0);

export function currentStage(a, s) {
  let t = a.settings;
  if (t.estagio !== "auto") return t.estagio;
  let r = a.concursos
    .filter((o) => o.ativo && o.dataProva && o.status === "edital_publicado")
    .map((o) => diffDays(o.dataProva, s))
    .filter((o) => o >= 0);
  if (!r.length) return "base";
  let l = Math.min(...r);
  return l > 90 ? "base" : l > 30 ? "consolidacao" : "reta_final";
}

export function generatePlan(a, s, t) {
  let r = a.settings,
    originalMix = STUDY_STAGES[currentStage(a, s)],
    preference = a.settings.diagnostic?.learning,
    l = preference === "questoes" ? { ...originalMix, profundo: 25, consolidacao: 60, avaliacao: 15 }
      : preference === "leitura" || preference === "video" ? { ...originalMix, profundo: 65, consolidacao: 25, avaliacao: 10 }
      : originalMix,
    o = a.sessions,
    d = Array.from(
      {
        length: t,
      },
      (i, w) => addDays(s, w),
    ),
    u = computePriorities(a, s),
    L = new Set(
      o
        .filter((i) => ["planejada", "parcial"].includes(i.status) && i.date >= s)
        .flatMap((i) => (i.topicIds || []).map((w) => w + "|" + i.tipo)),
    ),
    g = {
      profundo: [],
      consolidacao: [],
      avaliacao: [],
    };
  for (let i of u) {
    let w = i.t,
      v = i.st,
      C = (x) => w.id + "|" + x;
    (w.status !== "estudado" && !L.has(C("teoria"))
      ? g.profundo.push({
          tipo: "teoria",
          topicIds: [w.id],
          concursoIds: w.concursos,
          min: r.sessaoMin,
          ess: i.score >= 0.6 ? "essencial" : "recomendada",
          why: `Prioridade ${(i.score * 100).toFixed(0)}: ${w.status === "nao_iniciado" ? "ainda não iniciado" : "teoria em andamento"}`,
        })
      : w.status === "estudado" &&
        (v.valid < r.amostraMin || (v.acc != null && v.acc < r.metaAcerto)) &&
        !L.has(C("questoes")) &&
        g.consolidacao.push({
          tipo: "questoes",
          topicIds: [w.id],
          concursoIds: w.concursos,
          min: r.sessaoMin,
          ess: "recomendada",
          why:
            v.valid < r.amostraMin
              ? `Só ${v.valid} questões: validar o aprendizado`
              : `Acerto ${(v.acc * 100).toFixed(0)}% abaixo da meta`,
        }),
      v.unreviewedErrors >= 3 &&
        !L.has(C("correcao")) &&
        g.consolidacao.push({
          tipo: "correcao",
          topicIds: [w.id],
          concursoIds: w.concursos,
          min: r.revisaoMin,
          ess: "recomendada",
          why: `${v.unreviewedErrors} erros aguardando revisão`,
        }));
  }
  let m = [],
    h = {
      profundo: 0,
      consolidacao: 0,
      avaliacao: 0,
    },
    f = () => h.profundo + h.consolidacao + h.avaliacao || 1,
    n = dueReviews(a, addDays(s, t - 1)).filter((i) => !L.has(i.id + "|revisao"));
  for (let i of d) {
    let w = netMinutes(r, i) - plannedMinutes(o, i),
      v = new Set(
        o.filter((b) => b.date === i && b.status !== "cancelada").flatMap((b) => b.topicIds || []),
      ),
      C = (b, N) => {
        let I = Math.min(b.min, w);
        return I < 15
          ? false
          : (m.push({
              id: uid(),
              date: i,
              status: "planejada",
              plannedMin: I,
              actualMin: null,
              notes: "",
              prioridade: b.ess,
              auto: true,
              why: b.why,
              tipo: b.tipo,
              topicIds: b.topicIds,
              concursoIds: b.concursoIds,
            }),
            (w -= I),
            (h[N] += I),
            b.topicIds.forEach((A) => v.add(A)),
            true);
      };
    for (let b = 0; b < n.length;) {
      let N = n[b];
      N.rev.due <= i && w >= 15 && (v.has(N.id) || v.size < r.maxAssuntosDia)
        ? (C(
            {
              tipo: "revisao",
              topicIds: [N.id],
              concursoIds: N.concursos,
              min: r.revisaoMin,
              ess: "essencial",
              why: `Revisão prevista para ${N.rev.due}`,
            },
            "consolidacao",
          ),
          n.splice(b, 1))
        : b++;
    }
    if (
      weekdayIndex(i) === r.simuladoDia &&
      !o.some((b) => b.date === i && b.tipo === "simulado" && b.status !== "cancelada") &&
      w >= 60 &&
      a.concursos.some(c => c.ativo && c.id === a.settings.concursoPrincipal) &&
      u.length > 0
    ) {
      let b = Math.min(r.simuladoMin, w);
      (m.push({
        id: uid(),
        date: i,
        status: "planejada",
        plannedMin: b,
        actualMin: null,
        notes: "",
        prioridade: "recomendada",
        auto: true,
        why: "Avaliação semanal (simulado + análise)",
        tipo: "simulado",
        topicIds: [],
        concursoIds: [a.settings.concursoPrincipal].filter(Boolean),
      }),
        (w -= b),
        (h.avaliacao += b));
    }
    let x = 0;
    for (; w >= 15 && x++ < 30;) {
      let b = ["profundo", "consolidacao"].filter((I) => g[I].length);
      if (!b.length) break;
      b.sort((I, A) => h[I] / f() - l[I] / 100 - (h[A] / f() - l[A] / 100));
      let N = false;
      for (let I of b) {
        let A = g[I].findIndex(
          (R) =>
            R.topicIds.every((S) => v.has(S)) ||
            v.size + R.topicIds.filter((S) => !v.has(S)).length <= r.maxAssuntosDia,
        );
        if (A >= 0) {
          let [R] = g[I].splice(A, 1);
          N = C(R, I);
          break;
        }
      }
      if (!N) break;
    }
  }
  return {
    sessions: m,
    stage: currentStage(a, s),
    mix: l,
  };
}

/** Recalcula somente sessões automáticas futuras ainda não iniciadas. Mantém histórico e sessões manuais. */
export function regenerateUpcomingPlan(a, start, days = 28) {
  const end = addDays(start, days);
  const preserved = a.sessions.filter(s => !(s.auto && s.status === "planejada" && s.date >= start && s.date < end));
  const base = { ...a, sessions: preserved };
  const suggestion = generatePlan(base, start, days);
  return { sessions: [...preserved, ...suggestion.sessions], removed: a.sessions.length - preserved.length, added: suggestion.sessions.length, stage: suggestion.stage };
}

export function replanOverdue(a, s) {
  let t = a.settings,
    r = a.sessions.filter((g) => g.status === "planejada" && g.date && g.date < s && (g.concursoIds || []).some(id => a.concursos.some(c => c.id === id && c.ativo))),
    l = {
      essencial: 0,
      recomendada: 1,
      adiavel: 2,
    };
  r.sort(
    (g, m) =>
      l[g.prioridade || "recomendada"] - l[m.prioridade || "recomendada"] ||
      g.date.localeCompare(m.date),
  );
  let o = {},
    d = {},
    u = [],
    L = r.map((g) => g.id);
  for (let g of r) {
    let m = g.prioridade || "recomendada";
    if (m === "adiavel") {
      u.push({
        id: g.id,
        from: g.date,
        to: null,
        reason: "Adiável: vai para o backlog sem ocupar a semana",
      });
      continue;
    }
    let h = null;
    for (let f = 0; f < 21 && !h; f++) {
      let n = addDays(s, f),
        i = netMinutes(t, n),
        w = plannedMinutes(a.sessions, n, L) + (o[n] || 0),
        v = new Set(
          a.sessions
            .filter((x) => x.date === n && !L.includes(x.id))
            .flatMap((x) => x.topicIds || []),
        );
      (d[n] || []).forEach((x) => v.add(x));
      let C = (g.topicIds || []).filter((x) => !v.has(x)).length;
      w + g.plannedMin <= i && v.size + C <= t.maxAssuntosDia && (h = n);
    }
    h
      ? ((o[h] = (o[h] || 0) + g.plannedMin),
        (d[h] = [...(d[h] || []), ...(g.topicIds || [])]),
        u.push({
          id: g.id,
          from: g.date,
          to: h,
          reason:
            m === "essencial"
              ? "Essencial: realocada no primeiro dia com folga"
              : "Recomendada: realocada onde coube",
        }))
      : u.push({
          id: g.id,
          from: g.date,
          to: null,
          reason: "Sem folga nas próximas 3 semanas: vai para o backlog",
        });
  }
  return u;
}

export function coverageStats(a, s) {
  let t = (s ? a.topics : activeTopics(a)).filter((d) => (s ? d.concursos.includes(s) : true)),
    r = a.settings,
    l = 0,
    o = 0;
  for (let d of t) {
    let u = topicStats(a, d.id);
    d.status === "estudado" && (l++, u.valid >= r.amostraMin && u.acc >= 0.7 && o++);
  }
  return {
    total: t.length,
    studied: l,
    validated: o,
  };
}

export function buildAlerts(a, s) {
  let t = a.settings,
    r = [],
    l = a.sessions.filter((f) => f.status === "planejada" && f.date && f.date < s && (f.concursoIds || []).some(id => a.concursos.some(c => c.id === id && c.ativo)));
  l.length &&
    r.push({
      tone: "crit",
      t: `${l.length} sessão(ões) atrasada(s)`,
      d: "Replaneje só o que ficou para trás; o resto do plano não se desloca.",
      go: "cronograma",
      cta: "Replanejar",
    });
  let o = dueReviews(a, s);
  o.length &&
    r.push({
      tone: "warn",
      t: `${o.length} revisão(ões) vencida(s)`,
      d: o
        .slice(0, 3)
        .map((f) => f.nome)
        .join(" · "),
      go: "revisoes",
      cta: "Revisar",
    });
  for (let f of a.concursos)
    for (let n of f.prazos || []) {
      let i = diffDays(n.data, s);
      f.ativo &&
        i >= 0 &&
        i <= 7 &&
        /inscri|pagamento/i.test(n.rotulo) &&
        r.push({
          tone: i <= 2 ? "crit" : "warn",
          t: `${n.rotulo}: ${i === 0 ? "hoje" : `em ${i} dia(s)`}`,
          d: f.orgao.split("(")[0].trim(),
          go: "concursos",
          cta: "Ver prazos",
        });
    }
  let d = null;
  for (let f = 0; f < 7; f++) {
    let n = addDays(s, f),
      i = plannedMinutes(a.sessions, n),
      w = netMinutes(t, n);
    if (i > w && w >= 0 && i > 0) {
      d = {
        d: n,
        l: i,
        c: w,
      };
      break;
    }
  }
  d &&
    r.push({
      tone: "warn",
      t: `Carga acima da capacidade em ${d.d.slice(8)}/${d.d.slice(5, 7)}`,
      d: `${d.l} min planejados para ${d.c} min disponíveis (já com margem para imprevistos).`,
      go: "cronograma",
      cta: "Ajustar",
    });
  let u = activeTopics(a).filter((f) => f.concursos.includes(t.concursoPrincipal)),
    g = [...new Set(u.map((f) => f.disciplina))]
      .map((f) => {
        let i = u
          .filter((w) => w.disciplina === f)
          .map((w) => topicStats(a, w.id).last)
          .filter(Boolean)
          .sort();
        return {
          dn: f,
          days: i.length ? diffDays(s, i[i.length - 1]) : null,
        };
      })
      .filter((f) => f.days == null || f.days >= 7);
  g.length &&
    (a.sessions.some((f) => f.status === "feita") || a.questions.length) &&
    r.push({
      tone: "info",
      t: `${g.length} disciplina(s) sem contato há 7+ dias`,
      d: g
        .slice(0, 3)
        .map((f) => `${f.dn}${f.days == null ? " (nunca)" : ` (${f.days}d)`}`)
        .join(" · "),
      go: "matriz",
      cta: "Ver matriz",
    });
  let m = a.sessions.filter((f) => f.status === "feita" && f.date >= addDays(s, -13)),
    h = m.reduce((f, n) => f + (n.actualMin || 0), 0);
  if (h >= 180) {
    let f = STUDY_STAGES[currentStage(a, s)],
      n = {
        profundo: 0,
        consolidacao: 0,
        avaliacao: 0,
      };
    m.forEach((i) => (n[SESSION_TYPE_MODE[i.tipo]] += i.actualMin || 0));
    for (let i of Object.keys(n)) {
      let w = (n[i] / h) * 100;
      Math.abs(w - f[i]) >= 20 &&
        r.push({
          tone: "info",
          t: `Mix de blocos fora do alvo (${i})`,
          d: `${w.toFixed(0)}% do tempo nos últimos 14 dias; alvo do estágio “${f.label}”: ${f[i]}%.`,
          go: "config",
          cta: "Ver mix",
        });
    }
  }
  return r;
}

export function nextBestAction(a, s) {
  let t = a.settings,
    r = a.concursos
      .flatMap((g) =>
        g.ativo
          ? (g.prazos || []).map((m) => ({
              c: g,
              p: m,
              d: diffDays(m.data, s),
            }))
          : [],
      )
      .filter((g) => g.d >= 0 && g.d <= 7 && /inscri/i.test(g.p.rotulo))
      .sort((g, m) => g.d - m.d)[0];
  if (r)
    return {
      t: `Confirmar a inscrição (${r.c.orgao.split("(")[0].trim()})`,
      why: `${r.p.rotulo} em ${r.d === 0 ? "hoje" : r.d + " dia(s)"}. Sem inscrição, o resto do plano perde o objetivo.`,
      go: "concursos",
      cta: "Abrir prazos",
    };
  let l = computePriorities(a, s),
    o = a.questions.length || a.sessions.some((g) => g.status === "feita"),
    d = dueReviews(a, s);
  if (!o) {
    let g = l[0]?.t;
    return {
      t: "Fazer o diagnóstico inicial",
      why: `Nenhum registro ainda. Resolva ~${t.amostraMin} questões cronometradas de “${g?.nome || "um assunto"}” (maior prioridade) anotando a confiança antes de responder. Sem isso, nenhum indicador é calculado.`,
      go: "questoes",
      cta: "Registrar questões",
    };
  }
  if (d.length)
    return {
      t: `Fazer ${d.length} revisão(ões) vencida(s)`,
      why: `Revisões atrasadas custam mais retenção do que conteúdo novo rende. Começa por “${d[0].nome}”.`,
      go: "revisoes",
      cta: "Abrir revisões",
    };
  if (a.sessions.some((g) => g.status === "planejada" && g.date < s && (g.concursoIds || []).some(id => a.concursos.some(c => c.id === id && c.ativo))))
    return {
      t: "Replanejar as sessões atrasadas",
      why: "Há sessões vencidas. Realoque as essenciais e mande as adiáveis para o backlog.",
      go: "cronograma",
      cta: "Replanejar",
    };
  let u = l.find((g) => g.t.status === "estudado" && g.st.valid < t.amostraMin);
  if (u)
    return {
      t: `Validar “${u.t.nome}” com questões`,
      why: `Teoria marcada como concluída, mas só ${u.st.valid} questão(ões) respondida(s). Concluído sem questões não conta como dominado.`,
      go: "questoes",
      cta: "Registrar questões",
    };
  let L = l[0];
  return L
    ? {
        t: `${L.t.status === "estudado" ? "Reforçar" : "Estudar"} “${L.t.nome}”`,
        why: `Maior prioridade (${(L.score * 100).toFixed(0)}/100), calculada por regra transparente. Veja a composição na Matriz.`,
        go: "matriz",
        cta: "Ver prioridades",
      }
    : null;
}

export function weekSummary(a, s) {
  let t = startOfWeek(s),
    r = addDays(t, 6),
    l = executionStats(a.sessions, t, r, s),
    o = a.questions.filter((u) => u.date >= t && u.date <= r),
    d = questionStats(o);
  return {
    ws: t,
    we: r,
    ex: l,
    qs: o,
    k: d,
  };
}

export function errorBreakdown(a) {
  let s = {};
  for (let t of a)
    if (t.correto === false) {
      let r = t.tipoErro || "Sem classificação";
      s[r] = (s[r] || 0) + 1;
    }
  return Object.entries(s).sort((t, r) => r[1] - t[1]);
}
