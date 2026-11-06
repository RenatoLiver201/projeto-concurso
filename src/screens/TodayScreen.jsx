/**
 * Tela inicial: próxima melhor ação, o que estudar agora, atrasos/riscos e evolução do desempenho.
 */
import { useMemo } from "react";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Flame,
  Info,
  Lightbulb,
  Play,
  TriangleAlert,
} from "lucide-react";
import { BarList } from "../components/charts/BarList";
import { LineChart } from "../components/charts/LineChart";
import { PlannedDoneChart } from "../components/charts/PlannedDoneChart";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, ProgressBar, StatCard } from "../components/ui/feedback";
import { useApp } from "../context/AppContext";
import { SESSION_TYPE_LABELS } from "../data/constants";
import { cn } from "../lib/cn";
import {
  WEEKDAYS_SHORT,
  diffDays,
  formatDM,
  formatMinutes,
  formatWeekdayDM,
  today,
  weekDates,
} from "../lib/dates";
import {
  activeTopics,
  buildAlerts,
  computePriorities,
  coverageStats,
  errorBreakdown,
  netMinutes,
  nextBestAction,
  weekSummary,
} from "../lib/planner";
import {
  formatPct,
  linearSlope,
  questionStats,
  scoreSimulado,
  stdDev,
  weeklyAccuracy,
  wilsonInterval,
} from "../lib/stats";

export function TodayScreen() {
  let { state, nav, openSession, completeSession } = useApp(),
    todayStr = today(),
    settings = state.settings,
    d = useMemo(() => weekSummary(state, todayStr), [state, todayStr]),
    u = useMemo(() => buildAlerts(state, todayStr), [state, todayStr]),
    L = useMemo(() => nextBestAction(state, todayStr), [state, todayStr]),
    g = useMemo(() => computePriorities(state, todayStr), [state, todayStr]),
    m = questionStats(state.questions),
    h = questionStats(d.qs),
    f = wilsonInterval(m.c, m.valid),
    n = coverageStats(state, settings.concursoPrincipal),
    i = activeTopics(state).filter((c) => c.rev?.due && c.rev.due <= todayStr).length,
    activeContestIds = new Set(state.concursos.filter(c => c.ativo).map(c => c.id)),
    isCurrentContestSession = c => (c.concursoIds || []).some(id => activeContestIds.has(id)),
    w = state.sessions.filter((c) => c.status === "planejada" && c.date < todayStr && isCurrentContestSession(c)),
    v = state.sessions.filter(
      (c) => c.date === todayStr && ["planejada", "parcial"].includes(c.status) && isCurrentContestSession(c),
    ),
    C = settings.ciclo.itens[settings.ciclo.ptr % Math.max(1, settings.ciclo.itens.length)],
    x = state.concursos.find((c) => c.id === settings.concursoPrincipal),
    b = state.concursos
      .filter((c) => c.ativo)
      .flatMap((c) =>
        (c.prazos || []).map((p) => ({
          ...p,
          c,
          d: diffDays(p.data, todayStr),
        })),
      )
      .filter((c) => c.d >= 0)
      .sort((c, p) => c.d - p.d)
      .slice(0, 4),
    N = weeklyAccuracy(state.questions, 10, todayStr, settings.amostraMin).map((c) => ({
      x: `${c.start.slice(8)}/${c.start.slice(5, 7)}`,
      y: c.acc,
      n: c.valid,
      low: c.low,
    })),
    I = state.questions.length > 0,
    A = (() => {
      let c = N.map((p, y) => ({
        x: y,
        y: p.y,
        ok: !p.low,
      })).filter((p) => p.y != null && p.ok);
      return c.length >= 4 ? linearSlope(c) : null;
    })(),
    R = weekDates(todayStr).map((c) => ({
      label: WEEKDAYS_SHORT[new Date(c + "T12:00").getDay()],
      planned: state.sessions
        .filter((p) => p.date === c && p.status !== "cancelada" && p.status !== "backlog")
        .reduce((p, y) => p + (y.plannedMin || 0), 0),
      done: state.sessions
        .filter((p) => p.date === c && ["feita", "parcial"].includes(p.status))
        .reduce((p, y) => p + (y.actualMin || 0), 0),
      cap: netMinutes(settings, c),
      today: c === todayStr,
    })),
    S = useMemo(() => {
      let c = {};
      for (let p of state.questions) {
        let F =
          state.topics.find((U) => U.id === p.topicId)?.disciplina ||
          p.disciplina ||
          "Sem disciplina";
        (c[F] || (c[F] = [])).push(p);
      }
      return Object.entries(c)
        .map(([p, y]) => ({
          dn: p,
          ...questionStats(y),
        }))
        .sort((p, y) => (p.acc ?? 2) - (y.acc ?? 2));
    }, [state.questions, state.topics]),
    O = errorBreakdown(state.questions),
    P = g.filter((c) => c.st.valid >= settings.amostraMin && c.st.acc < 0.6).slice(0, 4),
    K = state.simulados
      .slice()
      .sort((c, p) => c.data.localeCompare(p.data))
      .map((c) => ({
        s: c,
        sc: scoreSimulado(c),
      }))
      .filter((c) => c.sc.pctMax != null),
    B = stdDev(K.map((c) => c.sc.pctMax)),
    H = state.sessions
      .filter((c) => c.date === todayStr && c.status === "feita" && isCurrentContestSession(c))
      .reduce((c, p) => c + (p.actualMin || 0), 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            {"Hoje · "}
            {formatWeekdayDM(todayStr)}
          </h1>
          <p className="text-xs text-ink2">
            {x
              ? `${x.orgao.split("(")[0].trim()} · ${x.area}`
              : "Defina o concurso principal nas configurações"}
            {x?.dataProva
              ? ` · prova em ${diffDays(x.dataProva, todayStr)} dias (${formatDM(x.dataProva)})`
              : ""}
          </p>
        </div>
        {b.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {b.map((c) => (
              <Badge key={c.id + c.c.id} tone={c.d <= 7 ? "warn" : "muted"} title={c.c.orgao}>
                {c.rotulo}
                {" · "}
                {c.d === 0 ? "hoje" : `${c.d}d`}
                {" ("}
                {formatDM(c.data)})
              </Badge>
            ))}
          </div>
        )}
      </div>
      {!state.concursos.length && (
        <div className="rounded-lg border border-line bg-surface2 p-4 text-[13px]">
          <b>Seu painel ainda não tem concursos.</b> Use “Concurso guiado” no menu para informar seu objetivo e começar um plano individualizado.
        </div>
      )}
      {state.concursos.length > 0 && activeTopics(state).length === 0 && (
        <div className="rounded-lg border border-line bg-surface2 p-4 text-[13px]">
          <b>Faltam disciplinas para gerar sessões.</b> Cadastre ou importe o conteúdo programático em Matriz, ou adicione um concurso pelo assistente guiado.
        </div>
      )}
      {settings.provisorio && (
        <div className="flex items-start gap-2 rounded-lg border border-line2 bg-warnSoft px-3 py-2 text-xs text-warnInk">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            {"Disponibilidade semanal "}
            <b>provisória</b>
            {" ("}
            {formatMinutes(settings.horasDia.reduce((c, p) => c + p, 0))}
            {"/semana). Não é um dado seu: ajuste os minutos por dia em "}
            <button className="underline" onClick={() => nav("config")}>
              Configurações
            </button>
            .
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Execução da semana"
          value={d.ex.ratio == null ? "—" : formatPct(d.ex.ratio)}
          sub={
            d.ex.planned
              ? `${formatMinutes(d.ex.done)} de ${formatMinutes(d.ex.planned)} planejados até hoje`
              : "Nada planejado até hoje na semana"
          }
          def="Minutos executados ÷ minutos planejados até hoje nas sessões da semana (seg–dom), excluindo canceladas e backlog; o que ainda vai acontecer não entra. Horas por si só não medem aprendizado."
          tone={d.ex.ratio != null && d.ex.ratio < 0.5 ? "warn" : undefined}
        />
        <StatCard
          label="Horas na semana"
          value={formatMinutes(d.ex.done)}
          sub={`Meta ${settings.metaHorasSemana} h`}
          def="Soma dos minutos reais de sessões feitas ou parciais. Meta configurável."
        />
        <StatCard
          label="Questões (semana)"
          value={h.total}
          sub={`Meta ${settings.metaQuestoesSemana} · ${m.total} no total`}
          def="Questões registradas na semana, incluindo em branco."
        />
        <StatCard
          label="Taxa de acerto"
          value={m.valid ? formatPct(m.acc) : "—"}
          sub={
            m.valid
              ? `n=${m.valid} · IC95% ${formatPct(f[0])}–${formatPct(f[1])}${m.b ? ` · ${m.b} em branco` : ""}`
              : "Sem questões válidas"
          }
          def="Corretas ÷ (corretas + incorretas). Em branco fica fora do denominador e é mostrado à parte. IC 95% de Wilson indica quanto a amostra permite afirmar."
          tone={m.valid >= settings.amostraMin && m.acc < 0.6 ? "crit" : undefined}
        />
        <StatCard
          label="Revisões vencidas"
          value={i}
          sub={i ? "Prioridade sobre conteúdo novo" : "Nenhuma pendente"}
          def="Assuntos cuja data de revisão chegou. Intervalos iniciais 1/7/30 dias, ajustados por importância, dificuldade, acerto e resultado da revisão anterior."
          tone={i ? "warn" : "good"}
        />
        <StatCard
          label="Cobertura do edital"
          value={n.total ? formatPct(n.studied / n.total) : "—"}
          sub={`${n.studied}/${n.total} com teoria concluída · ${n.validated} validados`}
          def="Tópicos com teoria concluída ÷ tópicos cadastrados. “Validado” exige ao menos a amostra mínima de questões com 70% de acerto. Só ler não vale como dominado."
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card
            title="Próxima melhor ação"
            right={<Lightbulb size={15} className="text-accent" aria-hidden />}
          >
            {L ? (
              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold">{L.t}</p>
                <p className="max-w-prose text-[13px] text-ink2">{L.why}</p>
                <div>
                  <Button variant="primary" icon={ArrowRight} onClick={() => nav(L.go)}>
                    {L.cta}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink2">Sem recomendação: cadastre assuntos na Matriz.</p>
            )}
          </Card>
          <Card
            title="O que estudar agora"
            sub={`Hoje: ${formatMinutes(H)} feitos · capacidade ${formatMinutes(netMinutes(settings, todayStr))}`}
            right={
              <Button size="sm" onClick={() => nav("cronograma")}>
                Abrir cronograma
              </Button>
            }
          >
            {v.length === 0 && w.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nada planejado para hoje"
                action={
                  <Button variant="primary" onClick={() => nav("cronograma")}>
                    Gerar sugestão de plano
                  </Button>
                }
              >
                O plano é sugerido a partir das prioridades e das revisões vencidas, e só vale
                depois que você aceitar.
              </EmptyState>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {[...w, ...v].slice(0, 6).map((c) => {
                  let p = (c.topicIds || [])
                    .map((y) => state.topics.find((F) => F.id === y)?.nome)
                    .filter(Boolean);
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-2 py-2">
                      <Badge tone={c.date < todayStr ? "crit" : "info"}>
                        {c.date < todayStr
                          ? `atrasada ${formatDM(c.date)}`
                          : SESSION_TYPE_LABELS[c.tipo]}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-[13px]" title={p.join(", ")}>
                        {p.join(" + ") || SESSION_TYPE_LABELS[c.tipo]}
                      </span>
                      <span className="text-xs tabular-nums text-ink2">
                        {formatMinutes(c.plannedMin)}
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={Check}
                        onClick={() => openSession(c)}
                      >
                        Concluir
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
            {C && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-surface2 px-3 py-2 text-xs text-ink2">
                <Flame size={14} aria-hidden />
                {" Próximo no ciclo: "}
                <b className="text-ink">{C.rotulo}</b>
                {" · "}
                {C.min}
                {" min "}
                <Button
                  size="sm"
                  className="ml-auto"
                  icon={Play}
                  onClick={() =>
                    openSession({
                      id: null,
                      date: todayStr,
                      tipo: "teoria",
                      topicIds: [],
                      concursoIds: [settings.concursoPrincipal],
                      plannedMin: C.min,
                      cicloRotulo: C.rotulo,
                    })
                  }
                >
                  Iniciar
                </Button>
              </div>
            )}
          </Card>
        </div>
        <Card
          title="O que está atrasado ou em risco"
          right={<Badge tone={u.length ? "warn" : "good"}>{u.length || "tudo em dia"}</Badge>}
        >
          {u.length === 0 ? (
            <p className="text-[13px] text-ink2">
              Nenhum alerta. Os alertas surgem de sessões vencidas, revisões, prazos de inscrição,
              sobrecarga e desequilíbrio entre blocos.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {u.map((c, p) => (
                <li key={p} className="flex gap-2">
                  <TriangleAlert
                    size={15}
                    className={cn(
                      "mt-0.5 shrink-0",
                      c.tone === "crit"
                        ? "text-critInk"
                        : c.tone === "warn"
                          ? "text-warnInk"
                          : "text-accentInk",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{c.t}</p>
                    <p className="text-xs text-ink2">{c.d}</p>
                    <button
                      className="mt-0.5 text-xs font-medium text-accentInk underline"
                      onClick={() => nav(c.go)}
                    >
                      {c.cta}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Como meu desempenho evolui"
          sub="Acerto semanal; ponto vazado = amostra abaixo do mínimo"
          right={
            A != null && (
              <Badge
                tone="info"
                title="Inclinação linear sobre semanas com amostra suficiente. Indicativo, não prova."
              >
                {"tendência "}
                {A >= 0 ? "+" : ""}
                {(A * 100).toFixed(1)}
                {" p.p./sem"}
              </Badge>
            )
          }
        >
          {I ? (
            <LineChart data={N} target={settings.metaAcerto} label="Taxa de acerto por semana" />
          ) : (
            <EmptyState
              title="Sem questões registradas"
              action={
                <Button variant="primary" onClick={() => nav("questoes")}>
                  Registrar questões
                </Button>
              }
            >
              {"O gráfico aparece quando houver questões válidas. Metas: acerto "}
              {formatPct(settings.metaAcerto)}
              {", amostra mínima de "}
              {settings.amostraMin}
              {" por ponto."}
            </EmptyState>
          )}
          {K.length > 0 && (
            <p className="mt-2 text-xs text-ink2">
              {"Simulados: "}
              {K.length}
              {" registrado(s)"}
              {B != null
                ? ` · desvio-padrão de ${(B * 100).toFixed(1)} p.p. do máximo`
                : " · mínimo de 2 para medir estabilidade"}
              .
            </p>
          )}
        </Card>
        <Card title="Planejado × executado na semana">
          {d.ex.n || R.some((c) => c.done) ? (
            <PlannedDoneChart days={R} />
          ) : (
            <EmptyState
              title="Semana sem sessões"
              action={
                <Button variant="primary" onClick={() => nav("cronograma")}>
                  Planejar semana
                </Button>
              }
            >
              Crie sessões no cronograma e registre o tempo real ao concluir.
            </EmptyState>
          )}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Onde estou errando mais" sub={`Erros por tipo · ${m.e} erro(s) registrado(s)`}>
          {O.length ? (
            <BarList
              rows={O.slice(0, 6).map(([c, p]) => ({
                label: c,
                value: p / O[0][1],
                text: `${p} (${Math.round((p / m.e) * 100)}%)`,
              }))}
            />
          ) : (
            <EmptyState title="Sem erros classificados">
              Ao registrar uma questão errada, escolha o tipo de erro. Com 10+ erros, o padrão passa
              a orientar o plano.
            </EmptyState>
          )}
          {P.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-2 text-xs font-medium text-ink2">
                {"Assuntos críticos (acerto < 60% com n ≥ "}
                {settings.amostraMin})
              </p>
              <ul className="flex flex-col gap-1.5">
                {P.map((c) => (
                  <li key={c.t.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="truncate">{c.t.nome}</span>
                    <Badge tone="crit">
                      {formatPct(c.st.acc)}
                      {" · n="}
                      {c.st.valid}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
        <Card
          title="Desempenho por disciplina"
          sub="Barras tracejadas: amostra abaixo do mínimo, leia com cautela"
        >
          <BarList
            rows={S.map((c) => ({
              label: c.dn,
              value: c.acc,
              hatched: c.valid < settings.amostraMin,
              text: c.valid ? `${formatPct(c.acc)} · n=${c.valid}` : "sem dados",
            }))}
            empty={
              <EmptyState title="Sem dados por disciplina">
                Vincule cada questão a um assunto para ver o desempenho por disciplina.
              </EmptyState>
            }
          />
        </Card>
      </div>
      <Card
        title="Progresso dos editais prioritários"
        sub="Cobertura = teoria concluída ÷ tópicos cadastrados"
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {state.concursos
            .filter((c) => c.ativo)
            .sort((c, p) => p.prioridade - c.prioridade)
            .map((c) => {
              let p = coverageStats(state, c.id);
              return (
                <li key={c.id} className="min-w-0">
                  <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                    <span className="truncate font-medium">{c.orgao.split("(")[0].trim()}</span>
                    <span className="tabular-nums text-ink2">
                      {p.total ? `${p.studied}/${p.total}` : "conteúdo pendente"}
                    </span>
                  </div>
                  <ProgressBar value={p.total ? p.studied / p.total : 0} label={c.orgao} />
                </li>
              );
            })}
        </ul>
      </Card>
    </div>
  );
}
